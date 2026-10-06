package com.infinitecareers.modules.onboarding;

import com.infinitecareers.common.BaseTenantEntity;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "onboarding_instances")
public class OnboardingInstance extends BaseTenantEntity {

    @Column(name = "application_id", nullable = false)
    private String applicationId;

    @Column(name = "candidate_id", nullable = false)
    private String candidateId;

    @Column(name = "status")
    private String status = "PREBOARDING";

    @Column(name = "target_start_date", nullable = false)
    private LocalDate targetStartDate;

    @Column(name = "completion_percentage")
    private Integer completionPercentage = 0;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "onboarding_instance_id")
    private List<OnboardingTask> tasks = new ArrayList<>();

    public String getApplicationId() { return applicationId; }
    public void setApplicationId(String applicationId) { this.applicationId = applicationId; }
    public String getCandidateId() { return candidateId; }
    public void setCandidateId(String candidateId) { this.candidateId = candidateId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDate getTargetStartDate() { return targetStartDate; }
    public void setTargetStartDate(LocalDate targetStartDate) { this.targetStartDate = targetStartDate; }
    public Integer getCompletionPercentage() { return completionPercentage; }
    public void setCompletionPercentage(Integer completionPercentage) { this.completionPercentage = completionPercentage; }
    public List<OnboardingTask> getTasks() { return tasks; }
    public void setTasks(List<OnboardingTask> tasks) { this.tasks = tasks; }
}
