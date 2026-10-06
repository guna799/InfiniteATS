package com.infinitecareers.modules.applications;

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

    public ApplicationService(
            ApplicationRepository applicationRepository,
            ApplicationStageHistoryRepository historyRepository) {
        this.applicationRepository = applicationRepository;
        this.historyRepository = historyRepository;
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
        if (application.getStage() == null) {
            application.setStage("NEW");
        }
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

    @Transactional
    public Application updateStage(String id, String targetStage, String reason, String notes) {
        Application application = getApplicationById(id);
        String previousStage = application.getStage();

        application.setStage(targetStage);
        application.setLastActivity(Instant.now());
        Application saved = applicationRepository.save(application);

        // Record Immutable Audit Stage History
        ApplicationStageHistory history = new ApplicationStageHistory();
        history.setApplicationId(saved.getId());
        history.setFromStage(previousStage);
        history.setToStage(targetStage);
        history.setChangedBy(TenantContextHolder.getUserId());
        history.setReason(reason);
        history.setNotes(notes);
        historyRepository.save(history);

        return saved;
    }

    public List<ApplicationStageHistory> getStageHistory(String applicationId) {
        // Ensure application belongs to tenant
        getApplicationById(applicationId);
        return historyRepository.findByApplicationIdOrderByCreatedAtDesc(applicationId);
    }
}
