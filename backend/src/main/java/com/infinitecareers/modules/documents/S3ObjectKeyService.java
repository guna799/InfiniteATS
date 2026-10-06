package com.infinitecareers.modules.documents;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class S3ObjectKeyService {

    private final String prefix;

    public S3ObjectKeyService(@Value("${app.storage.s3.prefix:${AWS_S3_PREFIX:infinitecareers}}") String prefix) {
        this.prefix = prefix.replaceAll("^/+|/+$", "");
    }

    public String buildCandidateDocumentKey(String tenantId, String candidateId, String category, String documentId, String extension) {
        String safeExt = sanitizeExtension(extension);
        String safeCategory = sanitizePathSegment(category.toLowerCase());
        return String.format("%s/tenants/%s/candidates/%s/%s/%s.%s",
                prefix, tenantId, candidateId, safeCategory, documentId, safeExt);
    }

    public String buildOfferDocumentKey(String tenantId, String offerId, String stage, int version, String documentId) {
        String safeStage = sanitizePathSegment(stage.toLowerCase());
        return String.format("%s/tenants/%s/offers/%s/%s/offer-v%d-%s.pdf",
                prefix, tenantId, offerId, safeStage, version, documentId);
    }

    public String buildOnboardingDocumentKey(String tenantId, String onboardingId, String category, String documentId, String extension) {
        String safeExt = sanitizeExtension(extension);
        String safeCategory = sanitizePathSegment(category.toLowerCase());
        return String.format("%s/tenants/%s/onboarding/%s/%s/%s.%s",
                prefix, tenantId, onboardingId, safeCategory, documentId, safeExt);
    }

    public String buildEmployeeDocumentKey(String tenantId, String employeeId, String category, String documentId, String extension) {
        String safeExt = sanitizeExtension(extension);
        String safeCategory = sanitizePathSegment(category.toLowerCase());
        return String.format("%s/tenants/%s/employees/%s/%s/%s.%s",
                prefix, tenantId, employeeId, safeCategory, documentId, safeExt);
    }

    private String sanitizePathSegment(String segment) {
        if (segment == null || segment.trim().isEmpty()) {
            return "other";
        }
        return segment.replaceAll("[^a-zA-Z0-9_-]", "-");
    }

    private String sanitizeExtension(String ext) {
        if (ext == null || ext.trim().isEmpty()) {
            return "bin";
        }
        String cleaned = ext.replaceAll("^\\.+", "").replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
        return cleaned.isEmpty() ? "bin" : cleaned;
    }
}
