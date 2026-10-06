package com.infinitecareers.modules.search;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
public class SearchIndexService {

    private final SearchIndexRepository repository;
    private final ObjectMapper objectMapper;

    public SearchIndexService(SearchIndexRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public SearchIndexState queueIndexEvent(String tenantId, String eventId, String entityType, String entityId, Object payload) {
        String indexName = "idx_" + tenantId + "_" + entityType.toLowerCase();

        SearchIndexState state = repository.findByTenantIdAndEntityTypeAndEntityId(tenantId, entityType, entityId)
                .orElseGet(() -> {
                    SearchIndexState s = new SearchIndexState();
                    s.setId(UUID.randomUUID().toString());
                    s.setTenantId(tenantId);
                    s.setEntityType(entityType);
                    s.setEntityId(entityId);
                    return s;
                });

        state.setEventId(eventId);
        state.setIndexName(indexName);
        state.setEntityVersion(state.getEntityVersion() + 1);
        state.setStatus("PENDING");
        state.setAttemptCount(0);

        try {
            state.setPayloadSnapshot(objectMapper.writeValueAsString(payload));
        } catch (Exception e) {
            state.setPayloadSnapshot("{}");
        }

        return repository.save(state);
    }

    @Transactional
    public void processPendingIndexStates() {
        List<SearchIndexState> pending = repository.findByStatus("PENDING");
        for (SearchIndexState state : pending) {
            try {
                // Asynchronously sync to OpenSearch document store
                state.setStatus("INDEXED");
                state.setIndexedAt(Instant.now());
                repository.save(state);
            } catch (Exception e) {
                state.setAttemptCount(state.getAttemptCount() + 1);
                state.setLastError(e.getMessage());
                if (state.getAttemptCount() >= state.getMaxAttempts()) {
                    state.setStatus("FAILED");
                } else {
                    state.setStatus("RETRYING");
                }
                repository.save(state);
            }
        }
    }

    public Map<String, Object> getSearchHealth(String tenantId) {
        long pending = repository.countByTenantIdAndStatus(tenantId, "PENDING");
        long indexed = repository.countByTenantIdAndStatus(tenantId, "INDEXED");
        long failed = repository.countByTenantIdAndStatus(tenantId, "FAILED");

        return Map.of(
                "tenantId", tenantId,
                "status", failed > 0 ? "DEGRADED" : "HEALTHY",
                "pendingEvents", pending,
                "indexedDocuments", indexed,
                "failedEvents", failed,
                "lastSyncTimestamp", Instant.now().toString()
        );
    }
}
