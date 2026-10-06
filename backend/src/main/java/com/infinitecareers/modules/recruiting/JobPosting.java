package com.infinitecareers.modules.recruiting;

import com.infinitecareers.common.BaseTenantEntity;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "job_postings")
public class JobPosting extends BaseTenantEntity {

    @Column(name = "requisition_id", nullable = false)
    private String requisitionId;

    @Column(name = "posting_type")
    private String postingType = "PUBLIC";

    @Column(name = "status")
    private String status = "DRAFT";

    @Column(name = "slug", nullable = false)
    private String slug;

    @Column(name = "seo_title")
    private String seoTitle;

    @Column(name = "seo_description", columnDefinition = "TEXT")
    private String seoDescription;

    @Column(name = "published_at")
    private Instant publishedAt;

    @Column(name = "expires_at")
    private Instant expiresAt;

    public String getRequisitionId() { return requisitionId; }
    public void setRequisitionId(String requisitionId) { this.requisitionId = requisitionId; }
    public String getPostingType() { return postingType; }
    public void setPostingType(String postingType) { this.postingType = postingType; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public String getSeoTitle() { return seoTitle; }
    public void setSeoTitle(String seoTitle) { this.seoTitle = seoTitle; }
    public String getSeoDescription() { return seoDescription; }
    public void setSeoDescription(String seoDescription) { this.seoDescription = seoDescription; }
    public Instant getPublishedAt() { return publishedAt; }
    public void setPublishedAt(Instant publishedAt) { this.publishedAt = publishedAt; }
    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
}
