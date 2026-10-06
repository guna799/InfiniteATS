package com.infinitecareers;

import com.infinitecareers.common.TenantContext;
import com.infinitecareers.common.TenantContextHolder;
import com.infinitecareers.common.events.OutboxEvent;
import com.infinitecareers.common.events.OutboxEventPoller;
import com.infinitecareers.common.events.OutboxEventRepository;
import com.infinitecareers.common.events.TransactionalOutboxService;
import com.infinitecareers.modules.tenancy.Tenant;
import com.infinitecareers.modules.tenancy.TenantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class TransactionalOutboxTest {

    @Autowired
    private TransactionalOutboxService outboxService;

    @Autowired
    private OutboxEventRepository outboxEventRepository;

    @Autowired
    private OutboxEventPoller outboxEventPoller;

    @Autowired
    private TenantRepository tenantRepository;

    @BeforeEach
    void setUp() {
        if (tenantRepository.findById("tenant-outbox-test").isEmpty()) {
            Tenant t = new Tenant();
            t.setId("tenant-outbox-test");
            t.setName("Outbox Corp");
            t.setSlug("outbox-corp");
            tenantRepository.save(t);
        }

        TenantContextHolder.setContext(new TenantContext(
                "tenant-outbox-test", "user-outbox", "outbox@test.com",
                Set.of("RECRUITER"), Set.of("CANDIDATE_WRITE"), "TENANT"
        ));
    }

    @Test
    @DisplayName("Verify transactional outbox persistence and dispatching to subscribers")
    void testOutboxEventPublishAndPoll() {
        OutboxEvent event = outboxService.publishEvent(
                "tenant-outbox-test",
                "CANDIDATE_STAGE_CHANGED",
                "CANDIDATE",
                "cand-777",
                Map.of("fromStage", "SCREENING", "toStage", "TECHNICAL_INTERVIEW"),
                Map.of("correlationId", "corr-12345")
        );

        assertNotNull(event.getId());
        assertEquals("PENDING", event.getStatus());
        assertEquals("CANDIDATE_STAGE_CHANGED", event.getEventType());

        // Verify it was persisted to DB
        List<OutboxEvent> pendingEvents = outboxEventRepository.findPendingEvents(org.springframework.data.domain.PageRequest.of(0, 50));
        assertTrue(pendingEvents.stream().anyMatch(e -> e.getId().equals(event.getId())));

        // Trigger poller
        outboxEventPoller.processOutboxEvents();

        // Verify status transitioned to PUBLISHED
        OutboxEvent published = outboxEventRepository.findById(event.getId()).orElseThrow();
        assertEquals("PUBLISHED", published.getStatus());
        assertNotNull(published.getPublishedAt());
    }
}
