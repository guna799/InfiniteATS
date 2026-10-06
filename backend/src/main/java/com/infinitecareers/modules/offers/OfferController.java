package com.infinitecareers.modules.offers;

import com.infinitecareers.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/offers")
@Tag(name = "Offer Management & Compensation", description = "Candidate offer generation, multi-tier compensation approvals, and digital e-signatures")
public class OfferController {

    private final OfferService offerService;
    private final OfferLetterService offerLetterService;

    public OfferController(OfferService offerService, OfferLetterService offerLetterService) {
        this.offerService = offerService;
        this.offerLetterService = offerLetterService;
    }

    @PostMapping("/{id}/generate-document")
    @Operation(summary = "Generate official offer letter PDF, compute SHA-256 hash, and store in S3")
    public ResponseEntity<ApiResponse<com.infinitecareers.modules.documents.Document>> generateOfferDocument(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, Object> contextualDetails) {
        com.infinitecareers.modules.documents.Document doc = offerLetterService.generateAndStoreOfferLetter(id, contextualDetails);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(doc));
    }

    @GetMapping
    @Operation(summary = "List all offers for current tenant")
    public ResponseEntity<ApiResponse<List<Offer>>> getOffers() {
        return ResponseEntity.ok(ApiResponse.success(offerService.getAllOffers()));
    }

    @PostMapping
    @Operation(summary = "Draft new candidate offer package")
    public ResponseEntity<ApiResponse<Offer>> createOffer(@Valid @RequestBody Offer offer) {
        Offer created = offerService.createOffer(offer);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(created));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get offer details")
    public ResponseEntity<ApiResponse<Offer>> getOfferById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(offerService.getOfferById(id)));
    }

    @GetMapping("/by-application/{applicationId}")
    @Operation(summary = "Get offer by application ID")
    public ResponseEntity<ApiResponse<Offer>> getOfferByApplicationId(@PathVariable String applicationId) {
        return ResponseEntity.ok(ApiResponse.success(offerService.getOfferByApplicationId(applicationId)));
    }

    @PostMapping("/{id}/submit")
    @Operation(summary = "Submit offer for compensation and leadership approval")
    public ResponseEntity<ApiResponse<Offer>> submitForApproval(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(offerService.submitForApproval(id)));
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "Approve compensation and offer terms")
    public ResponseEntity<ApiResponse<Offer>> approve(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(offerService.approve(id)));
    }

    @PostMapping("/{id}/send")
    @Operation(summary = "Send approved offer to candidate portal")
    public ResponseEntity<ApiResponse<Offer>> sendOffer(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(offerService.sendOffer(id)));
    }

    @PostMapping("/{id}/accept")
    @Operation(summary = "Candidate executes digital e-signature and accepts offer")
    public ResponseEntity<ApiResponse<Offer>> acceptOffer(@PathVariable String id, @RequestBody Map<String, String> payload) {
        String signatureUrl = payload.get("signatureUrl");
        return ResponseEntity.ok(ApiResponse.success(offerService.acceptOffer(id, signatureUrl)));
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "Candidate declines offer")
    public ResponseEntity<ApiResponse<Offer>> rejectOffer(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(offerService.rejectOffer(id)));
    }
}
