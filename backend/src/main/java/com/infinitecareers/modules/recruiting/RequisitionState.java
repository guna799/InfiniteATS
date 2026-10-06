package com.infinitecareers.modules.recruiting;

public enum RequisitionState {
    DRAFT,
    PENDING_APPROVAL,
    APPROVED,
    REJECTED,
    OPEN,
    PAUSED,
    CLOSED,
    CANCELLED;

    public boolean canTransitionTo(RequisitionState target) {
        if (this == target) return true;
        switch (this) {
            case DRAFT:
                return target == PENDING_APPROVAL || target == CANCELLED;
            case PENDING_APPROVAL:
                return target == APPROVED || target == REJECTED || target == CANCELLED;
            case APPROVED:
                return target == OPEN || target == CANCELLED;
            case REJECTED:
                return target == DRAFT || target == CANCELLED;
            case OPEN:
                return target == PAUSED || target == CLOSED || target == CANCELLED;
            case PAUSED:
                return target == OPEN || target == CLOSED || target == CANCELLED;
            case CLOSED:
            case CANCELLED:
                return false; // Terminal states
            default:
                return false;
        }
    }
}
