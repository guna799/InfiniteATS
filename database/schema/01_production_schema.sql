-- =====================================================================================
-- INFINITECAREERS ENTERPRISE SaaS PLATFORM - PRODUCTION POSTGRESQL DDL SPECIFICATION
-- =====================================================================================
-- Database Engine: PostgreSQL 15+ / 16+
-- Primary Key Strategy: UUID v4 (gen_random_uuid())
-- Multi-Tenancy Strategy: Shared Database, Shared Schema with Discriminator (tenant_id)
-- Defense-in-Depth: PostgreSQL Row-Level Security (RLS) enabled on all tenant tables
-- Naming Conventions: snake_case, explicit foreign key & constraint names
-- =====================================================================================

-- 0. EXTENSIONS & PREREQUISITES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Custom App Setting for Tenant Context in RLS:
-- Usage in transaction: SET LOCAL app.current_tenant_id = 'tenant-uuid';

-- =====================================================================================
-- 1. CORE TENANT & SUBSCRIPTION DOMAIN
-- =====================================================================================

CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    tier VARCHAR(50) NOT NULL DEFAULT 'ENTERPRISE',
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    logo_url TEXT,
    primary_color VARCHAR(30) DEFAULT '#4F46E5',
    data_residency_region VARCHAR(50) DEFAULT 'us-east-1',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenants_slug UNIQUE (slug),
    CONSTRAINT chk_tenants_status CHECK (status IN ('TRIAL', 'ACTIVE', 'SUSPENDED', 'DEPROVISIONED')),
    CONSTRAINT chk_tenants_tier CHECK (tier IN ('STARTER', 'GROWTH', 'ENTERPRISE', 'CUSTOM'))
);

CREATE TABLE tenant_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_encrypted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tenant_settings_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT uq_tenant_settings_key UNIQUE (tenant_id, setting_key)
);

CREATE TABLE tenant_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    domain_name VARCHAR(255) NOT NULL,
    domain_type VARCHAR(50) NOT NULL DEFAULT 'CAREERS_PORTAL',
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    ssl_cert_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tenant_domains_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT uq_tenant_domain_name UNIQUE (domain_name),
    CONSTRAINT chk_tenant_domains_type CHECK (domain_type IN ('CAREERS_PORTAL', 'SSO_SAML', 'CUSTOM_APP'))
);

CREATE TABLE tenant_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    plan_name VARCHAR(100) NOT NULL,
    seat_limit INT NOT NULL DEFAULT 10,
    candidate_limit INT NOT NULL DEFAULT 50000,
    starts_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ,
    auto_renew BOOLEAN NOT NULL DEFAULT TRUE,
    billing_email VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tenant_subscriptions_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT chk_tenant_subs_status CHECK (status IN ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED'))
);

-- =====================================================================================
-- 2. IDENTITY, AUTHENTICATION & ACCESS CONTROL (RBAC)
-- =====================================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(50),
    avatar_url TEXT,
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_global_admin BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_users_email UNIQUE (email)
);

CREATE TABLE user_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    password_salt VARCHAR(100),
    password_algorithm VARCHAR(50) NOT NULL DEFAULT 'BCRYPT',
    failed_attempts INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    password_reset_token VARCHAR(255),
    reset_token_expires_at TIMESTAMPTZ,
    must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_credentials_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_user_credentials_user UNIQUE (user_id)
);

CREATE TABLE user_mfa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    mfa_type VARCHAR(50) NOT NULL DEFAULT 'TOTP',
    secret_key_encrypted TEXT NOT NULL,
    backup_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_mfa_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_user_mfa UNIQUE (user_id, mfa_type)
);

CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    tenant_id UUID,
    session_token_hash VARCHAR(255) NOT NULL,
    refresh_token_hash VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,
    expires_at TIMESTAMPTZ NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_sessions_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL,
    CONSTRAINT uq_user_sessions_token UNIQUE (session_token_hash)
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL,
    resource_name VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_permissions_code UNIQUE (code)
);

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID, -- NULL indicates global system roles
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_roles_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT uq_roles_tenant_name UNIQUE (tenant_id, name)
);

CREATE TABLE role_permissions (
    role_id UUID NOT NULL,
    permission_id UUID NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_rp_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

CREATE TABLE tenant_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    data_scope VARCHAR(50) NOT NULL DEFAULT 'TENANT',
    scope_entity_id UUID,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tm_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_tm_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_tm_tenant_user UNIQUE (tenant_id, user_id),
    CONSTRAINT chk_tm_scope CHECK (data_scope IN ('TENANT', 'LEGAL_ENTITY', 'BUSINESS_UNIT', 'DEPARTMENT', 'LOCATION', 'RECRUITING_TEAM', 'OWN_RECORDS')),
    CONSTRAINT chk_tm_status CHECK (status IN ('INVITED', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED'))
);

CREATE TABLE user_roles (
    membership_id UUID NOT NULL,
    role_id UUID NOT NULL,
    PRIMARY KEY (membership_id, role_id),
    CONSTRAINT fk_ur_membership FOREIGN KEY (membership_id) REFERENCES tenant_memberships(id) ON DELETE CASCADE,
    CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- =====================================================================================
-- 3. ORGANIZATIONAL HIERARCHY DOMAIN
-- =====================================================================================

CREATE TABLE legal_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    registration_number VARCHAR(100),
    tax_identifier VARCHAR(100),
    country_code CHAR(2) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_le_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT uq_le_code UNIQUE (tenant_id, code)
);

CREATE TABLE business_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    legal_entity_id UUID,
    parent_unit_id UUID,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bu_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_bu_le FOREIGN KEY (legal_entity_id) REFERENCES legal_entities(id) ON DELETE SET NULL,
    CONSTRAINT fk_bu_parent FOREIGN KEY (parent_unit_id) REFERENCES business_units(id) ON DELETE RESTRICT,
    CONSTRAINT uq_bu_code UNIQUE (tenant_id, code)
);

CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    business_unit_id UUID,
    parent_department_id UUID,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    cost_center_code VARCHAR(50),
    head_user_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_dept_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_dept_bu FOREIGN KEY (business_unit_id) REFERENCES business_units(id) ON DELETE SET NULL,
    CONSTRAINT fk_dept_parent FOREIGN KEY (parent_department_id) REFERENCES departments(id) ON DELETE RESTRICT,
    CONSTRAINT fk_dept_head FOREIGN KEY (head_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uq_dept_code UNIQUE (tenant_id, code)
);

CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    street_address TEXT,
    city VARCHAR(100) NOT NULL,
    state_province VARCHAR(100),
    postal_code VARCHAR(30),
    country_code CHAR(2) NOT NULL,
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    is_remote BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_loc_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT uq_loc_code UNIQUE (tenant_id, code)
);

