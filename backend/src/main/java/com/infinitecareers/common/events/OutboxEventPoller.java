package com.infinitecareers.common.events;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.infinitecareers.common.websocket.RealtimeFanout;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Delivers committed outbox events. Safe to run on every replica: each event is claimed by exactly one
 * replica, which hands it to {@link RealtimeFanout} for delivery to clients connected to any replica.
 */
@Component
@EnableScheduling
public class OutboxEventPoller {

    private static final Logger log = LoggerFactory.getLogger(OutboxEventPoller.class);
    static final int MAX_RETRIES = 5;
    private static final Duration CLAIM_TIMEOUT = Duration.ofSeconds(60);

    private final OutboxEventRepository outboxEventRepository;
    private final RealtimeFanout fanout;
    private final ObjectMapper objectMapper;
    private final boolean enabled;

    public OutboxEventPoller(OutboxEventRepository outboxEventRepository, RealtimeFanout fanout, ObjectMapper objectMapper,
                             @Value("${app.outbox.poller-enabled:true}") boolean enabled) {
        this.outboxEventRepository = outboxEventRepository;
        this.fanout = fanout;
        this.objectMapper = objectMapper;
        this.enabled = enabled;
    }

    @Scheduled(fixedDelayString = "${app.outbox.poll-interval-ms:500}")
    public void processOutboxEvents() {
        if (enabled) {
            drainOnce();
        }
    }

    /** One delivery pass over pending events (also used directly by tests). */
    public void drainOnce() {
        outboxEventRepository.releaseStaleClaims(Instant.now().minus(CLAIM_TIMEOUT));
        List<OutboxEvent> pending = outboxEventRepository.findPendingEvents(PageRequest.of(0, 50));
        for (OutboxEvent row : pending) {
            if (outboxEventRepository.claim(row.getId(), Instant.now()) != 1) {
                continue; // another replica owns it
            }
            deliver(row);
        }
    }

    void deliver(OutboxEvent row) {
        try {
            fanout.publish(objectMapper.readValue(row.getPayloadJson(), DomainEvent.class));
            outboxEventRepository.markPublished(row.getId(), Instant.now());
        } catch (Exception e) {
            log.warn("Outbox event {} ({}) delivery failed: {}", row.getId(), row.getEventType(), e.getMessage());
            outboxEventRepository.markAttemptFailed(row.getId(), truncate(e.getMessage()), MAX_RETRIES);
        }
    }

    private static String truncate(String message) {
        if (message == null) {
            return "unknown error";
        }
        return message.length() > 1000 ? message.substring(0, 1000) : message;
    }
}
