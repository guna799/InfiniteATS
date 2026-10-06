package com.infinitecareers.modules.search;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SearchIndexRepository extends JpaRepository<SearchIndexState, String> {
    Optional<SearchIndexState> findByTenantIdAndEntityTypeAndEntityId(String tenantId, String entityType, String entityId);
    List<SearchIndexState> findByStatus(String status);
    long countByTenantIdAndStatus(String tenantId, String status);
}
