-- Migrate any events with status FULL back to PUBLISHED.
-- FULL is no longer a stored status; fullness is derived from currentParticipants >= maxParticipants.
UPDATE events SET status = 'PUBLISHED' WHERE status = 'FULL';
