package com.infinitecareers.common;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Component
public class TenantFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final boolean allowTenantHeader;

    public TenantFilter(JwtTokenProvider tokenProvider,
                        @org.springframework.beans.factory.annotation.Value("${app.security.allow-tenant-header:false}") boolean allowTenantHeader) {
        this.allowTenantHeader = allowTenantHeader;
        this.tokenProvider = tokenProvider;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String correlationId = request.getHeader("X-Correlation-ID");
        if (!StringUtils.hasText(correlationId)) {
            correlationId = "REQ-" + UUID.randomUUID().toString().substring(0, 8);
        }
        response.setHeader("X-Correlation-ID", correlationId);
        org.slf4j.MDC.put("trace_id", correlationId);
        org.slf4j.MDC.put("request_id", correlationId);

        try {
            String jwt = getJwtFromRequest(request);
            if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
                Claims claims = tokenProvider.getClaimsFromToken(jwt);
                String userId = claims.getSubject();
                String email = claims.get("email", String.class);
                String tenantId = claims.get("tenantId", String.class);
                String dataScope = claims.get("dataScope", String.class);

                org.slf4j.MDC.put("tenant_id", tenantId);
                org.slf4j.MDC.put("user_id", userId);

                List<?> rawRoles = claims.get("roles", List.class);
                Set<String> roles = rawRoles != null 
                        ? rawRoles.stream().map(Object::toString).collect(Collectors.toSet())
                        : Collections.emptySet();

                List<?> rawPermissions = claims.get("permissions", List.class);
                Set<String> permissions = rawPermissions != null
                        ? rawPermissions.stream().map(Object::toString).collect(Collectors.toSet())
                        : Collections.emptySet();

                TenantContext context = new TenantContext(tenantId, userId, email, roles, permissions, dataScope);
                TenantContextHolder.setContext(context);

                // Set Spring Security Context
                List<SimpleGrantedAuthority> authorities = new ArrayList<>();
                roles.forEach(r -> authorities.add(new SimpleGrantedAuthority("ROLE_" + r)));
                permissions.forEach(p -> authorities.add(new SimpleGrantedAuthority(p)));

                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        userId, null, authorities
                );
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } else {
                // Local/test profiles only: unauthenticated X-Tenant-ID header fallback
                String headerTenantId = allowTenantHeader ? request.getHeader("X-Tenant-ID") : null;
                if (StringUtils.hasText(headerTenantId)) {
                    org.slf4j.MDC.put("tenant_id", headerTenantId);
                    TenantContext fallbackCtx = new TenantContext(
                            headerTenantId, "dev-user", "dev@infinitecareers.com",
                            Set.of("SUPER_ADMIN", "RECRUITER"),
                            Set.of("CANDIDATE_READ", "CANDIDATE_CREATE", "CANDIDATE_UPDATE", "REQUISITION_READ", "REQUISITION_CREATE", "REQUISITION_APPROVE", "OFFER_READ", "OFFER_CREATE", "OFFER_APPROVE", "EMPLOYEE_READ", "ONBOARDING_READ", "ONBOARDING_UPDATE"),
                            "TENANT"
                    );
                    TenantContextHolder.setContext(fallbackCtx);
                    SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                            "dev-user", null,
                            fallbackCtx.getRoles().stream().map(r -> new SimpleGrantedAuthority("ROLE_" + r)).toList()));
                }
            }

            filterChain.doFilter(request, response);
        } finally {
            TenantContextHolder.clear();
            org.slf4j.MDC.clear();
        }
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
