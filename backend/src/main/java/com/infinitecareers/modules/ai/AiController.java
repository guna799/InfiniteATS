package com.infinitecareers.modules.ai;

import com.infinitecareers.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/ai")
@Tag(name = "Assistive AI Intelligence", description = "Resume parsing, candidate-job matching, JD generation, and interview question generation")
public class AiController {

    private final AiService aiService;
    private final AiGatewayService aiGatewayService;

    public AiController(AiService aiService, AiGatewayService aiGatewayService) {
        this.aiService = aiService;
        this.aiGatewayService = aiGatewayService;
    }

    @PostMapping("/match-candidate")
    @Operation(summary = "Calculate candidate fit with explainability audit record and PII redaction")
    public ResponseEntity<ApiResponse<AiRecommendationAudit>> matchCandidate(@RequestBody Map<String, Object> payload) {
        String candidateId = (String) payload.get("candidateId");
        String jobId = (String) payload.get("jobId");
        @SuppressWarnings("unchecked")
        Map<String, Object> candidateData = (Map<String, Object>) payload.getOrDefault("candidateData", Map.of());
        @SuppressWarnings("unchecked")
        Map<String, Object> jobRequirements = (Map<String, Object>) payload.getOrDefault("jobRequirements", Map.of());

        AiRecommendationAudit audit = aiGatewayService.matchCandidateWithExplainability(candidateId, jobId, candidateData, jobRequirements);
        return ResponseEntity.ok(ApiResponse.success(audit));
    }

    @GetMapping("/quotas")
    @Operation(summary = "Get AI token consumption and quota overview for current tenant")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getQuotas() {
        String tenantId = com.infinitecareers.common.TenantContextHolder.getTenantId();
        return ResponseEntity.ok(ApiResponse.success(aiGatewayService.getTenantQuotaOverview(tenantId)));
    }

    @PostMapping("/parse-resume")
    @Operation(summary = "Extract structured entities and skills from resume text")
    public ResponseEntity<ApiResponse<Map<String, Object>>> parseResume(@RequestBody Map<String, String> payload) {
        String text = payload.getOrDefault("rawText", "");
        return ResponseEntity.ok(ApiResponse.success(aiService.parseResume(text)));
    }

    @GetMapping("/match-score")
    @Operation(summary = "Calculate candidate-to-requisition semantic fit score with explainable rationale")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMatchScore(
            @RequestParam String candidateId,
            @RequestParam String requisitionId) {
        return ResponseEntity.ok(ApiResponse.success(aiService.calculateMatchScore(candidateId, requisitionId)));
    }

    @PostMapping("/generate-job-description")
    @Operation(summary = "Generate job description and requirements draft")
    public ResponseEntity<ApiResponse<Map<String, Object>>> generateJobDescription(@RequestBody Map<String, Object> payload) {
        String jobTitle = (String) payload.getOrDefault("jobTitle", "Software Engineer");
        String department = (String) payload.getOrDefault("department", "Engineering");
        String level = (String) payload.getOrDefault("level", "Senior");
        @SuppressWarnings("unchecked")
        List<String> keyReqs = (List<String>) payload.getOrDefault("keyRequirements", List.of());

        return ResponseEntity.ok(ApiResponse.success(aiService.generateJobDescription(jobTitle, department, level, keyReqs)));
    }

    @PostMapping("/interview-questions")
    @Operation(summary = "Generate targeted interview questions and scoring criteria")
    public ResponseEntity<ApiResponse<Map<String, Object>>> generateInterviewQuestions(@RequestBody Map<String, String> payload) {
        String jobTitle = payload.getOrDefault("jobTitle", "Backend Engineer");
        String topic = payload.getOrDefault("topic", "System Design");
        return ResponseEntity.ok(ApiResponse.success(aiService.generateInterviewQuestions(jobTitle, topic)));
    }
}
