package com.infinitecareers.modules.recruiting;

import com.infinitecareers.common.ApiResponse;
import com.infinitecareers.common.TenantContextHolder;
import com.infinitecareers.modules.tenancy.Tenant;
import com.infinitecareers.modules.tenancy.TenantRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/v1/public/postings")
@Tag(name = "Public Career Postings", description = "Public candidate-facing job board and career portal endpoints")
public class JobPostingController {

    private final JobPostingRepository postingRepository;
    private final JobRequisitionRepository requisitionRepository;
    private final TenantRepository tenantRepository;

    public JobPostingController(
            JobPostingRepository postingRepository,
            JobRequisitionRepository requisitionRepository,
            TenantRepository tenantRepository) {
        this.postingRepository = postingRepository;
        this.requisitionRepository = requisitionRepository;
        this.tenantRepository = tenantRepository;
    }

    @GetMapping("/by-tenant/{tenantSlug}")
    @Operation(summary = "Get published jobs for a company career portal")
    public ResponseEntity<ApiResponse<List<JobPosting>>> getPublicPostingsByTenantSlug(@PathVariable String tenantSlug) {
        Tenant tenant = tenantRepository.findBySlug(tenantSlug)
                .orElseThrow(() -> new NoSuchElementException("Tenant not found: " + tenantSlug));
        List<JobPosting> postings = postingRepository.findByTenantIdAndStatus(tenant.getId(), "PUBLISHED");
        return ResponseEntity.ok(ApiResponse.success(postings));
    }

    @GetMapping("/by-slug/{tenantSlug}/{postingSlug}")
    @Operation(summary = "Get single published job detail for candidate application")
    public ResponseEntity<ApiResponse<JobPosting>> getPostingDetail(
            @PathVariable String tenantSlug,
            @PathVariable String postingSlug) {
        Tenant tenant = tenantRepository.findBySlug(tenantSlug)
                .orElseThrow(() -> new NoSuchElementException("Tenant not found: " + tenantSlug));
        JobPosting posting = postingRepository.findByTenantIdAndSlug(tenant.getId(), postingSlug)
                .orElseThrow(() -> new NoSuchElementException("Job posting not found: " + postingSlug));
        return ResponseEntity.ok(ApiResponse.success(posting));
    }
}
