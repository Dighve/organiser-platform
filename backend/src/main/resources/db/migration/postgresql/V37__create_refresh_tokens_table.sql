-- Create refresh_tokens table for secure token rotation
CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(500) NOT NULL UNIQUE,
    member_id BIGINT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_at TIMESTAMP,
    replaced_by_token VARCHAR(500),
    device_info VARCHAR(500),
    ip_address VARCHAR(45),
    
    CONSTRAINT fk_refresh_token_member FOREIGN KEY (member_id) 
        REFERENCES members(id) ON DELETE CASCADE
);

-- Note: token column has UNIQUE constraint which automatically creates an index
-- No need for explicit idx_refresh_tokens_token index

-- Index for finding user's active tokens
CREATE INDEX idx_refresh_tokens_member_id ON refresh_tokens(member_id);

-- Index for cleanup of expired tokens
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- Index for finding active (non-revoked) tokens
CREATE INDEX idx_refresh_tokens_revoked ON refresh_tokens(revoked);

COMMENT ON TABLE refresh_tokens IS 'Stores refresh tokens for long-term authentication with rotation support';
COMMENT ON COLUMN refresh_tokens.token IS 'Unique refresh token (UUID format)';
COMMENT ON COLUMN refresh_tokens.member_id IS 'User who owns this refresh token';
COMMENT ON COLUMN refresh_tokens.expires_at IS 'Token expiration timestamp (30 days from creation)';
COMMENT ON COLUMN refresh_tokens.revoked IS 'Whether token has been revoked (logout or security)';
COMMENT ON COLUMN refresh_tokens.replaced_by_token IS 'New token that replaced this one (rotation)';
COMMENT ON COLUMN refresh_tokens.device_info IS 'User agent string for device tracking';
COMMENT ON COLUMN refresh_tokens.ip_address IS 'IP address where token was created';
