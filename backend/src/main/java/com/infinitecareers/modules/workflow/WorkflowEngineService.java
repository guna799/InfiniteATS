package com.infinitecareers.modules.workflow;

import com.infinitecareers.common.TenantContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class WorkflowEngineService {

    private final WorkflowDefinitionRepository definitionRepository;
    private final WorkflowInstanceRepository instanceRepository;

    public WorkflowEngineService(WorkflowDefinitionRepository definitionRepository, WorkflowInstanceRepository instanceRepository) {
        this.definitionRepository = definitionRepository;
        this.instanceRepository = instanceRepository;
    }

    public List<WorkflowDefinition> getDefinitions() {
        return definitionRepository.findByTenantId(TenantContextHolder.getTenantId());
    }

    public WorkflowDefinition getDefinitionById(String id) {
        return definitionRepository.findByIdAndTenantId(id, TenantContextHolder.getTenantId())
                .orElseThrow(() -> new NoSuchElementException("Workflow definition not found: " + id));
    }

    @Transactional
    public WorkflowDefinition createDefinition(WorkflowDefinition definition) {
        definition.setTenantId(TenantContextHolder.getTenantId());
        return definitionRepository.save(definition);
    }

    @Transactional
    public WorkflowInstance triggerWorkflow(String eventType, String entityType, String entityId, String contextData) {
        String tenantId = TenantContextHolder.getTenantId();
        List<WorkflowDefinition> defs = definitionRepository.findByTenantIdAndTriggerEventAndIsActiveTrue(tenantId, eventType);

        if (defs.isEmpty()) {
            // Create a default instance to record the event execution
            WorkflowInstance instance = new WorkflowInstance();
            instance.setTenantId(tenantId);
            instance.setWorkflowVersionId("v1");
            instance.setEntityType(entityType);
            instance.setEntityId(entityId);
            instance.setStatus("COMPLETED");
            instance.setCurrentNodeId("end-node");
            instance.setContextData(contextData);
            instance.setCompletedAt(Instant.now());
            return instanceRepository.save(instance);
        }

        WorkflowDefinition def = defs.get(0);
        WorkflowInstance instance = new WorkflowInstance();
        instance.setTenantId(tenantId);
        instance.setWorkflowVersionId(def.getId());
        instance.setEntityType(entityType);
        instance.setEntityId(entityId);
        instance.setStatus("RUNNING");
        instance.setCurrentNodeId("step-1");
        instance.setContextData(contextData);
        return instanceRepository.save(instance);
    }

    public List<WorkflowInstance> getInstances() {
        return instanceRepository.findByTenantIdOrderByStartedAtDesc(TenantContextHolder.getTenantId());
    }
}
