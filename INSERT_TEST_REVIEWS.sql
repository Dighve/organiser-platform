-- ============================================
-- STEP 1: Find your actual IDs first!
-- ============================================
-- Run these queries to find your IDs:

-- Find member IDs:
-- SELECT id, email, display_name FROM members ORDER BY id LIMIT 10;

-- Find event and group IDs:
-- SELECT e.id as event_id, e.title, e.group_id, g.name as group_name 
-- FROM events e 
-- JOIN groups g ON e.group_id = g.id 
-- ORDER BY e.id LIMIT 10;

-- ============================================
-- STEP 2: Replace the IDs below with YOUR actual IDs
-- ============================================

-- CHANGE THESE VALUES:
-- Event ID: Replace 1 with your actual event ID
-- Group ID: Replace 1 with your actual group ID  
-- Member IDs: Replace 1,2,3,4,5 with your actual member IDs (5 different members)

-- ============================================
-- STEP 3: Run this SQL in your database
-- ============================================

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
) VALUES 
-- Review 1: Excellent (5 stars)
(1, 1, 1, 5, 5, 5, 5, 5, 
 'Amazing hike! The route was well-planned and the group was very welcoming. Would definitely join again!', 
 true, true, 
 NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),

-- Review 2: Very Good (4.6 stars)
(1, 1, 2, 5, 4, 5, 5, 4, 
 'Great experience overall. The organizer was very professional and the route was beautiful.', 
 true, true, 
 NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),

-- Review 3: Good (4.4 stars)
(1, 1, 3, 4, 4, 5, 5, 4, 
 'Excellent organization and beautiful route. The group atmosphere was fantastic.', 
 true, true, 
 NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),

-- Review 4: Very Good (4.8 stars)
(1, 1, 4, 5, 5, 4, 5, 5, 
 'Fantastic hike! Well organized, great route, and the safety measures were top-notch.', 
 true, true, 
 NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),

-- Review 5: Good (4.4 stars)
(1, 1, 5, 4, 5, 4, 5, 4, 
 'Really enjoyed this hike. The route was challenging but rewarding. Great group!', 
 true, true, 
 NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

-- ============================================
-- STEP 4: Verify the data was inserted
-- ============================================
-- Run these queries to check:

-- Check reviews:
-- SELECT * FROM event_reviews WHERE group_id = 1;  -- Replace 1 with your group_id

-- Check auto-calculated group rating:
-- SELECT * FROM group_rating_summary WHERE group_id = 1;  -- Replace 1 with your group_id

-- Expected results:
-- - 5 reviews in event_reviews
-- - average_rating: ~4.6
-- - total_reviews: 5
-- - recommendation_percentage: 100

-- ============================================
-- TROUBLESHOOTING
-- ============================================

-- If you get "foreign key constraint violation":
-- The member IDs don't exist. Find real member IDs:
-- SELECT id FROM members ORDER BY id;

-- If you get "duplicate key value":
-- Review already exists. Delete existing reviews first:
-- DELETE FROM event_reviews WHERE event_id = 1;  -- Replace 1 with your event_id

-- If rating cards still don't show:
-- 1. Check you have >= 3 reviews (you should have 5)
-- 2. Check the group_rating_summary table was auto-populated
-- 3. Check backend API is running
-- 4. Check browser console for errors
