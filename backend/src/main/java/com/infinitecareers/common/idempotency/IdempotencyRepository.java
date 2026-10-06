package com.infinitecareers.common.idempotency;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface IdempotencyRepository extends JpaRepository<IdempotencyKey, String> {

    Optional<IdempotencyKey> findByTenantIdAndIdempotencyKey(String tenantId, String idempotencyKey);

    @Modifying
    @Query("DELETE FROM IdempotencyKey k WHERE k.expiresAt < :now")
    int deleteExpiredKeys(Instant now);
}
