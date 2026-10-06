package com.infinitecareers.modules.onboarding;

import com.infinitecareers.common.BaseTenantEntity;
import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "onboarding_tasks")
public class OnboardingTask extends BaseTenantEntity {

    @Column(name = "onboarding_instance_id", nullable = false)
    private String onboardingInstanceId;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "category")
    private String category = "DOCUMENT";

    @Column(name = "assigned_role")
    private String assignedRole = "CANDIDATE";

    @Column(name = "assignee_id")
    private String assigneeId;

    @Column(name = "status")
    private String status = "NOT_STARTED"; // NOT_STARTED, IN_PROGRESS, BLOCKED, COMPLETED, OVERDUE, CANCELLED

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "order_index")
    private Integer orderIndex = 0;

    public String getOnboardingInstanceId() { return onboardingInstanceId; }
    public void setOnboardingInstanceId(String onboardingInstanceId) { this.onboardingInstanceId = onboardingInstanceId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getAssignedRole() { return assignedRole; }
    public void setAssignedRole(String assignedRole) { this.assignedRole = assignedRole; }
    public String getAssigneeId() { return assigneeId; }
    public void setAssigneeId(String assigneeId) { this.assigneeId = assigneeId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
    public Integer getOrderIndex() { return orderIndex; }
    public void setOrderIndex(Integer orderIndex) { this.orderIndex = orderIndex; }
}
