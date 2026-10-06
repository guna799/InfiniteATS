package com.infinitecareers.modules.applications;

import java.util.Arrays;

/** Canonical recruitment pipeline stages, in board order. Shared with the UI via GET /api/v1/pipeline/stages. */
public enum PipelineStage {
    APPLIED("Applied"),
    SCREENING("Screening"),
    PHONE_SCREEN("Phone Screen"),
    TECHNICAL_INTERVIEW("Technical Round"),
    HIRING_MANAGER_INTERVIEW("Manager Interview"),
    ONSITE_PANEL("Onsite / Panel"),
    EVALUATION("Evaluation / Debrief"),
    OFFER_EXTENDED("Offer Extended"),
    OFFER_ACCEPTED("Offer Accepted / Preboarding"),
    ONBOARDED("Hired & Active Employee"),
    REJECTED("Disqualified"),
    WITHDRAWN("Withdrawn");

    private final String label;

    PipelineStage(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }

    /** Closed outcomes; not shown as board columns. */
    public boolean isTerminal() {
        return this == REJECTED || this == WITHDRAWN;
    }

    public boolean requiresReason() {
        return this == REJECTED;
    }

    /** Application.status kept in sync with the stage. */
    public String applicationStatus() {
        return switch (this) {
            case REJECTED -> "REJECTED";
            case WITHDRAWN -> "WITHDRAWN";
            case ONBOARDED -> "HIRED";
            default -> "ACTIVE";
        };
    }

    public static PipelineStage parse(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Target stage is required");
        }
        return Arrays.stream(values())
                .filter(s -> s.name().equals(value.trim()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown pipeline stage: " + value));
    }
}