CREATE TABLE cost_centers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    department_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cc_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_cc_dept FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    CONSTRAINT uq_cc_code UNIQUE (tenant_id, code)
);

CREATE TABLE job_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    job_code VARCHAR(50) NOT NULL,
    job_family VARCHAR(100),
    management_level VARCHAR(50),
    standard_description TEXT,
    min_base_pay NUMERIC(15,2),
    max_base_pay NUMERIC(15,2),
    pay_currency CHAR(3) DEFAULT 'USD',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_jp_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT uq_jp_code UNIQUE (tenant_id, job_code)
);

CREATE TABLE positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    position_number VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    job_profile_id UUID,
    department_id UUID,
    location_id UUID,
    cost_center_id UUID,
    reports_to_position_id UUID,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pos_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_pos_jp FOREIGN KEY (job_profile_id) REFERENCES job_profiles(id) ON DELETE SET NULL,
    CONSTRAINT fk_pos_dept FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    CONSTRAINT fk_pos_loc FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL,
    CONSTRAINT fk_pos_cc FOREIGN KEY (cost_center_id) REFERENCES cost_centers(id) ON DELETE SET NULL,
    CONSTRAINT fk_pos_parent FOREIGN KEY (reports_to_position_id) REFERENCES positions(id) ON DELETE RESTRICT,
    CONSTRAINT uq_pos_number UNIQUE (tenant_id, position_number),
    CONSTRAINT chk_pos_status CHECK (status IN ('PLANNED', 'OPEN', 'FROZEN', 'FILLED', 'ELIMINATED'))
);

-- =====================================================================================
-- 4. RECRUITING & JOB REQUISITION DOMAIN
-- =====================================================================================

CREATE TABLE recruiting_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    lead_recruiter_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rec_team_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_rec_team_lead FOREIGN KEY (lead_recruiter_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE job_requisitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    req_number VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    job_profile_id UUID,
    position_id UUID,
    department_id UUID,
    location_id UUID,
    hiring_manager_id UUID,
    recruiter_id UUID,
    recruiting_team_id UUID,
    employment_type VARCHAR(50) NOT NULL DEFAULT 'FULL_TIME',
    headcount INT NOT NULL DEFAULT 1,
    opened_headcount INT NOT NULL DEFAULT 1,
    filled_headcount INT NOT NULL DEFAULT 0,
    min_salary NUMERIC(15,2),
    max_salary NUMERIC(15,2),
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    description TEXT,
    requirements TEXT,
    benefits TEXT,
    target_start_date DATE,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_req_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_req_jp FOREIGN KEY (job_profile_id) REFERENCES job_profiles(id) ON DELETE SET NULL,
    CONSTRAINT fk_req_pos FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE SET NULL,
    CONSTRAINT fk_req_dept FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    CONSTRAINT fk_req_loc FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL,
    CONSTRAINT fk_req_hm FOREIGN KEY (hiring_manager_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_req_recruiter FOREIGN KEY (recruiter_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_req_team FOREIGN KEY (recruiting_team_id) REFERENCES recruiting_teams(id) ON DELETE SET NULL,
    CONSTRAINT fk_req_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uq_req_number UNIQUE (tenant_id, req_number),
    CONSTRAINT chk_req_status CHECK (status IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'OPEN', 'PAUSED', 'CLOSED', 'CANCELLED')),
    CONSTRAINT chk_req_headcount CHECK (headcount > 0 AND filled_headcount <= headcount)
);

CREATE TABLE requisition_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    requisition_id UUID NOT NULL,
    step_order INT NOT NULL,
    approver_user_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    decision_notes TEXT,
    decided_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ra_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_ra_req FOREIGN KEY (requisition_id) REFERENCES job_requisitions(id) ON DELETE CASCADE,
    CONSTRAINT fk_ra_approver FOREIGN KEY (approver_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT uq_ra_step UNIQUE (requisition_id, step_order),
    CONSTRAINT chk_ra_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'SKIPPED'))
);

CREATE TABLE job_postings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    requisition_id UUID NOT NULL,
    posting_type VARCHAR(50) NOT NULL DEFAULT 'EXTERNAL',
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    slug VARCHAR(255) NOT NULL,
    custom_application_form_id UUID,
    seo_title VARCHAR(255),
    seo_description TEXT,
    published_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_jpost_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_jpost_req FOREIGN KEY (requisition_id) REFERENCES job_requisitions(id) ON DELETE CASCADE,
    CONSTRAINT uq_jpost_slug UNIQUE (tenant_id, slug),
    CONSTRAINT chk_jpost_type CHECK (posting_type IN ('EXTERNAL', 'INTERNAL', 'UNLISTED', 'CONFIDENTIAL')),
    CONSTRAINT chk_jpost_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'UNPUBLISHED', 'EXPIRED', 'ARCHIVED'))
);

CREATE TABLE job_posting_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    job_posting_id UUID NOT NULL,
    channel_name VARCHAR(100) NOT NULL,
    external_job_id VARCHAR(255),
    published_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_jpc_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_jpc_post FOREIGN KEY (job_posting_id) REFERENCES job_postings(id) ON DELETE CASCADE,
    CONSTRAINT uq_jpc_channel UNIQUE (job_posting_id, channel_name)
);

-- =====================================================================================
-- 5. CANDIDATE IDENTITY & PROFILE DOMAIN
-- =====================================================================================

CREATE TABLE candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    primary_email VARCHAR(255) NOT NULL,
    primary_phone VARCHAR(50),
    headline VARCHAR(255),
    summary TEXT,
    photo_storage_key TEXT,
    source_type VARCHAR(100) DEFAULT 'CAREER_SITE',
    source_detail VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    do_not_contact BOOLEAN NOT NULL DEFAULT FALSE,
    anonymized_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cand_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT uq_cand_tenant_email UNIQUE (tenant_id, primary_email),
    CONSTRAINT chk_cand_status CHECK (status IN ('ACTIVE', 'HIRED', 'ARCHIVED', 'BLOCKED', 'PURGED'))
);

CREATE TABLE candidate_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    candidate_id UUID NOT NULL,
    contact_type VARCHAR(50) NOT NULL, -- EMAIL, PHONE, WHATSAPP, TELEGRAM
    contact_value VARCHAR(255) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ccontact_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_ccontact_cand FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
    CONSTRAINT uq_ccontact_val UNIQUE (candidate_id, contact_type, contact_value)
);

