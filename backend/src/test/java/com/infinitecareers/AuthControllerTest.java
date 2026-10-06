package com.infinitecareers;

import com.infinitecareers.modules.identity.AuthDto;
import com.infinitecareers.modules.identity.AuthService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class AuthControllerTest {

    @Autowired
    private AuthService authService;

    @Test
    @DisplayName("Verify user registration and authentication flow produces valid JWT and tenant claims")
    void testRegisterAndLogin() {
        String uniqueEmail = "testuser." + System.currentTimeMillis() + "@acme.com";

        // 1. Register
        AuthDto.RegisterRequest regReq = new AuthDto.RegisterRequest();
        regReq.setEmail(uniqueEmail);
        regReq.setPassword("SecureP@ssword123!");
        regReq.setFirstName("Jane");
        regReq.setLastName("Doe");
        regReq.setOrganizationName("Jane Acme Tech");

        AuthDto.AuthResponse regRes = authService.register(regReq);
        assertNotNull(regRes.getAccessToken());
        assertNotNull(regRes.getRefreshToken());
        assertEquals(uniqueEmail, regRes.getEmail());
        assertNotNull(regRes.getTenantId());
        assertTrue(regRes.getRoles().contains("SUPER_ADMIN"));

        // 2. Login
        AuthDto.LoginRequest loginReq = new AuthDto.LoginRequest();
        loginReq.setEmail(uniqueEmail);
        loginReq.setPassword("SecureP@ssword123!");

        AuthDto.AuthResponse loginRes = authService.login(loginReq);
        assertNotNull(loginRes.getAccessToken());
        assertEquals(regRes.getTenantId(), loginRes.getTenantId());

        // 3. Refresh Token
        AuthDto.AuthResponse refreshRes = authService.refresh(loginRes.getRefreshToken());
        assertNotNull(refreshRes.getAccessToken());
        assertEquals(uniqueEmail, refreshRes.getEmail());
    }
}
