package com.infinitecareers.common;

/**
 * The client acted on an outdated copy of a record (another user changed it first). Mapped to HTTP 409 with
 * the current state so the UI can reconcile without a reload.
 */
public class StaleStateException extends RuntimeException {

    private final transient Object current;

    public StaleStateException(String message, Object current) {
        super(message);
        this.current = current;
    }

    public Object getCurrent() {
        return current;
    }
}
