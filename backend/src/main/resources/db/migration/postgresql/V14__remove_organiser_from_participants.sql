-- Migration V14: Remove organisers from event participants (unless they're the host)
-- This fixes the issue where organisers were automatically added as participants

-- Delete event_participants records where:
-- 1. The member is the group's primary organiser
-- 2. The member is NOT the event's host
DELETE FROM event_participants ep
USING events e, groups g
WHERE ep.event_id = e.id
  AND e.group_id = g.id
  AND ep.member_id = g.primary_organiser_id
  AND (e.host_member_id IS NULL OR ep.member_id != e.host_member_id);

-- Note: This keeps the organiser in the participants list if they are also the host
