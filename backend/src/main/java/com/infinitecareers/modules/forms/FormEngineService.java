package com.infinitecareers.modules.forms;

import com.infinitecareers.common.TenantContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
public class FormEngineService {

    private final FormDefinitionRepository definitionRepository;
    private final FormSubmissionRepository submissionRepository;

    public FormEngineService(FormDefinitionRepository definitionRepository, FormSubmissionRepository submissionRepository) {
        this.definitionRepository = definitionRepository;
        this.submissionRepository = submissionRepository;
    }

    public List<FormDefinition> getAllForms() {
        return definitionRepository.findByTenantId(TenantContextHolder.getTenantId());
    }

    public FormDefinition getFormById(String id) {
        return definitionRepository.findByIdAndTenantId(id, TenantContextHolder.getTenantId())
                .orElseThrow(() -> new NoSuchElementException("Form not found: " + id));
    }

    public FormDefinition getFormBySlug(String slug) {
        return definitionRepository.findByTenantIdAndSlug(TenantContextHolder.getTenantId(), slug)
                .orElseThrow(() -> new NoSuchElementException("Form not found for slug: " + slug));
    }

    @Transactional
    public FormDefinition createForm(FormDefinition definition) {
        definition.setTenantId(TenantContextHolder.getTenantId());
        return definitionRepository.save(definition);
    }

    @Transactional
    public FormSubmission submitForm(String formId, String answersJson) {
        FormDefinition def = getFormById(formId);
        FormSubmission submission = new FormSubmission();
        submission.setTenantId(def.getTenantId());
        submission.setFormDefinitionId(def.getId());
        submission.setSubmittedBy(TenantContextHolder.getUserId());
        submission.setAnswersJson(answersJson);
        return submissionRepository.save(submission);
    }

    public List<FormSubmission> getSubmissions(String formId) {
        return submissionRepository.findByTenantIdAndFormDefinitionId(TenantContextHolder.getTenantId(), formId);
    }
}
