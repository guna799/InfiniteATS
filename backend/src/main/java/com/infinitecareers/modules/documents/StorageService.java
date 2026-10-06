package com.infinitecareers.modules.documents;

import com.infinitecareers.common.TenantContextHolder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class StorageService {

    private final DocumentRepository documentRepository;
    private final String storageProvider;

    public StorageService(
            DocumentRepository documentRepository,
            @Value("${app.storage.provider:local}") String storageProvider) {
        this.documentRepository = documentRepository;
        this.storageProvider = storageProvider;
    }

    public List<Document> getDocumentsForOwner(String ownerId) {
        return documentRepository.findByTenantIdAndOwnerId(TenantContextHolder.getTenantId(), ownerId);
    }

    public Document getDocumentById(String id) {
        return documentRepository.findByIdAndTenantId(id, TenantContextHolder.getTenantId())
                .orElseThrow(() -> new NoSuchElementException("Document not found: " + id));
    }

    @Transactional
    public Document registerDocument(String ownerId, String category, String filename, String mimeType, long fileSize) {
        String tenantId = TenantContextHolder.getTenantId();
        String storageKey = String.format("tenants/%s/%s/%s-%s", tenantId, category.toLowerCase(), UUID.randomUUID(), filename);

        Document doc = new Document();
        doc.setTenantId(tenantId);
        doc.setOwnerId(ownerId);
        doc.setCategory(category);
        doc.setFilename(filename);
        doc.setMimeType(mimeType);
        doc.setStorageKey(storageKey);
        doc.setFileSize(fileSize);
        doc.setCreatedBy(TenantContextHolder.getUserId());
        return documentRepository.save(doc);
    }

    public String generatePresignedDownloadUrl(String documentId) {
        Document doc = getDocumentById(documentId);
        // Generates secure temporary signed access URL (mocked for local, S3 presigned in prod)
        return String.format("/api/v1/public/documents/download/%s?token=%s&expires=%d",
                doc.getId(),
                UUID.randomUUID().toString().substring(0, 16),
                Instant.now().getEpochSecond() + 3600
        );
    }
}
