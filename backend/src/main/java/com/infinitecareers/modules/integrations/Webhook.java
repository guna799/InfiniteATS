package com.infinitecareers.modules.integrations;

import com.infinitecareers.common.BaseTenantEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "webhooks")
public class Webhook extends BaseTenantEntity {

    @Column(name = "target_url", nullable = false)
    private String targetUrl;

    @Column(name = "event_type", nullable = false)
    private String eventType; // candidate.created, application.stage_changed, interview.scheduled, offer.accepted

    @Column(name = "secret_key", nullable = false)
    private String secretKey;

    @Column(name = "is_active")
    private Boolean isActive = true;

    public String getTargetUrl() { return targetUrl; }
    public void setTargetUrl(String targetUrl) { this.targetUrl = targetUrl; }
    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public String getSecretKey() { return secretKey; }
    public void setSecretKey(String secretKey) { this.secretKey = secretKey; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean active) { isActive = active; }
}
