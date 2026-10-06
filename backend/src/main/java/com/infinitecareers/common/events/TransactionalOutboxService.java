package com.infinitecareers.common.events;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.infinitecareers.common.TenantContextHolder;
import org.slf4j.MDC;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Service
public class TransactionalOutboxService {

    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;

    public TransactionalOutboxService(OutboxEventRepository outboxEventRepository, ObjectMapper objectMapper) {
        this.outboxEventRepository = outboxEventRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Records a domain event for the current tenant/actor in the caller's transaction, so it is delivered if
     * and only if the business change commits.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public DomainEvent publish(String eventType, String entityType, String entityId, Map<String, Object> payload) {
        DomainEvent event = new DomainEvent(
                UUID.randomUUID().toString(),
                eventType,
                TenantContextHolder.getTenantId(),
                entityType,
                entityId,
                TenantContextHolder.getUserId(),
                MDC.get("trace_id"),
                Instant.now(),
                DomainEvent.CURRENT_VERSION,
                payload
        );
        save(event);
        return event;
    }

    /** Lower-level variant for callers that set the tenant explicitly (e.g. system jobs). */
    @Transactional(propagation = Propagation.REQUIRED)
    public OutboxEvent publishEvent(String tenantId, String eventType, String aggregateType, String aggregateId, Object payload, Map<String, String> headers) {
        DomainEvent event = new DomainEvent(
                UUID.randomUUID().toString(),
                eventType,
                tenantId,
                aggregateType,
                aggregateId,
                TenantContextHolder.getUserId(),
                headers != null ? headers.getOrDefault("correlationId", MDC.get("trace_id")) : MDC.get("trace_id"),
                Instant.now(),
                DomainEvent.CURRENT_VERSION,
                objectMapper.convertValue(payload, new TypeReference<Map<String, Object>>() {})
        );
        return save(event);
    }

    private OutboxEvent save(DomainEvent event) {
        try {
            OutboxEvent row = new OutboxEvent(
                    event.eventId(),
                    event.tenantId(),
                    event.eventType(),
                    event.entityType(),
                    event.entityId(),
                    objectMapper.writeValueAsString(event),
                    "{}"
            );
            return outboxEventRepository.save(row);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to serialize outbox event " + event.eventType(), e);
        }
    }
}
