package com.infinitecareers.modules.workflow;

import com.infinitecareers.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/workflows")
@Tag(name = "Workflow Automation Engine", description = "Visual workflow builders, trigger conditions, and durable execution history")
public class WorkflowController {

    private final WorkflowEngineService workflowService;

    public WorkflowController(WorkflowEngineService workflowService) {
        this.workflowService = workflowService;
    }

    @GetMapping("/definitions")
    @Operation(summary = "List workflow definitions for tenant")
    public ResponseEntity<ApiResponse<List<WorkflowDefinition>>> getDefinitions() {
        return ResponseEntity.ok(ApiResponse.success(workflowService.getDefinitions()));
    }

    @PostMapping("/definitions")
    @Operation(summary = "Create workflow definition")
    public ResponseEntity<ApiResponse<WorkflowDefinition>> createDefinition(@Valid @RequestBody WorkflowDefinition definition) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(workflowService.createDefinition(definition)));
    }

    @GetMapping("/instances")
    @Operation(summary = "List workflow execution instances")
    public ResponseEntity<ApiResponse<List<WorkflowInstance>>> getInstances() {
        return ResponseEntity.ok(ApiResponse.success(workflowService.getInstances()));
    }

    @PostMapping("/trigger")
    @Operation(summary = "Trigger workflow execution for an event")
    public ResponseEntity<ApiResponse<WorkflowInstance>> triggerWorkflow(@RequestBody Map<String, String> payload) {
        String eventType = payload.get("eventType");
        String entityType = payload.get("entityType");
        String entityId = payload.get("entityId");
        String contextData = payload.get("contextData");

        WorkflowInstance instance = workflowService.triggerWorkflow(eventType, entityType, entityId, contextData);
        return ResponseEntity.ok(ApiResponse.success(instance));
    }
}
