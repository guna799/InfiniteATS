package com.infinitecareers.modules.applications;

import java.time.Instant;

/** One application as shown on the pipeline board. Also the payload of stage-change responses. */
public record PipelineCard(
        String applicationId,
        String stage,
        long version,
        Integer rating,
        Instant appliedDate,
        Instant lastActivity,
        CandidateSummary candidate,
        RequisitionSummary requisition
) {
    public record CandidateSummary(String id, String name, String headline) {
    }

    public record RequisitionSummary(String id, String reqNumber, String title) {
    }
}
