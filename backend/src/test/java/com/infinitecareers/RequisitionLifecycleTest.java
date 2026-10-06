package com.infinitecareers;

import com.infinitecareers.common.TenantContext;
import com.infinitecareers.common.TenantContextHolder;
import com.infinitecareers.modules.recruiting.JobRequisition;
import com.infinitecareers.modules.recruiting.RequisitionService;
import com.infinitecareers.modules.recruiting.RequisitionState;
import com.infinitecareers.modules.tenancy.Tenant;
import com.infinitecareers.modules.tenancy.TenantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class RequisitionLifecycleTest {

    @Autowired
    private RequisitionService requisitionService;

    @Autowired
    private TenantRepository tenantRepository;

    @BeforeEach
    void setUp() {
        if (tenantRepository.findById("tenant-test-lifecycle").isEmpty()) {
            Tenant t = new Tenant();
            t.setId("tenant-test-lifecycle");
            t.setName("Lifecycle Test Corp");
            t.setSlug("lifecycle-test-corp");
            tenantRepository.save(t);
        }

        TenantContextHolder.setContext(new TenantContext(
                "tenant-test-lifecycle", "user-test", "test@lifecycle.com",
                Set.of("SUPER_ADMIN"), Set.of("REQUISITION_READ", "REQUISITION_CREATE", "REQUISITION_APPROVE"), "TENANT"
        ));
    }

    @Test
    @DisplayName("Verify valid requisition state machine transitions: DRAFT -> PENDING -> APPROVED -> OPEN -> CLOSED")
    void testValidLifecycle() {
        JobRequisition req = new JobRequisition();
        req.setTitle("Principal Cloud Architect");
        req = requisitionService.createRequisition(req);

        assertEquals(RequisitionState.DRAFT, req.getStatus());

        // Submit
        req = requisitionService.submit(req.getId());
        assertEquals(RequisitionState.PENDING_APPROVAL, req.getStatus());

        // Approve
        req = requisitionService.approve(req.getId());
        assertEquals(RequisitionState.APPROVED, req.getStatus());

        // Publish to open
        req = requisitionService.publish(req.getId());
        assertEquals(RequisitionState.OPEN, req.getStatus());

        // Close
        req = requisitionService.close(req.getId());
        assertEquals(RequisitionState.CLOSED, req.getStatus());
    }

    @Test
    @DisplayName("Verify invalid state transition throws IllegalStateException")
    void testInvalidTransitionThrowsException() {
        JobRequisition req = new JobRequisition();
        req.setTitle("Staff QA Engineer");
        req = requisitionService.createRequisition(req);

        assertEquals(RequisitionState.DRAFT, req.getStatus());

        // Attempting to directly approve a DRAFT (skipping submission) must fail
        String reqId = req.getId();
        assertThrows(IllegalStateException.class, () -> {
            requisitionService.approve(reqId);
        });

        // Attempting to directly close a DRAFT must fail
        assertThrows(IllegalStateException.class, () -> {
            requisitionService.close(reqId);
        });
    }
}
