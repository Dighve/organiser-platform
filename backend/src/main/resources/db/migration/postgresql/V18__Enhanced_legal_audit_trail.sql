-- Enhanced Legal Agreement Audit Trail System
-- Industry Standard Compliance for GDPR, SOX, HIPAA
-- Supports immutable audit trail with full agreement text preservation

-- Drop unique constraint to allow multiple acceptances
ALTER TABLE legal_agreements DROP CONSTRAINT IF EXISTS legal_agreements_member_id_agreement_type_key;

-- Add new columns for enhanced audit trail
ALTER TABLE legal_agreements 
ADD COLUMN IF NOT EXISTS agreement_text TEXT,
ADD COLUMN IF NOT EXISTS agreement_hash VARCHAR(64),
ADD COLUMN IF NOT EXISTS consent_method VARCHAR(50) DEFAULT 'web_form',
ADD COLUMN IF NOT EXISTS browser_fingerprint VARCHAR(255),
ADD COLUMN IF NOT EXISTS session_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS referrer_url TEXT,
ADD COLUMN IF NOT EXISTS is_withdrawn BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS withdrawn_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS withdrawal_reason TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_legal_agreements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_legal_agreements_updated_at ON legal_agreements;
CREATE TRIGGER trigger_legal_agreements_updated_at
    BEFORE UPDATE ON legal_agreements
    FOR EACH ROW
    EXECUTE FUNCTION update_legal_agreements_updated_at();

-- Create agreement versions table for master agreement management
CREATE TABLE IF NOT EXISTS agreement_versions (
    id BIGSERIAL PRIMARY KEY,
    agreement_type VARCHAR(50) NOT NULL,
    version VARCHAR(20) NOT NULL,
    effective_date TIMESTAMP NOT NULL,
    expiry_date TIMESTAMP,
    agreement_text TEXT NOT NULL,
    agreement_hash VARCHAR(64) NOT NULL,
    created_by VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(agreement_type, version)
);

-- Create indexes for performance and audit queries
CREATE INDEX IF NOT EXISTS idx_legal_agreements_member_type_date ON legal_agreements(member_id, agreement_type, accepted_at);
CREATE INDEX IF NOT EXISTS idx_legal_agreements_hash ON legal_agreements(agreement_hash);
CREATE INDEX IF NOT EXISTS idx_legal_agreements_withdrawn ON legal_agreements(is_withdrawn, withdrawn_at);
CREATE INDEX IF NOT EXISTS idx_legal_agreements_session ON legal_agreements(session_id);
CREATE INDEX IF NOT EXISTS idx_agreement_versions_type_effective ON agreement_versions(agreement_type, effective_date);
CREATE INDEX IF NOT EXISTS idx_agreement_versions_active ON agreement_versions(is_active, agreement_type);

-- Insert current agreement versions with hash
INSERT INTO agreement_versions (agreement_type, version, effective_date, agreement_text, agreement_hash, created_by) 
VALUES 
(
    'ORGANISER', 
    '2025-12-09', 
    '2025-12-09 00:00:00',
    'PLACEHOLDER_ORGANISER_AGREEMENT_TEXT',
    'placeholder_hash_organiser',
    'system_migration'
),
(
    'USER', 
    '2024-12-15', 
    '2024-12-15 00:00:00',
    'PLACEHOLDER_USER_AGREEMENT_TEXT', 
    'placeholder_hash_user',
    'system_migration'
)
ON CONFLICT (agreement_type, version) DO NOTHING;

-- Add comment explaining the audit trail purpose
COMMENT ON TABLE legal_agreements IS 'Immutable audit trail of user agreement acceptances. Each row represents a specific acceptance event with full agreement text preserved for legal compliance.';
COMMENT ON COLUMN legal_agreements.agreement_text IS 'Full text of agreement at time of acceptance - immutable for legal compliance';
COMMENT ON COLUMN legal_agreements.agreement_hash IS 'SHA-256 hash of agreement text for tamper detection';
COMMENT ON COLUMN legal_agreements.consent_method IS 'How consent was obtained: web_form, api, email, etc.';
COMMENT ON COLUMN legal_agreements.is_withdrawn IS 'Whether user has withdrawn consent for this specific agreement';
COMMENT ON COLUMN legal_agreements.withdrawn_at IS 'Timestamp when consent was withdrawn';

COMMENT ON TABLE agreement_versions IS 'Master table of agreement versions with full text and metadata';
COMMENT ON COLUMN agreement_versions.effective_date IS 'When this version became active';
COMMENT ON COLUMN agreement_versions.expiry_date IS 'When this version expires (NULL = no expiry)';
COMMENT ON COLUMN agreement_versions.is_active IS 'Whether this version is currently active for new acceptances';
