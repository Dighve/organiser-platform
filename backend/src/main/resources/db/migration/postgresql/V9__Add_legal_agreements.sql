-- Legal agreements tracking table
CREATE TABLE legal_agreements (
    id BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    agreement_type VARCHAR(50) NOT NULL,
    agreement_version VARCHAR(20) NOT NULL,
    accepted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    UNIQUE(member_id, agreement_type)
);

CREATE INDEX idx_legal_agreements_member ON legal_agreements(member_id);
CREATE INDEX idx_legal_agreements_type ON legal_agreements(agreement_type);

-- Add organiser agreement flag to members table
ALTER TABLE members ADD COLUMN IF NOT EXISTS has_accepted_organiser_agreement BOOLEAN DEFAULT FALSE;
ALTER TABLE members ADD COLUMN IF NOT EXISTS organiser_agreement_accepted_at TIMESTAMP;

-- Backfill existing organisers (assume they accepted when they became organisers)
UPDATE members 
SET has_accepted_organiser_agreement = TRUE,
    organiser_agreement_accepted_at = created_at
WHERE is_organiser = TRUE;
