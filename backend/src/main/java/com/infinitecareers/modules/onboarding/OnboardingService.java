package com.infinitecareers.modules.onboarding;

import com.infinitecareers.common.TenantContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class OnboardingService {

    private final OnboardingInstanceRepository instanceRepository;
    private final OnboardingTaskRepository taskRepository;

    public OnboardingService(OnboardingInstanceRepository instanceRepository, OnboardingTaskRepository taskRepository) {
        this.instanceRepository = instanceRepository;
        this.taskRepository = taskRepository;
    }

    public List<OnboardingInstance> getAllInstances() {
        return instanceRepository.findByTenantId(TenantContextHolder.getTenantId());
    }

    public OnboardingInstance getInstanceById(String id) {
        return instanceRepository.findByIdAndTenantId(id, TenantContextHolder.getTenantId())
                .orElseThrow(() -> new NoSuchElementException("Onboarding instance not found: " + id));
    }

    @Transactional
    public OnboardingInstance startOnboarding(String applicationId, String candidateId, LocalDate targetStartDate) {
        String tenantId = TenantContextHolder.getTenantId();
        OnboardingInstance instance = new OnboardingInstance();
        instance.setTenantId(tenantId);
        instance.setApplicationId(applicationId);
        instance.setCandidateId(candidateId);
        instance.setTargetStartDate(targetStartDate != null ? targetStartDate : LocalDate.now().plusWeeks(2));
        instance.setStatus("PREBOARDING");
        instance.setCompletionPercentage(0);
        instance = instanceRepository.save(instance);

        // Generate Standard Default Enterprise Tasks
        createTask(instance.getId(), "Sign Employment Agreement & NDA", "Execute digital signature", "DOCUMENT", "CANDIDATE", 1, instance.getTargetStartDate().minusDays(10));
        createTask(instance.getId(), "Submit I-9 & Tax Verification", "Upload identity & tax documents", "DOCUMENT", "CANDIDATE", 2, instance.getTargetStartDate().minusDays(7));
        createTask(instance.getId(), "Hardware & Access Provisioning", "IT setup of laptop, VPN, and corporate accounts", "IT", "IT", 3, instance.getTargetStartDate().minusDays(3));
        createTask(instance.getId(), "Payroll & Direct Deposit Configuration", "Finance banking setup", "FINANCE", "FINANCE", 4, instance.getTargetStartDate().minusDays(2));
        createTask(instance.getId(), "Day 1 Welcome & Manager Orientation", "Introductory team lunch & onboarding schedule", "ORIENTATION", "HIRING_MANAGER", 5, instance.getTargetStartDate());

        return getInstanceById(instance.getId());
    }

    private void createTask(String instanceId, String title, String description, String category, String assignedRole, int orderIndex, LocalDate dueDate) {
        OnboardingTask task = new OnboardingTask();
        task.setTenantId(TenantContextHolder.getTenantId());
        task.setOnboardingInstanceId(instanceId);
        task.setTitle(title);
        task.setDescription(description);
        task.setCategory(category);
        task.setAssignedRole(assignedRole);
        task.setStatus("NOT_STARTED");
        task.setOrderIndex(orderIndex);
        task.setDueDate(dueDate);
        taskRepository.save(task);
    }

    @Transactional
    public OnboardingTask updateTaskStatus(String taskId, String newStatus) {
        OnboardingTask task = taskRepository.findByIdAndTenantId(taskId, TenantContextHolder.getTenantId())
                .orElseThrow(() -> new NoSuchElementException("Onboarding task not found: " + taskId));

        task.setStatus(newStatus);
        if ("COMPLETED".equalsIgnoreCase(newStatus)) {
            task.setCompletedAt(Instant.now());
        }
        taskRepository.save(task);

        // Recalculate instance completion percentage
        List<OnboardingTask> tasks = taskRepository.findByTenantIdAndOnboardingInstanceIdOrderByOrderIndexAsc(
                task.getTenantId(), task.getOnboardingInstanceId()
        );
        if (!tasks.isEmpty()) {
            long completedCount = tasks.stream().filter(t -> "COMPLETED".equalsIgnoreCase(t.getStatus())).count();
            int percentage = (int) Math.round(((double) completedCount / tasks.size()) * 100);

            instanceRepository.findById(task.getOnboardingInstanceId()).ifPresent(inst -> {
                inst.setCompletionPercentage(percentage);
                if (percentage == 100) {
                    inst.setStatus("COMPLETED");
                } else if (percentage > 0 && "PREBOARDING".equalsIgnoreCase(inst.getStatus())) {
                    inst.setStatus("IN_PROGRESS");
                }
                instanceRepository.save(inst);
            });
        }

        return task;
    }

    public List<OnboardingTask> getTasksForInstance(String instanceId) {
        return taskRepository.findByTenantIdAndOnboardingInstanceIdOrderByOrderIndexAsc(TenantContextHolder.getTenantId(), instanceId);
    }
}
