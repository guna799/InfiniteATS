package com.infinitecareers.modules.documents;

import com.infinitecareers.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/documents")
@Tag(name = "Document Storage & Signed URLs", description = "S3-compatible secure object storage, resume vaults, and temporary signed download URLs")
public class DocumentController {

    private final StorageService storageService;

    public DocumentController(StorageService storageService) {
        this.storageService = storageService;
    }

    @GetMapping("/by-owner/{ownerId}")
    @Operation(summary = "List documents uploaded for candidate or employee")
    public ResponseEntity<ApiResponse<List<Document>>> getDocumentsForOwner(@PathVariable String ownerId) {
        return ResponseEntity.ok(ApiResponse.success(storageService.getDocumentsForOwner(ownerId)));
    }

    @PostMapping("/register")
    @Operation(summary = "Register uploaded document metadata")
    public ResponseEntity<ApiResponse<Document>> registerDocument(@RequestBody Map<String, Object> payload) {
        String ownerId = (String) payload.get("ownerId");
        String category = (String) payload.get("category");
        String filename = (String) payload.get("filename");
        String mimeType = (String) payload.get("mimeType");
        long fileSize = ((Number) payload.getOrDefault("fileSize", 1024L)).longValue();

        Document doc = storageService.registerDocument(ownerId, category, filename, mimeType, fileSize);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(doc));
    }

    @GetMapping("/{id}/signed-url")
    @Operation(summary = "Generate temporary time-limited pre-signed download URL")
    public ResponseEntity<ApiResponse<Map<String, String>>> getSignedDownloadUrl(@PathVariable String id) {
        String signedUrl = storageService.generatePresignedDownloadUrl(id);
        return ResponseEntity.ok(ApiResponse.success(Map.of("url", signedUrl)));
    }
}
