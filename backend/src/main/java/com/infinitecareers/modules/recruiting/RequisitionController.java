package com.infinitecareers.modules.recruiting;

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
@RequestMapping("/api/v1/requisitions")
@Tag(name = "Job Requisitions", description = "Lifecycle management of enterprise job requisitions and approvals")
public class RequisitionController {

    private final RequisitionService requisitionService;

    public RequisitionController(RequisitionService requisitionService) {
        this.requisitionService = requisitionService;
    }

    @GetMapping
    @Operation(summary = "List all job requisitions with pagination")
    public ResponseEntity<ApiResponse<List<JobRequisition>>> listRequisitions(@PageableDefault(size = 25) Pageable pageable) {
        Page<JobRequisition> page = requisitionService.getRequisitions(pageable);
        return ResponseEntity.ok(ApiResponse.success(page.getContent(), Map.of(
                "totalElements", page.getTotalElements(),
                "totalPages", page.getTotalPages(),
                "pageNumber", page.getNumber(),
                "pageSize", page.getSize()
        )));
    }

    @PostMapping
    @Operation(summary = "Create new draft job requisition")
    public ResponseEntity<ApiResponse<JobRequisition>> createRequisition(@Valid @RequestBody JobRequisition requisition) {
        JobRequisition created = requisitionService.createRequisition(requisition);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(created));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get requisition details by ID")
    public ResponseEntity<ApiResponse<JobRequisition>> getRequisitionById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(requisitionService.getRequisitionById(id)));
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Partially update requisition details")
    public ResponseEntity<ApiResponse<JobRequisition>> updateRequisition(@PathVariable String id, @RequestBody JobRequisition updates) {
        return ResponseEntity.ok(ApiResponse.success(requisitionService.updateRequisition(id, updates)));
    }

    @PostMapping("/{id}/submit")
    @Operation(summary = "Submit requisition for leadership approval")
    public ResponseEntity<ApiResponse<JobRequisition>> submit(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(requisitionService.submit(id)));
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "Approve requisition for hiring")
    public ResponseEntity<ApiResponse<JobRequisition>> approve(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(requisitionService.approve(id)));
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "Reject requisition with feedback")
    public ResponseEntity<ApiResponse<JobRequisition>> reject(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(requisitionService.reject(id)));
    }

    @PostMapping("/{id}/publish")
    @Operation(summary = "Publish approved requisition to public careers portal")
    public ResponseEntity<ApiResponse<JobRequisition>> publish(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(requisitionService.publish(id)));
    }

    @PostMapping("/{id}/close")
    @Operation(summary = "Close filled or cancelled requisition")
    public ResponseEntity<ApiResponse<JobRequisition>> close(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(requisitionService.close(id)));
    }
}
