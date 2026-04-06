-- Test Review Data for Rating Cards
-- Run this script manually to insert test reviews for your existing events

-- INSTRUCTIONS:
-- 1. First, find your actual IDs by running:
--    SELECT id, title FROM events WHERE group_id IS NOT NULL ORDER BY id LIMIT 5;
--    SELECT id, email FROM members ORDER BY id LIMIT 10;
--    SELECT id, name FROM groups ORDER BY id LIMIT 5;
--
-- 2. Replace the placeholder IDs below with your actual IDs
-- 3. Run this script in your PostgreSQL database

-- ============================================
-- CONFIGURATION - UPDATE THESE VALUES
-- ============================================
-- Replace these with actual IDs from your database:
-- Event ID: The event you want to add reviews to
-- Group ID: The group that owns the event
-- Reviewer IDs: Different members who attended the event (NOT the organizer)

-- ============================================
-- TEST REVIEWS FOR EVENT 1
-- ============================================
-- These 5 reviews will create a group rating of ~4.6 stars

-- Review 1: Excellent (5.0 stars)
INSERT INTO event_reviews (
    event_id,
    group_id,
    member_id,
    organization_rating,
    route_rating,
    group_rating,
    safety_rating,
    value_rating,
    comment,
    would_recommend,
    would_join_again,
    created_at,
    updated_at
) VALUES (
    1, -- CHANGE THIS: Your event ID
    1, -- CHANGE THIS: Your group ID
    2, -- CHANGE THIS: Member ID (must have attended event)
    5, -- Organization rating
    5, -- Route rating
    5, -- Group atmosphere rating
    5, -- Safety rating
    5, -- Value rating
    'Amazing hike! The route was well-planned and the group was very welcoming. The organizer was professional and safety-conscious. Would definitely join again!',
    true,
    true,
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days'
);

-- Review 2: Very Good (4.6 stars)
INSERT INTO event_reviews (
    event_id,
    group_id,
    reviewer_id,
    organization_rating,
    route_rating,
    group_atmosphere_rating,
    safety_rating,
    value_rating,
    overall_rating,
    comment,
    would_recommend,
    would_join_again,
    created_at,
    updated_at
) VALUES (
    1, -- CHANGE THIS: Your event ID
    1, -- CHANGE THIS: Your group ID
    3, -- CHANGE THIS: Different reviewer member ID
    5,
    4,
    5,
    5,
    4,
    4.6,
    'Great experience overall. The organizer was very professional and the route was beautiful. Highly recommend this group!',
    true,
    true,
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '4 days'
);

-- Review 3: Good (4.4 stars)
INSERT INTO event_reviews (
    event_id,
    group_id,
    reviewer_id,
    organization_rating,
    route_rating,
    group_atmosphere_rating,
    safety_rating,
    value_rating,
    overall_rating,
    comment,
    would_recommend,
    would_join_again,
    created_at,
    updated_at
) VALUES (
    1, -- CHANGE THIS: Your event ID
    1, -- CHANGE THIS: Your group ID
    4, -- CHANGE THIS: Different reviewer member ID
    4,
    4,
    5,
    5,
    4,
    4.4,
    'Excellent organization and beautiful route. The group atmosphere was fantastic and everyone was very friendly.',
    true,
    true,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days'
);

-- Review 4: Very Good (4.8 stars)
INSERT INTO event_reviews (
    event_id,
    group_id,
    reviewer_id,
    organization_rating,
    route_rating,
    group_atmosphere_rating,
    safety_rating,
    value_rating,
    overall_rating,
    comment,
    would_recommend,
    would_join_again,
    created_at,
    updated_at
) VALUES (
    1, -- CHANGE THIS: Your event ID
    1, -- CHANGE THIS: Your group ID
    5, -- CHANGE THIS: Different reviewer member ID
    5,
    5,
    4,
    5,
    5,
    4.8,
    'Fantastic hike! Well organized, great route, and the safety measures were top-notch. Will definitely join more events from this group.',
    true,
    true,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
);

-- Review 5: Good (4.4 stars)
INSERT INTO event_reviews (
    event_id,
    group_id,
    reviewer_id,
    organization_rating,
    route_rating,
    group_atmosphere_rating,
    safety_rating,
    value_rating,
    overall_rating,
    comment,
    would_recommend,
    would_join_again,
    created_at,
    updated_at
) VALUES (
    1, -- CHANGE THIS: Your event ID
    1, -- CHANGE THIS: Your group ID
    6, -- CHANGE THIS: Different reviewer member ID
    4,
    5,
    4,
    5,
    4,
    4.4,
    'Really enjoyed this hike. The route was challenging but rewarding. Great group of people and excellent safety protocols.',
    true,
    true,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
);

-- ============================================
-- EXPECTED GROUP RATING SUMMARY
-- ============================================
-- After inserting these 5 reviews, the group should have:
-- Average Rating: 4.64 stars
-- Total Reviews: 5
-- Category Averages:
--   - Organization: 4.6
--   - Route: 4.6
--   - Group Atmosphere: 4.6
--   - Safety: 5.0
--   - Value: 4.4
-- Recommendation Percentage: 100% (5/5 would recommend)

-- ============================================
-- VERIFY THE DATA
-- ============================================
-- After running this script, verify with:
-- SELECT * FROM event_reviews WHERE group_id = 1;
-- 
-- Check group rating calculation:
-- SELECT 
--   group_id,
--   COUNT(*) as total_reviews,
--   ROUND(AVG(overall_rating), 1) as avg_rating,
--   ROUND(AVG(organization_rating), 1) as avg_organization,
--   ROUND(AVG(route_rating), 1) as avg_route,
--   ROUND(AVG(group_atmosphere_rating), 1) as avg_atmosphere,
--   ROUND(AVG(safety_rating), 1) as avg_safety,
--   ROUND(AVG(value_rating), 1) as avg_value,
--   ROUND(100.0 * SUM(CASE WHEN would_recommend THEN 1 ELSE 0 END) / COUNT(*), 0) as recommendation_pct
-- FROM event_reviews
-- WHERE group_id = 1
-- GROUP BY group_id;
