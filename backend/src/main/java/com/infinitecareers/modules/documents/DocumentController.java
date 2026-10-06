package com.infinitecareers.modules.documents;

import com.infinitecareers.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/documents")
@Tag(name = "Document Storage & Verification", description = "S3-compatible secure object storage, candidate document verification, and signed download URLs")
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @GetMapping("/by-owner/{ownerId}")
    @Operation(summary = "List documents uploaded for candidate or employee")
    public ResponseEntity<ApiResponse<List<Document>>> getDocumentsForOwner(@PathVariable String ownerId) {
        return ResponseEntity.ok(ApiResponse.success(documentService.getDocumentsForOwner(ownerId)));
    }

    @GetMapping("/by-candidate/{candidateId}")
    @Operation(summary = "List documents uploaded for candidate")
    public ResponseEntity<ApiResponse<List<Document>>> getDocumentsByCandidate(@PathVariable String candidateId) {
        return ResponseEntity.ok(ApiResponse.success(documentService.getDocumentsByCandidate(candidateId)));
    }

    @GetMapping("/by-employee/{employeeId}")
    @Operation(summary = "List documents for employee")
    public ResponseEntity<ApiResponse<List<Document>>> getDocumentsByEmployee(@PathVariable String employeeId) {
        return ResponseEntity.ok(ApiResponse.success(documentService.getDocumentsByEmployee(employeeId)));
    }

    @GetMapping("/by-offer/{offerId}")
    @Operation(summary = "List documents for offer")
    public ResponseEntity<ApiResponse<List<Document>>> getDocumentsByOffer(@PathVariable String offerId) {
        return ResponseEntity.ok(ApiResponse.success(documentService.getDocumentsByOffer(offerId)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get document metadata by ID")
    public ResponseEntity<ApiResponse<Document>> getDocumentById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(documentService.getDocumentById(id)));
    }

    @PostMapping(value = "/upload", consumes = "multipart/form-data")
    @Operation(summary = "Upload candidate/employee document directly to S3")
    public ResponseEntity<ApiResponse<Document>> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "candidateId", required = false) String candidateId,
            @RequestParam(value = "employeeId", required = false) String employeeId,
            @RequestParam(value = "applicationId", required = false) String applicationId,
            @RequestParam(value = "offerId", required = false) String offerId,
            @RequestParam(value = "onboardingId", required = false) String onboardingId,
            @RequestParam("documentType") String documentType,
            @RequestParam("documentCategory") String documentCategory) throws IOException {

        Document doc = documentService.uploadDocument(
                candidateId,
                employeeId,
                applicationId,
                offerId,
                onboardingId,
                documentType,
                documentCategory,
                file.getOriginalFilename(),
                file.getContentType(),
                file.getBytes()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(doc));
    }

    @PostMapping("/{id}/verify")
    @Operation(summary = "Verify candidate document (HR Ops)")
    public ResponseEntity<ApiResponse<Document>> verifyDocument(@PathVariable String id) {
        Document doc = documentService.verifyDocument(id);
        return ResponseEntity.ok(ApiResponse.success(doc));
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "Reject candidate document with mandatory feedback note")
    public ResponseEntity<ApiResponse<Document>> rejectDocument(
            @PathVariable String id,
            @RequestBody Map<String, String> payload) {
        String reason = payload.get("rejectionReason");
        if (reason == null || reason.trim().isEmpty()) {
            reason = payload.get("reason");
        }
        Document doc = documentService.rejectDocument(id, reason);
        return ResponseEntity.ok(ApiResponse.success(doc));
    }

    @GetMapping("/{id}/download")
    @Operation(summary = "Generate short-lived presigned S3 download URL")
    public ResponseEntity<ApiResponse<Map<String, String>>> getSignedDownloadUrl(
            @PathVariable String id,
            @RequestParam(value = "expirySeconds", defaultValue = "300") int expirySeconds) {
        String signedUrl = documentService.generatePresignedDownloadUrl(id, expirySeconds);
        return ResponseEntity.ok(ApiResponse.success(Map.of("url", signedUrl)));
    }

    @GetMapping("/health")
    @Operation(summary = "Document storage and S3 health inspection")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStorageHealth() {
        return ResponseEntity.ok(ApiResponse.success(documentService.checkStorageHealth()));
    }
}
