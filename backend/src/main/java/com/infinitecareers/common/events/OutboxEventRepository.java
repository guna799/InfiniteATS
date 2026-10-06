package com.infinitecareers.common.events;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Repository
public interface OutboxEventRepository extends JpaRepository<OutboxEvent, String> {

    @Query("SELECT e FROM OutboxEvent e WHERE e.status = 'PENDING' ORDER BY e.createdAt ASC")
    List<OutboxEvent> findPendingEvents(Pageable pageable);

    @Query("SELECT e FROM OutboxEvent e WHERE e.status = 'FAILED' AND e.retryCount < 5 ORDER BY e.createdAt ASC")
    List<OutboxEvent> findRetryableEvents(Pageable pageable);

    /** Atomically takes ownership of one event; returns 1 only for the single replica that wins. */
    @Modifying
    @Transactional
    @Query("UPDATE OutboxEvent e SET e.status = 'PROCESSING', e.claimedAt = :now WHERE e.id = :id AND e.status = 'PENDING'")
    int claim(@Param("id") String id, @Param("now") Instant now);

    @Modifying
    @Transactional
    @Query("UPDATE OutboxEvent e SET e.status = 'PUBLISHED', e.publishedAt = :now, e.errorMessage = null WHERE e.id = :id")
    int markPublished(@Param("id") String id, @Param("now") Instant now);

    @Modifying
    @Transactional
    @Query("UPDATE OutboxEvent e SET e.retryCount = e.retryCount + 1, e.errorMessage = :error, " +
           "e.status = CASE WHEN e.retryCount + 1 >= :maxRetries THEN 'FAILED' ELSE 'PENDING' END WHERE e.id = :id")
    int markAttemptFailed(@Param("id") String id, @Param("error") String error, @Param("maxRetries") int maxRetries);

    /** Returns events stuck in PROCESSING (e.g. the claiming pod died) to the queue. */
    @Modifying
    @Transactional
    @Query("UPDATE OutboxEvent e SET e.status = 'PENDING' WHERE e.status = 'PROCESSING' AND e.claimedAt < :cutoff")
    int releaseStaleClaims(@Param("cutoff") Instant cutoff);
}
