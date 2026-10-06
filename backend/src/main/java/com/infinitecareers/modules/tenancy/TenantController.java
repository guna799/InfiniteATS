package com.infinitecareers.modules.tenancy;

import com.infinitecareers.common.ApiResponse;
import com.infinitecareers.common.TenantContextHolder;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/v1/tenants")
@Tag(name = "Tenancy Management", description = "Multi-tenant workspace configuration and organization profiles")
public class TenantController {

    private final TenantRepository tenantRepository;

    public TenantController(TenantRepository tenantRepository) {
        this.tenantRepository = tenantRepository;
    }

    @GetMapping("/current")
    @Operation(summary = "Get currently active tenant workspace details")
    public ResponseEntity<ApiResponse<Tenant>> getCurrentTenant() {
        String tenantId = TenantContextHolder.getTenantId();
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new NoSuchElementException("Tenant not found: " + tenantId));
        return ResponseEntity.ok(ApiResponse.success(tenant));
    }

    @GetMapping("/public/by-slug/{slug}")
    @Operation(summary = "Get public tenant branding and career site info by slug")
    public ResponseEntity<ApiResponse<Tenant>> getTenantBySlug(@PathVariable String slug) {
        Tenant tenant = tenantRepository.findBySlug(slug)
                .orElseThrow(() -> new NoSuchElementException("Tenant not found for slug: " + slug));
        return ResponseEntity.ok(ApiResponse.success(tenant));
    }

    @GetMapping
    @Operation(summary = "List all registered tenants (Platform Admin)")
    public ResponseEntity<ApiResponse<List<Tenant>>> listAllTenants() {
        return ResponseEntity.ok(ApiResponse.success(tenantRepository.findAll()));
    }
}
