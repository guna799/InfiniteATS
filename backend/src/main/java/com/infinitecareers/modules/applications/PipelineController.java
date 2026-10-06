package com.infinitecareers.modules.applications;

import com.infinitecareers.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/pipeline")
@Tag(name = "Pipeline Board", description = "Real-time recruitment pipeline board")
public class PipelineController {

    private final PipelineBoardService boardService;

    public PipelineController(PipelineBoardService boardService) {
        this.boardService = boardService;
    }

    public record StageView(String id, String label, boolean terminal) {
    }

    @GetMapping("/board")
    @Operation(summary = "Pipeline cards for the tenant, optionally for one requisition, plus the requisition filter list")
    public ResponseEntity<ApiResponse<Map<String, Object>>> board(@RequestParam(required = false) String requisitionId) {
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "cards", boardService.board(requisitionId),
                "requisitions", boardService.requisitions()
        )));
    }

    @GetMapping("/stages")
    @Operation(summary = "Canonical pipeline stages in board order")
    public ResponseEntity<ApiResponse<List<StageView>>> stages() {
        return ResponseEntity.ok(ApiResponse.success(Arrays.stream(PipelineStage.values())
                .map(s -> new StageView(s.name(), s.label(), s.isTerminal()))
                .toList()));
    }
}
