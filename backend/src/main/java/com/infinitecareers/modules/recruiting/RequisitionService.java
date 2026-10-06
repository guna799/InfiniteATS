package com.infinitecareers.modules.recruiting;

import com.infinitecareers.common.TenantContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class RequisitionService {

    private final JobRequisitionRepository requisitionRepository;
    private final JobPostingRepository postingRepository;

    public RequisitionService(JobRequisitionRepository requisitionRepository, JobPostingRepository postingRepository) {
        this.requisitionRepository = requisitionRepository;
        this.postingRepository = postingRepository;
    }

    public List<JobRequisition> getAllRequisitions() {
        return requisitionRepository.findByTenantId(TenantContextHolder.getTenantId());
    }

    public Page<JobRequisition> getRequisitions(Pageable pageable) {
        return requisitionRepository.findByTenantId(TenantContextHolder.getTenantId(), pageable);
    }

    public JobRequisition getRequisitionById(String id) {
        return requisitionRepository.findByIdAndTenantId(id, TenantContextHolder.getTenantId())
                .orElseThrow(() -> new NoSuchElementException("Requisition not found: " + id));
    }

    @Transactional
    public JobRequisition createRequisition(JobRequisition requisition) {
        requisition.setTenantId(TenantContextHolder.getTenantId());
        requisition.setStatus(RequisitionState.DRAFT);
        if (requisition.getReqNumber() == null || requisition.getReqNumber().trim().isEmpty()) {
            requisition.setReqNumber("REQ-" + (System.currentTimeMillis() % 100000));
        }
        requisition.setCreatedBy(TenantContextHolder.getUserId());
        return requisitionRepository.save(requisition);
    }

    @Transactional
    public JobRequisition updateRequisition(String id, JobRequisition updates) {
        JobRequisition existing = getRequisitionById(id);
        if (updates.getTitle() != null) existing.setTitle(updates.getTitle());
        if (updates.getDepartmentId() != null) existing.setDepartmentId(updates.getDepartmentId());
        if (updates.getLocationId() != null) existing.setLocationId(updates.getLocationId());
        if (updates.getJobProfileId() != null) existing.setJobProfileId(updates.getJobProfileId());
        if (updates.getHiringManagerId() != null) existing.setHiringManagerId(updates.getHiringManagerId());
        if (updates.getRecruiterId() != null) existing.setRecruiterId(updates.getRecruiterId());
        if (updates.getHeadcount() != null) existing.setHeadcount(updates.getHeadcount());
        if (updates.getMinSalary() != null) existing.setMinSalary(updates.getMinSalary());
        if (updates.getMaxSalary() != null) existing.setMaxSalary(updates.getMaxSalary());
        if (updates.getDescription() != null) existing.setDescription(updates.getDescription());
        if (updates.getRequirements() != null) existing.setRequirements(updates.getRequirements());
        if (updates.getBenefits() != null) existing.setBenefits(updates.getBenefits());
        return requisitionRepository.save(existing);
    }

    @Transactional
    public JobRequisition submit(String id) {
        JobRequisition req = getRequisitionById(id);
        transitionState(req, RequisitionState.PENDING_APPROVAL);
        return requisitionRepository.save(req);
    }

    @Transactional
    public JobRequisition approve(String id) {
        JobRequisition req = getRequisitionById(id);
        transitionState(req, RequisitionState.APPROVED);
        return requisitionRepository.save(req);
    }

    @Transactional
    public JobRequisition reject(String id) {
        JobRequisition req = getRequisitionById(id);
        transitionState(req, RequisitionState.REJECTED);
        return requisitionRepository.save(req);
    }

    @Transactional
    public JobRequisition publish(String id) {
        JobRequisition req = getRequisitionById(id);
        transitionState(req, RequisitionState.OPEN);
        JobRequisition savedReq = requisitionRepository.save(req);

        // Ensure Job Posting exists and is published
        JobPosting posting = postingRepository.findByRequisitionId(req.getId())
                .orElseGet(() -> {
                    JobPosting p = new JobPosting();
                    p.setTenantId(req.getTenantId());
                    p.setRequisitionId(req.getId());
                    String slug = req.getTitle().toLowerCase().replaceAll("[^a-z0-9]", "-").replaceAll("-+", "-");
                    p.setSlug(slug + "-" + req.getId().substring(0, Math.min(6, req.getId().length())));
                    return p;
                });

        posting.setStatus("PUBLISHED");
        posting.setPublishedAt(Instant.now());
        posting.setSeoTitle(req.getTitle());
        posting.setSeoDescription(req.getDescription());
        postingRepository.save(posting);

        return savedReq;
    }

    @Transactional
    public JobRequisition close(String id) {
        JobRequisition req = getRequisitionById(id);
        transitionState(req, RequisitionState.CLOSED);
        JobRequisition savedReq = requisitionRepository.save(req);

        postingRepository.findByRequisitionId(req.getId()).ifPresent(p -> {
            p.setStatus("CLOSED");
            postingRepository.save(p);
        });

        return savedReq;
    }

    private void transitionState(JobRequisition requisition, RequisitionState targetState) {
        if (!requisition.getStatus().canTransitionTo(targetState)) {
            throw new IllegalStateException(String.format(
                    "Invalid state transition from %s to %s for Requisition %s",
                    requisition.getStatus(), targetState, requisition.getId()
            ));
        }
        requisition.setStatus(targetState);
    }
}
