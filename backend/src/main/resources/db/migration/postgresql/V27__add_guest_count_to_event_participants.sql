-- Add guest_count to event participants to track attendee guests
ALTER TABLE event_participants
    ADD COLUMN IF NOT EXISTS guest_count INTEGER NOT NULL DEFAULT 0;
