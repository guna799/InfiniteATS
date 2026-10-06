package com.infinitecareers.common;

import java.util.Collections;
import java.util.Set;

public class TenantContext {

    private final String tenantId;
    private final String userId;
    private final String userEmail;
    private final Set<String> roles;
    private final Set<String> permissions;
    private final String dataScope;

    public TenantContext(String tenantId, String userId, String userEmail, Set<String> roles, Set<String> permissions, String dataScope) {
        this.tenantId = tenantId;
        this.userId = userId;
        this.userEmail = userEmail;
        this.roles = roles != null ? Collections.unmodifiableSet(roles) : Collections.emptySet();
        this.permissions = permissions != null ? Collections.unmodifiableSet(permissions) : Collections.emptySet();
        this.dataScope = dataScope != null ? dataScope : "TENANT";
    }

    public String getTenantId() {
        return tenantId;
    }

    public String getUserId() {
        return userId;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public Set<String> getRoles() {
        return roles;
    }

    public Set<String> getPermissions() {
        return permissions;
    }

    public String getDataScope() {
        return dataScope;
    }

    public boolean hasPermission(String permission) {
        return permissions.contains(permission) || roles.contains("SUPER_ADMIN");
    }

    public boolean hasRole(String role) {
        return roles.contains(role);
    }
}
