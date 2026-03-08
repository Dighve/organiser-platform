CREATE TABLE IF NOT EXISTS web_push_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    endpoint VARCHAR(1000) NOT NULL UNIQUE,
    p256dh_key VARCHAR(255) NOT NULL,
    auth_key VARCHAR(255) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    last_notified_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_web_push_member ON web_push_subscriptions(member_id);
CREATE INDEX IF NOT EXISTS idx_web_push_active ON web_push_subscriptions(active);
