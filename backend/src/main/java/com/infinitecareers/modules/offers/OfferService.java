package com.infinitecareers.modules.offers;

import com.infinitecareers.common.TenantContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class OfferService {

    private final OfferRepository offerRepository;

    public OfferService(OfferRepository offerRepository) {
        this.offerRepository = offerRepository;
    }

    public List<Offer> getAllOffers() {
        return offerRepository.findByTenantId(TenantContextHolder.getTenantId());
    }

    public Offer getOfferById(String id) {
        return offerRepository.findByIdAndTenantId(id, TenantContextHolder.getTenantId())
                .orElseThrow(() -> new NoSuchElementException("Offer not found: " + id));
    }

    public Offer getOfferByApplicationId(String applicationId) {
        return offerRepository.findByTenantIdAndApplicationId(TenantContextHolder.getTenantId(), applicationId)
                .orElseThrow(() -> new NoSuchElementException("Offer not found for application: " + applicationId));
    }

    @Transactional
    public Offer createOffer(Offer offer) {
        offer.setTenantId(TenantContextHolder.getTenantId());
        offer.setStatus(OfferState.DRAFT);
        offer.setCreatedBy(TenantContextHolder.getUserId());
        return offerRepository.save(offer);
    }

    @Transactional
    public Offer submitForApproval(String id) {
        Offer offer = getOfferById(id);
        transition(offer, OfferState.PENDING_APPROVAL);
        return offerRepository.save(offer);
    }

    @Transactional
    public Offer approve(String id) {
        Offer offer = getOfferById(id);
        transition(offer, OfferState.APPROVED);
        return offerRepository.save(offer);
    }

    @Transactional
    public Offer sendOffer(String id) {
        Offer offer = getOfferById(id);
        transition(offer, OfferState.SENT);
        return offerRepository.save(offer);
    }

    @Transactional
    public Offer acceptOffer(String id, String signatureUrl) {
        Offer offer = getOfferById(id);
        transition(offer, OfferState.ACCEPTED);
        offer.setSignedDocumentUrl(signatureUrl);
        offer.setSignedAt(Instant.now());
        return offerRepository.save(offer);
    }

    @Transactional
    public Offer rejectOffer(String id) {
        Offer offer = getOfferById(id);
        transition(offer, OfferState.REJECTED);
        return offerRepository.save(offer);
    }

    @Transactional
    public Offer withdrawOffer(String id) {
        Offer offer = getOfferById(id);
        transition(offer, OfferState.WITHDRAWN);
        return offerRepository.save(offer);
    }

    private void transition(Offer offer, OfferState target) {
        if (!offer.getStatus().canTransitionTo(target)) {
            throw new IllegalStateException(String.format(
                    "Invalid state transition from %s to %s for Offer %s",
                    offer.getStatus(), target, offer.getId()
            ));
        }
        offer.setStatus(target);
    }
}
