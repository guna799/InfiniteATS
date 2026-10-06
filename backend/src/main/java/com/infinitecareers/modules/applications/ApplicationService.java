package com.infinitecareers.modules.applications;

import com.infinitecareers.common.StaleStateException;
import com.infinitecareers.common.events.EventTypes;
import com.infinitecareers.common.events.TransactionalOutboxService;
import com.infinitecareers.modules.audit.AuditLogService;
import com.infinitecareers.modules.identity.UserRepository;
import java.util.LinkedHashMap;
import java.util.Map;

import com.infinitecareers.common.TenantContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final ApplicationStageHistoryRepository historyRepository;
    private final PipelineBoardService boardService;
    private final AuditLogService auditLogService;
    private final TransactionalOutboxService outboxService;
    private final UserRepository userRepository;

    public ApplicationService(
            ApplicationRepository applicationRepository,
            ApplicationStageHistoryRepository historyRepository,
            PipelineBoardService boardService,
            AuditLogService auditLogService,
            TransactionalOutboxService outboxService,
            UserRepository userRepository) {
        this.applicationRepository = applicationRepository;
        this.historyRepository = historyRepository;
        this.boardService = boardService;
        this.auditLogService = auditLogService;
        this.outboxService = outboxService;
        this.userRepository = userRepository;
    }

    public List<Application> getApplications(String requisitionId, String stage) {
        String tenantId = TenantContextHolder.getTenantId();
        if (requisitionId != null && !requisitionId.trim().isEmpty()) {
            return applicationRepository.findByTenantIdAndRequisitionId(tenantId, requisitionId);
        }
        if (stage != null && !stage.trim().isEmpty()) {
            return applicationRepository.findByTenantIdAndStage(tenantId, stage);
        }
        return applicationRepository.findByTenantId(tenantId);
    }

    public Page<Application> getApplicationsPaged(Pageable pageable) {
        return applicationRepository.findByTenantId(TenantContextHolder.getTenantId(), pageable);
    }

    public Application getApplicationById(String id) {
        return applicationRepository.findByIdAndTenantId(id, TenantContextHolder.getTenantId())
                .orElseThrow(() -> new NoSuchElementException("Application not found: " + id));
    }

    @Transactional
    public Application createApplication(Application application) {
        application.setTenantId(TenantContextHolder.getTenantId());
        application.setStage(PipelineStage.parse(
                application.getStage() == null ? PipelineStage.APPLIED.name() : application.getStage()).name());
        Application saved = applicationRepository.save(application);

        // Record Initial Stage History
        ApplicationStageHistory history = new ApplicationStageHistory();
        history.setApplicationId(saved.getId());
        history.setFromStage(null);
        history.setToStage(saved.getStage());
        history.setChangedBy(TenantContextHolder.getUserId());
        history.setReason("Application created");
        historyRepository.save(history);

        return saved;
    }

    /**
     * Moves an application to another stage. History, the audit-chain entry and the
     * CANDIDATE_STAGE_CHANGED outbox event are written in the same transaction as the change.
     *
     * @param expectedVersion the version the caller last saw; if another user has moved the candidate since,
     *                        the move is rejected with {@link StaleStateException} carrying the current card
     */
    @Transactional
    public PipelineCard moveStage(String id, String targetStage, Long expectedVersion, String reason, String notes) {
        PipelineStage target = PipelineStage.parse(targetStage);
        Application application = getApplicationById(id);

        if (expectedVersion != null && !expectedVersion.equals(application.getVersion())) {
            throw new StaleStateException("This candidate was moved by someone else", boardService.toCard(application));
        }
        String previousStage = application.getStage();
        if (target.name().equals(previousStage)) {
            return boardService.toCard(application);
        }
        if (target.requiresReason() && (reason == null || reason.isBlank())) {
            throw new IllegalArgumentException("A reason is required to move a candidate to " + target.label());
        }

        application.setStage(target.name());
        application.setStatus(target.applicationStatus());
        application.setLastActivity(Instant.now());
        Application saved = applicationRepository.saveAndFlush(application); // bumps @Version

        ApplicationStageHistory history = new ApplicationStageHistory();
        history.setApplicationId(saved.getId());
        history.setFromStage(previousStage);
        history.setToStage(target.name());
        history.setChangedBy(TenantContextHolder.getUserId());
        history.setReason(reason);
        history.setNotes(notes);
        historyRepository.save(history);

        auditLogService.record("APPLICATION_STAGE_CHANGED", "APPLICATION", saved.getId(),
                "{\"stage\":\"" + previousStage + "\"}", "{\"stage\":\"" + target.name() + "\"}");

        PipelineCard card = boardService.toCard(saved);
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("applicationId", card.applicationId());
        payload.put("candidateId", card.candidate().id());
        payload.put("candidateName", card.candidate().name());
        payload.put("requisitionId", card.requisition().id());
        payload.put("requisitionTitle", card.requisition().title());
        payload.put("fromStage", previousStage);
        payload.put("toStage", target.name());
        payload.put("version", card.version());
        payload.put("actorName", currentActorName());
        payload.put("card", card);
        outboxService.publish(EventTypes.CANDIDATE_STAGE_CHANGED, "APPLICATION", saved.getId(), payload);

        return card;
    }

    private String currentActorName() {
        String userId = TenantContextHolder.getUserId();
        if (userId == null) {
            return "System";
        }
        return userRepository.findById(userId)
                .map(u -> {
                    String name = PipelineBoardService.fullName(u.getFirstName(), u.getLastName());
                    return name.isEmpty() ? u.getEmail() : name;
                })
                .orElse("A teammate");
    }

    public List<ApplicationStageHistory> getStageHistory(String applicationId) {
        // Ensure application belongs to tenant
        getApplicationById(applicationId);
        return historyRepository.findByApplicationIdOrderByCreatedAtDesc(applicationId);
    }
}
