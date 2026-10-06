package com.infinitecareers.modules.onboarding;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OnboardingTaskRepository extends JpaRepository<OnboardingTask, String> {
    List<OnboardingTask> findByTenantIdAndOnboardingInstanceIdOrderByOrderIndexAsc(String tenantId, String onboardingInstanceId);
    Optional<OnboardingTask> findByIdAndTenantId(String id, String tenantId);
}
