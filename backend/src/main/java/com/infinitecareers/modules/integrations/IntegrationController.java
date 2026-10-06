package com.infinitecareers.modules.integrations;

import com.infinitecareers.common.ApiResponse;
import com.infinitecareers.common.TenantContextHolder;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/integrations")
@Tag(name = "Integrations & Webhooks", description = "Third-party connector configurations (Google, Zoom, Slack, Okta) and outbound webhook dispatchers")
public class IntegrationController {

    private final IntegrationRepository integrationRepository;
    private final WebhookRepository webhookRepository;

    public IntegrationController(IntegrationRepository integrationRepository, WebhookRepository webhookRepository) {
        this.integrationRepository = integrationRepository;
        this.webhookRepository = webhookRepository;
    }

    @GetMapping
    @Operation(summary = "List configured integrations")
    public ResponseEntity<ApiResponse<List<Integration>>> getIntegrations() {
        return ResponseEntity.ok(ApiResponse.success(integrationRepository.findByTenantId(TenantContextHolder.getTenantId())));
    }

    @PostMapping
    @Operation(summary = "Save integration configuration")
    public ResponseEntity<ApiResponse<Integration>> saveIntegration(@Valid @RequestBody Integration integration) {
        integration.setTenantId(TenantContextHolder.getTenantId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(integrationRepository.save(integration)));
    }

    @GetMapping("/webhooks")
    @Operation(summary = "List webhook event subscriptions")
    public ResponseEntity<ApiResponse<List<Webhook>>> getWebhooks() {
        return ResponseEntity.ok(ApiResponse.success(webhookRepository.findByTenantId(TenantContextHolder.getTenantId())));
    }

    @PostMapping("/webhooks")
    @Operation(summary = "Register outbound webhook subscriber")
    public ResponseEntity<ApiResponse<Webhook>> registerWebhook(@Valid @RequestBody Webhook webhook) {
        webhook.setTenantId(TenantContextHolder.getTenantId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(webhookRepository.save(webhook)));
    }
}
