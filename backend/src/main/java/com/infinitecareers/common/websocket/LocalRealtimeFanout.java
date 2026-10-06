package com.infinitecareers.common.websocket;

import com.infinitecareers.common.events.DomainEvent;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/** Single-instance delivery (local development, tests). Set app.realtime.fanout=redis when running replicas. */
@Component
@ConditionalOnProperty(name = "app.realtime.fanout", havingValue = "local", matchIfMissing = true)
public class LocalRealtimeFanout implements RealtimeFanout {

    private final RealtimeEventPublisher publisher;

    public LocalRealtimeFanout(RealtimeEventPublisher publisher) {
        this.publisher = publisher;
    }

    @Override
    public void publish(DomainEvent event) {
        publisher.broadcastTenantEvent(event);
    }
}
