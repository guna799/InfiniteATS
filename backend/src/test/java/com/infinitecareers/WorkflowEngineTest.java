package com.infinitecareers;

import com.infinitecareers.common.TenantContext;
import com.infinitecareers.common.TenantContextHolder;
import com.infinitecareers.modules.tenancy.Tenant;
import com.infinitecareers.modules.tenancy.TenantRepository;
import com.infinitecareers.modules.workflow.WorkflowDefinition;
import com.infinitecareers.modules.workflow.WorkflowEngineService;
import com.infinitecareers.modules.workflow.WorkflowInstance;
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
public class WorkflowEngineTest {

    @Autowired
    private WorkflowEngineService workflowEngineService;

    @Autowired
    private TenantRepository tenantRepository;

    @BeforeEach
    void setUp() {
        if (tenantRepository.findById("tenant-wf-test").isEmpty()) {
            Tenant t = new Tenant();
            t.setId("tenant-wf-test");
            t.setName("Workflow Test Corp");
            t.setSlug("workflow-test-corp");
            tenantRepository.save(t);
        }

        TenantContextHolder.setContext(new TenantContext(
                "tenant-wf-test", "user-wf", "wf@test.com",
                Set.of("SUPER_ADMIN"), Set.of("WORKFLOW_MANAGE"), "TENANT"
        ));
    }

    @Test
    @DisplayName("Verify workflow definition registration and execution triggering")
    void testWorkflowExecution() {
        WorkflowDefinition def = new WorkflowDefinition();
        def.setName("Automated Offer Preboarding Trigger");
        def.setDescription("Runs verification tasks upon offer acceptance");
        def.setTriggerEvent("OFFER_ACCEPTED");
        def.setIsActive(true);
        def = workflowEngineService.createDefinition(def);

        assertNotNull(def.getId());

        // Trigger workflow
        WorkflowInstance instance = workflowEngineService.triggerWorkflow(
                "OFFER_ACCEPTED", "OFFER", "off-999", "{\"offerId\":\"off-999\"}"
        );

        assertNotNull(instance);
        assertEquals("RUNNING", instance.getStatus());
        assertEquals("OFFER", instance.getEntityType());
        assertEquals("off-999", instance.getEntityId());
    }
}
