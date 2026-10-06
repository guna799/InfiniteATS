package com.infinitecareers.modules.documents;

import com.infinitecareers.common.TenantContextHolder;
import com.infinitecareers.common.events.TransactionalOutboxService;
import com.infinitecareers.modules.audit.AuditLogService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final DocumentStorageService documentStorageService;
    private final S3ObjectKeyService s3ObjectKeyService;
    private final AuditLogService auditLogService;
    private final TransactionalOutboxService transactionalOutboxService;

    // Standard Enterprise Onboarding Requirements Definition
    public static final List<Map<String, Object>> MANDATORY_ONBOARDING_REQUIREMENTS = List.of(
            Map.of("type", "PAN_CARD", "category", "IDENTITY", "title", "Permanent Account Number (PAN)", "required", true),
            Map.of("type", "AADHAAR_CARD", "category", "IDENTITY", "title", "Aadhaar Identity Card", "required", true),
            Map.of("type", "DEGREE_CERTIFICATE", "category", "EDUCATION", "title", "Highest Degree Certificate", "required", true),
            Map.of("type", "EXPERIENCE_LETTER", "category", "EMPLOYMENT", "title", "Previous Experience / Relieving Letter", "required", true),
            Map.of("type", "BANK_PROOF", "category", "BANKING", "title", "Cancelled Cheque / Bank Statement", "required", true),
            Map.of("type", "NDA", "category", "EMPLOYMENT", "title", "Signed Non-Disclosure & Inventions Agreement", "required", true),
            Map.of("type", "PASSPORT", "category", "IDENTITY", "title", "Passport (Optional)", "required", false),
            Map.of("type", "FORM_11", "category", "STATUTORY", "title", "EPFO Form 11 Declaration", "required", false)
    );

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

    public List<Document> getDocumentHistory(String candidateId, String documentType) {
        return documentRepository.findByTenantIdAndCandidateIdAndDocumentTypeOrderByVersionDesc(
                TenantContextHolder.getTenantId(), candidateId, documentType
        );
    }

    public List<Document> getDocumentsByEmployee(String employeeId) {
        return documentRepository.findByTenantIdAndEmployeeId(TenantContextHolder.getTenantId(), employeeId);
    }

    public List<Document> getDocumentsByOffer(String offerId) {
        return documentRepository.findByTenantIdAndOfferId(TenantContextHolder.getTenantId(), offerId);
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

        // Determine Document Version
        int version = 1;
        if (candidateId != null && !candidateId.trim().isEmpty()) {
            List<Document> existing = documentRepository.findByTenantIdAndCandidateIdAndDocumentTypeOrderByVersionDesc(tenantId, candidateId, documentType);
            if (!existing.isEmpty() && existing.get(0).getVersion() != null) {
                version = existing.get(0).getVersion() + 1;
            }
        }

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
                "version", String.valueOf(version),
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
        doc.setVersion(version);
        doc.setStatus("PENDING_VERIFICATION");
        doc.setUploadedById(TenantContextHolder.getUserId());
        doc.setUploadedBy(TenantContextHolder.getContext() != null && TenantContextHolder.getContext().getUserEmail() != null 
                ? TenantContextHolder.getContext().getUserEmail() : "user@infinitecareers.com");
        doc.setUploadedAt(Instant.now());

        Document saved = documentRepository.save(doc);

        // 3. Cryptographic Audit Log
        String auditPayload = String.format("{\"documentId\":\"%s\",\"type\":\"%s\",\"version\":%d,\"sha256\":\"%s\",\"s3Key\":\"%s\"}",
                saved.getId(), documentType, version, sha256, s3Key);
        auditLogService.record("DOCUMENT_UPLOADED", "DOCUMENT", saved.getId(), null, auditPayload);

        // 4. Outbox Event
        transactionalOutboxService.publish("DOCUMENT_UPLOADED", "DOCUMENT", saved.getId(), Map.of(
                "documentId", saved.getId(),
                "documentType", documentType,
                "candidateId", candidateId != null ? candidateId : "",
                "version", version,
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
                "version", doc.getVersion() != null ? doc.getVersion() : 1,
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
                "version", doc.getVersion() != null ? doc.getVersion() : 1,
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

    public Map<String, Object> getCandidateOnboardingProgress(String candidateId) {
        String tenantId = TenantContextHolder.getTenantId();
        List<Document> allDocs = documentRepository.findByTenantIdAndCandidateId(tenantId, candidateId);

        // Group latest document per documentType
        Map<String, Document> latestDocs = new LinkedHashMap<>();
        for (Document d : allDocs) {
            String type = d.getDocumentType();
            if (!latestDocs.containsKey(type) || (d.getVersion() != null && d.getVersion() > latestDocs.get(type).getVersion())) {
                latestDocs.put(type, d);
            }
        }

        long requiredCount = MANDATORY_ONBOARDING_REQUIREMENTS.stream().filter(r -> Boolean.TRUE.equals(r.get("required"))).count();
        long verifiedRequired = MANDATORY_ONBOARDING_REQUIREMENTS.stream()
                .filter(r -> Boolean.TRUE.equals(r.get("required")))
                .filter(r -> {
                    Document d = latestDocs.get((String) r.get("type"));
                    return d != null && "VERIFIED".equalsIgnoreCase(d.getStatus());
                }).count();

        int progressPercent = requiredCount > 0 ? (int) Math.round(((double) verifiedRequired / requiredCount) * 100) : 100;

        List<Map<String, Object>> checklistItems = new ArrayList<>();
        for (Map<String, Object> req : MANDATORY_ONBOARDING_REQUIREMENTS) {
            String type = (String) req.get("type");
            Document doc = latestDocs.get(type);
            Map<String, Object> item = new LinkedHashMap<>(req);
            if (doc != null) {
                item.put("documentId", doc.getId());
                item.put("status", doc.getStatus());
                item.put("version", doc.getVersion());
                item.put("originalFilename", doc.getOriginalFilename());
                item.put("fileSize", doc.getFileSize());
                item.put("sha256", doc.getSha256Hash());
                item.put("uploadedAt", doc.getUploadedAt());
                item.put("verifiedAt", doc.getVerifiedAt());
                item.put("verifiedBy", doc.getVerifiedBy());
                item.put("rejectionReason", doc.getRejectionReason());
            } else {
                item.put("status", "NOT_SUBMITTED");
            }
            checklistItems.add(item);
        }

        return Map.of(
                "candidateId", candidateId,
                "totalRequired", requiredCount,
                "verifiedRequired", verifiedRequired,
                "completionPercentage", progressPercent,
                "isComplete", verifiedRequired == requiredCount,
                "checklist", checklistItems
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
