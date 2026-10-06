package com.infinitecareers.common.websocket;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class RealtimeEventPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public RealtimeEventPublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void broadcastTenantEvent(String tenantId, String eventType, Object payload) {
        String destination = "/topic/tenants/" + tenantId + "/events";
        messagingTemplate.convertAndSend(destination, Map.of(
                "eventType", eventType,
                "tenantId", tenantId,
                "payload", payload,
                "timestamp", System.currentTimeMillis()
        ));
    }

    public void sendPrivateNotification(String userId, Object notificationPayload) {
        messagingTemplate.convertAndSendToUser(userId, "/queue/notifications", notificationPayload);
    }
}
