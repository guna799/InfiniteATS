package com.infinitecareers.modules.applications;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "application_stage_history")
public class ApplicationStageHistory {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "application_id", nullable = false)
    private String applicationId;

    @Column(name = "from_stage")
    private String fromStage;

    @Column(name = "to_stage", nullable = false)
    private String toStage;

    @Column(name = "changed_by")
    private String changedBy;

    @Column(name = "reason")
    private String reason;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getApplicationId() { return applicationId; }
    public void setApplicationId(String applicationId) { this.applicationId = applicationId; }
    public String getFromStage() { return fromStage; }
    public void setFromStage(String fromStage) { this.fromStage = fromStage; }
    public String getToStage() { return toStage; }
    public void setToStage(String toStage) { this.toStage = toStage; }
    public String getChangedBy() { return changedBy; }
    public void setChangedBy(String changedBy) { this.changedBy = changedBy; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
