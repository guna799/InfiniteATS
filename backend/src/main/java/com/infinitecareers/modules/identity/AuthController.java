package com.infinitecareers.modules.identity;

import com.infinitecareers.common.ApiResponse;
import com.infinitecareers.common.TenantContextHolder;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication & Identity", description = "Authentication, registration, MFA, and token lifecycle endpoints")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate user with email and password")
    public ResponseEntity<ApiResponse<AuthDto.AuthResponse>> login(@Valid @RequestBody AuthDto.LoginRequest request) {
        AuthDto.AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/register")
    @Operation(summary = "Register new tenant workspace and administrator account")
    public ResponseEntity<ApiResponse<AuthDto.AuthResponse>> register(@Valid @RequestBody AuthDto.RegisterRequest request) {
        AuthDto.AuthResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token using valid refresh token")
    public ResponseEntity<ApiResponse<AuthDto.AuthResponse>> refresh(@Valid @RequestBody AuthDto.RefreshTokenRequest request) {
        AuthDto.AuthResponse response = authService.refresh(request.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user identity and active tenant context")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMe() {
        var ctx = TenantContextHolder.getContext();
        if (ctx == null) {
            return ResponseEntity.ok(ApiResponse.success(Map.of(
                    "authenticated", false,
                    "tenantId", TenantContextHolder.getTenantId()
            )));
        }
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "userId", ctx.getUserId(),
                "email", ctx.getUserEmail(),
                "tenantId", ctx.getTenantId(),
                "roles", ctx.getRoles(),
                "permissions", ctx.getPermissions(),
                "dataScope", ctx.getDataScope()
        )));
    }
}
