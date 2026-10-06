package com.infinitecareers.modules.employees;

import com.infinitecareers.common.TenantContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepository;

    public EmployeeService(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }

    public List<Employee> getAllEmployees() {
        return employeeRepository.findByTenantId(TenantContextHolder.getTenantId());
    }

    public Page<Employee> getEmployees(Pageable pageable) {
        return employeeRepository.findByTenantId(TenantContextHolder.getTenantId(), pageable);
    }

    public Employee getEmployeeById(String id) {
        return employeeRepository.findByIdAndTenantId(id, TenantContextHolder.getTenantId())
                .orElseThrow(() -> new NoSuchElementException("Employee not found: " + id));
    }

    @Transactional
    public Employee createEmployee(Employee employee) {
        employee.setTenantId(TenantContextHolder.getTenantId());
        if (employee.getEmployeeNumber() == null || employee.getEmployeeNumber().trim().isEmpty()) {
            employee.setEmployeeNumber("EMP-" + (System.currentTimeMillis() % 100000));
        }
        if (employee.getHireDate() == null) {
            employee.setHireDate(LocalDate.now());
        }
        if (employee.getStatus() == null) {
            employee.setStatus("ACTIVE");
        }
        return employeeRepository.save(employee);
    }

    @Transactional
    public Employee updateEmployee(String id, Employee updates) {
        Employee existing = getEmployeeById(id);
        if (updates.getFirstName() != null) existing.setFirstName(updates.getFirstName());
        if (updates.getLastName() != null) existing.setLastName(updates.getLastName());
        if (updates.getJobTitle() != null) existing.setJobTitle(updates.getJobTitle());
        if (updates.getDepartmentId() != null) existing.setDepartmentId(updates.getDepartmentId());
        if (updates.getLocationId() != null) existing.setLocationId(updates.getLocationId());
        if (updates.getManagerId() != null) existing.setManagerId(updates.getManagerId());
        if (updates.getEmploymentType() != null) existing.setEmploymentType(updates.getEmploymentType());
        if (updates.getStatus() != null) existing.setStatus(updates.getStatus());
        return employeeRepository.save(existing);
    }
}
