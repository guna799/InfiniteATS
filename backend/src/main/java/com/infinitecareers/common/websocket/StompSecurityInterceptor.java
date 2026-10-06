package com.infinitecareers.common.websocket;

import com.infinitecareers.common.JwtTokenProvider;
import com.infinitecareers.common.TenantContext;
import io.jsonwebtoken.Claims;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Component
public class StompSecurityInterceptor implements ChannelInterceptor {

    private final JwtTokenProvider tokenProvider;
    private static final Pattern TENANT_TOPIC_PATTERN = Pattern.compile("^/topic/tenants/([^/]+)/.*$");

    public StompSecurityInterceptor(JwtTokenProvider tokenProvider) {
        this.tokenProvider = tokenProvider;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }

        // 1. Authenticate during CONNECT
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                try {
                    if (tokenProvider.validateToken(token)) {
                        Claims claims = tokenProvider.getClaimsFromToken(token);
                        String userId = claims.getSubject();
                        String email = claims.get("email", String.class);
                        String tenantId = claims.get("tenantId", String.class);
                        String dataScope = claims.get("dataScope", String.class);

                        List<?> rawRoles = claims.get("roles", List.class);
                        Set<String> roles = rawRoles != null 
                                ? rawRoles.stream().map(Object::toString).collect(Collectors.toSet())
                                : Collections.emptySet();

                        List<?> rawPermissions = claims.get("permissions", List.class);
                        Set<String> permissions = rawPermissions != null
                                ? rawPermissions.stream().map(Object::toString).collect(Collectors.toSet())
                                : Collections.emptySet();

                        TenantContext ctx = new TenantContext(tenantId, userId, email, roles, permissions, dataScope);
                        accessor.getSessionAttributes().put("tenantContext", ctx);
                        accessor.setUser(new StompPrincipal(userId, tenantId));
                    }
                } catch (Exception e) {
                    throw new AccessDeniedException("Invalid JWT token for WebSocket authentication");
                }
            }
        }

        // 2. Enforce Multi-Tenant Isolation during SUBSCRIBE
        if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            String destination = accessor.getDestination();
            if (destination != null) {
                Matcher matcher = TENANT_TOPIC_PATTERN.matcher(destination);
                if (matcher.matches()) {
                    String requestedTenantId = matcher.group(1);
                    TenantContext ctx = (TenantContext) accessor.getSessionAttributes().get("tenantContext");
                    
                    // If session is authenticated, verify tenant matching
                    if (ctx != null && !requestedTenantId.equalsIgnoreCase(ctx.getTenantId())) {
                        throw new AccessDeniedException(String.format(
                                "Cross-tenant subscription prohibited! User from tenant [%s] cannot subscribe to [%s]",
                                ctx.getTenantId(), requestedTenantId
                        ));
                    }
                }
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
