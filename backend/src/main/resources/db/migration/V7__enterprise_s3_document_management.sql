-- V7: Enterprise S3 Document Management & Versioned Offer Letters

-- 1. Enhance Documents Table with Enterprise Metadata
ALTER TABLE documents ADD COLUMN IF NOT EXISTS candidate_id VARCHAR(64);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS employee_id VARCHAR(64);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS onboarding_id VARCHAR(64);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS application_id VARCHAR(64);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS offer_id VARCHAR(64);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS document_type VARCHAR(64);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS document_category VARCHAR(64);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS original_filename VARCHAR(255);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS stored_filename VARCHAR(255);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS s3_bucket VARCHAR(128);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS s3_key VARCHAR(512);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS sha256_hash VARCHAR(64);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS uploaded_by_id VARCHAR(64);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS uploaded_by VARCHAR(255);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS verified_by_id VARCHAR(64);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS verified_by VARCHAR(255);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;

-- 2. Create Indexes for High-Throughput Scoped Queries
CREATE INDEX IF NOT EXISTS idx_documents_tenant_id ON documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_candidate ON documents(tenant_id, candidate_id);
CREATE INDEX IF NOT EXISTS idx_documents_employee ON documents(tenant_id, employee_id);
CREATE INDEX IF NOT EXISTS idx_documents_offer ON documents(tenant_id, offer_id);
CREATE INDEX IF NOT EXISTS idx_documents_application ON documents(tenant_id, application_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(tenant_id, document_type);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(tenant_id, created_at DESC);