CREATE TABLE candidate_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    candidate_id UUID NOT NULL,
    address_type VARCHAR(50) DEFAULT 'HOME',
    street_address TEXT,
    city VARCHAR(100) NOT NULL,
    state_province VARCHAR(100),
    postal_code VARCHAR(30),
    country_code CHAR(2) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_caddr_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_caddr_cand FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);

CREATE TABLE candidate_experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    candidate_id UUID NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    job_title VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    start_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cexp_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_cexp_cand FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
    CONSTRAINT chk_cexp_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE TABLE candidate_educations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    candidate_id UUID NOT NULL,
    institution_name VARCHAR(255) NOT NULL,
    degree VARCHAR(255),
    field_of_study VARCHAR(255),
    start_year INT,
    graduation_year INT,
    gpa NUMERIC(4,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cedu_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_cedu_cand FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);

CREATE TABLE candidate_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    candidate_id UUID NOT NULL,
    skill_name VARCHAR(100) NOT NULL,
    years_experience NUMERIC(4,1),
    proficiency VARCHAR(50) DEFAULT 'INTERMEDIATE',
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cskill_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_cskill_cand FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
    CONSTRAINT uq_cskill_name UNIQUE (candidate_id, skill_name)
);

CREATE TABLE candidate_certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    candidate_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    issuing_organization VARCHAR(255) NOT NULL,
    issue_date DATE,
    expiration_date DATE,
    credential_id VARCHAR(255),
    credential_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ccert_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_ccert_cand FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);

CREATE TABLE candidate_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    candidate_id UUID NOT NULL,
    link_type VARCHAR(50) NOT NULL, -- LINKEDIN, GITHUB, PORTFOLIO, BLOG, TWITTER
    url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_clink_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_clink_cand FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);

CREATE TABLE candidate_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    candidate_id UUID NOT NULL,
    tag_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ctag_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_ctag_cand FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
    CONSTRAINT uq_ctag UNIQUE (candidate_id, tag_name)
);

CREATE TABLE candidate_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    candidate_id UUID NOT NULL,
    consent_purpose VARCHAR(100) NOT NULL, -- GDPR_PROCESSING, DATA_RETENTION, BACKGROUND_CHECK
    is_granted BOOLEAN NOT NULL DEFAULT TRUE,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMPTZ,
    ip_address INET,
    user_agent TEXT,
    privacy_policy_version VARCHAR(50) NOT NULL DEFAULT 'v1.0',
    CONSTRAINT fk_cconsent_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_cconsent_cand FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);

-- =====================================================================================
-- 6. APPLICATION & CANDIDATE PIPELINE DOMAIN
-- =====================================================================================

CREATE TABLE application_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    stage_type VARCHAR(50) NOT NULL, -- SCREENING, INTERVIEW, EVALUATION, OFFER, HIRED, REJECTED
    order_index INT NOT NULL,
    is_system_stage BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_astage_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT uq_astage_order UNIQUE (tenant_id, order_index)
);

CREATE TABLE application_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'DIRECT', -- JOB_BOARD, REFERRAL, AGENCY, SOCIAL, SOURCED
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_asrc_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT uq_asrc_name UNIQUE (tenant_id, name)
);

CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    candidate_id UUID NOT NULL,
    requisition_id UUID NOT NULL,
    current_stage_id UUID NOT NULL,
    source_id UUID,
    recruiter_id UUID,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    rating INT DEFAULT 0,
    rejection_reason_code VARCHAR(100),
    rejection_notes TEXT,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_app_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_app_cand FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
    CONSTRAINT fk_app_req FOREIGN KEY (requisition_id) REFERENCES job_requisitions(id) ON DELETE CASCADE,
    CONSTRAINT fk_app_stage FOREIGN KEY (current_stage_id) REFERENCES application_stages(id) ON DELETE RESTRICT,
    CONSTRAINT fk_app_source FOREIGN KEY (source_id) REFERENCES application_sources(id) ON DELETE SET NULL,
    CONSTRAINT fk_app_recruiter FOREIGN KEY (recruiter_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uq_app_cand_req UNIQUE (candidate_id, requisition_id),
    CONSTRAINT chk_app_status CHECK (status IN ('ACTIVE', 'WITHDRAWN', 'REJECTED', 'HIRED')),
    CONSTRAINT chk_app_rating CHECK (rating BETWEEN 0 AND 5)
);

CREATE TABLE application_stage_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    application_id UUID NOT NULL,
    from_stage_id UUID,
    to_stage_id UUID NOT NULL,
    changed_by_user_id UUID,
    reason VARCHAR(255),
    notes TEXT,
    entered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    exited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ash_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_ash_app FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    CONSTRAINT fk_ash_from_stage FOREIGN KEY (from_stage_id) REFERENCES application_stages(id) ON DELETE SET NULL,
    CONSTRAINT fk_ash_to_stage FOREIGN KEY (to_stage_id) REFERENCES application_stages(id) ON DELETE RESTRICT,
    CONSTRAINT fk_ash_user FOREIGN KEY (changed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE application_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    application_id UUID NOT NULL,
    author_id UUID NOT NULL,
    content TEXT NOT NULL,
    is_private BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_anotes_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_anotes_app FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    CONSTRAINT fk_anotes_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE application_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    application_id UUID NOT NULL,
    document_id UUID NOT NULL,
    attachment_type VARCHAR(50) NOT NULL DEFAULT 'RESUME', -- RESUME, COVER_LETTER, PORTFOLIO, WORK_SAMPLE
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_aatt_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_aatt_app FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);

-- =====================================================================================
-- 7. INTERVIEWS, PLANS & STRUCTURED SCORECARDS DOMAIN
-- =====================================================================================

CREATE TABLE interview_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    job_profile_id UUID,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ipl_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_ipl_jp FOREIGN KEY (job_profile_id) REFERENCES job_profiles(id) ON DELETE SET NULL
);

CREATE TABLE interview_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    interview_plan_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    stage_order INT NOT NULL,
    estimated_duration_minutes INT NOT NULL DEFAULT 45,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_is_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_is_plan FOREIGN KEY (interview_plan_id) REFERENCES interview_plans(id) ON DELETE CASCADE,
    CONSTRAINT uq_is_order UNIQUE (interview_plan_id, stage_order)
);

CREATE TABLE scorecard_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    interview_stage_id UUID NOT NULL,
    category VARCHAR(100) NOT NULL, -- TECHNICAL, SYSTEM_DESIGN, LEADERSHIP, CULTURAL_FIT
    question_text TEXT NOT NULL,
    scoring_guide TEXT,
    weight NUMERIC(3,2) DEFAULT 1.0,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sq_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_sq_stage FOREIGN KEY (interview_stage_id) REFERENCES interview_stages(id) ON DELETE CASCADE
);

