package com.infinitecareers.modules.tenancy;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobProfileRepository extends JpaRepository<JobProfile, String> {
    List<JobProfile> findByTenantId(String tenantId);
}
