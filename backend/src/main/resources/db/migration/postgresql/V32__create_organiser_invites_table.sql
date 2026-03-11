CREATE TABLE organiser_invites (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(36) NOT NULL UNIQUE,
    created_by_admin_id BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    note VARCHAR(255),
    used_by_member_id BIGINT REFERENCES members(id) ON DELETE SET NULL,
    used_at TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    is_used BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_organiser_invites_token ON organiser_invites(token);
CREATE INDEX idx_organiser_invites_admin ON organiser_invites(created_by_admin_id);
CREATE INDEX idx_organiser_invites_expires ON organiser_invites(expires_at);
