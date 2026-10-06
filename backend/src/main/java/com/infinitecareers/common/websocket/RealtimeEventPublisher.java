package com.infinitecareers.common.websocket;

import com.infinitecareers.common.events.DomainEvent;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

/** Pushes to STOMP clients connected to this replica. Use {@link RealtimeFanout} to reach all replicas. */
@Service
public class RealtimeEventPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public RealtimeEventPublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public static String tenantTopic(String tenantId) {
        return "/topic/tenants/" + tenantId + "/events";
    }

    public void broadcastTenantEvent(DomainEvent event) {
        messagingTemplate.convertAndSend(tenantTopic(event.tenantId()), event);
    }

    public void sendPrivateNotification(String userId, Object notificationPayload) {
        messagingTemplate.convertAndSendToUser(userId, "/queue/notifications", notificationPayload);
    }
}
