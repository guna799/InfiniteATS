package com.infinitecareers.common.websocket;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final StompSecurityInterceptor stompSecurityInterceptor;
    private final CookieAuthHandshakeInterceptor cookieAuthHandshakeInterceptor;
    private final String[] allowedOrigins;

    public WebSocketConfig(StompSecurityInterceptor stompSecurityInterceptor,
                           CookieAuthHandshakeInterceptor cookieAuthHandshakeInterceptor,
                           @org.springframework.beans.factory.annotation.Value("${app.cors.allowed-origins:}") String[] allowedOrigins) {
        this.stompSecurityInterceptor = stompSecurityInterceptor;
        this.cookieAuthHandshakeInterceptor = cookieAuthHandshakeInterceptor;
        this.allowedOrigins = allowedOrigins;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Topic for tenant broadcast (e.g. /topic/tenants/{tenantId}/events)
        // Queue for private user notifications (e.g. /queue/notifications)
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Same-origin only unless app.cors.allowed-origins lists more: the session is cookie-authenticated,
        // so accepting any Origin would allow cross-site WebSocket hijacking.
        var endpoint = registry.addEndpoint("/ws").addInterceptors(cookieAuthHandshakeInterceptor);
        if (allowedOrigins.length > 0) {
            endpoint.setAllowedOrigins(allowedOrigins);
        }
        endpoint.withSockJS();
    }

    @Override
    public void configureClientInboundChannel(org.springframework.messaging.simp.config.ChannelRegistration registration) {
        registration.interceptors(stompSecurityInterceptor);
    }
}
