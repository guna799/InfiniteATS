package com.infinitecareers.common.idempotency;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "idempotency_keys", indexes = {
        @Index(name = "idx_idempotency_lookup", columnList = "tenant_id, idempotency_key"),
        @Index(name = "idx_idempotency_expires", columnList = "expires_at")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uq_tenant_idempotency_key", columnNames = {"tenant_id", "idempotency_key"})
})
public class IdempotencyKey {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "tenant_id", length = 64, nullable = false)
    private String tenantId;

    @Column(name = "idempotency_key", length = 256, nullable = false)
    private String idempotencyKey;

    @Column(name = "request_hash", length = 64, nullable = false)
    private String requestHash;

    @Column(name = "resource_path", length = 256, nullable = false)
    private String resourcePath;

    @Column(length = 32, nullable = false)
    private String status; // IN_FLIGHT, COMPLETED, FAILED

    @Column(name = "response_status")
    private Integer responseStatus;

    @Column(name = "response_body", columnDefinition = "TEXT")
    private String responseBody;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    public IdempotencyKey() {}

    public IdempotencyKey(String id, String tenantId, String idempotencyKey, String requestHash, String resourcePath, Instant expiresAt) {
        this.id = id;
        this.tenantId = tenantId;
        this.idempotencyKey = idempotencyKey;
        this.requestHash = requestHash;
        this.resourcePath = resourcePath;
        this.status = "IN_FLIGHT";
        this.createdAt = Instant.now();
        this.expiresAt = expiresAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }

    public String getRequestHash() { return requestHash; }
    public void setRequestHash(String requestHash) { this.requestHash = requestHash; }

    public String getResourcePath() { return resourcePath; }
    public void setResourcePath(String resourcePath) { this.resourcePath = resourcePath; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getResponseStatus() { return responseStatus; }
    public void setResponseStatus(Integer responseStatus) { this.responseStatus = responseStatus; }

    public String getResponseBody() { return responseBody; }
    public void setResponseBody(String responseBody) { this.responseBody = responseBody; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
}
