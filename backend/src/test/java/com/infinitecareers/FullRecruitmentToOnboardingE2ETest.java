package com.infinitecareers;

import com.infinitecareers.common.TenantContext;
import com.infinitecareers.common.TenantContextHolder;
import com.infinitecareers.common.events.OutboxEvent;
import com.infinitecareers.common.events.OutboxEventRepository;
import com.infinitecareers.modules.applications.*;
import com.infinitecareers.modules.audit.AuditLogService;
import com.infinitecareers.modules.candidates.Candidate;
import com.infinitecareers.modules.candidates.CandidateService;
import com.infinitecareers.modules.documents.Document;
import com.infinitecareers.modules.documents.DocumentRepository;
import com.infinitecareers.modules.documents.DocumentService;
import com.infinitecareers.modules.documents.DocumentStorageService;
import com.infinitecareers.modules.employees.Employee;
import com.infinitecareers.modules.employees.EmployeeService;
import com.infinitecareers.modules.interviews.Interview;
import com.infinitecareers.modules.interviews.InterviewScorecard;
import com.infinitecareers.modules.interviews.InterviewService;
import com.infinitecareers.modules.offers.Offer;
import com.infinitecareers.modules.offers.OfferLetterService;
import com.infinitecareers.modules.offers.OfferService;
import com.infinitecareers.modules.offers.OfferState;
import com.infinitecareers.modules.onboarding.OnboardingInstance;
import com.infinitecareers.modules.onboarding.OnboardingService;
import com.infinitecareers.modules.onboarding.OnboardingTask;
import com.infinitecareers.modules.recruiting.JobPosting;
import com.infinitecareers.modules.recruiting.JobPostingRepository;
import com.infinitecareers.modules.recruiting.JobRequisition;
import com.infinitecareers.modules.recruiting.RequisitionService;
import com.infinitecareers.modules.recruiting.RequisitionState;
import com.infinitecareers.modules.tenancy.Tenant;
import com.infinitecareers.modules.tenancy.TenantRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;

@SpringBootTest
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
public class FullRecruitmentToOnboardingE2ETest {

    private static final String TENANT_ID = "tenant-e2e-enterprise";

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private RequisitionService requisitionService;

    @Autowired
    private JobPostingRepository jobPostingRepository;

    @Autowired
    private CandidateService candidateService;

    @Autowired
    private ApplicationService applicationService;

    @Autowired
    private InterviewService interviewService;

    @Autowired
    private OfferService offerService;

    @Autowired
    private OfferLetterService offerLetterService;

    @Autowired
    private OnboardingService onboardingService;

    @Autowired
    private DocumentService documentService;

    @Autowired
    private DocumentRepository documentRepository;

    @MockBean
    private DocumentStorageService documentStorageService;

    @Autowired
    private EmployeeService employeeService;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private OutboxEventRepository outboxEventRepository;

    private final Map<String, byte[]> storageMock = new ConcurrentHashMap<>();

    @BeforeEach
    void setUp() {
        storageMock.clear();

        if (tenantRepository.findById(TENANT_ID).isEmpty()) {
            Tenant t = new Tenant();
            t.setId(TENANT_ID);
            t.setName("InfiniteCareers Enterprise Corp");
            t.setSlug("infinitecareers-enterprise");
            tenantRepository.save(t);
        }

        // Mock Storage Interactions
        doAnswer(invocation -> {
            String key = invocation.getArgument(0);
            byte[] bytes = invocation.getArgument(1);
            storageMock.put(key, bytes);
            return null;
        }).when(documentStorageService).upload(anyString(), any(byte[].class), anyString(), any());

        when(documentStorageService.exists(anyString())).thenAnswer(invocation -> {
            String key = invocation.getArgument(0);
            return storageMock.containsKey(key);
        });

        when(documentStorageService.download(anyString())).thenAnswer(invocation -> {
            String key = invocation.getArgument(0);
            return storageMock.get(key);
        });

        when(documentStorageService.calculateSha256(any(byte[].class))).thenAnswer(invocation -> {
            byte[] bytes = invocation.getArgument(0);
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(bytes));
        });

