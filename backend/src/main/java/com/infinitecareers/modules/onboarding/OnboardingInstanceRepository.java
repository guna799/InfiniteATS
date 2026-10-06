package com.infinitecareers.modules.onboarding;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OnboardingInstanceRepository extends JpaRepository<OnboardingInstance, String> {
    List<OnboardingInstance> findByTenantId(String tenantId);
    Optional<OnboardingInstance> findByIdAndTenantId(String id, String tenantId);
    Optional<OnboardingInstance> findByTenantIdAndApplicationId(String tenantId, String applicationId);
}
