package com.infinitecareers;

import com.infinitecareers.common.TenantContext;
import com.infinitecareers.common.TenantContextHolder;
import com.infinitecareers.common.security.PiiSecurityService;
import com.infinitecareers.modules.ai.*;
import com.infinitecareers.modules.search.SearchIndexService;
import com.infinitecareers.modules.search.SearchIndexState;
import com.infinitecareers.modules.tenancy.Tenant;
import com.infinitecareers.modules.tenancy.TenantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class Phase4ScaleAndAiTest {

    @Autowired
    private PiiSecurityService piiSecurityService;

    @Autowired
    private SearchIndexService searchIndexService;

    @Autowired
    private AiGatewayService aiGatewayService;

    @Autowired
    private AiTenantQuotaRepository quotaRepository;

    @Autowired
    private TenantRepository tenantRepository;

    private static final String TEST_TENANT = "tenant-phase4-test";

    @BeforeEach
    void setUp() {
        if (tenantRepository.findById(TEST_TENANT).isEmpty()) {
            Tenant t = new Tenant();
            t.setId(TEST_TENANT);
            t.setName("Phase 4 Scale & AI Corp");
            t.setSlug("phase4-ai-corp");
            tenantRepository.save(t);
        }

        TenantContextHolder.setContext(new TenantContext(
                TEST_TENANT, "user-lead-recruiter", "lead.recruiter@acme.in",
                Set.of("RECRUITER"), Set.of("CANDIDATE_READ", "AI_ACCESS"), "TENANT"
        ));
    }

    @Test
    @DisplayName("Verify PII security masking for Indian statutory compliance (Aadhaar, PAN, Bank, Phone, Email)")
    void testPiiMaskingAndSanitization() {
        assertEquals("XXXX-XXXX-9876", piiSecurityService.maskAadhaar("1234 5678 9876"));
        assertEquals("XXXXXX234F", piiSecurityService.maskPan("ABCDE1234F"));
        assertEquals("XXXXXX7890", piiSecurityService.maskBankAccount("987654327890"));
        assertEquals("+91 XXXXX X5678", piiSecurityService.maskPhone("+91 98765 45678"));
        assertEquals("v***k@domain.com", piiSecurityService.maskEmail("venkatakarthik@domain.com"));

        Map<String, Object> candidateData = Map.of(
                "name", "Venkata Karthik Guntupalli",
                "email", "karthik@example.com",
                "phone", "+91 98765 12345",
                "pan", "ABCDE1234F",
                "aadhaar", "9999 8888 7777",
                "bankAccount", "112233445566",
                "skills", "Java, Kubernetes, Kafka"
        );

        Map<String, Object> sanitized = piiSecurityService.sanitizeForAiOrSearch(candidateData);
        assertFalse(sanitized.containsKey("pan"));
        assertFalse(sanitized.containsKey("aadhaar"));
        assertFalse(sanitized.containsKey("bankAccount"));
        assertTrue(sanitized.containsKey("skills"));
        assertTrue(((String) sanitized.get("email")).contains("***"));
    }

    @Test
    @DisplayName("Verify Outbox-driven search index task queueing and health reporting")
    void testSearchIndexStateAndHealth() {
        SearchIndexState state = searchIndexService.queueIndexEvent(
                TEST_TENANT, "evt-101", "CANDIDATE", "cand-999",
                Map.of("name", "Rakshitha Shetty", "title", "Staff AI Engineer")
        );

        assertNotNull(state.getId());
        assertEquals("PENDING", state.getStatus());
        assertEquals("CANDIDATE", state.getEntityType());

        // Process pending search tasks
        searchIndexService.processPendingIndexStates();

        Map<String, Object> health = searchIndexService.getSearchHealth(TEST_TENANT);
        assertEquals("HEALTHY", health.get("status"));
        assertTrue((Long) health.get("indexedDocuments") >= 1);
    }

    @Test
    @DisplayName("Verify AI Gateway token quota enforcement, PII redaction, and explainability audit trail")
    void testAiGatewayAndExplainability() {
        Map<String, Object> candidateData = Map.of(
                "candidateName", "Aditya Kapoor",
                "pan", "XYZPK9999L",
                "skills", "Distributed Systems, Go, Java, High-Concurrency",
                "yearsExperience", 9
        );
        Map<String, Object> jobReqs = Map.of(
                "title", "Principal Distributed Systems Architect",
                "requiredSkills", "Java, Kafka, Distributed Architecture"
        );

        AiRecommendationAudit audit = aiGatewayService.matchCandidateWithExplainability("cand-777", "job-101", candidateData, jobReqs);
        assertNotNull(audit.getId());
        assertTrue(audit.getScore() > 80);
        assertTrue(audit.getPiiRedacted());
        assertNotNull(audit.getMatchedSkills());
        assertNotNull(audit.getGeneratedExplanation());

        // Verify Quota Tracking
        Map<String, Object> quota = aiGatewayService.getTenantQuotaOverview(TEST_TENANT);
        assertTrue((Long) quota.get("monthlyTokensUsed") > 0);
        assertTrue((Integer) quota.get("todayRequestsUsed") >= 1);

        // Test Hard Quota Limit Enforcement
        AiTenantQuota tenantQuota = quotaRepository.findByTenantId(TEST_TENANT).orElseThrow();
        tenantQuota.setCurrentMonthTokensUsed(1000000L); // hit ceiling
        quotaRepository.save(tenantQuota);

        assertThrows(IllegalStateException.class, () ->
                aiGatewayService.matchCandidateWithExplainability("cand-888", "job-102", candidateData, jobReqs)
        );
    }
}
