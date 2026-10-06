package com.infinitecareers.common.websocket;

import com.infinitecareers.common.JwtTokenProvider;
import jakarta.servlet.http.Cookie;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Arrays;
import java.util.Map;

/**
 * Authenticates browser WebSocket/SockJS sessions from the HttpOnly access-token cookie, which page
 * JavaScript cannot read and therefore cannot put in a STOMP CONNECT header. The resulting tenant context
 * is checked again by {@link StompSecurityInterceptor} on CONNECT and SUBSCRIBE.
 */
@Component
public class CookieAuthHandshakeInterceptor implements HandshakeInterceptor {

    private final JwtTokenProvider tokenProvider;

    public CookieAuthHandshakeInterceptor(JwtTokenProvider tokenProvider) {
        this.tokenProvider = tokenProvider;
    }

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) {
        if (request instanceof ServletServerHttpRequest servletRequest) {
            Cookie[] cookies = servletRequest.getServletRequest().getCookies();
            if (cookies != null) {
                Arrays.stream(cookies)
                        .filter(c -> JwtTokenProvider.ACCESS_COOKIE.equals(c.getName()))
                        .findFirst()
                        .flatMap(c -> tokenProvider.parseAccessToken(c.getValue()))
                        .ifPresent(ctx -> attributes.put(StompSecurityInterceptor.SESSION_CONTEXT, ctx));
            }
        }
        // Unauthenticated handshakes are allowed through so the STOMP CONNECT can still carry a bearer token;
        // StompSecurityInterceptor rejects the CONNECT if neither is present.
        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
    }
}