CREATE TABLE interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    application_id UUID NOT NULL,
    interview_stage_id UUID,
    title VARCHAR(255) NOT NULL,
    scheduled_start_utc TIMESTAMPTZ NOT NULL,
    scheduled_end_utc TIMESTAMPTZ NOT NULL,
    local_timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    location_type VARCHAR(50) NOT NULL DEFAULT 'VIRTUAL', -- VIRTUAL, ONSITE, PHONE
    meeting_link TEXT,
    physical_room VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED',
    cancellation_reason TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_int_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_int_app FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    CONSTRAINT fk_int_stage FOREIGN KEY (interview_stage_id) REFERENCES interview_stages(id) ON DELETE SET NULL,
    CONSTRAINT fk_int_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_int_status CHECK (status IN ('SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
    CONSTRAINT chk_int_duration CHECK (scheduled_end_utc > scheduled_start_utc)
);

CREATE TABLE interview_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    interview_id UUID NOT NULL,
    user_id UUID NOT NULL,
    participant_role VARCHAR(50) NOT NULL DEFAULT 'INTERVIEWER', -- LEAD_INTERVIEWER, INTERVIEWER, SHADOW, SCRIBE
    response_status VARCHAR(50) NOT NULL DEFAULT 'ACCEPTED', -- PENDING, ACCEPTED, DECLINED, TENTATIVE
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ip_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_ip_interview FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE,
    CONSTRAINT fk_ip_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT uq_ip_user UNIQUE (interview_id, user_id)
);

CREATE TABLE interview_scorecards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    interview_id UUID NOT NULL,
    interviewer_user_id UUID NOT NULL,
    recommendation VARCHAR(50) NOT NULL,
    overall_rating INT NOT NULL,
    strengths_summary TEXT,
    weaknesses_summary TEXT,
    private_notes TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sc_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_sc_interview FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE,
    CONSTRAINT fk_sc_interviewer FOREIGN KEY (interviewer_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT uq_sc_submission UNIQUE (interview_id, interviewer_user_id),
    CONSTRAINT chk_sc_rec CHECK (recommendation IN ('STRONG_HIRE', 'HIRE', 'NEUTRAL', 'NO_HIRE', 'STRONG_NO_HIRE')),
    CONSTRAINT chk_sc_rating CHECK (overall_rating BETWEEN 1 AND 5)
);

CREATE TABLE interview_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    scorecard_id UUID NOT NULL,
    question_id UUID,
    dimension_name VARCHAR(100) NOT NULL,
    score INT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_iscore_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_iscore_sc FOREIGN KEY (scorecard_id) REFERENCES interview_scorecards(id) ON DELETE CASCADE,
    CONSTRAINT fk_iscore_q FOREIGN KEY (question_id) REFERENCES scorecard_questions(id) ON DELETE SET NULL,
    CONSTRAINT chk_iscore_val CHECK (score BETWEEN 1 AND 5)
);

CREATE TABLE interview_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    interview_id UUID NOT NULL,
    author_id UUID NOT NULL,
    feedback_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ifb_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_ifb_int FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE,
    CONSTRAINT fk_ifb_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- =====================================================================================
-- 8. OFFER MANAGEMENT & COMPENSATION DOMAIN
-- =====================================================================================

CREATE TABLE offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    application_id UUID NOT NULL,
    version INT NOT NULL DEFAULT 1,
    base_salary NUMERIC(15,2) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    payment_frequency VARCHAR(50) NOT NULL DEFAULT 'ANNUAL',
    target_start_date DATE NOT NULL,
    offer_expiration_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    created_by UUID,
    sent_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    decided_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_off_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_off_app FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    CONSTRAINT fk_off_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_off_status CHECK (status IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'WITHDRAWN')),
    CONSTRAINT chk_off_dates CHECK (offer_expiration_date >= CURRENT_DATE)
);

CREATE TABLE offer_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    offer_id UUID NOT NULL,
    component_type VARCHAR(50) NOT NULL, -- SIGNING_BONUS, ANNUAL_BONUS, EQUITY_ISO, EQUITY_RSU, RELOCATION, COMMISSION
    name VARCHAR(255) NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    vesting_schedule TEXT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_oc_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_oc_offer FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE
);

CREATE TABLE offer_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    offer_id UUID NOT NULL,
    step_order INT NOT NULL,
    approver_user_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    comments TEXT,
    decided_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_oa_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_oa_offer FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE,
    CONSTRAINT fk_oa_approver FOREIGN KEY (approver_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT uq_oa_step UNIQUE (offer_id, step_order),
    CONSTRAINT chk_oa_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'SKIPPED'))
);

CREATE TABLE offer_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    offer_id UUID NOT NULL,
    document_id UUID NOT NULL,
    document_role VARCHAR(50) NOT NULL DEFAULT 'OFFER_LETTER', -- OFFER_LETTER, SIGNED_EXECUTED, NDA, IP_ASSIGNMENT
    envelope_id VARCHAR(255),
    signed_at TIMESTAMPTZ,
    signer_ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_od_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_od_offer FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE
);

-- =====================================================================================
-- 9. PREBOARDING & EMPLOYEE ONBOARDING DOMAIN
-- =====================================================================================

CREATE TABLE onboarding_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    department_id UUID,
    location_id UUID,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_otpl_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_otpl_dept FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    CONSTRAINT fk_otpl_loc FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL
);

CREATE TABLE onboarding_template_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    onboarding_template_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_role VARCHAR(50) NOT NULL DEFAULT 'CANDIDATE', -- CANDIDATE, EMPLOYEE, HR, MANAGER, IT, FINANCE
    category VARCHAR(50) NOT NULL DEFAULT 'DOCUMENT', -- DOCUMENT, HARDWARE, TRAINING, ACCESS, SURVEY
    days_relative_to_start INT NOT NULL DEFAULT -7, -- -7 means 7 days before start date
    order_index INT NOT NULL DEFAULT 0,
    is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ott_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_ott_template FOREIGN KEY (onboarding_template_id) REFERENCES onboarding_templates(id) ON DELETE CASCADE
);

