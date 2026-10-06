package com.infinitecareers.modules.recruiting;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JobPostingRepository extends JpaRepository<JobPosting, String> {
    List<JobPosting> findByTenantIdAndStatus(String tenantId, String status);
    Optional<JobPosting> findByTenantIdAndSlug(String tenantId, String slug);
    Optional<JobPosting> findByRequisitionId(String requisitionId);
}
