package com.infinitecareers.modules.audit;

import com.infinitecareers.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/audit")
@Tag(name = "Compliance & Audit Trail", description = "Immutable enterprise audit logging of security events, compensation edits, and stage transitions")
public class AuditController {

    private final AuditLogService auditLogService;

    public AuditController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    @Operation(summary = "Query immutable audit logs with pagination")
    public ResponseEntity<ApiResponse<List<AuditLog>>> getAuditLogs(@PageableDefault(size = 50) Pageable pageable) {
        Page<AuditLog> page = auditLogService.getAuditLogs(pageable);
        return ResponseEntity.ok(ApiResponse.success(page.getContent(), Map.of(
                "totalElements", page.getTotalElements(),
                "totalPages", page.getTotalPages(),
                "pageNumber", page.getNumber(),
                "pageSize", page.getSize()
        )));
    }

    @GetMapping("/resource/{type}/{id}")
    @Operation(summary = "Get complete audit history for specific entity")
    public ResponseEntity<ApiResponse<List<AuditLog>>> getResourceAuditTrail(
            @PathVariable String type,
            @PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(auditLogService.getResourceAuditTrail(type, id)));
    }

    @GetMapping("/verify-chain")
    @Operation(summary = "Cryptographically verify the SHA-256 tamper-evident hash chain for current tenant")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyChain() {
        return ResponseEntity.ok(ApiResponse.success(auditLogService.verifyChain(
                com.infinitecareers.common.TenantContextHolder.getTenantId()
        )));
    }
}
