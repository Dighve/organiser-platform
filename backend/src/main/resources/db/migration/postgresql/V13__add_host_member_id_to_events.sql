-- Add host_member_id column to events table
-- This allows any group member to host an event, separate from the organiser

ALTER TABLE events
ADD COLUMN host_member_id BIGINT;

-- Add foreign key constraint to members table
ALTER TABLE events
ADD CONSTRAINT fk_events_host_member
FOREIGN KEY (host_member_id) REFERENCES members(id)
ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX idx_events_host_member ON events(host_member_id);

-- Add comment for documentation
COMMENT ON COLUMN events.host_member_id IS 'The member who is hosting/leading this event (can be different from organiser)';
