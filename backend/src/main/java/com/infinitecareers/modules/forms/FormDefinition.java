package com.infinitecareers.modules.forms;

import com.infinitecareers.common.BaseTenantEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "form_definitions")
public class FormDefinition extends BaseTenantEntity {

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "slug", nullable = false)
    private String slug;

    @Column(name = "form_type")
    private String formType = "APPLICATION";

    @Column(name = "schema_json", columnDefinition = "TEXT", nullable = false)
    private String schemaJson;

    @Column(name = "is_published")
    private Boolean isPublished = true;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public String getFormType() { return formType; }
    public void setFormType(String formType) { this.formType = formType; }
    public String getSchemaJson() { return schemaJson; }
    public void setSchemaJson(String schemaJson) { this.schemaJson = schemaJson; }
    public Boolean getIsPublished() { return isPublished; }
    public void setIsPublished(Boolean published) { isPublished = published; }
}
