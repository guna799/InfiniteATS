package com.infinitecareers.modules.workflow;

import com.infinitecareers.common.BaseTenantEntity;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "workflow_instances")
public class WorkflowInstance extends BaseTenantEntity {

    @Column(name = "workflow_version_id", nullable = false)
    private String workflowVersionId;

    @Column(name = "entity_type", nullable = false)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private String entityId;

    @Column(name = "status")
    private String status = "RUNNING"; // RUNNING, COMPLETED, FAILED, PAUSED

    @Column(name = "current_node_id")
    private String currentNodeId;

    @Column(name = "context_data", columnDefinition = "TEXT")
    private String contextData;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @PrePersist
    @Override
    protected void onCreate() {
        super.onCreate();
        if (this.startedAt == null) {
            this.startedAt = Instant.now();
        }
    }

    public String getWorkflowVersionId() { return workflowVersionId; }
    public void setWorkflowVersionId(String workflowVersionId) { this.workflowVersionId = workflowVersionId; }
    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }
    public String getEntityId() { return entityId; }
    public void setEntityId(String entityId) { this.entityId = entityId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCurrentNodeId() { return currentNodeId; }
    public void setCurrentNodeId(String currentNodeId) { this.currentNodeId = currentNodeId; }
    public String getContextData() { return contextData; }
    public void setContextData(String contextData) { this.contextData = contextData; }
    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }
    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
}
