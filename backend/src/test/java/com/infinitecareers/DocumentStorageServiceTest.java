package com.infinitecareers;

import com.infinitecareers.modules.documents.DocumentStorageService;
import com.infinitecareers.modules.documents.S3DocumentStorageService;
import com.infinitecareers.modules.documents.S3ObjectKeyService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;

class DocumentStorageServiceTest {

    private S3ObjectKeyService objectKeyService;
    private DocumentStorageService storageService;
    private S3Client mockS3Client;
    private S3Presigner mockPresigner;

    @BeforeEach
    void setUp() {
        objectKeyService = new S3ObjectKeyService("infinitecareers");
        mockS3Client = Mockito.mock(S3Client.class);
        mockPresigner = Mockito.mock(S3Presigner.class);
        storageService = new S3DocumentStorageService(mockS3Client, mockPresigner, "infiniteatsbucket", 20);
    }

    @Test
    @DisplayName("S3 Key Service constructs isolated multi-tenant candidate prefix")
    void testCandidateDocumentKey() {
        String key = objectKeyService.buildCandidateDocumentKey("tenant-acme", "cand-123", "IDENTITY", "doc-456", "pdf");
        assertEquals("infinitecareers/tenants/tenant-acme/candidates/cand-123/identity/doc-456.pdf", key);
    }

    @Test
    @DisplayName("S3 Key Service constructs versioned offer letter prefix")
    void testOfferDocumentKey() {
        String key = objectKeyService.buildOfferDocumentKey("tenant-nexus", "off-789", "final", 2, "doc-999");
        assertEquals("infinitecareers/tenants/tenant-nexus/offers/off-789/final/offer-v2-doc-999.pdf", key);
    }

    @Test
    @DisplayName("S3 Key Service sanitizes special characters in category and extension")
    void testSanitization() {
        String key = objectKeyService.buildCandidateDocumentKey("tenant-acme", "cand-1", "BANK PROOF!", "doc-1", ".PDF");
        assertEquals("infinitecareers/tenants/tenant-acme/candidates/cand-1/bank-proof-/doc-1.pdf", key);
    }

    @Test
    @DisplayName("SHA-256 calculation produces exact deterministic cryptographic hash")
    void testSha256Calculation() {
        byte[] content = "InfiniteCareers Enterprise Document Content".getBytes(StandardCharsets.UTF_8);
        String hash = storageService.calculateSha256(content);
        assertNotNull(hash);
        assertEquals(64, hash.length());
        // Deterministic check
        assertEquals(hash, storageService.calculateSha256(content));
    }

    @Test
    @DisplayName("Validation fails on empty document bytes")
    void testValidationEmptyBytes() {
        assertThrows(IllegalArgumentException.class, () ->
                storageService.validateFileTypeAndSize("test.pdf", "application/pdf", new byte[0]));
    }

    @Test
    @DisplayName("Validation fails on unsupported executable / script MIME types")
    void testValidationUnsupportedType() {
        byte[] payload = "echo 'malicious'".getBytes(StandardCharsets.UTF_8);
        assertThrows(IllegalArgumentException.class, () ->
                storageService.validateFileTypeAndSize("script.sh", "application/x-sh", payload));
    }

    @Test
    @DisplayName("Validation fails when file exceeds configured max size limit")
    void testValidationOversizedFile() {
        byte[] hugePayload = new byte[21 * 1024 * 1024]; // 21MB exceeds 20MB limit
        assertThrows(IllegalArgumentException.class, () ->
                storageService.validateFileTypeAndSize("large.pdf", "application/pdf", hugePayload));
    }
}