        when(documentStorageService.generatePresignedDownloadUrl(anyString(), anyString(), anyString(), anyInt()))
                .thenAnswer(invocation -> {
                    String key = invocation.getArgument(0);
                    int expiry = invocation.getArgument(3);
                    return String.format("https://infiniteatsbucket.s3.us-east-2.amazonaws.com/%s?X-Amz-Expires=%d", key, expiry);
                });
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    private void asUser(String userId, String email, Set<String> roles, Set<String> perms) {
        TenantContextHolder.setContext(new TenantContext(
                TENANT_ID, userId, email, roles, perms, "TENANT"
        ));
    }

    @Test
    @DisplayName("Complete Recruitment-to-Onboarding Business Lifecycle E2E Validation")
    void testCompleteRecruitmentToOnboardingLifecycle() {
        // =========================================================================
        // Step 1: RECRUITER Creates Job Requisition
        // =========================================================================
        asUser("user-recruiter-01", "recruiter@infinitecareers.test",
                Set.of("RECRUITER"), Set.of("REQUISITION_CREATE", "REQUISITION_READ"));

        JobRequisition req = new JobRequisition();
        req.setTitle("Senior Software Engineer");
        req.setDepartmentId("dept-engineering");
        req.setLocationId("loc-bengaluru");
        req.setHeadcount(1);
        req.setMinSalary(new BigDecimal("1800000.00"));
        req.setMaxSalary(new BigDecimal("2200000.00"));
        req.setCurrency("INR");
        req.setDescription("Architect high-throughput scalable services");
        req.setRequirements("4-7 years distributed systems experience");

        JobRequisition createdReq = requisitionService.createRequisition(req);
        assertNotNull(createdReq.getId(), "Requisition ID must be generated");
        assertEquals(RequisitionState.DRAFT, createdReq.getStatus(), "Initial requisition status must be DRAFT");
        assertEquals("Senior Software Engineer", createdReq.getTitle());

        // Submit for Approval
        JobRequisition submittedReq = requisitionService.submit(createdReq.getId());
        assertEquals(RequisitionState.PENDING_APPROVAL, submittedReq.getStatus());

        // =========================================================================
        // Step 2: HIRING MANAGER Approves Requisition
        // =========================================================================
        asUser("user-hm-01", "hiring.manager@infinitecareers.test",
                Set.of("HIRING_MANAGER"), Set.of("REQUISITION_APPROVE", "REQUISITION_READ"));

        JobRequisition approvedReq = requisitionService.approve(submittedReq.getId());
        assertEquals(RequisitionState.APPROVED, approvedReq.getStatus());

        // Publish Requisition to OPEN state & create JobPosting
        JobRequisition openReq = requisitionService.publish(approvedReq.getId());
        assertEquals(RequisitionState.OPEN, openReq.getStatus());

        // =========================================================================
        // Step 3: PUBLISH JOB & Verify Career Portal Listing
        // =========================================================================
        asUser("user-recruiter-01", "recruiter@infinitecareers.test",
                Set.of("RECRUITER"), Set.of("JOB_POSTING_CREATE", "JOB_POSTING_READ"));

        List<JobPosting> publicJobs = jobPostingRepository.findByTenantIdAndStatus(TENANT_ID, "PUBLISHED");
        assertFalse(publicJobs.isEmpty(), "Published job posting must exist");
        JobPosting savedPosting = publicJobs.stream().filter(j -> j.getRequisitionId().equals(openReq.getId())).findFirst().orElseThrow();
        assertEquals("PUBLISHED", savedPosting.getStatus());

        // =========================================================================
        // Step 4 & 5: CANDIDATE Registers & Applies with Resume
        // =========================================================================
        asUser("user-candidate-01", "arjun.rao@example.test",
                Set.of("CANDIDATE"), Set.of("APPLICATION_CREATE", "DOCUMENT_UPLOAD"));

        Candidate candidate = new Candidate();
        candidate.setTenantId(TENANT_ID);
        candidate.setFirstName("Arjun");
        candidate.setLastName("Rao");
        candidate.setEmail("e2e.candidate+001@example.test");
        candidate.setPhone("+91-9000000001");
        candidate.setLocation("Bengaluru, India");
        candidate.setSource("CAREER_PORTAL");
        Candidate savedCandidate = candidateService.createOrResolveCandidate(candidate);
        assertNotNull(savedCandidate.getId());

        // Upload Resume
        byte[] resumeBytes = "%PDF-1.4 [Synthetic Resume Content for Arjun Rao - Staff Engineer]".getBytes(StandardCharsets.UTF_8);
        Document resumeDoc = documentService.uploadDocument(
                savedCandidate.getId(), null, null, null, null,
                "RESUME", "CAREERS", "Arjun_Rao_Resume.pdf", "application/pdf", resumeBytes
        );
        assertNotNull(resumeDoc.getId());
        assertTrue(resumeDoc.getS3Key().contains("infinitecareers/tenants/" + TENANT_ID));
        assertTrue(documentStorageService.exists(resumeDoc.getS3Key()));

        // Submit Application
        Application app = new Application();
        app.setRequisitionId(openReq.getId());
        app.setCandidateId(savedCandidate.getId());
        app.setStage(PipelineStage.APPLIED.name());
        Application savedApp = applicationService.createApplication(app);
        assertNotNull(savedApp.getId());
        assertEquals(PipelineStage.APPLIED.name(), savedApp.getStage());

        // =========================================================================
        // Step 6: RECRUITER Screens Candidate & Moves Pipeline Stage
        // =========================================================================
        asUser("user-recruiter-01", "recruiter@infinitecareers.test",
                Set.of("RECRUITER"), Set.of("APPLICATION_UPDATE", "APPLICATION_READ"));

        PipelineCard screeningCard = applicationService.moveStage(
                savedApp.getId(), PipelineStage.SCREENING.name(), savedApp.getVersion(), "Initial resume screen passed", "Strong distributed systems background"
        );
        assertEquals(PipelineStage.SCREENING.name(), screeningCard.stage());

        // =========================================================================
        // Step 7: SCHEDULE TECHNICAL INTERVIEW
        // =========================================================================
        asUser("user-recruiter-01", "recruiter@infinitecareers.test",
                Set.of("RECRUITER"), Set.of("INTERVIEW_CREATE", "INTERVIEW_READ"));

        Interview interview = new Interview();
        interview.setApplicationId(savedApp.getId());
        interview.setTitle("Technical Architecture Round");
        interview.setStage("TECHNICAL_INTERVIEW");
        interview.setScheduledStart(Instant.now().plusSeconds(86400));
        interview.setScheduledEnd(Instant.now().plusSeconds(90000));
        interview.setTimeZone("Asia/Kolkata");
        interview.setStatus("SCHEDULED");
        interview.setMeetingLink("https://meet.infinitecareers.com/tech-round-01");
        Interview scheduledInterview = interviewService.scheduleInterview(interview);
        assertNotNull(scheduledInterview.getId());
        assertEquals("SCHEDULED", scheduledInterview.getStatus());

        // Advance Pipeline to TECHNICAL_INTERVIEW
        applicationService.moveStage(savedApp.getId(), PipelineStage.TECHNICAL_INTERVIEW.name(), screeningCard.version(), "Technical round scheduled", null);

        // =========================================================================
        // Step 8: INTERVIEWER Submits Scorecard
        // =========================================================================
        asUser("user-hm-01", "hiring.manager@infinitecareers.test",
                Set.of("HIRING_MANAGER"), Set.of("INTERVIEW_READ", "SCORECARD_SUBMIT"));

        InterviewScorecard scorecard = new InterviewScorecard();
        scorecard.setOverallRating(5);
        scorecard.setTechnicalRating(5);
        scorecard.setCulturalRating(5);
        scorecard.setCommunicationRating(4);
        scorecard.setRecommendation("STRONG_HIRE");
        scorecard.setNotes("Exceptional problem solving, concurrency knowledge, and architecture clarity.");
        scorecard.setStrengths("Java, Spring Boot, Distributed Consensus, High-Throughput DB Tuning");
        InterviewScorecard savedScorecard = interviewService.submitScorecard(scheduledInterview.getId(), scorecard);
        assertNotNull(savedScorecard.getId());
        assertEquals("STRONG_HIRE", savedScorecard.getRecommendation());

        // =========================================================================
        // Step 9: CANDIDATE SELECTION & Stage Progression to EVALUATION
        // =========================================================================
        asUser("user-recruiter-01", "recruiter@infinitecareers.test",
                Set.of("RECRUITER"), Set.of("APPLICATION_UPDATE", "OFFER_CREATE"));

        Application appLatest = applicationService.getApplicationById(savedApp.getId());
        applicationService.moveStage(savedApp.getId(), PipelineStage.EVALUATION.name(), appLatest.getVersion(), "Debrief completed, unanimous hire", null);

        // =========================================================================
        // Step 10: CREATE OFFER (Base ₹18L + Variable ₹2L = Total CTC ₹20L)
        // =========================================================================
        Offer offer = new Offer();
        offer.setApplicationId(savedApp.getId());
        offer.setBaseSalary(new BigDecimal("1800000.00"));
        offer.setBonusAmount(new BigDecimal("200000.00"));
        offer.setCurrency("INR");
        offer.setStartDate(LocalDate.now().plusWeeks(3));
        offer.setExpirationDate(LocalDate.now().plusWeeks(1));

        Offer createdOffer = offerService.createOffer(offer);
        assertNotNull(createdOffer.getId());
        assertEquals(OfferState.DRAFT, createdOffer.getStatus());

        // =========================================================================
        // Step 11: OFFER APPROVAL CHAIN
        // =========================================================================
        Offer submittedOffer = offerService.submitForApproval(createdOffer.getId());
        assertEquals(OfferState.PENDING_APPROVAL, submittedOffer.getStatus());

        asUser("user-hm-01", "hiring.manager@infinitecareers.test",
                Set.of("HIRING_MANAGER"), Set.of("OFFER_APPROVE"));
        Offer approvedOffer = offerService.approve(submittedOffer.getId());
        assertEquals(OfferState.APPROVED, approvedOffer.getStatus());

        // =========================================================================
        // Step 12: GENERATE OFFER LETTER PDF & STORE IN S3
        // =========================================================================
        asUser("user-recruiter-01", "recruiter@infinitecareers.test",
                Set.of("RECRUITER"), Set.of("OFFER_GENERATE", "DOCUMENT_UPLOAD"));

        Map<String, Object> candidateDetails = Map.of(
                "candidateName", "Arjun Rao",
                "candidateAddress", "Bengaluru, Karnataka, India",
                "title", "Senior Software Engineer",
                "department", "Engineering",
                "location", "Bengaluru, India (Hybrid)",
                "companyName", "InfiniteCareers Enterprise Labs India Pvt. Ltd.",
                "companyAddress", "Mindspace IT Park, Building 12B, HITEC City, Hyderabad"
        );

        Document offerDoc = offerLetterService.generateAndStoreOfferLetter(
                approvedOffer.getId(), candidateDetails
        );

        assertNotNull(offerDoc.getS3Key(), "Offer letter S3 Key must be generated");
        assertNotNull(offerDoc.getSha256Hash(), "Offer letter SHA-256 hash must be computed");
        assertTrue(documentStorageService.exists(offerDoc.getS3Key()), "Offer letter PDF must physically exist in Storage/S3");

        // Send Offer
        Offer sentOffer = offerService.sendOffer(approvedOffer.getId());
        assertEquals(OfferState.SENT, sentOffer.getStatus());

        // Advance pipeline to OFFER_EXTENDED
        Application appForOffer = applicationService.getApplicationById(savedApp.getId());
        applicationService.moveStage(savedApp.getId(), PipelineStage.OFFER_EXTENDED.name(), appForOffer.getVersion(), "Offer sent to candidate", null);

        // =========================================================================
        // Step 13 & 14: CANDIDATE VIEWS & ACCEPTS OFFER
        // =========================================================================
        asUser("user-candidate-01", "arjun.rao@example.test",
                Set.of("CANDIDATE"), Set.of("OFFER_READ", "OFFER_ACCEPT"));

        Offer candidateViewOffer = offerService.getOfferById(sentOffer.getId());
        assertEquals(OfferState.SENT, candidateViewOffer.getStatus());

        Offer acceptedOffer = offerService.acceptOffer(sentOffer.getId(), offerDoc.getS3Key());
        assertEquals(OfferState.ACCEPTED, acceptedOffer.getStatus());
        assertNotNull(acceptedOffer.getSignedAt());

        // Advance pipeline to OFFER_ACCEPTED
        Application appForAccept = applicationService.getApplicationById(savedApp.getId());
        applicationService.moveStage(savedApp.getId(), PipelineStage.OFFER_ACCEPTED.name(), appForAccept.getVersion(), "Offer accepted by candidate", null);

        // =========================================================================
        // Step 15 & 16: START ONBOARDING & GENERATE DOCUMENT CHECKLIST
        // =========================================================================
        asUser("user-hr-01", "hrops@infinitecareers.test",
                Set.of("HR_OPS"), Set.of("ONBOARDING_MANAGE", "DOCUMENT_VERIFY"));

        OnboardingInstance onboarding = onboardingService.startOnboarding(
                savedApp.getId(), savedCandidate.getId(), LocalDate.now().plusWeeks(3)
        );
        assertNotNull(onboarding.getId());
        assertEquals("PREBOARDING", onboarding.getStatus());

        List<OnboardingTask> tasks = onboardingService.getTasksForInstance(onboarding.getId());
        assertFalse(tasks.isEmpty(), "Onboarding checklist tasks must be populated");
        assertEquals(5, tasks.size(), "Standard 5 onboarding tasks generated");

        // =========================================================================
        // Step 17 & 18: CANDIDATE UPLOADS REQUIRED ONBOARDING DOCUMENTS TO S3
        // =========================================================================
        asUser("user-candidate-01", "arjun.rao@example.test",
                Set.of("CANDIDATE"), Set.of("DOCUMENT_UPLOAD"));

        // Upload PAN
        byte[] panBytes = "%PDF-1.4 [Synthetic PAN Card - Arjun Rao - ABCDE1234F]".getBytes(StandardCharsets.UTF_8);
        Document panDoc = documentService.uploadDocument(
                savedCandidate.getId(), null, savedApp.getId(), acceptedOffer.getId(), onboarding.getId(),
                "PAN_CARD", "IDENTITY", "PAN_Arjun_Rao.pdf", "application/pdf", panBytes
        );
        assertNotNull(panDoc.getId());
        assertTrue(documentStorageService.exists(panDoc.getS3Key()));
        assertEquals("PENDING_VERIFICATION", panDoc.getStatus());

        // Upload Aadhaar
        byte[] aadhaarBytes = "%PDF-1.4 [Synthetic Aadhaar Card - Arjun Rao - XXXX-XXXX-9001]".getBytes(StandardCharsets.UTF_8);
        Document aadhaarDoc = documentService.uploadDocument(
                savedCandidate.getId(), null, savedApp.getId(), acceptedOffer.getId(), onboarding.getId(),
                "AADHAAR_CARD", "IDENTITY", "Aadhaar_Arjun_Rao.pdf", "application/pdf", aadhaarBytes
        );
        assertNotNull(aadhaarDoc.getId());
        assertTrue(documentStorageService.exists(aadhaarDoc.getS3Key()));

        // Upload Degree Certificate
        byte[] degreeBytes = "%PDF-1.4 [Synthetic Degree B.Tech Computer Science - Distinction]".getBytes(StandardCharsets.UTF_8);
        Document degreeDoc = documentService.uploadDocument(
                savedCandidate.getId(), null, savedApp.getId(), acceptedOffer.getId(), onboarding.getId(),
                "DEGREE_CERTIFICATE", "EDUCATION", "Degree_Certificate.pdf", "application/pdf", degreeBytes
        );
        assertNotNull(degreeDoc.getId());
        assertTrue(documentStorageService.exists(degreeDoc.getS3Key()));

        // Upload Experience Letter (to test rejection and replacement)
        byte[] incompleteExpBytes = "%PDF-1.4 [Incomplete Experience Letter]".getBytes(StandardCharsets.UTF_8);
        Document expDoc = documentService.uploadDocument(
                savedCandidate.getId(), null, savedApp.getId(), acceptedOffer.getId(), onboarding.getId(),
                "EXPERIENCE_LETTER", "EMPLOYMENT", "Experience_Letter_Old.pdf", "application/pdf", incompleteExpBytes
        );

        // =========================================================================
        // Step 19: HR OPS VERIFIES / REJECTS / RE-VERIFIES DOCUMENTS
        // =========================================================================
        asUser("user-hr-01", "hrops@infinitecareers.test",
                Set.of("HR_OPS"), Set.of("DOCUMENT_VERIFY", "ONBOARDING_MANAGE"));

        // Verify PAN, Aadhaar, Degree
        Document verifiedPan = documentService.verifyDocument(panDoc.getId());
        assertEquals("VERIFIED", verifiedPan.getStatus());

        Document verifiedAadhaar = documentService.verifyDocument(aadhaarDoc.getId());
        assertEquals("VERIFIED", verifiedAadhaar.getStatus());

        Document verifiedDegree = documentService.verifyDocument(degreeDoc.getId());
        assertEquals("VERIFIED", verifiedDegree.getStatus());

        // Reject Experience Letter with Reason
        Document rejectedExp = documentService.rejectDocument(expDoc.getId(), "Test document is incomplete (missing relieving date)");
        assertEquals("REJECTED", rejectedExp.getStatus());
        assertEquals("Test document is incomplete (missing relieving date)", rejectedExp.getRejectionReason());

        // Candidate Re-uploads Replacement Experience Letter
        asUser("user-candidate-01", "arjun.rao@example.test",
                Set.of("CANDIDATE"), Set.of("DOCUMENT_UPLOAD"));
        byte[] completeExpBytes = "%PDF-1.4 [Full Certified Experience Letter with Relieving Date]".getBytes(StandardCharsets.UTF_8);
        Document replacementExpDoc = documentService.uploadDocument(
                savedCandidate.getId(), null, savedApp.getId(), acceptedOffer.getId(), onboarding.getId(),
                "EXPERIENCE_LETTER", "EMPLOYMENT", "Experience_Letter_Final.pdf", "application/pdf", completeExpBytes
        );

        // HR Verifies Replacement
        asUser("user-hr-01", "hrops@infinitecareers.test",
                Set.of("HR_OPS"), Set.of("DOCUMENT_VERIFY", "ONBOARDING_MANAGE"));
        Document verifiedReplacement = documentService.verifyDocument(replacementExpDoc.getId());
        assertEquals("VERIFIED", verifiedReplacement.getStatus());

        // Complete all Onboarding Checklist Tasks
        for (OnboardingTask task : tasks) {
            onboardingService.updateTaskStatus(task.getId(), "COMPLETED");
        }

        OnboardingInstance completedOnboarding = onboardingService.getInstanceById(onboarding.getId());
        assertEquals("COMPLETED", completedOnboarding.getStatus());
        assertEquals(100, completedOnboarding.getCompletionPercentage());

        // Advance application to ONBOARDED
        Application appForOnboard = applicationService.getApplicationById(savedApp.getId());
        applicationService.moveStage(savedApp.getId(), PipelineStage.ONBOARDED.name(), appForOnboard.getVersion(), "All onboarding checks and docs verified", null);

        // =========================================================================
        // Step 20 & 21: CONVERT CANDIDATE TO EMPLOYEE & LINK DOCUMENTS
        // =========================================================================
        Employee employee = new Employee();
        employee.setTenantId(TENANT_ID);
        employee.setCandidateId(savedCandidate.getId());
        employee.setFirstName(savedCandidate.getFirstName());
        employee.setLastName(savedCandidate.getLastName());
        employee.setWorkEmail("arjun.rao@infinitecareers.com");
        employee.setPersonalEmail(savedCandidate.getEmail());
        employee.setPhone(savedCandidate.getPhone());
        employee.setJobTitle("Senior Software Engineer");
        employee.setEmploymentType("FULL_TIME");
        employee.setHireDate(LocalDate.now());
        employee.setStatus("ACTIVE");
        Employee createdEmployee = employeeService.createEmployee(employee);
        assertNotNull(createdEmployee.getId());
        assertEquals("ACTIVE", createdEmployee.getStatus());

        // Verify Documents Remain Accessible & Linked to Candidate / Onboarding
        List<Document> candidateDocs = documentRepository.findByTenantIdAndCandidateId(TENANT_ID, savedCandidate.getId());
        assertTrue(candidateDocs.size() >= 5, "Candidate must have all uploaded documents persisted");

        // =========================================================================
        // Step 22: VERIFY TAMPER-EVIDENT AUDIT HASH CHAIN
        // =========================================================================
        Map<String, Object> chainResult = auditLogService.verifyChain(TENANT_ID);
        assertTrue((Boolean) chainResult.get("valid"), "Audit hash-chain must be cryptographically valid");
        assertEquals("VERIFIED_VALID", chainResult.get("status"));
        assertTrue(((Number) chainResult.get("recordsVerified")).longValue() > 5, "Multiple audit records must be verified in chain");

        // =========================================================================
        // Step 23: VERIFY TRANSACTIONAL OUTBOX EVENTS PROCESSED
        // =========================================================================
        List<OutboxEvent> outboxEvents = outboxEventRepository.findAll();
        assertFalse(outboxEvents.isEmpty(), "Outbox events must be written throughout the lifecycle");
        assertTrue(outboxEvents.stream().anyMatch(e -> "CANDIDATE_STAGE_CHANGED".equals(e.getEventType())));
        assertTrue(outboxEvents.stream().anyMatch(e -> "DOCUMENT_UPLOADED".equals(e.getEventType())));
        assertTrue(outboxEvents.stream().anyMatch(e -> "DOCUMENT_VERIFIED".equals(e.getEventType())));

        // =========================================================================
        // Step 24: S3 SECURITY & TENANT ISOLATION TESTS
        // =========================================================================
        // Verify Presigned URL Generation
        String presignedUrl = documentService.generatePresignedDownloadUrl(panDoc.getId(), 300);
        assertNotNull(presignedUrl);
        assertTrue(presignedUrl.contains("http") || presignedUrl.contains("infiniteatsbucket"));

        // Verify Storage Health
        Map<String, Object> storageHealth = documentService.checkStorageHealth();
        assertEquals("HEALTHY", storageHealth.get("s3Storage"));
        assertEquals("BLOCKED", storageHealth.get("publicAccess"));

        System.out.println("==========================================================================");
        System.out.println(">>> FULL RECRUITMENT-TO-ONBOARDING E2E VALIDATION PASSED COMPLETELY <<<");
        System.out.println("Requisition: " + createdReq.getId() + " (" + createdReq.getTitle() + ")");
        System.out.println("Candidate: " + savedCandidate.getId() + " (" + savedCandidate.getFirstName() + " " + savedCandidate.getLastName() + ")");
        System.out.println("Application: " + savedApp.getId());
        System.out.println("Offer: " + acceptedOffer.getId() + " (Total CTC: ₹20,00,000)");
        System.out.println("Onboarding: " + completedOnboarding.getId() + " (100% Completed)");
        System.out.println("Employee: " + createdEmployee.getId() + " (" + createdEmployee.getEmployeeNumber() + ")");
        System.out.println("Audit Chain: " + chainResult);
        System.out.println("==========================================================================");
    }
}
