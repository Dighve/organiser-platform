-- Add join question to events (organiser-configured question asked on join)
ALTER TABLE events ADD COLUMN IF NOT EXISTS join_question TEXT;

-- Add join question answer to event_participants (attendee's answer)
ALTER TABLE event_participants ADD COLUMN IF NOT EXISTS join_question_answer TEXT;
