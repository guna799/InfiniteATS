package com.infinitecareers.modules.identity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TenantMembershipRepository extends JpaRepository<TenantMembership, String> {
    List<TenantMembership> findByUserId(String userId);
    Optional<TenantMembership> findByTenantIdAndUserId(String tenantId, String userId);
    List<TenantMembership> findByTenantId(String tenantId);
}
