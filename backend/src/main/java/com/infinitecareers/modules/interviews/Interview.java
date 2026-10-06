package com.infinitecareers.modules.interviews;

import com.infinitecareers.common.BaseTenantEntity;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "interviews")
public class Interview extends BaseTenantEntity {

    @Column(name = "application_id", nullable = false)
    private String applicationId;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "stage")
    private String stage = "TECHNICAL";

    @Column(name = "scheduled_start", nullable = false)
    private Instant scheduledStart;

    @Column(name = "scheduled_end", nullable = false)
    private Instant scheduledEnd;

    @Column(name = "time_zone")
    private String timeZone = "UTC";

    @Column(name = "location")
    private String location;

    @Column(name = "meeting_link")
    private String meetingLink;

    @Column(name = "status")
    private String status = "SCHEDULED";

    @Column(name = "feedback_notes", columnDefinition = "TEXT")
    private String feedbackNotes;

    public String getApplicationId() { return applicationId; }
    public void setApplicationId(String applicationId) { this.applicationId = applicationId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getStage() { return stage; }
    public void setStage(String stage) { this.stage = stage; }
    public Instant getScheduledStart() { return scheduledStart; }
    public void setScheduledStart(Instant scheduledStart) { this.scheduledStart = scheduledStart; }
    public Instant getScheduledEnd() { return scheduledEnd; }
    public void setScheduledEnd(Instant scheduledEnd) { this.scheduledEnd = scheduledEnd; }
    public String getTimeZone() { return timeZone; }
    public void setTimeZone(String timeZone) { this.timeZone = timeZone; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getMeetingLink() { return meetingLink; }
    public void setMeetingLink(String meetingLink) { this.meetingLink = meetingLink; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getFeedbackNotes() { return feedbackNotes; }
    public void setFeedbackNotes(String feedbackNotes) { this.feedbackNotes = feedbackNotes; }
}
