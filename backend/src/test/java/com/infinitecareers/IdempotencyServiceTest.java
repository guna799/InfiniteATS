package com.infinitecareers;

import com.infinitecareers.common.TenantContext;
import com.infinitecareers.common.TenantContextHolder;
import com.infinitecareers.common.idempotency.IdempotencyKey;
import com.infinitecareers.common.idempotency.IdempotencyService;
import com.infinitecareers.modules.tenancy.Tenant;
import com.infinitecareers.modules.tenancy.TenantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class IdempotencyServiceTest {

    @Autowired
    private IdempotencyService idempotencyService;

    @Autowired
    private TenantRepository tenantRepository;

    @BeforeEach
    void setUp() {
        if (tenantRepository.findById("tenant-idem-test").isEmpty()) {
            Tenant t = new Tenant();
            t.setId("tenant-idem-test");
            t.setName("Idempotency Corp");
            t.setSlug("idempotency-corp");
            tenantRepository.save(t);
        }

        TenantContextHolder.setContext(new TenantContext(
                "tenant-idem-test", "user-idem", "idem@test.com",
                Set.of("RECRUITER"), Set.of("OFFER_ACCEPT"), "TENANT"
        ));
    }

    @Test
    @DisplayName("Verify idempotency key acquisition and response caching prevents duplicate mutation")
    void testIdempotencyFlow() {
        String key = "req-key-" + System.currentTimeMillis();
        String payload = "{\"candidateId\":\"cand-101\",\"action\":\"ACCEPT_OFFER\"}";
        String path = "/api/v1/offers/101/accept";
        String hash = idempotencyService.computePayloadHash(payload);

        // Step 1: Start processing (first call) - should be empty (no prior record)
        Optional<IdempotencyKey> initial = idempotencyService.checkAndStart("tenant-idem-test", key, hash, path);
        assertTrue(initial.isEmpty());

        // Step 2: Complete processing with response payload
        String responseBody = "{\"status\":\"OFFER_ACCEPTED\",\"employeeId\":\"emp-888\"}";
        idempotencyService.recordResponse("tenant-idem-test", key, 200, responseBody);

        // Step 3: Second call with same key returns cached result
        Optional<IdempotencyKey> cached = idempotencyService.checkAndStart("tenant-idem-test", key, hash, path);
        assertTrue(cached.isPresent());
        assertEquals("COMPLETED", cached.get().getStatus());
        assertEquals(200, cached.get().getResponseStatus());
        assertEquals(responseBody, cached.get().getResponseBody());
    }
}
