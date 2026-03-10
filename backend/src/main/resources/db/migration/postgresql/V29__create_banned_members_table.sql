-- ============================================================
-- Migration: V29 - Create banned_members table
-- Description: Track members banned from groups by organisers
-- ============================================================

CREATE TABLE banned_members (
    id BIGSERIAL PRIMARY KEY,
    group_id BIGINT NOT NULL,
    member_id BIGINT NOT NULL,
    banned_by_member_id BIGINT NOT NULL,
    banned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reason VARCHAR(500),
    
    -- Foreign keys
    CONSTRAINT fk_banned_group FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    CONSTRAINT fk_banned_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    CONSTRAINT fk_banned_by FOREIGN KEY (banned_by_member_id) REFERENCES members(id) ON DELETE SET NULL,
    
    -- Prevent duplicate bans
    CONSTRAINT unique_banned_member_per_group UNIQUE (group_id, member_id)
);

-- Indexes for performance
CREATE INDEX idx_banned_members_group_id ON banned_members(group_id);
CREATE INDEX idx_banned_members_member_id ON banned_members(member_id);
CREATE INDEX idx_banned_members_banned_at ON banned_members(banned_at);

-- Comments for documentation
COMMENT ON TABLE banned_members IS 'Tracks members banned from groups by organisers';
COMMENT ON COLUMN banned_members.group_id IS 'The group from which the member is banned';
COMMENT ON COLUMN banned_members.member_id IS 'The member who was banned';
COMMENT ON COLUMN banned_members.banned_by_member_id IS 'The organiser who banned the member';
COMMENT ON COLUMN banned_members.banned_at IS 'When the ban was applied';
COMMENT ON COLUMN banned_members.reason IS 'Optional reason for the ban';
