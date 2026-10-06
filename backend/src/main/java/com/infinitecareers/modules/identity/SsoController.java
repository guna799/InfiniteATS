package com.infinitecareers.modules.identity;

import com.infinitecareers.common.ApiResponse;
import com.infinitecareers.common.TenantContextHolder;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth/sso")
@Tag(name = "Enterprise SSO (OIDC & SAML)", description = "Enterprise Single Sign-On and identity federation")
public class SsoController {

    private final SsoService ssoService;

    public SsoController(SsoService ssoService) {
        this.ssoService = ssoService;
    }

    @GetMapping("/config")
    @Operation(summary = "Get SSO configuration for current tenant")
    public ResponseEntity<ApiResponse<SsoConfiguration>> getSsoConfig() {
        String tenantId = TenantContextHolder.getTenantId();
        return ResponseEntity.ok(ApiResponse.success(
                ssoService.getConfiguration(tenantId).orElse(null)
        ));
    }

    @PostMapping("/config")
    @Operation(summary = "Configure or update SSO identity provider for tenant")
    public ResponseEntity<ApiResponse<SsoConfiguration>> configureSso(@RequestBody Map<String, Object> request) {
        String tenantId = TenantContextHolder.getTenantId();
        String providerType = (String) request.getOrDefault("providerType", "OIDC");
        String issuerUrl = (String) request.get("issuerUrl");
        String clientId = (String) request.get("clientId");
        String clientSecret = (String) request.get("clientSecret");
        Boolean enforceSso = (Boolean) request.getOrDefault("enforceSso", false);

        SsoConfiguration config = ssoService.configureSso(tenantId, providerType, issuerUrl, clientId, clientSecret, enforceSso);
        return ResponseEntity.ok(ApiResponse.success(config));
    }

    @PostMapping("/login")
    @Operation(summary = "Initiate SSO authorization flow")
    public ResponseEntity<ApiResponse<Map<String, String>>> initiateLogin(@RequestBody Map<String, String> request) {
        String tenantId = request.get("tenantId");
        String redirectUri = request.getOrDefault("redirectUri", "http://localhost:3000/auth/sso/callback");

        Map<String, String> result = ssoService.initiateSsoLogin(tenantId, redirectUri);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/callback")
    @Operation(summary = "Complete SSO authentication and obtain JWT session token")
    public ResponseEntity<ApiResponse<AuthDto.AuthResponse>> processCallback(@RequestBody Map<String, String> request) {
        String tenantId = request.get("tenantId");
        String code = request.get("code");
        String email = request.get("email");
        String name = request.get("name");

        AuthDto.AuthResponse authResponse = ssoService.processSsoCallback(tenantId, code, email, name);
        return ResponseEntity.ok(ApiResponse.success(authResponse));
    }
}
