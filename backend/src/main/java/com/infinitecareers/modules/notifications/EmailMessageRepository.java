package com.infinitecareers.modules.notifications;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmailMessageRepository extends JpaRepository<EmailMessage, String> {
    List<EmailMessage> findByTenantIdOrderByCreatedAtDesc(String tenantId);
    List<EmailMessage> findByStatus(String status);
}
