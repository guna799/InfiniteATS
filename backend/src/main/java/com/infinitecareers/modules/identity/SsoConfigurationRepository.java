package com.infinitecareers.modules.identity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SsoConfigurationRepository extends JpaRepository<SsoConfiguration, String> {
    Optional<SsoConfiguration> findByTenantId(String tenantId);
}
