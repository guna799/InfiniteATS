package com.infinitecareers;

import com.infinitecareers.common.TenantContext;
import com.infinitecareers.common.TenantContextHolder;
import com.infinitecareers.modules.documents.Document;
import com.infinitecareers.modules.documents.DocumentRepository;
import com.infinitecareers.modules.documents.DocumentService;
import com.infinitecareers.modules.documents.DocumentStorageService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doNothing;

@SpringBootTest
@ActiveProfiles("test")
class DocumentTenantIsolationTest {

    @Autowired
    private DocumentService documentService;

    @Autowired
    private DocumentRepository documentRepository;

    @MockBean
    private DocumentStorageService documentStorageService;

    @BeforeEach
    void setUp() {
        doNothing().when(documentStorageService).upload(any(), any(), any(), any());
        doNothing().when(documentStorageService).validateFileTypeAndSize(any(), any(), any());
        doAnswer(inv -> "d9a5ed82ebb7b88113bf8fe49ea9d67c4f46e50284c71234567890abcdef1234")
                .when(documentStorageService).calculateSha256(any());
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("Tenant A cannot access, view, or verify documents belonging to Tenant B")
    void testTenantIsolationOnDocumentAccess() {
        // 1. Upload document as Tenant A
        TenantContextHolder.setContext(new TenantContext("tenant-acme-tech", "user-1", "admin@acme.com", Set.of("RECRUITER"), Set.of("DOC_WRITE"), "TENANT"));
        byte[] samplePdf = "%PDF-1.4 sample content".getBytes(StandardCharsets.UTF_8);

        Document docA = documentService.uploadDocument(
                "cand-101", null, "app-101", null, null,
                "PAN", "STATUTORY", "pan_card.pdf", "application/pdf", samplePdf
        );
        assertNotNull(docA.getId());
        assertEquals("tenant-acme-tech", docA.getTenantId());

        // 2. Switch context to Tenant B
        TenantContextHolder.setContext(new TenantContext("tenant-nexus-health", "user-2", "admin@nexus.com", Set.of("RECRUITER"), Set.of("DOC_WRITE"), "TENANT"));

        // Tenant B searching by candidate ID cand-101 gets empty list
        List<Document> tenantBQuery = documentService.getDocumentsByCandidate("cand-101");
        assertTrue(tenantBQuery.isEmpty(), "Tenant B should receive zero documents for Tenant A candidate");

        // Tenant B attempting direct ID access throws NoSuchElementException (404/403)
        assertThrows(NoSuchElementException.class, () -> documentService.getDocumentById(docA.getId()));

        // Tenant B attempting to verify Tenant A document throws exception
        assertThrows(NoSuchElementException.class, () -> documentService.verifyDocument(docA.getId()));

        // 3. Switch back to Tenant A
        TenantContextHolder.setContext(new TenantContext("tenant-acme-tech", "user-1", "admin@acme.com", Set.of("RECRUITER"), Set.of("DOC_WRITE"), "TENANT"));
        Document fetchedByA = documentService.getDocumentById(docA.getId());
        assertEquals(docA.getId(), fetchedByA.getId());

        // Document verification workflow succeeds for Tenant A
        Document verified = documentService.verifyDocument(docA.getId());
        assertEquals("VERIFIED", verified.getStatus());
        assertNotNull(verified.getVerifiedAt());
    }

    @Test
    @DisplayName("Document rejection requires mandatory rejection reason")
    void testDocumentRejectionValidation() {
        TenantContextHolder.setContext(new TenantContext("tenant-acme-tech", "user-1", "admin@acme.com", Set.of("HR_OPS"), Set.of("DOC_WRITE"), "TENANT"));
        byte[] samplePdf = "%PDF-1.4 sample content".getBytes(StandardCharsets.UTF_8);

        Document doc = documentService.uploadDocument(
                "cand-102", null, "app-102", null, null,
                "AADHAAR", "IDENTITY", "aadhaar.pdf", "application/pdf", samplePdf
        );

        // Blank rejection reason fails
        assertThrows(IllegalArgumentException.class, () -> documentService.rejectDocument(doc.getId(), ""));
        assertThrows(IllegalArgumentException.class, () -> documentService.rejectDocument(doc.getId(), "   "));

        // Valid rejection reason marks as REJECTED with note
        Document rejected = documentService.rejectDocument(doc.getId(), "Aadhaar image is blurred; please upload clear color scan");
        assertEquals("REJECTED", rejected.getStatus());
        assertEquals("Aadhaar image is blurred; please upload clear color scan", rejected.getRejectionReason());
    }
}
