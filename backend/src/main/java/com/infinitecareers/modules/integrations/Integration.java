package com.infinitecareers.modules.integrations;

import com.infinitecareers.common.BaseTenantEntity;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "integrations")
public class Integration extends BaseTenantEntity {

    @Column(name = "provider", nullable = false)
    private String provider; // GOOGLE_CALENDAR, ZOOM, SLACK, OKTA, ADP, DOCUSIGN

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "credentials_encrypted", columnDefinition = "TEXT")
    private String credentialsEncrypted;

    @Column(name = "config_json", columnDefinition = "TEXT")
    private String configJson;

    @Column(name = "status")
    private String status = "ACTIVE";

    @Column(name = "last_sync_at")
    private Instant lastSyncAt;

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCredentialsEncrypted() { return credentialsEncrypted; }
    public void setCredentialsEncrypted(String credentialsEncrypted) { this.credentialsEncrypted = credentialsEncrypted; }
    public String getConfigJson() { return configJson; }
    public void setConfigJson(String configJson) { this.configJson = configJson; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getLastSyncAt() { return lastSyncAt; }
    public void setLastSyncAt(Instant lastSyncAt) { this.lastSyncAt = lastSyncAt; }
}
