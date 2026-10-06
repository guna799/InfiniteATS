package com.infinitecareers.modules.candidates;

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
@RequestMapping("/api/v1/candidates")
@Tag(name = "Candidate Pool & Profiles", description = "Candidate management, deduplication, and talent pool queries")
public class CandidateController {

    private final CandidateService candidateService;

    public CandidateController(CandidateService candidateService) {
        this.candidateService = candidateService;
    }

    @GetMapping
    @Operation(summary = "Search or list candidates with pagination")
    public ResponseEntity<ApiResponse<List<Candidate>>> getCandidates(
            @RequestParam(required = false) String query,
            @PageableDefault(size = 25) Pageable pageable) {
        Page<Candidate> page = candidateService.searchCandidates(query, pageable);
        return ResponseEntity.ok(ApiResponse.success(page.getContent(), Map.of(
                "totalElements", page.getTotalElements(),
                "totalPages", page.getTotalPages(),
                "pageNumber", page.getNumber(),
                "pageSize", page.getSize()
        )));
    }

    @PostMapping
    @Operation(summary = "Create candidate profile or merge duplicate by email")
    public ResponseEntity<ApiResponse<Candidate>> createCandidate(@Valid @RequestBody Candidate candidate) {
        Candidate created = candidateService.createOrResolveCandidate(candidate);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(created));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get candidate detail by ID")
    public ResponseEntity<ApiResponse<Candidate>> getCandidateById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(candidateService.getCandidateById(id)));
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Update candidate profile")
    public ResponseEntity<ApiResponse<Candidate>> updateCandidate(@PathVariable String id, @RequestBody Candidate updates) {
        return ResponseEntity.ok(ApiResponse.success(candidateService.updateCandidate(id, updates)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete candidate record")
    public ResponseEntity<ApiResponse<Void>> deleteCandidate(@PathVariable String id) {
        candidateService.deleteCandidate(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
