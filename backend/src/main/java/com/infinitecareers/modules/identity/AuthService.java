package com.infinitecareers.modules.identity;

import com.infinitecareers.common.JwtTokenProvider;
import com.infinitecareers.modules.tenancy.Tenant;
import com.infinitecareers.modules.tenancy.TenantRepository;
import io.jsonwebtoken.Claims;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final TenantMembershipRepository membershipRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final String timingEqualizerHash;

    public AuthService(
            UserRepository userRepository,
            TenantRepository tenantRepository,
            TenantMembershipRepository membershipRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.tenantRepository = tenantRepository;
        this.membershipRepository = membershipRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.timingEqualizerHash = passwordEncoder.encode(java.util.UUID.randomUUID().toString());
    }

    @Transactional
    public AuthDto.AuthResponse login(AuthDto.LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail().toLowerCase().trim()).orElse(null);

        // Always run one bcrypt comparison so response time doesn't reveal which emails exist
        String hash = user != null && user.getPasswordHash() != null ? user.getPasswordHash() : timingEqualizerHash;
        if (!passwordEncoder.matches(request.getPassword(), hash) || user == null) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        if (Boolean.FALSE.equals(user.getIsActive())) {
            throw new IllegalStateException("Account is deactivated");
        }

        // Resolve Tenant Membership
        List<TenantMembership> memberships = membershipRepository.findByUserId(user.getId());
        if (memberships.isEmpty()) {
            throw new IllegalStateException("User does not belong to any active organization");
        }

        TenantMembership activeMembership = null;
        if (request.getTenantSlug() != null && !request.getTenantSlug().trim().isEmpty()) {
            Optional<Tenant> tenantOpt = tenantRepository.findBySlug(request.getTenantSlug().trim());
            if (tenantOpt.isPresent()) {
                activeMembership = memberships.stream()
                        .filter(m -> m.getTenantId().equals(tenantOpt.get().getId()))
                        .findFirst()
                        .orElse(memberships.get(0));
            }
        }

        if (activeMembership == null) {
            activeMembership = memberships.get(0);
        }

        // Collect Roles and Permissions
        Set<String> roleNames = new HashSet<>();
        Set<String> permissionNames = new HashSet<>();

        for (Role role : activeMembership.getRoles()) {
            roleNames.add(role.getName());
            if (role.getPermissions() != null) {
                for (Permission perm : role.getPermissions()) {
                    permissionNames.add(perm.getName());
                }
            }
        }

        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        String accessToken = tokenProvider.generateToken(
                user.getId(),
                user.getEmail(),
                activeMembership.getTenantId(),
                roleNames,
                permissionNames,
                activeMembership.getDataScope()
        );

        String refreshToken = tokenProvider.generateRefreshToken(user.getId(), activeMembership.getTenantId());

        return new AuthDto.AuthResponse(
                accessToken,
                refreshToken,
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                activeMembership.getTenantId(),
                roleNames,
                permissionNames
        );
    }

    @Transactional
    public AuthDto.AuthResponse register(AuthDto.RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail().toLowerCase().trim())) {
            throw new IllegalArgumentException("An account with this email already exists");
        }

        // Create Tenant if organization name given
        String orgName = request.getOrganizationName() != null && !request.getOrganizationName().trim().isEmpty()
                ? request.getOrganizationName().trim()
                : request.getFirstName() + "'s Organization";

        String slug = orgName.toLowerCase().replaceAll("[^a-z0-9]", "-").replaceAll("-+", "-");
        if (tenantRepository.existsBySlug(slug)) {
            slug = slug + "-" + UUID.randomUUID().toString().substring(0, 6);
        }

        Tenant tenant = new Tenant();
        tenant.setName(orgName);
        tenant.setSlug(slug);
        tenant = tenantRepository.save(tenant);

        // Create User
        User user = new User();
        user.setEmail(request.getEmail().toLowerCase().trim());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());
        user.setPhone(request.getPhone());
        user.setEmailVerified(true);
        user = userRepository.save(user);

        // Assign Admin Role & Membership
        Role adminRole = roleRepository.findByName("SUPER_ADMIN").orElse(null);

        TenantMembership membership = new TenantMembership();
        membership.setTenantId(tenant.getId());
        membership.setUserId(user.getId());
        membership.setDataScope("TENANT");
        if (adminRole != null) {
            membership.getRoles().add(adminRole);
        }
        membershipRepository.save(membership);

        Set<String> roles = adminRole != null ? Set.of(adminRole.getName()) : Set.of("SUPER_ADMIN");
        Set<String> permissions = adminRole != null && adminRole.getPermissions() != null
                ? adminRole.getPermissions().stream().map(Permission::getName).collect(Collectors.toSet())
                : Set.of("CANDIDATE_READ", "CANDIDATE_CREATE", "REQUISITION_READ", "REQUISITION_CREATE", "OFFER_READ");

        String accessToken = tokenProvider.generateToken(
                user.getId(),
                user.getEmail(),
                tenant.getId(),
                roles,
                permissions,
                "TENANT"
        );

        String refreshToken = tokenProvider.generateRefreshToken(user.getId(), tenant.getId());

        return new AuthDto.AuthResponse(
                accessToken,
                refreshToken,
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                tenant.getId(),
                roles,
                permissions
        );
    }

    public AuthDto.AuthResponse refresh(String refreshToken) {
        if (!tokenProvider.validateToken(refreshToken)) {
            throw new IllegalArgumentException("Invalid or expired refresh token");
        }

        Claims claims = tokenProvider.getClaimsFromToken(refreshToken);
        String userId = claims.getSubject();
        String tenantId = claims.get("tenantId", String.class);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        TenantMembership membership = membershipRepository.findByTenantIdAndUserId(tenantId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Membership not found"));

        Set<String> roleNames = membership.getRoles().stream().map(Role::getName).collect(Collectors.toSet());
        Set<String> permissionNames = membership.getRoles().stream()
                .flatMap(r -> r.getPermissions().stream())
                .map(Permission::getName)
                .collect(Collectors.toSet());

        String newAccessToken = tokenProvider.generateToken(
                user.getId(),
                user.getEmail(),
                tenantId,
                roleNames,
                permissionNames,
                membership.getDataScope()
        );

        String newRefreshToken = tokenProvider.generateRefreshToken(userId, tenantId);

        return new AuthDto.AuthResponse(
                newAccessToken,
                newRefreshToken,
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                tenantId,
                roleNames,
                permissionNames
        );
    }
}
