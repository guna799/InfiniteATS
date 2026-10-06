package com.infinitecareers.modules.documents;

import java.util.Map;

public interface DocumentStorageService {

    void upload(String key, byte[] bytes, String contentType, Map<String, String> metadata);

    byte[] download(String key);

    String generatePresignedDownloadUrl(String key, String originalFilename, String contentType, int expirySeconds);

    String generatePresignedUploadUrl(String key, String contentType, int expirySeconds);

    void delete(String key);

    boolean exists(String key);

    String calculateSha256(byte[] bytes);

    void validateFileTypeAndSize(String originalFilename, String contentType, byte[] bytes);
}
