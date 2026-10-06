package com.infinitecareers.modules.audit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, String> {
    List<AuditLog> findByTenantIdOrderByCreatedAtDesc(String tenantId);
    List<AuditLog> findByTenantIdOrderByCreatedAtAsc(String tenantId);
    List<AuditLog> findByTenantIdOrderBySequenceNumberAsc(String tenantId);
    java.util.Optional<AuditLog> findFirstByTenantIdOrderByCreatedAtDesc(String tenantId);
    java.util.Optional<AuditLog> findFirstByTenantIdOrderBySequenceNumberDesc(String tenantId);
    // Chained records only: rows seeded before the hash chain existed have a NULL sequence number,
    // and PostgreSQL sorts NULLs first in DESC order.
    java.util.Optional<AuditLog> findFirstByTenantIdAndSequenceNumberIsNotNullOrderBySequenceNumberDesc(String tenantId);
    List<AuditLog> findByTenantIdAndSequenceNumberIsNotNullOrderBySequenceNumberAsc(String tenantId);
    long countByTenantIdAndSequenceNumberIsNull(String tenantId);
    Page<AuditLog> findByTenantIdOrderByCreatedAtDesc(String tenantId, Pageable pageable);
    List<AuditLog> findByTenantIdAndResourceTypeAndResourceId(String tenantId, String resourceType, String resourceId);
}