CREATE TABLE onboarding_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    application_id UUID,
    candidate_id UUID NOT NULL,
    onboarding_template_id UUID,
    target_start_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PREBOARDING',
    completion_percentage INT NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_onbi_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_onbi_app FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE SET NULL,
    CONSTRAINT fk_onbi_cand FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE RESTRICT,
    CONSTRAINT fk_onbi_tpl FOREIGN KEY (onboarding_template_id) REFERENCES onboarding_templates(id) ON DELETE SET NULL,
    CONSTRAINT chk_onbi_status CHECK (status IN ('PREBOARDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'OVERDUE')),
    CONSTRAINT chk_onbi_pct CHECK (completion_percentage BETWEEN 0 AND 100)
);

CREATE TABLE onboarding_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    onboarding_instance_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'DOCUMENT',
    assigned_role VARCHAR(50) NOT NULL DEFAULT 'CANDIDATE',
    due_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'NOT_STARTED',
    completed_at TIMESTAMPTZ,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_onbt_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_onbt_inst FOREIGN KEY (onboarding_instance_id) REFERENCES onboarding_instances(id) ON DELETE CASCADE,
    CONSTRAINT chk_onbt_status CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'OVERDUE', 'CANCELLED'))
);

CREATE TABLE onboarding_task_dependencies (
    task_id UUID NOT NULL,
    depends_on_task_id UUID NOT NULL,
    PRIMARY KEY (task_id, depends_on_task_id),
    CONSTRAINT fk_otd_task FOREIGN KEY (task_id) REFERENCES onboarding_tasks(id) ON DELETE CASCADE,
    CONSTRAINT fk_otd_dep FOREIGN KEY (depends_on_task_id) REFERENCES onboarding_tasks(id) ON DELETE CASCADE
);

CREATE TABLE onboarding_task_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    task_id UUID NOT NULL,
    assignee_user_id UUID NOT NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ota_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_ota_task FOREIGN KEY (task_id) REFERENCES onboarding_tasks(id) ON DELETE CASCADE,
    CONSTRAINT fk_ota_user FOREIGN KEY (assignee_user_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE onboarding_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    onboarding_instance_id UUID NOT NULL,
    document_id UUID NOT NULL,
    task_id UUID,
    document_type VARCHAR(100) NOT NULL, -- I9_VERIFICATION, W4_TAX, DIRECT_DEPOSIT, EMERGENCY_CONTACT
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_REVIEW', -- PENDING_REVIEW, APPROVED, REJECTED
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_onbd_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_onbd_inst FOREIGN KEY (onboarding_instance_id) REFERENCES onboarding_instances(id) ON DELETE CASCADE,
    CONSTRAINT fk_onbd_task FOREIGN KEY (task_id) REFERENCES onboarding_tasks(id) ON DELETE SET NULL,
    CONSTRAINT fk_onbd_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE onboarding_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    onboarding_instance_id UUID NOT NULL,
    form_definition_id UUID NOT NULL,
    task_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_onbf_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_onbf_inst FOREIGN KEY (onboarding_instance_id) REFERENCES onboarding_instances(id) ON DELETE CASCADE
);

CREATE TABLE onboarding_form_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    onboarding_form_id UUID NOT NULL,
    form_submission_id UUID NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_onbfs_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_onbfs_form FOREIGN KEY (onboarding_form_id) REFERENCES onboarding_forms(id) ON DELETE CASCADE
);

-- =====================================================================================
-- 10. EMPLOYEE DIRECTORY & HCM DOMAIN
-- =====================================================================================

CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID,
    candidate_id UUID,
    employee_number VARCHAR(50) NOT NULL,
    legal_first_name VARCHAR(100) NOT NULL,
    legal_last_name VARCHAR(100) NOT NULL,
    preferred_name VARCHAR(100),
    work_email VARCHAR(255) NOT NULL,
    personal_email VARCHAR(255),
    hire_date DATE NOT NULL,
    original_hire_date DATE,
    termination_date DATE,
    employment_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_emp_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_emp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_emp_cand FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE SET NULL,
    CONSTRAINT uq_emp_number UNIQUE (tenant_id, employee_number),
    CONSTRAINT uq_emp_work_email UNIQUE (tenant_id, work_email),
    CONSTRAINT chk_emp_status CHECK (employment_status IN ('PRE_HIRE', 'ACTIVE', 'ON_LEAVE', 'TERMINATED', 'RETIRED'))
);

CREATE TABLE employee_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    gender VARCHAR(50),
    birth_date DATE,
    marital_status VARCHAR(50),
    nationality_country CHAR(2),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    emergency_contact_relation VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_eprof_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_eprof_emp FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    CONSTRAINT uq_eprof_emp UNIQUE (employee_id)
);

CREATE TABLE employee_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    position_id UUID,
    job_profile_id UUID NOT NULL,
    department_id UUID NOT NULL,
    location_id UUID NOT NULL,
    cost_center_id UUID,
    employment_type VARCHAR(50) NOT NULL DEFAULT 'FULL_TIME',
    is_primary BOOLEAN NOT NULL DEFAULT TRUE,
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_eass_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_eass_emp FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    CONSTRAINT fk_eass_pos FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE SET NULL,
    CONSTRAINT fk_eass_jp FOREIGN KEY (job_profile_id) REFERENCES job_profiles(id) ON DELETE RESTRICT,
    CONSTRAINT fk_eass_dept FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
    CONSTRAINT fk_eass_loc FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE RESTRICT,
    CONSTRAINT fk_eass_cc FOREIGN KEY (cost_center_id) REFERENCES cost_centers(id) ON DELETE SET NULL
);

CREATE TABLE employee_managers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    manager_employee_id UUID NOT NULL,
    relationship_type VARCHAR(50) NOT NULL DEFAULT 'DIRECT', -- DIRECT, MATRIX, MENTOR
    is_primary BOOLEAN NOT NULL DEFAULT TRUE,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_eman_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_eman_emp FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    CONSTRAINT fk_eman_mgr FOREIGN KEY (manager_employee_id) REFERENCES employees(id) ON DELETE RESTRICT,
    CONSTRAINT chk_eman_not_self CHECK (employee_id <> manager_employee_id)
);

CREATE TABLE employee_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    document_id UUID NOT NULL,
    category VARCHAR(100) NOT NULL, -- CONTRACT, VISA, APPRAISAL, COMPLIANCE
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_edoc_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_edoc_emp FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE employee_employment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- HIRE, PROMOTION, TRANSFER, SALARY_CHANGE, TITLE_CHANGE, TERMINATION
    effective_date DATE NOT NULL,
    prior_job_title VARCHAR(255),
    new_job_title VARCHAR(255),
    prior_salary NUMERIC(15,2),
    new_salary NUMERIC(15,2),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_eeh_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_eeh_emp FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- =====================================================================================
