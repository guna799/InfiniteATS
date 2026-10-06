package com.infinitecareers.common;

public final class TenantContextHolder {

    private static final ThreadLocal<TenantContext> CONTEXT = new ThreadLocal<>();

    private TenantContextHolder() {}

    public static void setContext(TenantContext context) {
        CONTEXT.set(context);
    }

    public static TenantContext getContext() {
        return CONTEXT.get();
    }

    public static String getTenantId() {
        TenantContext ctx = CONTEXT.get();
        return ctx != null ? ctx.getTenantId() : "tenant-acme-tech"; // default fallback for testing/local
    }

    public static String getUserId() {
        TenantContext ctx = CONTEXT.get();
        return ctx != null ? ctx.getUserId() : null;
    }

    public static void clear() {
        CONTEXT.remove();
    }
}
