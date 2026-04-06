-- Run these queries in your database to find the IDs you need

-- 1. Find member IDs (you need 5 different member IDs)
SELECT id, email, display_name 
FROM members 
ORDER BY id 
LIMIT 10;

-- 2. Find event and group IDs (you need 1 event ID and its group ID)
SELECT 
    e.id as event_id, 
    e.title as event_title,
    e.group_id,
    g.name as group_name
FROM events e 
JOIN groups g ON e.group_id = g.id 
ORDER BY e.id 
LIMIT 10;

-- 3. Check if you already have any reviews
SELECT COUNT(*) as review_count FROM event_reviews;

-- 4. Check if group_rating_summary table exists and has data
SELECT * FROM group_rating_summary;
