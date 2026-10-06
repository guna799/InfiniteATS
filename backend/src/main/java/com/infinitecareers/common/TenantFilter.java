package com.infinitecareers.common;

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

    public static final String CSRF_HEADER = "X-Requested-With";
    public static final String CSRF_HEADER_VALUE = "InfiniteCareers";

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
            String bearer = getBearerToken(request);
            String cookieToken = bearer == null ? getCookieToken(request) : null;
            Optional<TenantContext> authenticated = tokenProvider.parseAccessToken(bearer != null ? bearer : cookieToken);

            if (authenticated.isPresent()) {
                // Browsers send cookies on cross-site requests; a custom header cannot be added cross-site
                // without a CORS preflight, so requiring it blocks CSRF on cookie-authenticated writes.
                if (cookieToken != null && !isSafeMethod(request) && !CSRF_HEADER_VALUE.equals(request.getHeader(CSRF_HEADER))) {
                    response.sendError(HttpServletResponse.SC_FORBIDDEN, "Missing " + CSRF_HEADER + " header");
                    return;
                }
                TenantContext context = authenticated.get();
                org.slf4j.MDC.put("tenant_id", context.getTenantId());
                org.slf4j.MDC.put("user_id", context.getUserId());
                TenantContextHolder.setContext(context);

                List<SimpleGrantedAuthority> authorities = new ArrayList<>();
                context.getRoles().forEach(r -> authorities.add(new SimpleGrantedAuthority("ROLE_" + r)));
                context.getPermissions().forEach(p -> authorities.add(new SimpleGrantedAuthority(p)));
                SecurityContextHolder.getContext().setAuthentication(
                        new UsernamePasswordAuthenticationToken(context.getUserId(), null, authorities));
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

    private static boolean isSafeMethod(HttpServletRequest request) {
        return Set.of("GET", "HEAD", "OPTIONS").contains(request.getMethod());
    }

    private static String getBearerToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    private static String getCookieToken(HttpServletRequest request) {
        if (request.getCookies() == null) {
            return null;
        }
        return Arrays.stream(request.getCookies())
                .filter(c -> JwtTokenProvider.ACCESS_COOKIE.equals(c.getName()) && StringUtils.hasText(c.getValue()))
                .map(jakarta.servlet.http.Cookie::getValue)
                .findFirst()
                .orElse(null);
    }
}
