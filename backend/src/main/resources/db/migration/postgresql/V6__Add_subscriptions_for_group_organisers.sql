-- Migration to ensure all group organisers have active subscriptions
-- This is needed so organisers appear in the member list

INSERT INTO subscriptions (member_id, group_id, status, notification_enabled, subscribed_at)
SELECT 
    g.primary_organiser_id,
    g.id,
    'ACTIVE',
    true,
    g.created_at
FROM groups g
WHERE NOT EXISTS (
    SELECT 1 
    FROM subscriptions s 
    WHERE s.member_id = g.primary_organiser_id 
    AND s.group_id = g.id
);
