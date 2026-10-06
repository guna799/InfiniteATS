-- Real-time pipeline: canonical stage vocabulary, optimistic concurrency, multi-replica outbox claims.

-- Optimistic locking for concurrent stage moves (JPA @Version)
ALTER TABLE applications ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

-- Map legacy stage names onto the canonical PipelineStage set
UPDATE applications SET stage = 'APPLIED' WHERE stage = 'NEW';
UPDATE applications SET stage = 'TECHNICAL_INTERVIEW' WHERE stage = 'INTERVIEW';
UPDATE applications SET stage = 'OFFER_EXTENDED' WHERE stage = 'OFFER';
UPDATE applications SET stage = 'ONBOARDED' WHERE stage = 'HIRED';
ALTER TABLE applications ALTER COLUMN stage SET DEFAULT 'APPLIED';

-- Outbox rows claimed by one replica (status PROCESSING); stale claims are released after a timeout
ALTER TABLE outbox_events ADD COLUMN claimed_at TIMESTAMP WITH TIME ZONE;
