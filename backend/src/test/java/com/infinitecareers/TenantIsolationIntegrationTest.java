package com.infinitecareers;

import com.infinitecareers.common.TenantContext;
import com.infinitecareers.common.TenantContextHolder;
import com.infinitecareers.modules.candidates.Candidate;
import com.infinitecareers.modules.candidates.CandidateRepository;
import com.infinitecareers.modules.candidates.CandidateService;
import com.infinitecareers.modules.recruiting.JobRequisition;
import com.infinitecareers.modules.recruiting.JobRequisitionRepository;
import com.infinitecareers.modules.recruiting.RequisitionService;
import com.infinitecareers.modules.tenancy.Tenant;
import com.infinitecareers.modules.tenancy.TenantRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class TenantIsolationIntegrationTest {

    @Autowired
    private CandidateService candidateService;

    @Autowired
    private CandidateRepository candidateRepository;

    @Autowired
    private RequisitionService requisitionService;

    @Autowired
    private JobRequisitionRepository requisitionRepository;

    @Autowired
    private TenantRepository tenantRepository;

    @BeforeEach
    void setUp() {
        TenantContextHolder.clear();
        createTenantIfNotExists("tenant-alpha", "Alpha Corp", "alpha-corp");
        createTenantIfNotExists("tenant-beta", "Beta Corp", "beta-corp");
    }

    private void createTenantIfNotExists(String id, String name, String slug) {
        if (tenantRepository.findById(id).isEmpty()) {
            Tenant t = new Tenant();
            t.setId(id);
            t.setName(name);
            t.setSlug(slug);
            tenantRepository.save(t);
        }
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("Verify strict tenant data isolation between Tenant Alpha and Tenant Beta")
    void testTenantIsolation() {
        // 1. Act as Tenant Alpha
        TenantContextHolder.setContext(new TenantContext(
                "tenant-alpha", "user-alpha", "alpha@test.com",
                Set.of("SUPER_ADMIN"), Set.of("CANDIDATE_READ", "CANDIDATE_CREATE"), "TENANT"
        ));

        Candidate candAlpha = new Candidate();
        candAlpha.setFirstName("Alice");
        candAlpha.setLastName("Alpha");
        candAlpha.setEmail("alice@alpha.com");
        candAlpha = candidateService.createOrResolveCandidate(candAlpha);

        JobRequisition reqAlpha = new JobRequisition();
        reqAlpha.setTitle("Senior Alpha Architect");
        reqAlpha = requisitionService.createRequisition(reqAlpha);

        // Verify Tenant Alpha can see its records
        List<Candidate> alphaCandidates = candidateService.getAllCandidates();
        assertTrue(alphaCandidates.stream().anyMatch(c -> c.getEmail().equals("alice@alpha.com")));

        // 2. Switch Context to Tenant Beta
        TenantContextHolder.setContext(new TenantContext(
                "tenant-beta", "user-beta", "beta@test.com",
                Set.of("SUPER_ADMIN"), Set.of("CANDIDATE_READ", "CANDIDATE_CREATE"), "TENANT"
        ));

        // Verify Tenant Beta cannot see Tenant Alpha's candidates
        List<Candidate> betaCandidates = candidateService.getAllCandidates();
        assertFalse(betaCandidates.stream().anyMatch(c -> c.getEmail().equals("alice@alpha.com")));

        // Verify Tenant Beta cannot fetch Tenant Alpha's candidate by ID
        String alphaCandId = candAlpha.getId();
        assertThrows(NoSuchElementException.class, () -> {
            candidateService.getCandidateById(alphaCandId);
        });

        // Verify Tenant Beta cannot fetch Tenant Alpha's requisition by ID
        String alphaReqId = reqAlpha.getId();
        assertThrows(NoSuchElementException.class, () -> {
            requisitionService.getRequisitionById(alphaReqId);
        });
    }
}
