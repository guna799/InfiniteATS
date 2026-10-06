package com.infinitecareers.modules.search;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "search_index_states")
public class SearchIndexState {

    @Id
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private String tenantId;

    @Column(name = "event_id", nullable = false)
    private String eventId;

    @Column(name = "entity_type", nullable = false)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private String entityId;

    @Column(name = "entity_version", nullable = false)
    private Integer entityVersion = 1;

    @Column(name = "index_name", nullable = false)
    private String indexName;

    @Column(name = "status", nullable = false)
    private String status = "PENDING"; // PENDING, INDEXED, RETRYING, FAILED

    @Column(name = "attempt_count", nullable = false)
    private Integer attemptCount = 0;

    @Column(name = "max_attempts", nullable = false)
    private Integer maxAttempts = 5;

    @Column(name = "last_error", columnDefinition = "TEXT")
    private String lastError;

    @Column(name = "payload_snapshot", columnDefinition = "TEXT")
    private String payloadSnapshot;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "indexed_at")
    private Instant indexedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }
    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }
    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }
    public String getEntityId() { return entityId; }
    public void setEntityId(String entityId) { this.entityId = entityId; }
    public Integer getEntityVersion() { return entityVersion; }
    public void setEntityVersion(Integer entityVersion) { this.entityVersion = entityVersion; }
    public String getIndexName() { return indexName; }
    public void setIndexName(String indexName) { this.indexName = indexName; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getAttemptCount() { return attemptCount; }
    public void setAttemptCount(Integer attemptCount) { this.attemptCount = attemptCount; }
    public Integer getMaxAttempts() { return maxAttempts; }
    public void setMaxAttempts(Integer maxAttempts) { this.maxAttempts = maxAttempts; }
    public String getLastError() { return lastError; }
    public void setLastError(String lastError) { this.lastError = lastError; }
    public String getPayloadSnapshot() { return payloadSnapshot; }
    public void setPayloadSnapshot(String payloadSnapshot) { this.payloadSnapshot = payloadSnapshot; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getIndexedAt() { return indexedAt; }
    public void setIndexedAt(Instant indexedAt) { this.indexedAt = indexedAt; }
}
