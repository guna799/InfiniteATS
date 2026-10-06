package com.infinitecareers.modules.identity;

import com.infinitecareers.common.JwtTokenProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
public class SsoService {

    private final SsoConfigurationRepository ssoRepository;
    private final UserRepository userRepository;
    private final TenantMembershipRepository membershipRepository;
    private final RoleRepository roleRepository;
    private final JwtTokenProvider tokenProvider;

    public SsoService(SsoConfigurationRepository ssoRepository,
                      UserRepository userRepository,
                      TenantMembershipRepository membershipRepository,
                      RoleRepository roleRepository,
                      JwtTokenProvider tokenProvider) {
        this.ssoRepository = ssoRepository;
        this.userRepository = userRepository;
        this.membershipRepository = membershipRepository;
        this.roleRepository = roleRepository;
        this.tokenProvider = tokenProvider;
    }

    public Optional<SsoConfiguration> getConfiguration(String tenantId) {
        return ssoRepository.findByTenantId(tenantId);
    }

    @Transactional
    public SsoConfiguration configureSso(String tenantId, String providerType, String issuerUrl, String clientId, String clientSecret, Boolean enforceSso) {
        SsoConfiguration config = ssoRepository.findByTenantId(tenantId)
                .orElseGet(() -> {
                    SsoConfiguration c = new SsoConfiguration();
                    c.setId(UUID.randomUUID().toString());
                    c.setTenantId(tenantId);
                    return c;
                });

        config.setProviderType(providerType);
        config.setIssuerUrl(issuerUrl);
        config.setClientId(clientId);
        config.setClientSecret(clientSecret);
        config.setEnforceSso(enforceSso != null ? enforceSso : false);
        config.setUpdatedAt(Instant.now());
        return ssoRepository.save(config);
    }

    public Map<String, String> initiateSsoLogin(String tenantId, String redirectUri) {
        SsoConfiguration config = ssoRepository.findByTenantId(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("SSO not configured for tenant: " + tenantId));

        if (!Boolean.TRUE.equals(config.getIsEnabled())) {
            throw new IllegalStateException("SSO is currently disabled for tenant: " + tenantId);
        }

        String state = UUID.randomUUID().toString();
        String nonce = UUID.randomUUID().toString();

        String authorizationUrl = String.format(
                "%s/authorize?client_id=%s&response_type=code&scope=openid%%20email%%20profile&redirect_uri=%s&state=%s&nonce=%s",
                config.getIssuerUrl(), config.getClientId(), redirectUri, state, nonce
        );

        return Map.of(
                "authorizationUrl", authorizationUrl,
                "state", state,
                "providerType", config.getProviderType()
        );
    }

    @Transactional
    public AuthDto.AuthResponse processSsoCallback(String tenantId, String code, String email, String fullName) {
        SsoConfiguration config = ssoRepository.findByTenantId(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid SSO tenant configuration"));

        // JIT (Just-In-Time) User Provisioning
        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = new User();
            newUser.setId(UUID.randomUUID().toString());
            newUser.setEmail(email);
            newUser.setFullName(fullName != null ? fullName : email.split("@")[0]);
            newUser.setPasswordHash("$2a$10$SSO_AUTHENTICATED_FEDERATED_IDENTITY_PLACEHOLDER");
            newUser.setIsActive(true);
            return userRepository.save(newUser);
        });

        // Ensure Tenant Membership exists
        List<TenantMembership> memberships = membershipRepository.findByUserId(user.getId());
        TenantMembership targetMembership = memberships.stream()
                .filter(m -> m.getTenantId().equals(tenantId))
                .findFirst()
                .orElseGet(() -> {
                    TenantMembership newMembership = new TenantMembership();
                    newMembership.setId(UUID.randomUUID().toString());
                    newMembership.setUserId(user.getId());
                    newMembership.setTenantId(tenantId);
                    newMembership.setDataScope("TENANT");
                    newMembership.setStatus("ACTIVE");
                    return membershipRepository.save(newMembership);
                });

        Set<String> roleNames = new HashSet<>();
        Set<String> permissions = new HashSet<>();
        targetMembership.getRoles().forEach(r -> {
            roleNames.add(r.getName());
            r.getPermissions().forEach(p -> permissions.add(p.getName()));
        });

        if (roleNames.isEmpty()) {
            roleNames.add("RECRUITER");
            permissions.addAll(Set.of("CANDIDATE_READ", "REQUISITION_READ", "OFFER_READ"));
        }

        String token = tokenProvider.generateToken(user.getId(), user.getEmail(), tenantId, roleNames, permissions, targetMembership.getDataScope());
        String refreshToken = tokenProvider.generateRefreshToken(user.getId(), tenantId);

        return new AuthDto.AuthResponse(
                token, refreshToken,
                user.getId(), user.getEmail(), user.getFirstName(), user.getLastName(),
                tenantId, roleNames, permissions
        );
    }
}
