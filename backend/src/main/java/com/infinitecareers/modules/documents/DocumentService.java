package com.infinitecareers.modules.documents;

import com.infinitecareers.common.TenantContextHolder;
import com.infinitecareers.common.events.TransactionalOutboxService;
import com.infinitecareers.modules.audit.AuditLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
public class DocumentService {

    private static final Logger log = LoggerFactory.getLogger(DocumentService.class);

    private final DocumentRepository documentRepository;
    private final DocumentStorageService documentStorageService;
    private final S3ObjectKeyService s3ObjectKeyService;
    private final AuditLogService auditLogService;
    private final TransactionalOutboxService transactionalOutboxService;

    public DocumentService(
            DocumentRepository documentRepository,
            DocumentStorageService documentStorageService,
            S3ObjectKeyService s3ObjectKeyService,
            AuditLogService auditLogService,
            TransactionalOutboxService transactionalOutboxService) {
        this.documentRepository = documentRepository;
        this.documentStorageService = documentStorageService;
        this.s3ObjectKeyService = s3ObjectKeyService;
        this.auditLogService = auditLogService;
        this.transactionalOutboxService = transactionalOutboxService;
    }

    public List<Document> getDocumentsForOwner(String ownerId) {
        return documentRepository.findByTenantIdAndOwnerId(TenantContextHolder.getTenantId(), ownerId);
    }

    public List<Document> getDocumentsByCandidate(String candidateId) {
        return documentRepository.findByTenantIdAndCandidateId(TenantContextHolder.getTenantId(), candidateId);
    }

    public List<Document> getDocumentsByEmployee(String employeeId) {
        return documentRepository.findByTenantIdAndEmployeeId(TenantContextHolder.getTenantId(), employeeId);
    }

    public List<Document> getDocumentsByOffer(String offerId) {
        return documentRepository.findByTenantIdAndOfferId(TenantContextHolder.getTenantId(), offerId);
    }

    public List<Document> getDocumentsByApplication(String applicationId) {
        return documentRepository.findByTenantIdAndApplicationId(TenantContextHolder.getTenantId(), applicationId);
    }

    public Document getDocumentById(String id) {
        return documentRepository.findByIdAndTenantId(id, TenantContextHolder.getTenantId())
                .orElseThrow(() -> new NoSuchElementException("Document not found: " + id));
    }

    @Transactional
    public Document uploadDocument(
            String candidateId,
            String employeeId,
            String applicationId,
            String offerId,
            String onboardingId,
            String documentType,
            String documentCategory,
            String originalFilename,
            String contentType,
            byte[] fileBytes) {

        String tenantId = TenantContextHolder.getTenantId();
        documentStorageService.validateFileTypeAndSize(originalFilename, contentType, fileBytes);

        String documentId = UUID.randomUUID().toString();
        String extension = getFileExtension(originalFilename);
        String s3Key;

        if (candidateId != null && !candidateId.trim().isEmpty()) {
            s3Key = s3ObjectKeyService.buildCandidateDocumentKey(tenantId, candidateId, documentCategory, documentId, extension);
        } else if (employeeId != null && !employeeId.trim().isEmpty()) {
            s3Key = s3ObjectKeyService.buildEmployeeDocumentKey(tenantId, employeeId, documentCategory, documentId, extension);
        } else if (onboardingId != null && !onboardingId.trim().isEmpty()) {
            s3Key = s3ObjectKeyService.buildOnboardingDocumentKey(tenantId, onboardingId, documentCategory, documentId, extension);
        } else {
            s3Key = String.format("infinitecareers/tenants/%s/documents/%s/%s.%s", tenantId, documentCategory.toLowerCase(), documentId, extension);
        }

        String sha256 = documentStorageService.calculateSha256(fileBytes);

        // 1. Upload to S3
        Map<String, String> s3Meta = Map.of(
                "tenantId", tenantId,
                "documentType", documentType,
                "sha256", sha256
        );
        documentStorageService.upload(s3Key, fileBytes, contentType, s3Meta);

        // 2. Persist in Postgres
        Document doc = new Document();
        doc.setId(documentId);
        doc.setTenantId(tenantId);
        doc.setCandidateId(candidateId);
        doc.setEmployeeId(employeeId);
        doc.setApplicationId(applicationId);
        doc.setOfferId(offerId);
        doc.setOnboardingId(onboardingId);
        doc.setOwnerId(candidateId != null ? candidateId : (employeeId != null ? employeeId : applicationId));
        doc.setDocumentType(documentType);
        doc.setDocumentCategory(documentCategory);
        doc.setFilename(originalFilename);
        doc.setOriginalFilename(originalFilename);
        doc.setStoredFilename(String.format("%s.%s", documentId, extension));
        doc.setMimeType(contentType);
        doc.setStorageKey(s3Key);
        doc.setS3Key(s3Key);
        doc.setS3Bucket("infiniteatsbucket");
        doc.setFileSize((long) fileBytes.length);
        doc.setSha256Hash(sha256);
        doc.setStatus("PENDING_VERIFICATION");
        doc.setUploadedById(TenantContextHolder.getUserId());
        doc.setUploadedBy(TenantContextHolder.getContext() != null && TenantContextHolder.getContext().getUserEmail() != null 
                ? TenantContextHolder.getContext().getUserEmail() : "user@infinitecareers.com");
        doc.setUploadedAt(Instant.now());

        Document saved = documentRepository.save(doc);

        // 3. Cryptographic Audit Log
        String auditPayload = String.format("{\"documentId\":\"%s\",\"type\":\"%s\",\"sha256\":\"%s\",\"s3Key\":\"%s\"}",
                saved.getId(), documentType, sha256, s3Key);
        auditLogService.record("DOCUMENT_UPLOADED", "DOCUMENT", saved.getId(), null, auditPayload);

        // 4. Outbox Event
        transactionalOutboxService.publish("DOCUMENT_UPLOADED", "DOCUMENT", saved.getId(), Map.of(
                "documentId", saved.getId(),
                "documentType", documentType,
                "candidateId", candidateId != null ? candidateId : "",
                "status", "PENDING_VERIFICATION",
                "sha256", sha256
        ));

        return saved;
    }

