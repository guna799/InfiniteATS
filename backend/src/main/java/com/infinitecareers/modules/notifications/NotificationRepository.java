package com.infinitecareers.modules.notifications;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, String> {
    List<Notification> findByTenantIdAndRecipientIdOrderByCreatedAtDesc(String tenantId, String recipientId);
}
