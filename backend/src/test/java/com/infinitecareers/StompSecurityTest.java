package com.infinitecareers;

import com.infinitecareers.common.TenantContext;
import com.infinitecareers.common.websocket.StompSecurityInterceptor;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.messaging.Message;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.context.ActiveProfiles;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class StompSecurityTest {

    @Autowired
    private StompSecurityInterceptor interceptor;

    @Test
    @DisplayName("Verify STOMP security interceptor allows same-tenant subscription and rejects cross-tenant subscription")
    void testCrossTenantSubscriptionRejection() {
        TenantContext ctx = new TenantContext(
                "tenant-alpha", "user-1", "alpha@test.com",
                Set.of("RECRUITER"), Set.of("CANDIDATE_READ"), "TENANT"
        );

        // 1. Same-tenant subscription -> PASS
        StompHeaderAccessor allowedAccessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        allowedAccessor.setDestination("/topic/tenants/tenant-alpha/events");
        allowedAccessor.setSessionId("sess-1");
        Map<String, Object> sessionAttributes = new HashMap<>();
        sessionAttributes.put("tenantContext", ctx);
        allowedAccessor.setSessionAttributes(sessionAttributes);

        Message<byte[]> allowedMessage = MessageBuilder.createMessage(new byte[0], allowedAccessor.getMessageHeaders());
        assertDoesNotThrow(() -> interceptor.preSend(allowedMessage, null));

        // 2. Cross-tenant subscription (Alpha user attempting to listen to Beta's events) -> DENY
        StompHeaderAccessor crossAccessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        crossAccessor.setDestination("/topic/tenants/tenant-beta/events");
        crossAccessor.setSessionId("sess-1");
        crossAccessor.setSessionAttributes(sessionAttributes);

        Message<byte[]> crossMessage = MessageBuilder.createMessage(new byte[0], crossAccessor.getMessageHeaders());
        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () -> interceptor.preSend(crossMessage, null));
        assertTrue(ex.getMessage().contains("Cross-tenant subscription prohibited"));
    }
}
