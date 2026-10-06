package com.infinitecareers;

import com.infinitecareers.modules.identity.AuthDto;
import com.infinitecareers.modules.identity.AuthService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "app.security.allow-tenant-header=false")
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class ApiSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AuthService authService;

    @Test
    @DisplayName("Protected APIs reject anonymous and header-only requests and accept a valid JWT")
    void protectedApisRequireJwt() throws Exception {
        mockMvc.perform(get("/api/v1/audit/verify-chain"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/audit/verify-chain").header("X-Tenant-ID", "tenant-acme-tech"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/swagger-ui.html"))
                .andExpect(status().isUnauthorized());

        AuthDto.RegisterRequest reg = new AuthDto.RegisterRequest();
        reg.setEmail("sec." + System.currentTimeMillis() + "@acme.com");
        reg.setPassword("SecureP@ssword123!");
        reg.setFirstName("Sec");
        reg.setLastName("Test");
        reg.setOrganizationName("Security Test Org " + System.nanoTime());
        String token = authService.register(reg).getAccessToken();

        mockMvc.perform(get("/api/v1/audit/verify-chain").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Health probes stay public")
    void healthIsPublic() throws Exception {
        mockMvc.perform(get("/actuator/health/liveness")).andExpect(status().isOk());
    }
}
