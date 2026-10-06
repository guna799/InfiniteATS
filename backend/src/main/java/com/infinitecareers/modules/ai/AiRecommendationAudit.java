package com.infinitecareers.modules.ai;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "ai_recommendation_audits")
public class AiRecommendationAudit {

    @Id
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private String tenantId;

    @Column(name = "candidate_id", nullable = false)
    private String candidateId;

    @Column(name = "job_id", nullable = false)
    private String jobId;

    @Column(name = "model", nullable = false)
    private String model;

    @Column(name = "model_version", nullable = false)
    private String modelVersion;

    @Column(name = "prompt_version", nullable = false)
    private String promptVersion;

    @Column(name = "score", nullable = false)
    private Integer score;

    @Column(name = "matched_skills", columnDefinition = "TEXT")
    private String matchedSkills;

    @Column(name = "missing_skills", columnDefinition = "TEXT")
    private String missingSkills;

    @Column(name = "experience_match_score")
    private Integer experienceMatchScore;

    @Column(name = "education_match_score")
    private Integer educationMatchScore;

    @Column(name = "generated_explanation", columnDefinition = "TEXT", nullable = false)
    private String generatedExplanation;

    @Column(name = "pii_redacted", nullable = false)
    private Boolean piiRedacted = true;

    @Column(name = "trace_id")
    private String traceId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }
    public String getCandidateId() { return candidateId; }
    public void setCandidateId(String candidateId) { this.candidateId = candidateId; }
    public String getJobId() { return jobId; }
    public void setJobId(String jobId) { this.jobId = jobId; }
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
    public String getModelVersion() { return modelVersion; }
    public void setModelVersion(String modelVersion) { this.modelVersion = modelVersion; }
    public String getPromptVersion() { return promptVersion; }
    public void setPromptVersion(String promptVersion) { this.promptVersion = promptVersion; }
    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }
    public String getMatchedSkills() { return matchedSkills; }
    public void setMatchedSkills(String matchedSkills) { this.matchedSkills = matchedSkills; }
    public String getMissingSkills() { return missingSkills; }
    public void setMissingSkills(String missingSkills) { this.missingSkills = missingSkills; }
    public Integer getExperienceMatchScore() { return experienceMatchScore; }
    public void setExperienceMatchScore(Integer experienceMatchScore) { this.experienceMatchScore = experienceMatchScore; }
    public Integer getEducationMatchScore() { return educationMatchScore; }
    public void setEducationMatchScore(Integer educationMatchScore) { this.educationMatchScore = educationMatchScore; }
    public String getGeneratedExplanation() { return generatedExplanation; }
    public void setGeneratedExplanation(String generatedExplanation) { this.generatedExplanation = generatedExplanation; }
    public Boolean getPiiRedacted() { return piiRedacted; }
    public void setPiiRedacted(Boolean piiRedacted) { this.piiRedacted = piiRedacted; }
    public String getTraceId() { return traceId; }
    public void setTraceId(String traceId) { this.traceId = traceId; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
