package com.infinitecareers.modules.identity;

import com.infinitecareers.common.TenantContextHolder;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/scim/v2/Users")
@Tag(name = "SCIM 2.0 Directory Sync", description = "RFC 7644 SCIM 2.0 protocol endpoint for identity lifecycle provisioning (Entra ID, Okta)")
public class ScimUserController {

    private final UserRepository userRepository;
    private final TenantMembershipRepository membershipRepository;
    private final RoleRepository roleRepository;

    public ScimUserController(UserRepository userRepository,
                              TenantMembershipRepository membershipRepository,
                              RoleRepository roleRepository) {
        this.userRepository = userRepository;
        this.membershipRepository = membershipRepository;
        this.roleRepository = roleRepository;
    }

    @GetMapping
    @Operation(summary = "List provisioned users in SCIM 2.0 format")
    public ResponseEntity<Map<String, Object>> listUsers(
            @RequestParam(defaultValue = "1") int startIndex,
            @RequestParam(defaultValue = "100") int count) {
        String tenantId = TenantContextHolder.getTenantId();
        List<TenantMembership> memberships = membershipRepository.findByTenantId(tenantId);

        List<Map<String, Object>> resources = new ArrayList<>();
        for (TenantMembership m : memberships) {
            userRepository.findById(m.getUserId()).ifPresent(u -> resources.add(toScimUser(u, m)));
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("schemas", List.of("urn:ietf:params:scim:api:messages:2.0:ListResponse"));
        response.put("totalResults", resources.size());
        response.put("startIndex", startIndex);
        response.put("itemsPerPage", count);
        response.put("Resources", resources);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get user details by ID in SCIM 2.0 format")
    public ResponseEntity<Map<String, Object>> getUser(@PathVariable String id) {
        String tenantId = TenantContextHolder.getTenantId();
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + id));

        TenantMembership membership = membershipRepository.findByUserId(user.getId()).stream()
                .filter(m -> m.getTenantId().equals(tenantId))
                .findFirst()
                .orElseThrow(() -> new NoSuchElementException("User does not belong to tenant: " + tenantId));

        return ResponseEntity.ok(toScimUser(user, membership));
    }

    @PostMapping
    @Transactional
    @Operation(summary = "Provision new user via SCIM 2.0")
    public ResponseEntity<Map<String, Object>> createUser(@RequestBody Map<String, Object> scimRequest) {
        String tenantId = TenantContextHolder.getTenantId();
        String userName = (String) scimRequest.get("userName");
        Boolean active = (Boolean) scimRequest.getOrDefault("active", true);

        Map<String, Object> nameMap = (Map<String, Object>) scimRequest.get("name");
        String formattedName = nameMap != null ? (String) nameMap.get("formatted") : userName;

        User user = userRepository.findByEmail(userName).orElseGet(() -> {
            User u = new User();
            u.setId(UUID.randomUUID().toString());
            u.setEmail(userName);
            u.setFullName(formattedName);
            u.setPasswordHash("$2a$10$SCIM_PROVISIONED_ACCOUNT_HASH_PLACEHOLDER");
            u.setIsActive(active);
            return userRepository.save(u);
        });

        TenantMembership membership = membershipRepository.findByUserId(user.getId()).stream()
                .filter(m -> m.getTenantId().equals(tenantId))
                .findFirst()
                .orElseGet(() -> {
                    TenantMembership m = new TenantMembership();
                    m.setId(UUID.randomUUID().toString());
                    m.setUserId(user.getId());
                    m.setTenantId(tenantId);
                    m.setDataScope("TENANT");
                    m.setStatus(active ? "ACTIVE" : "INACTIVE");
                    return membershipRepository.save(m);
                });

        return ResponseEntity.status(HttpStatus.CREATED).body(toScimUser(user, membership));
    }

    @PatchMapping("/{id}")
    @Transactional
    @Operation(summary = "Update user attributes or deprovision via SCIM 2.0 PATCH")
    public ResponseEntity<Map<String, Object>> patchUser(
            @PathVariable String id,
            @RequestBody Map<String, Object> patchRequest) {
        String tenantId = TenantContextHolder.getTenantId();
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("User not found"));

        TenantMembership membership = membershipRepository.findByUserId(user.getId()).stream()
                .filter(m -> m.getTenantId().equals(tenantId))
                .findFirst()
                .orElseThrow(() -> new NoSuchElementException("User not in tenant"));

        List<Map<String, Object>> operations = (List<Map<String, Object>>) patchRequest.get("Operations");
        if (operations != null) {
            for (Map<String, Object> op : operations) {
                Map<String, Object> value = (Map<String, Object>) op.get("value");
                if (value != null && value.containsKey("active")) {
                    Boolean active = (Boolean) value.get("active");
                    user.setIsActive(active);
                    membership.setStatus(active ? "ACTIVE" : "INACTIVE");
                    userRepository.save(user);
                    membershipRepository.save(membership);
                }
            }
        }

        return ResponseEntity.ok(toScimUser(user, membership));
    }

    @DeleteMapping("/{id}")
    @Transactional
    @Operation(summary = "Deprovision/Delete user via SCIM 2.0")
    public ResponseEntity<Void> deleteUser(@PathVariable String id) {
        String tenantId = TenantContextHolder.getTenantId();
        membershipRepository.findByUserId(id).stream()
                .filter(m -> m.getTenantId().equals(tenantId))
                .findFirst()
                .ifPresent(m -> {
                    m.setStatus("INACTIVE");
                    membershipRepository.save(m);
                });

        return ResponseEntity.noContent().build();
    }

    private Map<String, Object> toScimUser(User user, TenantMembership membership) {
        Map<String, Object> scim = new LinkedHashMap<>();
        scim.put("schemas", List.of("urn:ietf:params:scim:schemas:core:2.0:User"));
        scim.put("id", user.getId());
        scim.put("userName", user.getEmail());
        scim.put("name", Map.of("formatted", user.getFullName()));
        scim.put("emails", List.of(Map.of("value", user.getEmail(), "primary", true)));
        scim.put("active", Boolean.TRUE.equals(user.getIsActive()) && "ACTIVE".equalsIgnoreCase(membership.getStatus()));
        scim.put("meta", Map.of(
                "resourceType", "User",
                "created", user.getCreatedAt() != null ? user.getCreatedAt().toString() : Instant.now().toString(),
                "location", "/scim/v2/Users/" + user.getId()
        ));
        return scim;
    }
}
