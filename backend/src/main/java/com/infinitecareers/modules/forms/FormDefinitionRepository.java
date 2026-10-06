package com.infinitecareers.modules.forms;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FormDefinitionRepository extends JpaRepository<FormDefinition, String> {
    List<FormDefinition> findByTenantId(String tenantId);
    Optional<FormDefinition> findByIdAndTenantId(String id, String tenantId);
    Optional<FormDefinition> findByTenantIdAndSlug(String tenantId, String slug);
}
