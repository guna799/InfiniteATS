package com.infinitecareers;

import com.infinitecareers.common.JwtTokenProvider;
import com.infinitecareers.common.TenantContext;
import com.infinitecareers.common.websocket.CookieAuthHandshakeInterceptor;
import com.infinitecareers.common.websocket.StompSecurityInterceptor;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.messaging.Message;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.context.ActiveProfiles;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class StompAuthenticationTest {

    @Autowired private StompSecurityInterceptor interceptor;
    @Autowired private CookieAuthHandshakeInterceptor handshakeInterceptor;
    @Autowired private JwtTokenProvider tokenProvider;

    private Message<byte[]> frame(StompCommand command, Map<String, Object> session, String destination, String authHeader) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(command);
        accessor.setSessionId("sess-" + command);
        accessor.setSessionAttributes(session);
        if (destination != null) {
            accessor.setDestination(destination);
        }
        if (authHeader != null) {
            accessor.setNativeHeader("Authorization", authHeader);
        }
        accessor.setLeaveMutable(true);
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }

    private String token(String tenantId) {
        return tokenProvider.generateToken("user-1", "u@test.com", tenantId, Set.of("RECRUITER"), Set.of(), "TENANT");
    }

    @Test
    @DisplayName("Anonymous CONNECT and SUBSCRIBE are rejected")
    void anonymousRejected() {
        Map<String, Object> session = new HashMap<>();
        assertThrows(AccessDeniedException.class, () -> interceptor.preSend(frame(StompCommand.CONNECT, session, null, null), null));
        assertThrows(AccessDeniedException.class,
                () -> interceptor.preSend(frame(StompCommand.SUBSCRIBE, session, "/topic/tenants/tenant-acme-tech/events", null), null));
        assertThrows(AccessDeniedException.class,
                () -> interceptor.preSend(frame(StompCommand.CONNECT, session, null, "Bearer not-a-jwt"), null));
    }

    @Test
    @DisplayName("Handshake cookie authenticates the session; only own-tenant and user queues may be subscribed")
    void cookieHandshakeThenScopedSubscriptions() throws Exception {
        MockHttpServletRequest http = new MockHttpServletRequest("GET", "/ws/info");
        http.setCookies(new Cookie(JwtTokenProvider.ACCESS_COOKIE, token("tenant-acme-tech")));
        Map<String, Object> session = new HashMap<>();
        assertTrue(handshakeInterceptor.beforeHandshake(new ServletServerHttpRequest(http), null, null, session));
        assertEquals("tenant-acme-tech", ((TenantContext) session.get(StompSecurityInterceptor.SESSION_CONTEXT)).getTenantId());

        assertDoesNotThrow(() -> interceptor.preSend(frame(StompCommand.CONNECT, session, null, null), null));
        assertDoesNotThrow(() -> interceptor.preSend(
                frame(StompCommand.SUBSCRIBE, session, "/topic/tenants/tenant-acme-tech/events", null), null));
        assertDoesNotThrow(() -> interceptor.preSend(
                frame(StompCommand.SUBSCRIBE, session, "/user/queue/notifications", null), null));
        assertThrows(AccessDeniedException.class, () -> interceptor.preSend(
                frame(StompCommand.SUBSCRIBE, session, "/topic/tenants/tenant-nexus-health/events", null), null));
        assertThrows(AccessDeniedException.class, () -> interceptor.preSend(
                frame(StompCommand.SUBSCRIBE, session, "/topic/everything", null), null));
    }

    @Test
    @DisplayName("Refresh tokens cannot open a WebSocket session")
    void refreshTokenRejected() {
        String refresh = tokenProvider.generateRefreshToken("user-1", "tenant-acme-tech");
        assertThrows(AccessDeniedException.class,
                () -> interceptor.preSend(frame(StompCommand.CONNECT, new HashMap<>(), null, "Bearer " + refresh), null));
    }
}
