package com.infinitecareers.modules.interviews;

import com.infinitecareers.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/interviews")
@Tag(name = "Interview Scheduling & Scorecards", description = "Interview lifecycle, candidate evaluations, and structured feedback scoring")
public class InterviewController {

    private final InterviewService interviewService;

    public InterviewController(InterviewService interviewService) {
        this.interviewService = interviewService;
    }

    @GetMapping
    @Operation(summary = "List interviews for the tenant or application")
    public ResponseEntity<ApiResponse<List<Interview>>> getInterviews(@RequestParam(required = false) String applicationId) {
        return ResponseEntity.ok(ApiResponse.success(interviewService.getInterviews(applicationId)));
    }

    @PostMapping
    @Operation(summary = "Schedule interview session")
    public ResponseEntity<ApiResponse<Interview>> scheduleInterview(@Valid @RequestBody Interview interview) {
        Interview scheduled = interviewService.scheduleInterview(interview);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(scheduled));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get interview session details")
    public ResponseEntity<ApiResponse<Interview>> getInterviewById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(interviewService.getInterviewById(id)));
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Update or reschedule interview")
    public ResponseEntity<ApiResponse<Interview>> updateInterview(@PathVariable String id, @RequestBody Interview updates) {
        return ResponseEntity.ok(ApiResponse.success(interviewService.updateInterview(id, updates)));
    }

    @PostMapping("/{id}/scorecard")
    @Operation(summary = "Submit structured evaluation scorecard for interview")
    public ResponseEntity<ApiResponse<InterviewScorecard>> submitScorecard(
            @PathVariable String id,
            @Valid @RequestBody InterviewScorecard scorecard) {
        return ResponseEntity.ok(ApiResponse.success(interviewService.submitScorecard(id, scorecard)));
    }

    @GetMapping("/{id}/scorecards")
    @Operation(summary = "List scorecards for interview")
    public ResponseEntity<ApiResponse<List<InterviewScorecard>>> getScorecards(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(interviewService.getScorecards(id)));
    }
}
