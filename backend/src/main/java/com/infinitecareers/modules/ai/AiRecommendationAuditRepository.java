package com.infinitecareers.modules.ai;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AiRecommendationAuditRepository extends JpaRepository<AiRecommendationAudit, String> {
    Optional<AiRecommendationAudit> findByTenantIdAndCandidateIdAndJobId(String tenantId, String candidateId, String jobId);
    List<AiRecommendationAudit> findByTenantIdAndCandidateId(String tenantId, String candidateId);
}
