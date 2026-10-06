package com.infinitecareers.modules.offers;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OfferComponentRepository extends JpaRepository<OfferComponent, String> {
    List<OfferComponent> findByOfferId(String offerId);
}
