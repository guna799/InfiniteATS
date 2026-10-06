package com.infinitecareers.modules.forms;

import com.infinitecareers.common.BaseTenantEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "form_submissions")
public class FormSubmission extends BaseTenantEntity {

    @Column(name = "form_definition_id", nullable = false)
    private String formDefinitionId;

    @Column(name = "submitted_by")
    private String submittedBy;

    @Column(name = "answers_json", columnDefinition = "TEXT", nullable = false)
    private String answersJson;

    public String getFormDefinitionId() { return formDefinitionId; }
    public void setFormDefinitionId(String formDefinitionId) { this.formDefinitionId = formDefinitionId; }
    public String getSubmittedBy() { return submittedBy; }
    public void setSubmittedBy(String submittedBy) { this.submittedBy = submittedBy; }
    public String getAnswersJson() { return answersJson; }
    public void setAnswersJson(String answersJson) { this.answersJson = answersJson; }
}
