package com.infinitecareers.modules.documents;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentRepository extends JpaRepository<Document, String> {

    Optional<Document> findByIdAndTenantId(String id, String tenantId);

    List<Document> findByTenantIdAndOwnerId(String tenantId, String ownerId);

    List<Document> findByTenantIdAndCandidateId(String tenantId, String candidateId);

    List<Document> findByTenantIdAndEmployeeId(String tenantId, String employeeId);

    List<Document> findByTenantIdAndApplicationId(String tenantId, String applicationId);

    List<Document> findByTenantIdAndOfferId(String tenantId, String offerId);

    List<Document> findByTenantIdAndOnboardingId(String tenantId, String onboardingId);

    List<Document> findByTenantIdAndStatus(String tenantId, String status);

    long countByTenantIdAndStatus(String tenantId, String status);
}
