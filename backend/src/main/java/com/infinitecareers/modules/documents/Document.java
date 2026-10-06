package com.infinitecareers.modules.documents;

import com.infinitecareers.common.BaseTenantEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "documents")
public class Document extends BaseTenantEntity {

    @Column(name = "owner_id")
    private String ownerId;

    @Column(name = "category", nullable = false)
    private String category; // RESUME, OFFER_LETTER, SIGNED_OFFER, TAX_FORM, ID_VERIFICATION, CERTIFICATION

    @Column(name = "filename", nullable = false)
    private String filename;

    @Column(name = "mime_type", nullable = false)
    private String mimeType;

    @Column(name = "storage_key", nullable = false)
    private String storageKey;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @Column(name = "version")
    private Integer version = 1;

    @Column(name = "status")
    private String status = "ACTIVE";

    @Column(name = "created_by")
    private String createdBy;

    public String getOwnerId() { return ownerId; }
    public void setOwnerId(String ownerId) { this.ownerId = ownerId; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getFilename() { return filename; }
    public void setFilename(String filename) { this.filename = filename; }
    public String getMimeType() { return mimeType; }
    public void setMimeType(String mimeType) { this.mimeType = mimeType; }
    public String getStorageKey() { return storageKey; }
    public void setStorageKey(String storageKey) { this.storageKey = storageKey; }
    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }
    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
}
