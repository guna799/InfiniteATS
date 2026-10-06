package com.infinitecareers.modules.workflow;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkflowInstanceRepository extends JpaRepository<WorkflowInstance, String> {
    List<WorkflowInstance> findByTenantIdOrderByStartedAtDesc(String tenantId);
    Optional<WorkflowInstance> findByIdAndTenantId(String id, String tenantId);
}
