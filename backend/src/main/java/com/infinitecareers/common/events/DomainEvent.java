package com.infinitecareers.common.events;

import java.time.Instant;
import java.util.Map;

/**
 * The single event envelope used across the platform. Every domain change is written to the outbox in this
 * shape and delivered unchanged to WebSocket clients (and future consumers: search, notifications, webhooks).
 *
 * @param eventType     e.g. CANDIDATE_STAGE_CHANGED (see {@link EventTypes})
 * @param entityType    the aggregate the event is about, e.g. APPLICATION
 * @param correlationId the X-Correlation-ID of the request that caused the event
 * @param version       envelope schema version
 * @param payload       event-specific data; must be safe to show to every user in the tenant
 */
public record DomainEvent(
        String eventId,
        String eventType,
        String tenantId,
        String entityType,
        String entityId,
        String actorId,
        String correlationId,
        Instant occurredAt,
        int version,
        Map<String, Object> payload
) {
    public static final int CURRENT_VERSION = 1;
}
