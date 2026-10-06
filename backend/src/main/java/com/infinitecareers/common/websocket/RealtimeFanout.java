package com.infinitecareers.common.websocket;

import com.infinitecareers.common.events.DomainEvent;

/**
 * Delivers an event to WebSocket clients connected to <em>any</em> backend replica. The in-memory STOMP broker
 * only reaches clients of the local replica, so multi-replica deployments must use the Redis implementation.
 */
public interface RealtimeFanout {
    void publish(DomainEvent event);
}
