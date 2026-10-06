package com.infinitecareers.common.events;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.infinitecareers.common.websocket.RealtimeEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Component
@EnableScheduling
public class OutboxEventPoller {

    private final OutboxEventRepository outboxEventRepository;
    private final RealtimeEventPublisher realtimeEventPublisher;
    private final ObjectMapper objectMapper;

    public OutboxEventPoller(OutboxEventRepository outboxEventRepository, RealtimeEventPublisher realtimeEventPublisher, ObjectMapper objectMapper) {
        this.outboxEventRepository = outboxEventRepository;
        this.realtimeEventPublisher = realtimeEventPublisher;
        this.objectMapper = objectMapper;
    }

    @Scheduled(fixedDelay = 500)
    @Transactional
    public void processOutboxEvents() {
        List<OutboxEvent> pending = outboxEventRepository.findPendingEvents(PageRequest.of(0, 50));
        for (OutboxEvent event : pending) {
            try {
                Object payloadObj = objectMapper.readValue(event.getPayloadJson(), Map.class);
                // 1. Broadcast to real-time WebSockets
                realtimeEventPublisher.broadcastTenantEvent(event.getTenantId(), event.getEventType(), payloadObj);

                // 2. Mark event as PUBLISHED
                event.setStatus("PUBLISHED");
                event.setPublishedAt(Instant.now());
                outboxEventRepository.save(event);
            } catch (Exception e) {
                event.setRetryCount(event.getRetryCount() + 1);
                if (event.getRetryCount() >= 5) {
                    event.setStatus("FAILED");
                }
                event.setErrorMessage(e.getMessage());
                outboxEventRepository.save(event);
            }
        }
    }
}
