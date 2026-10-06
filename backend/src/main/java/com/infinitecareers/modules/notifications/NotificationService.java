package com.infinitecareers.modules.notifications;

import com.infinitecareers.common.TenantContextHolder;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final EmailMessageRepository emailRepository;

    public NotificationService(NotificationRepository notificationRepository, EmailMessageRepository emailRepository) {
        this.notificationRepository = notificationRepository;
        this.emailRepository = emailRepository;
    }

    public List<Notification> getMyNotifications() {
        String userId = TenantContextHolder.getUserId() != null ? TenantContextHolder.getUserId() : "user-sarah-chen";
        return notificationRepository.findByTenantIdAndRecipientIdOrderByCreatedAtDesc(TenantContextHolder.getTenantId(), userId);
    }

    @Transactional
    public Notification sendInAppNotification(String recipientId, String title, String message, String type, String link) {
        Notification notification = new Notification();
        notification.setTenantId(TenantContextHolder.getTenantId());
        notification.setRecipientId(recipientId);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type != null ? type : "INFO");
        notification.setLink(link);
        return notificationRepository.save(notification);
    }

    @Async
    @Transactional
    public void queueTemplatedEmail(String recipientEmail, String templateSubject, String templateBody, Map<String, String> variables) {
        String renderedSubject = replaceVariables(templateSubject, variables);
        String renderedBody = replaceVariables(templateBody, variables);

        EmailMessage email = new EmailMessage();
        email.setTenantId(TenantContextHolder.getTenantId());
        email.setRecipientEmail(recipientEmail);
        email.setSubject(renderedSubject);
        email.setBodyHtml(renderedBody);
        email.setStatus("SENT"); // Mocking successful asynchronous SMTP dispatch
        email.setSentAt(Instant.now());

        emailRepository.save(email);
    }

    private String replaceVariables(String template, Map<String, String> variables) {
        if (template == null || variables == null) return template;
        String result = template;
        for (Map.Entry<String, String> entry : variables.entrySet()) {
            result = result.replace("{{" + entry.getKey() + "}}", entry.getValue() != null ? entry.getValue() : "");
        }
        return result;
    }
}
