-- =========================================================================
-- V3: ENTERPRISE RELIABILITY LAYER
-- Outbox, Idempotency, Real-Time Notifications, Workflows, Distributed State
-- =========================================================================

-- 1. TRANSACTIONAL OUTBOX EVENTS
CREATE TABLE IF NOT EXISTS outbox_events (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    event_type VARCHAR(128) NOT NULL,
    aggregate_type VARCHAR(64) NOT NULL,
    aggregate_id VARCHAR(64) NOT NULL,
    payload_json TEXT NOT NULL,
    headers_json TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    retry_count INT NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_outbox_pending ON outbox_events(status, created_at);
CREATE INDEX IF NOT EXISTS idx_outbox_tenant ON outbox_events(tenant_id, created_at);

-- 2. IDEMPOTENCY KEYS
CREATE TABLE IF NOT EXISTS idempotency_keys (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    idempotency_key VARCHAR(256) NOT NULL,
    request_hash VARCHAR(64) NOT NULL,
    resource_path VARCHAR(256) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'IN_FLIGHT',
    response_status INT,
    response_body TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uq_tenant_idempotency_key UNIQUE (tenant_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_idempotency_lookup ON idempotency_keys(tenant_id, idempotency_key);
CREATE INDEX IF NOT EXISTS idx_idempotency_expires ON idempotency_keys(expires_at);

-- 3. NOTIFICATION TEMPLATES & DELIVERIES (Multi-Channel Matrix)
CREATE TABLE IF NOT EXISTS notification_templates (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64),
    event_type VARCHAR(128) NOT NULL,
    channel VARCHAR(32) NOT NULL, -- IN_APP, EMAIL, SMS, PUSH, WEBHOOK
    subject_template TEXT,
    body_template TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_deliveries (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    event_type VARCHAR(128) NOT NULL,
    channel VARCHAR(32) NOT NULL,
    recipient_identifier VARCHAR(256) NOT NULL, -- user_id, email, phone, or webhook url
    payload_json TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'QUEUED', -- QUEUED, SENDING, SENT, FAILED, RETRYING
    attempt_count INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 5,
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_notif_delivery_status ON notification_deliveries(status, created_at);
CREATE INDEX IF NOT EXISTS idx_notif_delivery_tenant ON notification_deliveries(tenant_id, created_at);

-- 4. DURABLE WORKFLOW EXECUTIONS & STEP STATE TRACING
CREATE TABLE IF NOT EXISTS workflow_instances (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    definition_id VARCHAR(64) NOT NULL,
    trigger_event VARCHAR(128) NOT NULL,
    aggregate_id VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'RUNNING', -- RUNNING, COMPLETED, FAILED, WAITING_APPROVAL, COMPENSATING
    current_step VARCHAR(64) NOT NULL,
    context_data TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workflow_step_executions (
    id VARCHAR(64) PRIMARY KEY,
    workflow_instance_id VARCHAR(64) NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
    step_name VARCHAR(128) NOT NULL,
    step_type VARCHAR(32) NOT NULL, -- ACTION, CONDITION, APPROVAL, WAIT, COMPENSATION
    status VARCHAR(32) NOT NULL, -- SUCCESS, FAILED, PENDING, SKIPPED
    input_payload TEXT,
    output_payload TEXT,
    error_message TEXT,
    duration_ms BIGINT,
    executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. FEATURE FLAGS
CREATE TABLE IF NOT EXISTS feature_flags (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64), -- NULL means global flag
    flag_key VARCHAR(128) NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    rollout_percentage INT DEFAULT 100,
    target_roles TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_feature_flag_tenant UNIQUE (tenant_id, flag_key)
);
