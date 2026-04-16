-- ============================================================
-- V50: Create member_contact_info table for social/messenger links
-- ============================================================

CREATE TABLE IF NOT EXISTS member_contact_info (
    id              BIGSERIAL PRIMARY KEY,
    member_id       BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    platform        VARCHAR(30) NOT NULL,        -- WHATSAPP, TELEGRAM, INSTAGRAM, FACEBOOK, X_TWITTER, LINKEDIN, SNAPCHAT, OTHER
    contact_value   VARCHAR(255) NOT NULL,       -- phone number, username, profile URL
    display_label   VARCHAR(100),                -- optional custom label e.g. "Personal WhatsApp"
    visibility      VARCHAR(30) NOT NULL DEFAULT 'GROUP_MEMBERS',  -- EVERYONE, GROUP_MEMBERS, EVENT_ATTENDEES, NOBODY
    display_order   INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_contact_info_member ON member_contact_info(member_id);
CREATE UNIQUE INDEX idx_contact_info_member_platform ON member_contact_info(member_id, platform);
