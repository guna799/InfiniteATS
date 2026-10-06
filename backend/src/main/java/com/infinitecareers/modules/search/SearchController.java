package com.infinitecareers.modules.search;

import com.infinitecareers.common.ApiResponse;
import com.infinitecareers.common.TenantContextHolder;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/search")
@Tag(name = "OpenSearch Indexing & Health", description = "Decoupled search consistency and health monitoring")
public class SearchController {

    private final SearchIndexService searchIndexService;

    public SearchController(SearchIndexService searchIndexService) {
        this.searchIndexService = searchIndexService;
    }

    @GetMapping("/health")
    @Operation(summary = "Get OpenSearch indexing health metrics for current tenant")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSearchHealth() {
        String tenantId = TenantContextHolder.getTenantId();
        return ResponseEntity.ok(ApiResponse.success(searchIndexService.getSearchHealth(tenantId)));
    }
}
