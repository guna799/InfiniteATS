package com.infinitecareers.modules.applications;

import com.infinitecareers.common.BaseTenantEntity;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "applications")
public class Application extends BaseTenantEntity {

    @Column(name = "candidate_id", nullable = false)
    private String candidateId;

    @Column(name = "requisition_id", nullable = false)
    private String requisitionId;

    @Column(name = "stage", nullable = false)
    private String stage = PipelineStage.APPLIED.name();

    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;

    @Column(name = "status")
    private String status = "ACTIVE";

    @Column(name = "rating")
    private Integer rating = 0;

    @Column(name = "source")
    private String source = "CAREER_PAGE";

    @Column(name = "recruiter_id")
    private String recruiterId;

    @Column(name = "applied_date", nullable = false)
    private Instant appliedDate;

    @Column(name = "last_activity", nullable = false)
    private Instant lastActivity;

    @PrePersist
    @Override
    protected void onCreate() {
        super.onCreate();
        Instant now = Instant.now();
        if (this.appliedDate == null) {
            this.appliedDate = now;
        }
        if (this.lastActivity == null) {
            this.lastActivity = now;
        }
    }

    public String getCandidateId() { return candidateId; }
    public void setCandidateId(String candidateId) { this.candidateId = candidateId; }
    public String getRequisitionId() { return requisitionId; }
    public void setRequisitionId(String requisitionId) { this.requisitionId = requisitionId; }
    public String getStage() { return stage; }
    public void setStage(String stage) { this.stage = stage; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public String getRecruiterId() { return recruiterId; }
    public void setRecruiterId(String recruiterId) { this.recruiterId = recruiterId; }
    public Instant getAppliedDate() { return appliedDate; }
    public void setAppliedDate(Instant appliedDate) { this.appliedDate = appliedDate; }
    public Instant getLastActivity() { return lastActivity; }
    public void setLastActivity(Instant lastActivity) { this.lastActivity = lastActivity; }

    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }
}