-- 11. DOCUMENT REPOSITORY & OBJECT STORAGE METADATA DOMAIN
-- =====================================================================================

CREATE TABLE document_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    retention_days INT DEFAULT 2555, -- 7 years default
    requires_encryption BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_dcat_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT uq_dcat_name UNIQUE (tenant_id, name)
);

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    category_id UUID,
    owner_entity_type VARCHAR(50) NOT NULL, -- CANDIDATE, EMPLOYEE, APPLICATION, REQUISITION, TENANT
    owner_entity_id UUID NOT NULL,
    filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    storage_provider VARCHAR(50) NOT NULL DEFAULT 'S3', -- S3, GCS, AZURE_BLOB
    storage_key VARCHAR(500) NOT NULL,
    storage_bucket VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    sha256_checksum CHAR(64) NOT NULL,
    current_version INT NOT NULL DEFAULT 1,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, ARCHIVED, DELETED, QUARANTINED
    expiry_at TIMESTAMPTZ,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_doc_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_doc_cat FOREIGN KEY (category_id) REFERENCES document_categories(id) ON DELETE SET NULL,
    CONSTRAINT fk_doc_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uq_doc_storage_key UNIQUE (storage_bucket, storage_key),
    CONSTRAINT chk_doc_status CHECK (status IN ('ACTIVE', 'ARCHIVED', 'DELETED', 'QUARANTINED'))
);

CREATE TABLE document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    document_id UUID NOT NULL,
    version_number INT NOT NULL,
    storage_key VARCHAR(500) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    sha256_checksum CHAR(64) NOT NULL,
    change_summary TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_dv_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_dv_doc FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    CONSTRAINT fk_dv_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uq_dv_version UNIQUE (document_id, version_number)
);

CREATE TABLE document_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    document_id UUID NOT NULL,
    accessed_by_user_id UUID,
    access_type VARCHAR(50) NOT NULL, -- PRESIGNED_DOWNLOAD, PREVIEW, UPLOAD_VERSION, DELETE
    ip_address INET,
    user_agent TEXT,
    accessed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_dal_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_dal_doc FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    CONSTRAINT fk_dal_user FOREIGN KEY (accessed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================================================
-- 12. VERSIONED WORKFLOW ENGINE DOMAIN
-- =====================================================================================

CREATE TABLE workflow_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_event_type VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wfdef_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT uq_wfdef_name UNIQUE (tenant_id, name)
);

CREATE TABLE workflow_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    workflow_definition_id UUID NOT NULL,
    version_number INT NOT NULL,
    graph_definition JSONB NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PUBLISHED', -- DRAFT, PUBLISHED, DEPRECATED
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wfv_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_wfv_def FOREIGN KEY (workflow_definition_id) REFERENCES workflow_definitions(id) ON DELETE CASCADE,
    CONSTRAINT uq_wfv_version UNIQUE (workflow_definition_id, version_number)
);

CREATE TABLE workflow_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    workflow_version_id UUID NOT NULL,
    node_key VARCHAR(100) NOT NULL,
    node_type VARCHAR(50) NOT NULL, -- TRIGGER, CONDITION, APPROVAL, TASK, EMAIL, NOTIFICATION, WAIT, WEBHOOK, INTEGRATION, END
    config_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wn_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_wn_version FOREIGN KEY (workflow_version_id) REFERENCES workflow_versions(id) ON DELETE CASCADE,
    CONSTRAINT uq_wn_key UNIQUE (workflow_version_id, node_key)
);

CREATE TABLE workflow_transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    workflow_version_id UUID NOT NULL,
    source_node_id UUID NOT NULL,
    target_node_id UUID NOT NULL,
    condition_expression TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wt_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_wt_version FOREIGN KEY (workflow_version_id) REFERENCES workflow_versions(id) ON DELETE CASCADE,
    CONSTRAINT fk_wt_source FOREIGN KEY (source_node_id) REFERENCES workflow_nodes(id) ON DELETE CASCADE,
    CONSTRAINT fk_wt_target FOREIGN KEY (target_node_id) REFERENCES workflow_nodes(id) ON DELETE CASCADE
);

CREATE TABLE workflow_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    workflow_version_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'RUNNING',
    idempotency_key VARCHAR(255),
    state_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_winst_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_winst_version FOREIGN KEY (workflow_version_id) REFERENCES workflow_versions(id) ON DELETE RESTRICT,
    CONSTRAINT uq_winst_idempotency UNIQUE (tenant_id, idempotency_key),
    CONSTRAINT chk_winst_status CHECK (status IN ('RUNNING', 'COMPLETED', 'FAILED', 'PAUSED', 'TERMINATED'))
);

CREATE TABLE workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    workflow_instance_id UUID NOT NULL,
    node_id UUID NOT NULL,
    execution_status VARCHAR(50) NOT NULL DEFAULT 'SUCCESS', -- RUNNING, SUCCESS, FAILED, RETRYING
    input_payload JSONB,
    output_payload JSONB,
    error_message TEXT,
    retry_count INT NOT NULL DEFAULT 0,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wexec_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_wexec_inst FOREIGN KEY (workflow_instance_id) REFERENCES workflow_instances(id) ON DELETE CASCADE,
    CONSTRAINT fk_wexec_node FOREIGN KEY (node_id) REFERENCES workflow_nodes(id) ON DELETE RESTRICT
);

CREATE TABLE workflow_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    workflow_instance_id UUID NOT NULL,
    node_id UUID NOT NULL,
    assignee_id UUID,
    task_type VARCHAR(50) NOT NULL DEFAULT 'HUMAN_APPROVAL',
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    due_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    action_result VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wtask_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_wtask_inst FOREIGN KEY (workflow_instance_id) REFERENCES workflow_instances(id) ON DELETE CASCADE,
    CONSTRAINT fk_wtask_node FOREIGN KEY (node_id) REFERENCES workflow_nodes(id) ON DELETE RESTRICT,
    CONSTRAINT fk_wtask_assignee FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_wtask_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED'))
);

-- =====================================================================================
-- 13. VERSIONED DYNAMIC FORM ENGINE DOMAIN
-- =====================================================================================

CREATE TABLE form_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    form_category VARCHAR(50) NOT NULL DEFAULT 'JOB_APPLICATION', -- JOB_APPLICATION, SCORECARD, ONBOARDING, SURVEY
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fdef_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT uq_fdef_slug UNIQUE (tenant_id, slug)
);

