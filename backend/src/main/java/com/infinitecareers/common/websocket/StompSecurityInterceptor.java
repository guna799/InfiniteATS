package com.infinitecareers.common.websocket;

import com.infinitecareers.common.JwtTokenProvider;
import com.infinitecareers.common.TenantContext;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class StompSecurityInterceptor implements ChannelInterceptor {

    private final JwtTokenProvider tokenProvider;
    public static final String SESSION_CONTEXT = "tenantContext";
    private static final Pattern TENANT_TOPIC_PATTERN = Pattern.compile("^/topic/tenants/([^/]+)/.*$");

    public StompSecurityInterceptor(JwtTokenProvider tokenProvider) {
        this.tokenProvider = tokenProvider;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || accessor.getCommand() == null) {
            return message;
        }
        Map<String, Object> session = accessor.getSessionAttributes();

        switch (accessor.getCommand()) {
            case CONNECT -> {
                // Bearer header (non-browser clients) takes precedence over the handshake cookie
                String authHeader = accessor.getFirstNativeHeader("Authorization");
                TenantContext ctx = authHeader != null && authHeader.startsWith("Bearer ")
                        ? tokenProvider.parseAccessToken(authHeader.substring(7))
                            .orElseThrow(() -> new AccessDeniedException("Invalid JWT token for WebSocket authentication"))
                        : session != null ? (TenantContext) session.get(SESSION_CONTEXT) : null;
                if (ctx == null || ctx.getTenantId() == null) {
                    throw new AccessDeniedException("WebSocket authentication required");
                }
                if (session != null) {
                    session.put(SESSION_CONTEXT, ctx);
                }
                accessor.setUser(new StompPrincipal(ctx.getUserId(), ctx.getTenantId()));
            }
            case SUBSCRIBE -> {
                TenantContext ctx = session != null ? (TenantContext) session.get(SESSION_CONTEXT) : null;
                if (ctx == null) {
                    throw new AccessDeniedException("WebSocket authentication required");
                }
                String destination = accessor.getDestination();
                if (destination == null) {
                    throw new AccessDeniedException("Subscription destination required");
                }
                Matcher matcher = TENANT_TOPIC_PATTERN.matcher(destination);
                if (matcher.matches()) {
                    String requestedTenantId = matcher.group(1);
                    if (!requestedTenantId.equals(ctx.getTenantId())) {
                        throw new AccessDeniedException(String.format(
                                "Cross-tenant subscription prohibited! User from tenant [%s] cannot subscribe to [%s]",
                                ctx.getTenantId(), requestedTenantId
                        ));
                    }
                } else if (!destination.startsWith("/user/queue/")) {
                    throw new AccessDeniedException("Subscription to " + destination + " is not allowed");
                }
            }
            case SEND -> {
                if (session == null || session.get(SESSION_CONTEXT) == null) {
                    throw new AccessDeniedException("WebSocket authentication required");
                }
            }
            default -> {
            }
        }
        return message;
    }

    public static class StompPrincipal implements java.security.Principal {
        private final String userId;
        private final String tenantId;

        public StompPrincipal(String userId, String tenantId) {
            this.userId = userId;
            this.tenantId = tenantId;
        }

        @Override
        public String getName() {
            return userId;
        }

        public String getTenantId() {
            return tenantId;
        }
    }
}
