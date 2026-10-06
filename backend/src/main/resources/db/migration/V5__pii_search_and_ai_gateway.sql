-- =========================================================================
-- V5: PII PROTECTION, SEARCH CONSISTENCY & ENTERPRISE AI GATEWAY
-- Field Classification, OpenSearch Sync State, Token Metering & Explainability
-- =========================================================================

-- 1. SEARCH CONSISTENCY & OUTBOX INDEX STATE TRACKING
CREATE TABLE IF NOT EXISTS search_index_states (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    event_id VARCHAR(64) NOT NULL,
    entity_type VARCHAR(64) NOT NULL, -- CANDIDATE, JOB_REQUISITION, EMPLOYEE
    entity_id VARCHAR(64) NOT NULL,
    entity_version INT NOT NULL DEFAULT 1,
    index_name VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- PENDING, INDEXED, RETRYING, FAILED
    attempt_count INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 5,
    last_error TEXT,
    payload_snapshot TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    indexed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uq_search_index_entity UNIQUE (tenant_id, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_search_status ON search_index_states(status, created_at);
CREATE INDEX IF NOT EXISTS idx_search_tenant ON search_index_states(tenant_id);

-- 2. ENTERPRISE AI USAGE METERING & QUOTAS
CREATE TABLE IF NOT EXISTS ai_tenant_quotas (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    monthly_token_limit BIGINT NOT NULL DEFAULT 1000000, -- 1M tokens / month
    daily_request_limit INT NOT NULL DEFAULT 1000,
    current_month_tokens_used BIGINT NOT NULL DEFAULT 0,
    today_requests_used INT NOT NULL DEFAULT 0,
    quota_reset_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_hard_capped BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_ai_quota UNIQUE (tenant_id)
);

CREATE TABLE IF NOT EXISTS ai_usage_records (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    feature VARCHAR(64) NOT NULL, -- CANDIDATE_MATCH, JD_GENERATION, INTERVIEW_SYNTHESIS
    model VARCHAR(64) NOT NULL,
    prompt_version VARCHAR(32) NOT NULL,
    input_tokens INT NOT NULL,
    output_tokens INT NOT NULL,
    total_tokens INT NOT NULL,
    latency_ms BIGINT NOT NULL,
    estimated_cost_cents INT NOT NULL DEFAULT 0,
    trace_id VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_tenant ON ai_usage_records(tenant_id, created_at);

-- 3. AI EXPLAINABILITY & CANDIDATE MATCH RECOMMENDATION AUDIT
CREATE TABLE IF NOT EXISTS ai_recommendation_audits (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    candidate_id VARCHAR(64) NOT NULL,
    job_id VARCHAR(64) NOT NULL,
    model VARCHAR(64) NOT NULL,
    model_version VARCHAR(32) NOT NULL,
    prompt_version VARCHAR(32) NOT NULL,
    score INT NOT NULL, -- 0 to 100
    matched_skills TEXT, -- comma/json separated
    missing_skills TEXT,
    experience_match_score INT,
    education_match_score INT,
    generated_explanation TEXT NOT NULL,
    pii_redacted BOOLEAN NOT NULL DEFAULT TRUE,
    trace_id VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_rec_lookup ON ai_recommendation_audits(tenant_id, candidate_id, job_id);
