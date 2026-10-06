package com.infinitecareers;

import com.infinitecareers.common.TenantContext;
import com.infinitecareers.common.TenantContextHolder;
import com.infinitecareers.modules.identity.*;
import com.infinitecareers.modules.tenancy.Tenant;
import com.infinitecareers.modules.tenancy.TenantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class SsoAndScimIntegrationTest {

    @Autowired
    private SsoService ssoService;

    @Autowired
    private ScimUserController scimUserController;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TenantMembershipRepository membershipRepository;

    private static final String TEST_TENANT = "tenant-sso-scim";

    @BeforeEach
    void setUp() {
        if (tenantRepository.findById(TEST_TENANT).isEmpty()) {
            Tenant t = new Tenant();
            t.setId(TEST_TENANT);
            t.setName("Enterprise SSO & SCIM Corp");
            t.setSlug("sso-scim-corp");
            tenantRepository.save(t);
        }

        TenantContextHolder.setContext(new TenantContext(
                TEST_TENANT, "admin-sso", "admin@ssocorp.com",
                Set.of("SUPER_ADMIN"), Set.of("USER_MANAGE"), "TENANT"
        ));
    }

    @Test
    @DisplayName("Verify Enterprise SSO OIDC configuration, authorization URL generation, and JIT user provisioning")
    void testSsoLifecycle() {
        // 1. Configure OIDC SSO for Tenant
        SsoConfiguration config = ssoService.configureSso(
                TEST_TENANT, "ENTRA_ID", "https://login.microsoftonline.com/tenant-id/v2.0",
                "client-id-12345", "client-secret-abcde", true
        );
        assertNotNull(config.getId());
        assertEquals("ENTRA_ID", config.getProviderType());

        // 2. Initiate SSO Login Flow
        Map<String, String> init = ssoService.initiateSsoLogin(TEST_TENANT, "http://localhost:3000/auth/sso/callback");
        assertTrue(init.get("authorizationUrl").contains("login.microsoftonline.com"));
        assertNotNull(init.get("state"));

        // 3. Process SSO Callback with Verified Token Claims
        AuthDto.AuthResponse response = ssoService.processSsoCallback(
                TEST_TENANT, "auth-code-999", "kiran.kumar@ssocorp.com", "Kiran Kumar"
        );

        assertNotNull(response.getAccessToken());
        assertEquals("kiran.kumar@ssocorp.com", response.getEmail());
        assertEquals(TEST_TENANT, response.getTenantId());
        assertTrue(response.getRoles().contains("RECRUITER"));
    }

    @Test
    @DisplayName("Verify SCIM 2.0 user provisioning, directory listing, and lifecycle deactivation")
    void testScimUserLifecycle() {
        // 1. Provision User via SCIM POST
        Map<String, Object> scimCreateReq = Map.of(
                "userName", "deepika.padukone@ssocorp.com",
                "name", Map.of("formatted", "Deepika Padukone"),
                "active", true
        );

        ResponseEntity<Map<String, Object>> createRes = scimUserController.createUser(scimCreateReq);
        assertEquals(201, createRes.getStatusCode().value());
        String userId = (String) createRes.getBody().get("id");
        assertNotNull(userId);
        assertEquals("deepika.padukone@ssocorp.com", createRes.getBody().get("userName"));

        // 2. Query SCIM 2.0 User List
        ResponseEntity<Map<String, Object>> listRes = scimUserController.listUsers(1, 50);
        assertEquals(200, listRes.getStatusCode().value());
        List<Map<String, Object>> resources = (List<Map<String, Object>>) listRes.getBody().get("Resources");
        assertTrue(resources.stream().anyMatch(r -> userId.equals(r.get("id"))));

        // 3. Deactivate User via SCIM PATCH (active: false)
        Map<String, Object> patchReq = Map.of(
                "Operations", List.of(
                        Map.of("op", "replace", "value", Map.of("active", false))
                )
        );
        ResponseEntity<Map<String, Object>> patchRes = scimUserController.patchUser(userId, patchReq);
        assertEquals(200, patchRes.getStatusCode().value());
        assertFalse((Boolean) patchRes.getBody().get("active"));

        // 4. Verify User is marked inactive in database
        User dbUser = userRepository.findById(userId).orElseThrow();
        assertFalse(dbUser.getIsActive());
    }
}
