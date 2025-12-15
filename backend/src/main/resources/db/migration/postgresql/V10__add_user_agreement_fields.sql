-- Add user agreement fields to members table
ALTER TABLE members
ADD COLUMN has_accepted_user_agreement BOOLEAN DEFAULT FALSE,
ADD COLUMN user_agreement_accepted_at TIMESTAMP;

-- Add comment for documentation
COMMENT ON COLUMN members.has_accepted_user_agreement IS 'Whether the user has accepted the Terms of Service';
COMMENT ON COLUMN members.user_agreement_accepted_at IS 'Timestamp when user accepted the Terms of Service';
