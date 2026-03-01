-- Fix agreement_hash column size to accommodate 'sha256_' prefix
-- The current VARCHAR(64) is too small for 'sha256_' + 64 hex chars = 71 chars

-- Increase column size in legal_agreements table
ALTER TABLE legal_agreements 
ALTER COLUMN agreement_hash TYPE VARCHAR(80);

-- Increase column size in agreement_versions table
ALTER TABLE agreement_versions 
ALTER COLUMN agreement_hash TYPE VARCHAR(80);

-- Add comment for clarity
COMMENT ON COLUMN legal_agreements.agreement_hash IS 'SHA-256 hash with sha256_ prefix, max 71 characters';
COMMENT ON COLUMN agreement_versions.agreement_hash IS 'SHA-256 hash with sha256_ prefix, max 71 characters';
