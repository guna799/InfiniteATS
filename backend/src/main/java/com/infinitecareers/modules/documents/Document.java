package com.infinitecareers.modules.documents;

import com.infinitecareers.common.BaseTenantEntity;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "documents")
public class Document extends BaseTenantEntity {

    @Column(name = "owner_id")
    private String ownerId;

    @Column(name = "candidate_id")
    private String candidateId;

    @Column(name = "employee_id")
    private String employeeId;

    @Column(name = "onboarding_id")
    private String onboardingId;

    @Column(name = "application_id")
    private String applicationId;

    @Column(name = "offer_id")
    private String offerId;

    @Column(name = "document_type", nullable = false)
    private String documentType; // AADHAAR, PAN, PASSPORT, RESUME, OFFER_LETTER, SIGNED_OFFER_LETTER, BANK_PROOF, FORM_11, etc.

    @Column(name = "document_category", nullable = false)
    private String documentCategory; // IDENTITY, RESUME, EDUCATION, PREVIOUS_EMPLOYMENT, ADDRESS, BACKGROUND_CHECK, STATUTORY, BANKING, EMPLOYMENT, OFFER, OTHER

    @Column(name = "category")
    private String category; // Legacy alias for backward compatibility

    @Column(name = "filename", nullable = false)
    private String filename;

    @Column(name = "original_filename")
    private String originalFilename;

    @Column(name = "stored_filename")
    private String storedFilename;

    @Column(name = "mime_type", nullable = false)
    private String mimeType;

    @Column(name = "storage_key", nullable = false)
    private String storageKey;

    @Column(name = "s3_bucket")
    private String s3Bucket;

    @Column(name = "s3_key")
    private String s3Key;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @Column(name = "sha256_hash")
    private String sha256Hash;

    @Column(name = "version")
    private Integer version = 1;

    @Column(name = "status")
    private String status = "UPLOADED"; // UPLOADING, UPLOADED, PENDING_VERIFICATION, VERIFIED, REJECTED, EXPIRED, ARCHIVED, DELETED

    @Column(name = "uploaded_by_id")
    private String uploadedById;

    @Column(name = "uploaded_by")
    private String uploadedBy;

    @Column(name = "uploaded_at")
    private Instant uploadedAt = Instant.now();

    @Column(name = "verified_by_id")
    private String verifiedById;

    @Column(name = "verified_by")
    private String verifiedBy;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @Column(name = "rejection_reason")
    private String rejectionReason;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "created_by")
    private String createdBy;

    @PrePersist
    @Override
    protected void onCreate() {
        super.onCreate();
        if (this.category == null) {
            this.category = this.documentCategory != null ? this.documentCategory : "OTHER";
        }
        if (this.documentCategory == null) {
            this.documentCategory = this.category != null ? this.category : "OTHER";
        }
        if (this.documentType == null) {
            this.documentType = "OTHER";
        }
        if (this.s3Key == null) {
            this.s3Key = this.storageKey;
        }
        if (this.storageKey == null) {
            this.storageKey = this.s3Key;
        }
        if (this.originalFilename == null) {
            this.originalFilename = this.filename;
        }
        if (this.filename == null) {
            this.filename = this.originalFilename;
        }
        if (this.uploadedAt == null) {
            this.uploadedAt = Instant.now();
        }
    }

    public String getOwnerId() { return ownerId; }
    public void setOwnerId(String ownerId) { this.ownerId = ownerId; }

    public String getCandidateId() { return candidateId; }
    public void setCandidateId(String candidateId) { this.candidateId = candidateId; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public String getOnboardingId() { return onboardingId; }
    public void setOnboardingId(String onboardingId) { this.onboardingId = onboardingId; }

    public String getApplicationId() { return applicationId; }
    public void setApplicationId(String applicationId) { this.applicationId = applicationId; }

    public String getOfferId() { return offerId; }
    public void setOfferId(String offerId) { this.offerId = offerId; }

    public String getDocumentType() { return documentType; }
    public void setDocumentType(String documentType) { this.documentType = documentType; }

    public String getDocumentCategory() { return documentCategory; }
    public void setDocumentCategory(String documentCategory) { this.documentCategory = documentCategory; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getFilename() { return filename; }
    public void setFilename(String filename) { this.filename = filename; }

    public String getOriginalFilename() { return originalFilename; }
    public void setOriginalFilename(String originalFilename) { this.originalFilename = originalFilename; }

    public String getStoredFilename() { return storedFilename; }
    public void setStoredFilename(String storedFilename) { this.storedFilename = storedFilename; }

    public String getMimeType() { return mimeType; }
    public void setMimeType(String mimeType) { this.mimeType = mimeType; }

    public String getStorageKey() { return storageKey; }
    public void setStorageKey(String storageKey) { this.storageKey = storageKey; }

    public String getS3Bucket() { return s3Bucket; }
    public void setS3Bucket(String s3Bucket) { this.s3Bucket = s3Bucket; }

    public String getS3Key() { return s3Key; }
    public void setS3Key(String s3Key) { this.s3Key = s3Key; }

    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }

    public String getSha256Hash() { return sha256Hash; }
    public void setSha256Hash(String sha256Hash) { this.sha256Hash = sha256Hash; }

    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getUploadedById() { return uploadedById; }
    public void setUploadedById(String uploadedById) { this.uploadedById = uploadedById; }

    public String getUploadedBy() { return uploadedBy; }
    public void setUploadedBy(String uploadedBy) { this.uploadedBy = uploadedBy; }

    public Instant getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(Instant uploadedAt) { this.uploadedAt = uploadedAt; }

    public String getVerifiedById() { return verifiedById; }
    public void setVerifiedById(String verifiedById) { this.verifiedById = verifiedById; }

    public String getVerifiedBy() { return verifiedBy; }
    public void setVerifiedBy(String verifiedBy) { this.verifiedBy = verifiedBy; }

    public Instant getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(Instant verifiedAt) { this.verifiedAt = verifiedAt; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
}
