package com.infinitecareers.modules.forms;

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
@RequestMapping("/api/v1/forms")
@Tag(name = "Dynamic Form Engine", description = "Visual form builder, schema definitions, custom applications, and survey responses")
public class FormController {

    private final FormEngineService formService;

    public FormController(FormEngineService formService) {
        this.formService = formService;
    }

    @GetMapping
    @Operation(summary = "List all dynamic form schemas for tenant")
    public ResponseEntity<ApiResponse<List<FormDefinition>>> getAllForms() {
        return ResponseEntity.ok(ApiResponse.success(formService.getAllForms()));
    }

    @PostMapping
    @Operation(summary = "Create custom form schema")
    public ResponseEntity<ApiResponse<FormDefinition>> createForm(@Valid @RequestBody FormDefinition definition) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(formService.createForm(definition)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get form definition and fields schema")
    public ResponseEntity<ApiResponse<FormDefinition>> getFormById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(formService.getFormById(id)));
    }

    @PostMapping("/{id}/submit")
    @Operation(summary = "Submit completed form answers")
    public ResponseEntity<ApiResponse<FormSubmission>> submitForm(
            @PathVariable String id,
            @RequestBody Map<String, String> payload) {
        String answersJson = payload.get("answersJson");
        return ResponseEntity.ok(ApiResponse.success(formService.submitForm(id, answersJson)));
    }

    @GetMapping("/{id}/submissions")
    @Operation(summary = "Get submitted responses for form")
    public ResponseEntity<ApiResponse<List<FormSubmission>>> getSubmissions(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(formService.getSubmissions(id)));
    }
}
