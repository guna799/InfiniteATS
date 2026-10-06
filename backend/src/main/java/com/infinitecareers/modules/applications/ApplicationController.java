package com.infinitecareers.modules.applications;

import com.infinitecareers.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/applications")
@Tag(name = "Candidate Applications & Pipeline", description = "Application tracking, pipeline progression, and immutable stage history")
public class ApplicationController {

    private final ApplicationService applicationService;

    public ApplicationController(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    @GetMapping
    @Operation(summary = "List applications with filters or pagination")
    public ResponseEntity<ApiResponse<List<Application>>> getApplications(
            @RequestParam(required = false) String requisitionId,
            @RequestParam(required = false) String stage,
            @PageableDefault(size = 50) Pageable pageable) {
        Page<Application> page = applicationService.getApplicationsPaged(pageable);
        return ResponseEntity.ok(ApiResponse.success(page.getContent(), Map.of(
                "totalElements", page.getTotalElements(),
                "totalPages", page.getTotalPages(),
                "pageNumber", page.getNumber(),
                "pageSize", page.getSize()
        )));
    }

    @PostMapping
    @Operation(summary = "Submit new application")
    public ResponseEntity<ApiResponse<Application>> createApplication(@Valid @RequestBody Application application) {
        Application created = applicationService.createApplication(application);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(created));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get application details")
    public ResponseEntity<ApiResponse<Application>> getApplicationById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(applicationService.getApplicationById(id)));
    }

    @PostMapping("/{id}/move-stage")
    @Operation(summary = "Move application to a new pipeline stage with audit trail")
    public ResponseEntity<ApiResponse<Application>> moveStage(
            @PathVariable String id,
            @RequestBody Map<String, String> payload) {
        String targetStage = payload.get("stage");
        String reason = payload.get("reason");
        String notes = payload.get("notes");
        Application updated = applicationService.updateStage(id, targetStage, reason, notes);
        return ResponseEntity.ok(ApiResponse.success(updated));
    }

    @GetMapping("/{id}/history")
    @Operation(summary = "Get immutable stage history for an application")
    public ResponseEntity<ApiResponse<List<ApplicationStageHistory>>> getStageHistory(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(applicationService.getStageHistory(id)));
    }
}
