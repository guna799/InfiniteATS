package com.infinitecareers.common.events;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

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

    @Transactional(propagation = Propagation.REQUIRED)
    public OutboxEvent publishEvent(String tenantId, String eventType, String aggregateType, String aggregateId, Object payload, Map<String, String> headers) {
        try {
            String payloadJson = objectMapper.writeValueAsString(payload);
            String headersJson = headers != null ? objectMapper.writeValueAsString(headers) : "{}";

            OutboxEvent event = new OutboxEvent(
                    UUID.randomUUID().toString(),
                    tenantId,
                    eventType,
                    aggregateType,
                    aggregateId,
                    payloadJson,
                    headersJson
            );

            return outboxEventRepository.save(event);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize outbox event payload", e);
        }
    }
}
