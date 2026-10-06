package com.infinitecareers.modules.ai;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiUsageRecordRepository extends JpaRepository<AiUsageRecord, String> {
    List<AiUsageRecord> findByTenantIdOrderByCreatedAtDesc(String tenantId);
}
