package com.infinitecareers.modules.notifications;

import com.infinitecareers.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@Tag(name = "Notification Center & Async Email", description = "In-app notifications, candidate alerts, and asynchronous email queue")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    @Operation(summary = "Get notification feed for current user")
    public ResponseEntity<ApiResponse<List<Notification>>> getMyNotifications() {
        return ResponseEntity.ok(ApiResponse.success(notificationService.getMyNotifications()));
    }

    @PostMapping("/send-email")
    @Operation(summary = "Trigger asynchronous templated email delivery")
    public ResponseEntity<ApiResponse<String>> sendEmail(@RequestBody Map<String, Object> payload) {
        String recipientEmail = (String) payload.get("recipientEmail");
        String subject = (String) payload.get("subject");
        String body = (String) payload.get("body");
        @SuppressWarnings("unchecked")
        Map<String, String> variables = (Map<String, String>) payload.getOrDefault("variables", Map.of());

        notificationService.queueTemplatedEmail(recipientEmail, subject, body, variables);
        return ResponseEntity.ok(ApiResponse.success("Email queued for asynchronous delivery"));
    }
}
