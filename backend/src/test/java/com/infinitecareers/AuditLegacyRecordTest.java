package com.infinitecareers;

import com.infinitecareers.common.TenantContext;
import com.infinitecareers.common.TenantContextHolder;
import com.infinitecareers.modules.audit.AuditLog;
import com.infinitecareers.modules.audit.AuditLogRepository;
import com.infinitecareers.modules.audit.AuditLogService;
import com.infinitecareers.modules.tenancy.Tenant;
import com.infinitecareers.modules.tenancy.TenantRepository;
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
public class AuditLegacyRecordTest {

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private TenantRepository tenantRepository;

    @Test
    @DisplayName("Pre-chain audit rows (no sequence/hash) neither break verification nor the next chain link")
    void legacyUnchainedRecordsAreReportedNotVerified() {
        String tenantId = "tenant-audit-legacy";
        Tenant t = new Tenant();
        t.setId(tenantId);
        t.setName("Legacy Audit Corp");
        t.setSlug("legacy-audit-corp");
        tenantRepository.save(t);
        TenantContextHolder.setContext(new TenantContext(
                tenantId, "user-auditor", "auditor@test.com",
                Set.of("SUPER_ADMIN"), Set.of("AUDIT_READ"), "TENANT"
        ));

        // Seed-style row written before the hash chain existed
        AuditLog legacy = new AuditLog();
        legacy.setTenantId(tenantId);
        legacy.setActorId("seed");
        legacy.setActorEmail("seed@test.com");
        legacy.setAction("APPLICATION_STAGE_CHANGED");
        legacy.setResourceType("APPLICATION");
        legacy.setResourceId("app-legacy");
        auditLogRepository.save(legacy);

        Map<String, Object> onlyLegacy = auditLogService.verifyChain(tenantId);
        assertEquals(true, onlyLegacy.get("valid"));
        assertEquals("EMPTY_CHAIN", onlyLegacy.get("status"));
        assertEquals(1L, onlyLegacy.get("legacyUnchainedRecords"));

        AuditLog first = auditLogService.record("OFFER_CREATED", "OFFER", "off-1", null, "{\"a\":1}");
        assertEquals(1L, first.getSequenceNumber());
        assertEquals(AuditLogService.GENESIS_HASH, first.getPreviousHash());
        AuditLog second = auditLogService.record("OFFER_APPROVED", "OFFER", "off-1", null, "{\"a\":2}");
        assertEquals(first.getHash(), second.getPreviousHash());

        Map<String, Object> result = auditLogService.verifyChain(tenantId);
        assertEquals(true, result.get("valid"));
        assertEquals("VERIFIED_VALID", result.get("status"));
        assertEquals(2, result.get("recordsVerified"));
        assertEquals(1L, result.get("legacyUnchainedRecords"));

        TenantContextHolder.clear();
    }
}
