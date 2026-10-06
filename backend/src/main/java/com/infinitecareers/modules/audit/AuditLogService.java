package com.infinitecareers.modules.audit;

import com.infinitecareers.common.TenantContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AuditLogService {

    public static final String GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";
    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper canonicalMapper;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
        this.canonicalMapper = new ObjectMapper();
        this.canonicalMapper.configure(SerializationFeature.ORDER_MAP_ENTRIES_BY_KEYS, true);
    }

    public Page<AuditLog> getAuditLogs(Pageable pageable) {
        return auditLogRepository.findByTenantIdOrderByCreatedAtDesc(TenantContextHolder.getTenantId(), pageable);
    }

    public List<AuditLog> getResourceAuditTrail(String resourceType, String resourceId) {
        return auditLogRepository.findByTenantIdAndResourceTypeAndResourceId(
                TenantContextHolder.getTenantId(), resourceType, resourceId
        );
    }

    @Transactional
    public AuditLog record(String action, String resourceType, String resourceId, String beforeState, String afterState) {
        String tenantId = TenantContextHolder.getTenantId();
        String actorId = TenantContextHolder.getUserId() != null ? TenantContextHolder.getUserId() : "system";
        String actorEmail = TenantContextHolder.getContext() != null ? TenantContextHolder.getContext().getUserEmail() : "system@infinitecareers.com";

        // 1. Fetch latest record for tenant to chain from
        Optional<AuditLog> latest = auditLogRepository.findFirstByTenantIdAndSequenceNumberIsNotNullOrderBySequenceNumberDesc(tenantId);
        String prevHash = latest.map(AuditLog::getHash).orElse(GENESIS_HASH);
        long nextSequence = latest.map(l -> l.getSequenceNumber() != null ? l.getSequenceNumber() + 1 : 1L).orElse(1L);

        // 2. Normalize canonical JSON representations
        String canonicalBefore = canonicalizeJson(beforeState);
        String canonicalAfter = canonicalizeJson(afterState);

        // 3. Compute SHA-256 Hash with sequence number
        String dataToHash = String.format("%d|%s|%s|%s|%s|%s|%s|%s|%s",
                nextSequence, prevHash, tenantId, actorId, action, resourceType, resourceId,
                canonicalBefore, canonicalAfter
        );
        String currentHash = computeSha256(dataToHash);

        AuditLog log = new AuditLog();
        log.setTenantId(tenantId);
        log.setActorId(actorId);
        log.setActorEmail(actorEmail);
        log.setAction(action);
        log.setResourceType(resourceType);
        log.setResourceId(resourceId);
        log.setBeforeState(beforeState);
        log.setAfterState(afterState);
        log.setIpAddress("127.0.0.1");
        log.setSequenceNumber(nextSequence);
        log.setPreviousHash(prevHash);
        log.setHash(currentHash);

        return auditLogRepository.save(log);
    }

    public Map<String, Object> verifyChain(String tenantId) {
        if (tenantId == null) {
            throw new IllegalStateException("No tenant context for audit chain verification");
        }
        List<AuditLog> chain = auditLogRepository.findByTenantIdAndSequenceNumberIsNotNullOrderBySequenceNumberAsc(tenantId);
        // Records written before the tamper-evident chain was introduced carry no sequence/hash;
        // they are reported, not verified.
        long legacyUnchained = auditLogRepository.countByTenantIdAndSequenceNumberIsNull(tenantId);
        if (chain.isEmpty()) {
            return result(true, "EMPTY_CHAIN", legacyUnchained, "recordsVerified", 0);
        }

        String expectedPrevHash = GENESIS_HASH;
        long expectedSequence = 1L;

        for (int i = 0; i < chain.size(); i++) {
            AuditLog item = chain.get(i);

            // Verify Monotonic Sequence Integrity (detects historical deletion or insertion)
            if (item.getSequenceNumber() != expectedSequence) {
                return result(false, "SEQUENCE_GAP_OR_INSERTION_DETECTED", legacyUnchained,
                        "tamperedRecordId", item.getId(),
                        "expectedSequence", expectedSequence,
                        "actualSequence", item.getSequenceNumber(),
                        "index", i);
            }

            // Verify Link to Previous Hash
            if (!expectedPrevHash.equals(item.getPreviousHash())) {
                return result(false, "TAMPERED_PREVIOUS_LINK", legacyUnchained,
                        "tamperedRecordId", item.getId(),
                        "expectedPreviousHash", expectedPrevHash,
                        "actualPreviousHash", item.getPreviousHash(),
                        "index", i);
            }

            // Verify Canonical Content Hash
            String canonicalBefore = canonicalizeJson(item.getBeforeState());
            String canonicalAfter = canonicalizeJson(item.getAfterState());
            String dataToHash = String.format("%d|%s|%s|%s|%s|%s|%s|%s|%s",
                    item.getSequenceNumber(), item.getPreviousHash(), item.getTenantId(), item.getActorId(),
                    item.getAction(), item.getResourceType(), item.getResourceId(),
                    canonicalBefore, canonicalAfter
            );
            String calculatedHash = computeSha256(dataToHash);
            if (!calculatedHash.equals(item.getHash())) {
                return result(false, "TAMPERED_CONTENT_HASH", legacyUnchained,
                        "tamperedRecordId", item.getId(),
                        "expectedHash", calculatedHash,
                        "storedHash", item.getHash(),
                        "index", i);
            }

            expectedPrevHash = item.getHash();
            expectedSequence++;
        }

        return result(true, "VERIFIED_VALID", legacyUnchained,
                "recordsVerified", chain.size(),
                "headHash", expectedPrevHash,
                "lastSequence", expectedSequence - 1);
    }

    // Map.of rejects null values, and tampered records can legitimately have null fields.
    private static Map<String, Object> result(boolean valid, String status, long legacyUnchained, Object... kv) {
        Map<String, Object> out = new java.util.LinkedHashMap<>();
        out.put("valid", valid);
        out.put("status", status);
        for (int i = 0; i < kv.length; i += 2) {
            out.put((String) kv[i], kv[i + 1]);
        }
        out.put("legacyUnchainedRecords", legacyUnchained);
        return out;
    }

    private String canonicalizeJson(String json) {
        if (json == null || json.trim().isEmpty()) return "";
        try {
            Object obj = canonicalMapper.readValue(json, Object.class);
            return canonicalMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return json.trim();
        }
    }

    private String computeSha256(String data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm unavailable", e);
        }
    }
}
