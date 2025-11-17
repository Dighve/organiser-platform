-- V7__Add_performance_indexes.sql (PostgreSQL version)
-- Add indexes for common query patterns to improve performance

-- Events table indexes
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_group_id ON events(group_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_group_date ON events(group_id, event_date);

-- Subscriptions table indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_member_id ON subscriptions(member_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_group_id ON subscriptions(group_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_member_status ON subscriptions(member_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_group_status ON subscriptions(group_id, status);

-- Event participants index
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_member_id ON event_participants(member_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_status ON event_participants(status);

-- Groups table indexes
CREATE INDEX IF NOT EXISTS idx_groups_primary_organiser_id ON groups(primary_organiser_id);
CREATE INDEX IF NOT EXISTS idx_groups_is_public ON groups(is_public);
CREATE INDEX IF NOT EXISTS idx_groups_active ON groups(active);

-- Event comments indexes (V5 already created idx_comment_event and idx_comment_member)
-- No new indexes needed - already covered by V5

-- Event comment replies indexes (V5 already created idx_reply_comment and idx_reply_member)
-- No new indexes needed - already covered by V5
