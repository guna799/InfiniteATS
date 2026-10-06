package com.infinitecareers.modules.workflow;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkflowDefinitionRepository extends JpaRepository<WorkflowDefinition, String> {
    List<WorkflowDefinition> findByTenantId(String tenantId);
    Optional<WorkflowDefinition> findByIdAndTenantId(String id, String tenantId);
    List<WorkflowDefinition> findByTenantIdAndTriggerEventAndIsActiveTrue(String tenantId, String triggerEvent);
}