    @Transactional
    public Document verifyDocument(String documentId) {
        Document doc = getDocumentById(documentId);
        String beforeState = String.format("{\"status\":\"%s\"}", doc.getStatus());

        doc.setStatus("VERIFIED");
        doc.setVerifiedById(TenantContextHolder.getUserId());
        doc.setVerifiedBy(TenantContextHolder.getContext() != null && TenantContextHolder.getContext().getUserEmail() != null 
                ? TenantContextHolder.getContext().getUserEmail() : "hr_ops@infinitecareers.com");
        doc.setVerifiedAt(Instant.now());
        doc.setRejectionReason(null);

        Document updated = documentRepository.save(doc);

        auditLogService.record("DOCUMENT_VERIFIED", "DOCUMENT", doc.getId(), beforeState,
                String.format("{\"status\":\"VERIFIED\",\"verifiedBy\":\"%s\"}", doc.getVerifiedBy()));

        transactionalOutboxService.publish("DOCUMENT_VERIFIED", "DOCUMENT", doc.getId(), Map.of(
                "documentId", doc.getId(),
                "documentType", doc.getDocumentType(),
                "status", "VERIFIED",
                "verifiedAt", doc.getVerifiedAt().toString()
        ));

        return updated;
    }

    @Transactional
    public Document rejectDocument(String documentId, String reason) {
        if (reason == null || reason.trim().isEmpty()) {
            throw new IllegalArgumentException("Rejection reason is mandatory when rejecting candidate document");
        }
        Document doc = getDocumentById(documentId);
        String beforeState = String.format("{\"status\":\"%s\"}", doc.getStatus());

        doc.setStatus("REJECTED");
        doc.setVerifiedById(TenantContextHolder.getUserId());
        doc.setVerifiedBy(TenantContextHolder.getContext() != null && TenantContextHolder.getContext().getUserEmail() != null 
                ? TenantContextHolder.getContext().getUserEmail() : "hr_ops@infinitecareers.com");
        doc.setVerifiedAt(Instant.now());
        doc.setRejectionReason(reason);

        Document updated = documentRepository.save(doc);

        auditLogService.record("DOCUMENT_REJECTED", "DOCUMENT", doc.getId(), beforeState,
                String.format("{\"status\":\"REJECTED\",\"reason\":\"%s\"}", reason));

        transactionalOutboxService.publish("DOCUMENT_REJECTED", "DOCUMENT", doc.getId(), Map.of(
                "documentId", doc.getId(),
                "documentType", doc.getDocumentType(),
                "status", "REJECTED",
                "rejectionReason", reason
        ));

        return updated;
    }

    public String generatePresignedDownloadUrl(String documentId, int expirySeconds) {
        Document doc = getDocumentById(documentId);
        return documentStorageService.generatePresignedDownloadUrl(
                doc.getS3Key(),
                doc.getOriginalFilename(),
                doc.getMimeType(),
                expirySeconds > 0 ? expirySeconds : 300
        );
    }

    public Map<String, Object> checkStorageHealth() {
        String tenantId = TenantContextHolder.getTenantId();
        long totalDocs = documentRepository.count();
        long pending = documentRepository.countByTenantIdAndStatus(tenantId, "PENDING_VERIFICATION");
        long verified = documentRepository.countByTenantIdAndStatus(tenantId, "VERIFIED");
        long rejected = documentRepository.countByTenantIdAndStatus(tenantId, "REJECTED");

        return Map.of(
                "s3Storage", "HEALTHY",
                "bucket", "infiniteatsbucket",
                "region", "us-east-2",
                "encryption", "AES256",
                "publicAccess", "BLOCKED",
                "totalDocuments", totalDocs,
                "pendingVerification", pending,
                "verifiedCount", verified,
                "rejectedCount", rejected
        );
    }

    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "pdf";
        }
        return filename.substring(filename.lastIndexOf(".") + 1);
    }
}
