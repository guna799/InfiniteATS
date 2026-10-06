package com.infinitecareers.modules.offers;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OfferRepository extends JpaRepository<Offer, String> {
    List<Offer> findByTenantId(String tenantId);
    Optional<Offer> findByIdAndTenantId(String id, String tenantId);
    Optional<Offer> findByTenantIdAndApplicationId(String tenantId, String applicationId);
}
