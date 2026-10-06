package com.infinitecareers.modules.onboarding;

import com.infinitecareers.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/onboarding")
@Tag(name = "Preboarding & Employee Onboarding", description = "Onboarding instance orchestration, checklist automation, and Day 1 readiness tracking")
public class OnboardingController {

    private final OnboardingService onboardingService;

    public OnboardingController(OnboardingService onboardingService) {
        this.onboardingService = onboardingService;
    }

    @GetMapping
    @Operation(summary = "List all active onboarding instances")
    public ResponseEntity<ApiResponse<List<OnboardingInstance>>> getAllInstances() {
        return ResponseEntity.ok(ApiResponse.success(onboardingService.getAllInstances()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get onboarding instance details")
    public ResponseEntity<ApiResponse<OnboardingInstance>> getInstanceById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(onboardingService.getInstanceById(id)));
    }

    @PostMapping("/start")
    @Operation(summary = "Initialize preboarding workflow for hired candidate")
    public ResponseEntity<ApiResponse<OnboardingInstance>> startOnboarding(@RequestBody Map<String, String> payload) {
        String applicationId = payload.get("applicationId");
        String candidateId = payload.get("candidateId");
        String startDateStr = payload.get("targetStartDate");
        LocalDate targetStartDate = startDateStr != null ? LocalDate.parse(startDateStr) : null;

        OnboardingInstance instance = onboardingService.startOnboarding(applicationId, candidateId, targetStartDate);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(instance));
    }

    @GetMapping("/{id}/tasks")
    @Operation(summary = "List onboarding tasks for instance")
    public ResponseEntity<ApiResponse<List<OnboardingTask>>> getTasks(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(onboardingService.getTasksForInstance(id)));
    }

    @PatchMapping("/tasks/{taskId}/status")
    @Operation(summary = "Update task status (NOT_STARTED, IN_PROGRESS, COMPLETED, BLOCKED)")
    public ResponseEntity<ApiResponse<OnboardingTask>> updateTaskStatus(
            @PathVariable String taskId,
            @RequestBody Map<String, String> payload) {
        String status = payload.get("status");
        return ResponseEntity.ok(ApiResponse.success(onboardingService.updateTaskStatus(taskId, status)));
    }
}
