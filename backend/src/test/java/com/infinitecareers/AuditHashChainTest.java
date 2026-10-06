package com.infinitecareers;

import com.infinitecareers.common.TenantContext;
import com.infinitecareers.common.TenantContextHolder;
import com.infinitecareers.modules.audit.AuditLog;
import com.infinitecareers.modules.audit.AuditLogRepository;
import com.infinitecareers.modules.audit.AuditLogService;
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
public class AuditHashChainTest {

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private TenantRepository tenantRepository;

    private static final String TEST_TENANT = "tenant-audit-test";

    @BeforeEach
    void setUp() {
        if (tenantRepository.findById(TEST_TENANT).isEmpty()) {
            Tenant t = new Tenant();
            t.setId(TEST_TENANT);
            t.setName("Audit Verification Corp");
            t.setSlug("audit-verification-corp");
            tenantRepository.save(t);
        }

        TenantContextHolder.setContext(new TenantContext(
                TEST_TENANT, "user-auditor", "auditor@test.com",
                Set.of("SUPER_ADMIN"), Set.of("AUDIT_READ"), "TENANT"
        ));
    }

    @Test
    @DisplayName("Verify cryptographic hash chain detects modifications to historical records")
    void testAuditHashChainIntegrityAndTamperDetection() {
        // Step 1: Record 3 consecutive audit entries
        AuditLog log1 = auditLogService.record("OFFER_CREATED", "OFFER", "off-101", null, "{\"salary\":1200000}");
        AuditLog log2 = auditLogService.record("OFFER_APPROVED", "OFFER", "off-101", "{\"status\":\"DRAFT\"}", "{\"status\":\"APPROVED\"}");
        AuditLog log3 = auditLogService.record("OFFER_ACCEPTED", "OFFER", "off-101", "{\"status\":\"APPROVED\"}", "{\"status\":\"ACCEPTED\"}");

        assertNotNull(log1.getHash());
        assertEquals(AuditLogService.GENESIS_HASH, log1.getPreviousHash());
        assertEquals(1L, log1.getSequenceNumber());

        assertNotNull(log2.getHash());
        assertEquals(log1.getHash(), log2.getPreviousHash());
        assertEquals(2L, log2.getSequenceNumber());

        assertNotNull(log3.getHash());
        assertEquals(log2.getHash(), log3.getPreviousHash());
        assertEquals(3L, log3.getSequenceNumber());

        // Step 2: Verify untampered chain
        Map<String, Object> verifyResult = auditLogService.verifyChain(TEST_TENANT);
        assertTrue((Boolean) verifyResult.get("valid"));
        assertEquals("VERIFIED_VALID", verifyResult.get("status"));

        // Step 3: Tamper with record 2 content directly in database (simulating malicious DB modification)
        log2.setAfterState("{\"status\":\"APPROVED\",\"salary\":999999999}");
        auditLogRepository.save(log2);

        // Step 4: Verify chain fails and pinpoints tampered record
        Map<String, Object> tamperedResult = auditLogService.verifyChain(TEST_TENANT);
        assertFalse((Boolean) tamperedResult.get("valid"));
        assertEquals("TAMPERED_CONTENT_HASH", tamperedResult.get("status"));
        assertEquals(log2.getId(), tamperedResult.get("tamperedRecordId"));
    }

    @Test
    @DisplayName("Verify deletion of an audit record is caught as a sequence gap violation")
    void testAuditRecordDeletionDetected() {
        String deletionTenant = "tenant-audit-del";
        Tenant t = new Tenant();
        t.setId(deletionTenant);
        t.setName("Deletion Test Corp");
        t.setSlug("del-test-corp");
        tenantRepository.save(t);

        TenantContextHolder.setContext(new TenantContext(
                deletionTenant, "user-auditor", "auditor@test.com",
                Set.of("SUPER_ADMIN"), Set.of("AUDIT_READ"), "TENANT"
        ));

        AuditLog l1 = auditLogService.record("USER_CREATED", "USER", "u-1", null, "{}");
        AuditLog l2 = auditLogService.record("USER_UPDATED", "USER", "u-1", "{}", "{\"role\":\"ADMIN\"}");
        AuditLog l3 = auditLogService.record("USER_DELETED", "USER", "u-1", "{\"role\":\"ADMIN\"}", null);

        // Delete the middle record l2 directly from DB
        auditLogRepository.delete(l2);

        // Verification must detect sequence gap
        Map<String, Object> result = auditLogService.verifyChain(deletionTenant);
        assertFalse((Boolean) result.get("valid"));
        assertEquals("SEQUENCE_GAP_OR_INSERTION_DETECTED", result.get("status"));
        assertEquals(l3.getId(), result.get("tamperedRecordId"));
    }
}
