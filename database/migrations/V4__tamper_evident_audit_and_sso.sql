-- =========================================================================
-- V4: TAMPER-EVIDENT AUDIT HASH CHAIN & ENTERPRISE SSO / SCIM
-- Cryptographic Integrity, SAML/OIDC, Directory Sync Provisioning
-- =========================================================================

-- 1. AUDIT TRAIL CRYPTOGRAPHIC HASH CHAIN & SEQUENCE INTEGRITY
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS previous_hash VARCHAR(128);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS hash VARCHAR(128);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS sequence_number BIGINT;

CREATE INDEX IF NOT EXISTS idx_audit_logs_hash ON audit_logs(tenant_id, sequence_number);

-- 2. ENTERPRISE SSO (SAML 2.0 / OIDC)
CREATE TABLE IF NOT EXISTS sso_configurations (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    provider_type VARCHAR(32) NOT NULL, -- OIDC, SAML_2_0, ENTRA_ID, OKTA
    issuer_url VARCHAR(512) NOT NULL,
    client_id VARCHAR(256) NOT NULL,
    client_secret VARCHAR(512),
    sso_metadata_xml TEXT,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    enforce_sso BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_sso UNIQUE (tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_sso_tenant ON sso_configurations(tenant_id);

-- 3. SCIM 2.0 DIRECTORY SYNC TOKENS
CREATE TABLE IF NOT EXISTS scim_sync_tokens (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    token_name VARCHAR(128) NOT NULL,
    bearer_token_hash VARCHAR(128) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_scim_token UNIQUE (tenant_id, token_name)
);

CREATE INDEX IF NOT EXISTS idx_scim_tenant ON scim_sync_tokens(tenant_id);
