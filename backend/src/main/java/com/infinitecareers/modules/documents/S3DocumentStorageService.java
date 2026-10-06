package com.infinitecareers.modules.documents;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.HexFormat;
import java.util.Map;
import java.util.Set;

@Service
public class S3DocumentStorageService implements DocumentStorageService {

    private static final Logger log = LoggerFactory.getLogger(S3DocumentStorageService.class);

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/msword",
            "image/jpeg",
            "image/png",
            "image/webp"
    );

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final String bucketName;
    private final long maxFileSizeMb;

    public S3DocumentStorageService(
            S3Client s3Client,
            S3Presigner s3Presigner,
            @Value("${app.storage.s3.bucket:${AWS_S3_BUCKET:${S3_BUCKET:infiniteatsbucket}}}") String bucketName,
            @Value("${app.storage.s3.max-file-size-mb:${AWS_S3_MAX_FILE_SIZE_MB:20}}") long maxFileSizeMb) {
        this.s3Client = s3Client;
        this.s3Presigner = s3Presigner;
        this.bucketName = bucketName;
        this.maxFileSizeMb = maxFileSizeMb;
    }

    public String getBucketName() {
        return bucketName;
    }

    @Override
    public void upload(String key, byte[] bytes, String contentType, Map<String, String> metadata) {
        validateFileTypeAndSize(key, contentType, bytes);
        try {
            PutObjectRequest.Builder requestBuilder = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType(contentType != null ? contentType : "application/octet-stream")
                    .serverSideEncryption(ServerSideEncryption.AES256);

            if (metadata != null && !metadata.isEmpty()) {
                requestBuilder.metadata(metadata);
            }

            s3Client.putObject(requestBuilder.build(), RequestBody.fromBytes(bytes));
            log.info("Successfully uploaded object to S3: bucket={}, key={}, size={}", bucketName, key, bytes.length);
        } catch (Exception e) {
            log.error("Failed to upload object to S3: bucket={}, key={}", bucketName, key, e);
            throw new RuntimeException("S3 document upload failed: " + e.getMessage(), e);
        }
    }

    @Override
    public byte[] download(String key) {
        try {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            return s3Client.getObjectAsBytes(getObjectRequest).asByteArray();
        } catch (Exception e) {
            log.error("Failed to download object from S3: bucket={}, key={}", bucketName, key, e);
            throw new RuntimeException("S3 document download failed: " + e.getMessage(), e);
        }
    }

    @Override
    public String generatePresignedDownloadUrl(String key, String originalFilename, String contentType, int expirySeconds) {
        try {
            String safeFilename = originalFilename != null ? originalFilename.replaceAll("[\"\\\\\\r\\n]", "_") : "document.pdf";
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .responseContentDisposition("inline; filename=\"" + safeFilename + "\"")
                    .responseContentType(contentType != null ? contentType : "application/pdf")
                    .build();

            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofSeconds(expirySeconds > 0 ? expirySeconds : 300))
                    .getObjectRequest(getObjectRequest)
                    .build();

            return s3Presigner.presignGetObject(presignRequest).url().toString();
        } catch (Exception e) {
            log.warn("S3 presign failed, generating direct secure API download reference: {}", e.getMessage());
            return String.format("/api/v1/documents/stream?key=%s", key);
        }
    }

    @Override
    public String generatePresignedUploadUrl(String key, String contentType, int expirySeconds) {
        try {
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType(contentType != null ? contentType : "application/octet-stream")
                    .serverSideEncryption(ServerSideEncryption.AES256)
                    .build();

            PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofSeconds(expirySeconds > 0 ? expirySeconds : 300))
                    .putObjectRequest(putObjectRequest)
                    .build();

            return s3Presigner.presignPutObject(presignRequest).url().toString();
        } catch (Exception e) {
            log.error("Failed to generate presigned upload URL: {}", e.getMessage());
            throw new RuntimeException("Presigned upload URL generation failed: " + e.getMessage(), e);
        }
    }

    @Override
    public void delete(String key) {
        try {
            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();
            s3Client.deleteObject(deleteObjectRequest);
            log.info("Deleted S3 object: bucket={}, key={}", bucketName, key);
        } catch (Exception e) {
            log.error("Failed to delete S3 object: bucket={}, key={}", bucketName, key, e);
            throw new RuntimeException("S3 document deletion failed: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean exists(String key) {
        try {
            HeadObjectRequest headObjectRequest = HeadObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();
            s3Client.headObject(headObjectRequest);
            return true;
        } catch (NoSuchKeyException e) {
            return false;
        } catch (Exception e) {
            log.warn("HeadObject failed for key {}: {}", key, e.getMessage());
            return false;
        }
    }

    @Override
    public String calculateSha256(byte[] bytes) {
        if (bytes == null || bytes.length == 0) {
            return "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"; // Empty string hash
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(bytes);
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }

    @Override
    public void validateFileTypeAndSize(String originalFilename, String contentType, byte[] bytes) {
        if (bytes == null || bytes.length == 0) {
            throw new IllegalArgumentException("Document file is empty");
        }
        long maxBytes = maxFileSizeMb * 1024 * 1024;
        if (bytes.length > maxBytes) {
            throw new IllegalArgumentException(String.format("File size %d bytes exceeds limit of %d MB", bytes.length, maxFileSizeMb));
        }

        if (contentType != null && !contentType.trim().isEmpty() && !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Unsupported file format: " + contentType + ". Allowed: PDF, DOC, DOCX, PNG, JPG, WEBP");
        }

        // Magic number inspection
        if (bytes.length >= 4) {
            // PDF: %PDF (0x25, 0x50, 0x44, 0x46)
            boolean isPdf = bytes[0] == 0x25 && bytes[1] == 0x50 && bytes[2] == 0x44 && bytes[3] == 0x46;
            // ZIP/DOCX: PK (0x50, 0x4B)
            boolean isZip = bytes[0] == 0x50 && bytes[1] == 0x4B;
            // PNG: 0x89, 0x50, 0x4E, 0x47
            boolean isPng = bytes[0] == (byte) 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47;
            // JPEG: 0xFF, 0xD8, 0xFF
            boolean isJpeg = bytes[0] == (byte) 0xFF && bytes[1] == (byte) 0xD8 && bytes[2] == (byte) 0xFF;

            if (!isPdf && !isZip && !isPng && !isJpeg && (contentType != null && contentType.startsWith("application/pdf"))) {
                throw new IllegalArgumentException("File content signature does not match PDF structure");
            }
        }
    }
}
