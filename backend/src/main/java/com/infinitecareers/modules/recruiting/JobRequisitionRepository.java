package com.infinitecareers.modules.recruiting;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JobRequisitionRepository extends JpaRepository<JobRequisition, String> {
    List<JobRequisition> findByTenantId(String tenantId);
    Page<JobRequisition> findByTenantId(String tenantId, Pageable pageable);
    Optional<JobRequisition> findByIdAndTenantId(String id, String tenantId);
    List<JobRequisition> findByTenantIdAndStatus(String tenantId, RequisitionState status);
}