CREATE TABLE form_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    form_definition_id UUID NOT NULL,
    version_number INT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PUBLISHED',
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fver_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_fver_def FOREIGN KEY (form_definition_id) REFERENCES form_definitions(id) ON DELETE CASCADE,
    CONSTRAINT uq_fver_num UNIQUE (form_definition_id, version_number)
);

CREATE TABLE form_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    form_version_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fsec_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_fsec_ver FOREIGN KEY (form_version_id) REFERENCES form_versions(id) ON DELETE CASCADE
);

CREATE TABLE form_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    form_section_id UUID NOT NULL,
    field_key VARCHAR(100) NOT NULL,
    label VARCHAR(255) NOT NULL,
    field_type VARCHAR(50) NOT NULL, -- TEXT, TEXTAREA, NUMBER, CURRENCY, DATE, DATETIME, SELECT, MULTI_SELECT, RADIO, CHECKBOX, FILE, EMAIL, PHONE, ADDRESS, SIGNATURE
    placeholder TEXT,
    help_text TEXT,
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    validation_rules JSONB DEFAULT '{}'::jsonb,
    visibility_conditions JSONB DEFAULT '{}'::jsonb,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ffld_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_ffld_sec FOREIGN KEY (form_section_id) REFERENCES form_sections(id) ON DELETE CASCADE,
    CONSTRAINT uq_ffld_key UNIQUE (form_section_id, field_key)
);

CREATE TABLE form_field_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    form_field_id UUID NOT NULL,
    option_label VARCHAR(255) NOT NULL,
    option_value VARCHAR(255) NOT NULL,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ffopt_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_ffopt_field FOREIGN KEY (form_field_id) REFERENCES form_fields(id) ON DELETE CASCADE
);

CREATE TABLE form_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    form_version_id UUID NOT NULL,
    target_entity_type VARCHAR(50), -- CANDIDATE, APPLICATION, ONBOARDING
    target_entity_id UUID,
    submitted_by_user_id UUID,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fsub_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_fsub_ver FOREIGN KEY (form_version_id) REFERENCES form_versions(id) ON DELETE RESTRICT,
    CONSTRAINT fk_fsub_user FOREIGN KEY (submitted_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE form_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    form_submission_id UUID NOT NULL,
    form_field_id UUID NOT NULL,
    field_key VARCHAR(100) NOT NULL,
    value_text TEXT,
    value_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fans_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_fans_sub FOREIGN KEY (form_submission_id) REFERENCES form_submissions(id) ON DELETE CASCADE,
    CONSTRAINT fk_fans_fld FOREIGN KEY (form_field_id) REFERENCES form_fields(id) ON DELETE RESTRICT,
    CONSTRAINT uq_fans_fld UNIQUE (form_submission_id, form_field_id)
);

-- =====================================================================================
-- 14. NOTIFICATIONS & ASYNC EMAIL DOMAIN
-- =====================================================================================

CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    code VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    channel VARCHAR(50) NOT NULL DEFAULT 'EMAIL', -- IN_APP, EMAIL, SMS, PUSH, SLACK
    subject_template TEXT,
    body_template TEXT NOT NULL,
    variables_schema JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ntpl_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT uq_ntpl_code UNIQUE (tenant_id, code)
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    recipient_user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL DEFAULT 'INFO',
    action_url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notif_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_notif_user FOREIGN KEY (recipient_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE email_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    template_id UUID,
    sender_email VARCHAR(255) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    subject TEXT NOT NULL,
    html_body TEXT NOT NULL,
    text_body TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'QUEUED', -- QUEUED, SENT, DELIVERED, FAILED, BOUNCED
    retry_count INT NOT NULL DEFAULT 0,
    max_retries INT NOT NULL DEFAULT 3,
    scheduled_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_em_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_em_tpl FOREIGN KEY (template_id) REFERENCES notification_templates(id) ON DELETE SET NULL,
    CONSTRAINT chk_em_status CHECK (status IN ('QUEUED', 'SENDING', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED'))
);

CREATE TABLE email_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    email_message_id UUID NOT NULL,
    provider VARCHAR(50) NOT NULL DEFAULT 'AWS_SES',
    provider_message_id VARCHAR(255),
    event_type VARCHAR(50) NOT NULL, -- SEND, DELIVERY, BOUNCE, COMPLAINT, OPEN, CLICK
    event_payload JSONB DEFAULT '{}'::jsonb,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_edel_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_edel_msg FOREIGN KEY (email_message_id) REFERENCES email_messages(id) ON DELETE CASCADE
);

-- =====================================================================================
-- 15. COMPLIANCE & IMMUTABLE AUDIT LOG DOMAIN
-- =====================================================================================

CREATE TABLE audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    actor_user_id UUID,
    actor_email VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID NOT NULL,
    before_state JSONB,
    after_state JSONB,
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ae_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- =====================================================================================
-- 16. INTEGRATIONS & SECURE WEBHOOKS DOMAIN
-- =====================================================================================

CREATE TABLE integration_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL, -- GOOGLE_WORKSPACE, MICROSOFT_365, ZOOM, SLACK, OKTA, ADP, DOCUSIGN, CHECKR
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL, -- CALENDAR, VIDEO_CONF, COMMUNICATION, SSO, HRIS, E_SIGN, BG_CHECK
    auth_type VARCHAR(50) NOT NULL DEFAULT 'OAUTH2',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_int_prov_code UNIQUE (code)
);

CREATE TABLE tenant_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    provider_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'CONFIGURED', -- CONFIGURED, ACTIVE, ERROR, DISABLED
    config_settings JSONB DEFAULT '{}'::jsonb,
    last_sync_at TIMESTAMPTZ,
    last_error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tint_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_tint_prov FOREIGN KEY (provider_id) REFERENCES integration_providers(id) ON DELETE RESTRICT,
    CONSTRAINT uq_tint_prov UNIQUE (tenant_id, provider_id)
);

CREATE TABLE integration_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    tenant_integration_id UUID NOT NULL,
    encrypted_credentials BYTEA NOT NULL,
    key_version VARCHAR(50) NOT NULL DEFAULT 'v1',
    token_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_icred_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_icred_tint FOREIGN KEY (tenant_integration_id) REFERENCES tenant_integrations(id) ON DELETE CASCADE,
    CONSTRAINT uq_icred_tint UNIQUE (tenant_integration_id)
);

CREATE TABLE integration_syncs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    tenant_integration_id UUID NOT NULL,
    sync_direction VARCHAR(20) NOT NULL DEFAULT 'INBOUND', -- INBOUND, OUTBOUND, BIDIRECTIONAL
    records_processed INT NOT NULL DEFAULT 0,
    records_failed INT NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'SUCCESS',
    started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    CONSTRAINT fk_isync_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_isync_tint FOREIGN KEY (tenant_integration_id) REFERENCES tenant_integrations(id) ON DELETE CASCADE
);

