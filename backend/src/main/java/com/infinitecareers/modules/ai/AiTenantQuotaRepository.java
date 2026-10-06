package com.infinitecareers.modules.ai;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AiTenantQuotaRepository extends JpaRepository<AiTenantQuota, String> {
    Optional<AiTenantQuota> findByTenantId(String tenantId);
}
