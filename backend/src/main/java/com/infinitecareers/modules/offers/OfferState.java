package com.infinitecareers.modules.offers;

public enum OfferState {
    DRAFT,
    PENDING_APPROVAL,
    APPROVED,
    SENT,
    VIEWED,
    ACCEPTED,
    REJECTED,
    EXPIRED,
    WITHDRAWN;

    public boolean canTransitionTo(OfferState target) {
        if (this == target) return true;
        switch (this) {
            case DRAFT:
                return target == PENDING_APPROVAL || target == WITHDRAWN;
            case PENDING_APPROVAL:
                return target == APPROVED || target == REJECTED || target == WITHDRAWN;
            case APPROVED:
                return target == SENT || target == WITHDRAWN;
            case SENT:
                return target == VIEWED || target == ACCEPTED || target == REJECTED || target == EXPIRED || target == WITHDRAWN;
            case VIEWED:
                return target == ACCEPTED || target == REJECTED || target == EXPIRED || target == WITHDRAWN;
            case ACCEPTED:
            case REJECTED:
            case EXPIRED:
            case WITHDRAWN:
                return false; // Terminal states
            default:
                return false;
        }
    }
}