CREATE TABLE webhook_endpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    target_url TEXT NOT NULL,
    event_types JSONB NOT NULL DEFAULT '[]'::jsonb,
    secret_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_whe_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    webhook_endpoint_id UUID NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    response_status_code INT,
    response_body TEXT,
    retry_count INT NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'SUCCESS', -- SUCCESS, FAILED, RETRYING
    delivered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_whd_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_whd_whe FOREIGN KEY (webhook_endpoint_id) REFERENCES webhook_endpoints(id) ON DELETE CASCADE
);

-- =====================================================================================
-- 17. ANALYTICS & DAILY REPORTING READ MODELS
-- =====================================================================================

CREATE TABLE recruiting_metrics_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    metric_date DATE NOT NULL,
    department_id UUID,
    location_id UUID,
    open_requisitions_count INT NOT NULL DEFAULT 0,
    active_candidates_count INT NOT NULL DEFAULT 0,
    applications_received_count INT NOT NULL DEFAULT 0,
    interviews_conducted_count INT NOT NULL DEFAULT 0,
    offers_extended_count INT NOT NULL DEFAULT 0,
    offers_accepted_count INT NOT NULL DEFAULT 0,
    avg_time_to_hire_days NUMERIC(5,2) DEFAULT 0.0,
    avg_time_to_fill_days NUMERIC(5,2) DEFAULT 0.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rmd_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT uq_rmd_slice UNIQUE (tenant_id, metric_date, department_id, location_id)
);

CREATE TABLE onboarding_metrics_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    metric_date DATE NOT NULL,
    active_preboardings_count INT NOT NULL DEFAULT 0,
    onboardings_completed_count INT NOT NULL DEFAULT 0,
    tasks_overdue_count INT NOT NULL DEFAULT 0,
    avg_days_to_complete NUMERIC(5,2) DEFAULT 0.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_omd_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT uq_omd_date UNIQUE (tenant_id, metric_date)
);

-- =====================================================================================
-- 18. PERFORMANCE INDEX STRATEGY (B-TREE, GIN & PARTIAL INDEXES)
-- =====================================================================================

-- Multi-Tenant B-Tree Indexes
CREATE INDEX idx_req_tenant_status ON job_requisitions (tenant_id, status);
CREATE INDEX idx_req_tenant_dept ON job_requisitions (tenant_id, department_id);
CREATE INDEX idx_req_tenant_created ON job_requisitions (tenant_id, created_at DESC);

CREATE INDEX idx_cand_tenant_name ON candidates (tenant_id, last_name, first_name);
CREATE INDEX idx_cand_tenant_email ON candidates (tenant_id, primary_email);
CREATE INDEX idx_cand_tenant_status ON candidates (tenant_id, status);

CREATE INDEX idx_app_tenant_cand ON applications (tenant_id, candidate_id);
CREATE INDEX idx_app_tenant_req ON applications (tenant_id, requisition_id);
CREATE INDEX idx_app_tenant_stage ON applications (tenant_id, current_stage_id);
CREATE INDEX idx_app_tenant_status ON applications (tenant_id, status);
CREATE INDEX idx_app_tenant_activity ON applications (tenant_id, last_activity_at DESC);

CREATE INDEX idx_int_tenant_app ON interviews (tenant_id, application_id);
CREATE INDEX idx_int_tenant_schedule ON interviews (tenant_id, scheduled_start_utc);
CREATE INDEX idx_int_tenant_status ON interviews (tenant_id, status);

CREATE INDEX idx_off_tenant_app ON offers (tenant_id, application_id);
CREATE INDEX idx_off_tenant_status ON offers (tenant_id, status);

CREATE INDEX idx_onb_tenant_cand ON onboarding_instances (tenant_id, candidate_id);
CREATE INDEX idx_onb_tenant_status ON onboarding_instances (tenant_id, status);
CREATE INDEX idx_onbt_tenant_inst ON onboarding_tasks (tenant_id, onboarding_instance_id);

CREATE INDEX idx_emp_tenant_status ON employees (tenant_id, employment_status);
CREATE INDEX idx_emp_tenant_dept ON employee_assignments (tenant_id, department_id);

CREATE INDEX idx_doc_tenant_owner ON documents (tenant_id, owner_entity_type, owner_entity_id);
CREATE INDEX idx_doc_tenant_status ON documents (tenant_id, status);

CREATE INDEX idx_ae_tenant_res ON audit_events (tenant_id, resource_type, resource_id);
CREATE INDEX idx_ae_tenant_created ON audit_events (tenant_id, created_at DESC);

-- Partial Indexes for Hot Queries
CREATE INDEX idx_req_open_only ON job_requisitions (tenant_id, created_at DESC) WHERE status = 'OPEN';
CREATE INDEX idx_app_active_only ON applications (tenant_id, requisition_id, current_stage_id) WHERE status = 'ACTIVE';
CREATE INDEX idx_int_upcoming ON interviews (tenant_id, scheduled_start_utc) WHERE status IN ('SCHEDULED', 'CONFIRMED');
CREATE INDEX idx_email_pending_queue ON email_messages (tenant_id, scheduled_at) WHERE status IN ('QUEUED', 'SENDING');
CREATE INDEX idx_notif_unread ON notifications (recipient_user_id, created_at DESC) WHERE is_read = FALSE;

-- GIN Indexes for Full-Text Search and JSONB
CREATE INDEX idx_cand_summary_trgm ON candidates USING gin (summary gin_trgm_ops);
CREATE INDEX idx_cand_skills_gin ON candidate_skills (tenant_id, skill_name);
CREATE INDEX idx_winst_payload_gin ON workflow_instances USING gin (state_payload);
CREATE INDEX idx_fsub_answers_gin ON form_answers USING gin (value_json);
CREATE INDEX idx_ae_after_state_gin ON audit_events USING gin (after_state);

-- =====================================================================================
-- 19. POSTGRESQL ROW-LEVEL SECURITY (RLS) POLICIES
-- =====================================================================================

-- Enable RLS on core multi-tenant tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_scorecards ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- Define Tenant Isolation Policies using current_setting('app.current_tenant_id')
CREATE POLICY tenant_isolation_requisitions ON job_requisitions
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_candidates ON candidates
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_applications ON applications
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_interviews ON interviews
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_offers ON offers
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_onboarding ON onboarding_instances
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_employees ON employees
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_documents ON documents
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_audit ON audit_events
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
