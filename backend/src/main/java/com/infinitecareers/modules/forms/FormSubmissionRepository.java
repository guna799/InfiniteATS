package com.infinitecareers.modules.forms;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FormSubmissionRepository extends JpaRepository<FormSubmission, String> {
    List<FormSubmission> findByTenantIdAndFormDefinitionId(String tenantId, String formDefinitionId);
}
