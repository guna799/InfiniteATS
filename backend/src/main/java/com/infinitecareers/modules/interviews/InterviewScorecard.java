package com.infinitecareers.modules.interviews;

import com.infinitecareers.common.BaseTenantEntity;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "interview_scorecards")
public class InterviewScorecard extends BaseTenantEntity {

    @Column(name = "interview_id", nullable = false)
    private String interviewId;

    @Column(name = "submitted_by", nullable = false)
    private String submittedBy;

    @Column(name = "recommendation", nullable = false)
    private String recommendation;

    @Column(name = "overall_rating", nullable = false)
    private Integer overallRating;

    @Column(name = "technical_rating")
    private Integer technicalRating;

    @Column(name = "cultural_rating")
    private Integer culturalRating;

    @Column(name = "communication_rating")
    private Integer communicationRating;

    @Column(name = "strengths", columnDefinition = "TEXT")
    private String strengths;

    @Column(name = "weaknesses", columnDefinition = "TEXT")
    private String weaknesses;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "submitted_at", nullable = false)
    private Instant submittedAt;

    @PrePersist
    @Override
    protected void onCreate() {
        super.onCreate();
        if (this.submittedAt == null) {
            this.submittedAt = Instant.now();
        }
    }

    public String getInterviewId() { return interviewId; }
    public void setInterviewId(String interviewId) { this.interviewId = interviewId; }
    public String getSubmittedBy() { return submittedBy; }
    public void setSubmittedBy(String submittedBy) { this.submittedBy = submittedBy; }
    public String getRecommendation() { return recommendation; }
    public void setRecommendation(String recommendation) { this.recommendation = recommendation; }
    public Integer getOverallRating() { return overallRating; }
    public void setOverallRating(Integer overallRating) { this.overallRating = overallRating; }
    public Integer getTechnicalRating() { return technicalRating; }
    public void setTechnicalRating(Integer technicalRating) { this.technicalRating = technicalRating; }
    public Integer getCulturalRating() { return culturalRating; }
    public void setCulturalRating(Integer culturalRating) { this.culturalRating = culturalRating; }
    public Integer getCommunicationRating() { return communicationRating; }
    public void setCommunicationRating(Integer communicationRating) { this.communicationRating = communicationRating; }
    public String getStrengths() { return strengths; }
    public void setStrengths(String strengths) { this.strengths = strengths; }
    public String getWeaknesses() { return weaknesses; }
    public void setWeaknesses(String weaknesses) { this.weaknesses = weaknesses; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public Instant getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(Instant submittedAt) { this.submittedAt = submittedAt; }
}
