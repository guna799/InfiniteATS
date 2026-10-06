package com.infinitecareers.modules.identity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "sso_configurations")
public class SsoConfiguration {

    @Id
    private String id;

    @Column(name = "tenant_id", nullable = false, unique = true)
    private String tenantId;

    @Column(name = "provider_type", nullable = false)
    private String providerType; // OIDC, SAML_2_0, ENTRA_ID, OKTA

    @Column(name = "issuer_url", nullable = false)
    private String issuerUrl;

    @Column(name = "client_id", nullable = false)
    private String clientId;

    @Column(name = "client_secret")
    private String clientSecret;

    @Column(name = "sso_metadata_xml", columnDefinition = "TEXT")
    private String ssoMetadataXml;

    @Column(name = "is_enabled", nullable = false)
    private Boolean isEnabled = true;

    @Column(name = "enforce_sso", nullable = false)
    private Boolean enforceSso = false;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }
    public String getProviderType() { return providerType; }
    public void setProviderType(String providerType) { this.providerType = providerType; }
    public String getIssuerUrl() { return issuerUrl; }
    public void setIssuerUrl(String issuerUrl) { this.issuerUrl = issuerUrl; }
    public String getClientId() { return clientId; }
    public void setClientId(String clientId) { this.clientId = clientId; }
    public String getClientSecret() { return clientSecret; }
    public void setClientSecret(String clientSecret) { this.clientSecret = clientSecret; }
    public String getSsoMetadataXml() { return ssoMetadataXml; }
    public void setSsoMetadataXml(String ssoMetadataXml) { this.ssoMetadataXml = ssoMetadataXml; }
    public Boolean getIsEnabled() { return isEnabled; }
    public void setIsEnabled(Boolean isEnabled) { this.isEnabled = isEnabled; }
    public Boolean getEnforceSso() { return enforceSso; }
    public void setEnforceSso(Boolean enforceSso) { this.enforceSso = enforceSso; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
