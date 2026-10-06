package com.infinitecareers.modules.interviews;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InterviewRepository extends JpaRepository<Interview, String> {
    List<Interview> findByTenantId(String tenantId);
    Optional<Interview> findByIdAndTenantId(String id, String tenantId);
    List<Interview> findByTenantIdAndApplicationId(String tenantId, String applicationId);
}
