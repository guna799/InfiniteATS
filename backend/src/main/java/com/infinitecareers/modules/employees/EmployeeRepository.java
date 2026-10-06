package com.infinitecareers.modules.employees;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, String> {
    List<Employee> findByTenantId(String tenantId);
    Page<Employee> findByTenantId(String tenantId, Pageable pageable);
    Optional<Employee> findByIdAndTenantId(String id, String tenantId);
    Optional<Employee> findByTenantIdAndWorkEmail(String tenantId, String workEmail);
}
