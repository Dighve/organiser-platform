-- Create email_otps table for passcode-based authentication
-- 6-digit numeric codes sent via email, valid for 10 minutes, same-tab verification

CREATE TABLE email_otps (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(6) NOT NULL,
    email VARCHAR(100) NOT NULL,
    member_id BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN NOT NULL DEFAULT false,
    used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_otps_email ON email_otps(email);
CREATE INDEX idx_email_otps_code_email ON email_otps(code, email);
CREATE INDEX idx_email_otps_expires_at ON email_otps(expires_at);

-- Feature flag: when true, use passcode (OTP) auth; when false, use magic link
INSERT INTO feature_flags (flag_key, flag_name, description, is_enabled)
VALUES (
    'PASSCODE_AUTH_ENABLED',
    'Passcode (OTP) Authentication',
    'When enabled, email authentication uses a 6-digit passcode entered in the same tab instead of a magic link. Fixes mobile/PWA context loss issues.',
    false
);
