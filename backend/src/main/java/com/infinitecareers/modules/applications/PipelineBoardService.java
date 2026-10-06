package com.infinitecareers.modules.applications;

import com.infinitecareers.common.TenantContextHolder;
import com.infinitecareers.modules.candidates.Candidate;
import com.infinitecareers.modules.candidates.CandidateRepository;
import com.infinitecareers.modules.recruiting.JobRequisition;
import com.infinitecareers.modules.recruiting.JobRequisitionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Read model for the pipeline board: applications joined with candidate and requisition summaries. */
@Service
@Transactional(readOnly = true)
public class PipelineBoardService {

    private final ApplicationRepository applicationRepository;
    private final CandidateRepository candidateRepository;
    private final JobRequisitionRepository requisitionRepository;

    public PipelineBoardService(ApplicationRepository applicationRepository,
                                CandidateRepository candidateRepository,
                                JobRequisitionRepository requisitionRepository) {
        this.applicationRepository = applicationRepository;
        this.candidateRepository = candidateRepository;
        this.requisitionRepository = requisitionRepository;
    }

    public List<PipelineCard> board(String requisitionId) {
        String tenantId = TenantContextHolder.getTenantId();
        List<Application> applications = requisitionId == null || requisitionId.isBlank()
                ? applicationRepository.findByTenantId(tenantId)
                : applicationRepository.findByTenantIdAndRequisitionId(tenantId, requisitionId);
        return toCards(applications).stream()
                .sorted(Comparator.comparing(PipelineCard::lastActivity, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    public List<PipelineCard.RequisitionSummary> requisitions() {
        return requisitionRepository.findByTenantId(TenantContextHolder.getTenantId()).stream()
                .map(this::summary)
                .sorted(Comparator.comparing(PipelineCard.RequisitionSummary::reqNumber, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
    }

    public PipelineCard toCard(Application application) {
        return toCards(List.of(application)).get(0);
    }

    private List<PipelineCard> toCards(Collection<Application> applications) {
        String tenantId = TenantContextHolder.getTenantId();
        Set<String> candidateIds = applications.stream().map(Application::getCandidateId).collect(Collectors.toSet());
        Set<String> requisitionIds = applications.stream().map(Application::getRequisitionId).collect(Collectors.toSet());

        // findAllById is not tenant-scoped; filter so a bad foreign key can never surface another tenant's data
        Map<String, Candidate> candidates = candidateRepository.findAllById(candidateIds).stream()
                .filter(c -> tenantId.equals(c.getTenantId()))
                .collect(Collectors.toMap(Candidate::getId, Function.identity()));
        Map<String, JobRequisition> requisitions = requisitionRepository.findAllById(requisitionIds).stream()
                .filter(r -> tenantId.equals(r.getTenantId()))
                .collect(Collectors.toMap(JobRequisition::getId, Function.identity()));

        return applications.stream().map(a -> {
            Candidate c = candidates.get(a.getCandidateId());
            JobRequisition r = requisitions.get(a.getRequisitionId());
            return new PipelineCard(
                    a.getId(),
                    a.getStage(),
                    a.getVersion() == null ? 0 : a.getVersion(),
                    a.getRating(),
                    a.getAppliedDate(),
                    a.getLastActivity(),
                    c == null ? new PipelineCard.CandidateSummary(a.getCandidateId(), "Unknown candidate", null)
                            : new PipelineCard.CandidateSummary(c.getId(), fullName(c.getFirstName(), c.getLastName()), c.getHeadline()),
                    r == null ? new PipelineCard.RequisitionSummary(a.getRequisitionId(), null, "Unknown requisition")
                            : summary(r)
            );
        }).toList();
    }

    private PipelineCard.RequisitionSummary summary(JobRequisition r) {
        return new PipelineCard.RequisitionSummary(r.getId(), r.getReqNumber(), r.getTitle());
    }

    static String fullName(String first, String last) {
        return ((first == null ? "" : first) + " " + (last == null ? "" : last)).trim();
    }
}
