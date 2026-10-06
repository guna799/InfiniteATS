package com.infinitecareers.common;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Component
public class JwtTokenProvider {

    /** HttpOnly cookie carrying the access token for browser clients (REST and the WebSocket handshake). */
    public static final String ACCESS_COOKIE = "ic_access";

    private final SecretKey key;
    private final long expirationMs;
    private final long refreshExpirationMs;

    public JwtTokenProvider(
            @Value("${app.jwt.secret:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}") String secret,
            @Value("${app.jwt.expiration-ms:86400000}") long expirationMs,
            @Value("${app.jwt.refresh-expiration-ms:604800000}") long refreshExpirationMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
        this.refreshExpirationMs = refreshExpirationMs;
    }

    public String generateToken(String userId, String email, String tenantId, Set<String> roles, Set<String> permissions, String dataScope) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(userId)
                .claim("email", email)
                .claim("tenantId", tenantId)
                .claim("roles", roles)
                .claim("permissions", permissions)
                .claim("dataScope", dataScope != null ? dataScope : "TENANT")
                .claim("tokenType", "ACCESS")
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }

    public String generateRefreshToken(String userId, String tenantId) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + refreshExpirationMs);

        return Jwts.builder()
                .subject(userId)
                .claim("tenantId", tenantId)
                .claim("tokenType", "REFRESH")
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }

    public Claims getClaimsFromToken(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
            return true;
        } catch (Exception ex) {
            return false;
        }
    }

    /**
     * Validates an access token and builds the caller's tenant context. Refresh tokens are rejected so they
     * cannot be replayed as long-lived access tokens.
     */
    public java.util.Optional<TenantContext> parseAccessToken(String token) {
        if (token == null || token.isBlank()) {
            return java.util.Optional.empty();
        }
        try {
            Claims claims = getClaimsFromToken(token);
            if ("REFRESH".equals(claims.get("tokenType", String.class))) {
                return java.util.Optional.empty();
            }
            return java.util.Optional.of(new TenantContext(
                    claims.get("tenantId", String.class),
                    claims.getSubject(),
                    claims.get("email", String.class),
                    toStringSet(claims.get("roles", java.util.List.class)),
                    toStringSet(claims.get("permissions", java.util.List.class)),
                    claims.get("dataScope", String.class)
            ));
        } catch (Exception ex) {
            return java.util.Optional.empty();
        }
    }

    private static Set<String> toStringSet(java.util.List<?> values) {
        return values == null ? Set.of()
                : values.stream().map(Object::toString).collect(java.util.stream.Collectors.toUnmodifiableSet());
    }
}
