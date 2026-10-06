package com.infinitecareers.modules.employees;

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
@RequestMapping("/api/v1/employees")
@Tag(name = "Employee Directory & HCM", description = "Active employee records, positions, and org chart relationships")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping
    @Operation(summary = "List active employees with pagination")
    public ResponseEntity<ApiResponse<List<Employee>>> getEmployees(@PageableDefault(size = 25) Pageable pageable) {
        Page<Employee> page = employeeService.getEmployees(pageable);
        return ResponseEntity.ok(ApiResponse.success(page.getContent(), Map.of(
                "totalElements", page.getTotalElements(),
                "totalPages", page.getTotalPages(),
                "pageNumber", page.getNumber(),
                "pageSize", page.getSize()
        )));
    }

    @PostMapping
    @Operation(summary = "Create employee profile (typically from completed onboarding)")
    public ResponseEntity<ApiResponse<Employee>> createEmployee(@Valid @RequestBody Employee employee) {
        Employee created = employeeService.createEmployee(employee);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(created));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get employee profile details")
    public ResponseEntity<ApiResponse<Employee>> getEmployeeById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(employeeService.getEmployeeById(id)));
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Update employee details")
    public ResponseEntity<ApiResponse<Employee>> updateEmployee(@PathVariable String id, @RequestBody Employee updates) {
        return ResponseEntity.ok(ApiResponse.success(employeeService.updateEmployee(id, updates)));
    }
}
