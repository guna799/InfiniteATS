package com.infinitecareers.common.idempotency;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

@Service
public class IdempotencyService {

    private final IdempotencyRepository repository;
    private static final Duration DEFAULT_TTL = Duration.ofHours(24);

    public IdempotencyService(IdempotencyRepository repository) {
        this.repository = repository;
    }

    public String computePayloadHash(String payload) {
        if (payload == null) return "";
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(payload.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    @Transactional
    public Optional<IdempotencyKey> checkAndStart(String tenantId, String key, String requestHash, String path) {
        Optional<IdempotencyKey> existing = repository.findByTenantIdAndIdempotencyKey(tenantId, key);
        if (existing.isPresent()) {
            return existing;
        }

        IdempotencyKey newRecord = new IdempotencyKey(
                UUID.randomUUID().toString(),
                tenantId,
                key,
                requestHash,
                path,
                Instant.now().plus(DEFAULT_TTL)
        );
        repository.save(newRecord);
        return Optional.empty();
    }

    @Transactional
    public void recordResponse(String tenantId, String key, int statusCode, String responseBody) {
        repository.findByTenantIdAndIdempotencyKey(tenantId, key).ifPresent(record -> {
            record.setStatus(statusCode >= 200 && statusCode < 400 ? "COMPLETED" : "FAILED");
            record.setResponseStatus(statusCode);
            record.setResponseBody(responseBody);
            repository.save(record);
        });
    }
}
