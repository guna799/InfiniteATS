package com.infinitecareers.modules.candidates;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CandidateRepository extends JpaRepository<Candidate, String> {
    List<Candidate> findByTenantId(String tenantId);
    Page<Candidate> findByTenantId(String tenantId, Pageable pageable);
    Optional<Candidate> findByIdAndTenantId(String id, String tenantId);
    Optional<Candidate> findByTenantIdAndEmail(String tenantId, String email);
    
    @Query("SELECT c FROM Candidate c WHERE c.tenantId = :tenantId AND " +
           "(LOWER(c.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(c.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(c.email) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(c.headline) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Candidate> searchCandidates(@Param("tenantId") String tenantId, @Param("query") String query, Pageable pageable);
}
