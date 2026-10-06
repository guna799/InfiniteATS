package com.infinitecareers.modules.integrations;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WebhookRepository extends JpaRepository<Webhook, String> {
    List<Webhook> findByTenantId(String tenantId);
    List<Webhook> findByTenantIdAndEventTypeAndIsActiveTrue(String tenantId, String eventType);
}
