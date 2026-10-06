package com.infinitecareers.modules.integrations;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IntegrationRepository extends JpaRepository<Integration, String> {
    List<Integration> findByTenantId(String tenantId);
}
