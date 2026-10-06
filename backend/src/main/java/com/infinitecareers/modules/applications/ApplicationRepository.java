package com.infinitecareers.modules.applications;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, String> {
    List<Application> findByTenantId(String tenantId);
    Page<Application> findByTenantId(String tenantId, Pageable pageable);
    Optional<Application> findByIdAndTenantId(String id, String tenantId);
    List<Application> findByTenantIdAndRequisitionId(String tenantId, String requisitionId);
    List<Application> findByTenantIdAndCandidateId(String tenantId, String candidateId);
    List<Application> findByTenantIdAndStage(String tenantId, String stage);
}
