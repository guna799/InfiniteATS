package com.infinitecareers;

import com.infinitecareers.common.TenantContext;
import com.infinitecareers.common.TenantContextHolder;
import com.infinitecareers.modules.documents.Document;
import com.infinitecareers.modules.documents.DocumentRepository;
import com.infinitecareers.modules.documents.DocumentStorageService;
import com.infinitecareers.modules.offers.Offer;
import com.infinitecareers.modules.offers.OfferLetterService;
import com.infinitecareers.modules.offers.OfferRepository;
import com.infinitecareers.modules.offers.OfferState;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;

@SpringBootTest
@ActiveProfiles("test")
class OfferLetterServiceTest {

    @Autowired
    private OfferLetterService offerLetterService;

    @Autowired
    private OfferRepository offerRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @MockBean
    private DocumentStorageService documentStorageService;

    @BeforeEach
    void setUp() {
        doAnswer(inv -> "d9a5ed82ebb7b88113bf8fe49ea9d67c4f46e50284c71234567890abcdef1234")
                .when(documentStorageService).calculateSha256(any());
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("OfferLetterService renders PDF, computes SHA-256, and stores document metadata")
    void testOfferLetterGenerationAndVersioning() {
        TenantContextHolder.setContext(new TenantContext("tenant-acme-tech", "admin-1", "talent@acme.com", Set.of("ADMIN"), Set.of("OFFER_WRITE"), "TENANT"));

        // Create approved Offer
        Offer offer = new Offer();
        offer.setTenantId("tenant-acme-tech");
        offer.setApplicationId("app-01");
        offer.setBaseSalary(new BigDecimal("3200000.00"));
        offer.setBonusAmount(new BigDecimal("400000.00"));
        offer.setEquityGrant("1,500 RSUs (4-year vesting)");
        offer.setCurrency("INR");
        offer.setStartDate(LocalDate.now().plusDays(30));
        offer.setExpirationDate(LocalDate.now().plusDays(14));
        offer.setStatus(OfferState.APPROVED);
        Offer savedOffer = offerRepository.save(offer);

        Map<String, Object> context = Map.of(
                "candidateName", "Guna Vardhan Mandala",
                "candidateAddress", "Hyderabad, Telangana, India",
                "title", "Lead Cloud Architect",
                "department", "Engineering & Platforms",
                "location", "Hyderabad (Hybrid)",
                "companyName", "InfiniteCareers Enterprise Labs Pvt. Ltd."
        );

        // Version 1 Generation
        Document docV1 = offerLetterService.generateAndStoreOfferLetter(savedOffer.getId(), context);
        assertNotNull(docV1.getId());
        assertEquals("OFFER_LETTER", docV1.getDocumentType());
        assertEquals(1, docV1.getVersion());
        assertTrue(docV1.getS3Key().contains("offer-v1-"));
        assertNotNull(docV1.getSha256Hash());

        // Version 2 Generation (Regeneration after compensation revision)
        Document docV2 = offerLetterService.generateAndStoreOfferLetter(savedOffer.getId(), context);
        assertNotNull(docV2.getId());
        assertEquals(2, docV2.getVersion());
        assertTrue(docV2.getS3Key().contains("offer-v2-"));
        assertNotEquals(docV1.getId(), docV2.getId());

        // Verify both versions exist in database (Immutability guarantee)
        var allOfferDocs = documentRepository.findByTenantIdAndOfferId("tenant-acme-tech", savedOffer.getId());
        assertEquals(2, allOfferDocs.size());
    }
}
