package com.infinitecareers.modules.tenancy;

import com.infinitecareers.common.ApiResponse;
import com.infinitecareers.common.TenantContextHolder;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/organization")
@Tag(name = "Organization Structure", description = "Departments, Locations, Business Units, and Job Profiles")
public class OrgStructureController {

    private final DepartmentRepository departmentRepository;
    private final LocationRepository locationRepository;
    private final JobProfileRepository jobProfileRepository;

    public OrgStructureController(
            DepartmentRepository departmentRepository,
            LocationRepository locationRepository,
            JobProfileRepository jobProfileRepository) {
        this.departmentRepository = departmentRepository;
        this.locationRepository = locationRepository;
        this.jobProfileRepository = jobProfileRepository;
    }

    @GetMapping("/departments")
    @Operation(summary = "List departments for the current tenant")
    public ResponseEntity<ApiResponse<List<Department>>> getDepartments() {
        return ResponseEntity.ok(ApiResponse.success(departmentRepository.findByTenantId(TenantContextHolder.getTenantId())));
    }

    @PostMapping("/departments")
    @Operation(summary = "Create department")
    public ResponseEntity<ApiResponse<Department>> createDepartment(@Valid @RequestBody Department department) {
        department.setTenantId(TenantContextHolder.getTenantId());
        return ResponseEntity.ok(ApiResponse.success(departmentRepository.save(department)));
    }

    @GetMapping("/locations")
    @Operation(summary = "List locations for the current tenant")
    public ResponseEntity<ApiResponse<List<Location>>> getLocations() {
        return ResponseEntity.ok(ApiResponse.success(locationRepository.findByTenantId(TenantContextHolder.getTenantId())));
    }

    @PostMapping("/locations")
    @Operation(summary = "Create location")
    public ResponseEntity<ApiResponse<Location>> createLocation(@Valid @RequestBody Location location) {
        location.setTenantId(TenantContextHolder.getTenantId());
        return ResponseEntity.ok(ApiResponse.success(locationRepository.save(location)));
    }

    @GetMapping("/job-profiles")
    @Operation(summary = "List job profiles for the current tenant")
    public ResponseEntity<ApiResponse<List<JobProfile>>> getJobProfiles() {
        return ResponseEntity.ok(ApiResponse.success(jobProfileRepository.findByTenantId(TenantContextHolder.getTenantId())));
    }

    @PostMapping("/job-profiles")
    @Operation(summary = "Create job profile")
    public ResponseEntity<ApiResponse<JobProfile>> createJobProfile(@Valid @RequestBody JobProfile jobProfile) {
        jobProfile.setTenantId(TenantContextHolder.getTenantId());
        return ResponseEntity.ok(ApiResponse.success(jobProfileRepository.save(jobProfile)));
    }
}
