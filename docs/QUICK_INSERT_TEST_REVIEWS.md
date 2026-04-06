# Quick Guide: Insert Test Review Data

Follow these steps to add test reviews to your database for testing the rating cards.

## Step 1: Find Your Database IDs

Open your database tool (DBeaver, pgAdmin, etc.) or use psql and run:

```sql
-- Find your member IDs
SELECT id, email, display_name FROM members ORDER BY id;

-- Find your event IDs with groups
SELECT e.id, e.title, e.group_id, g.name as group_name 
FROM events e 
JOIN groups g ON e.group_id = g.id 
ORDER BY e.id;

-- Find your group IDs
SELECT id, name FROM groups ORDER BY id;
```

**Write down:**
- 1 Event ID (e.g., 5)
- 1 Group ID (e.g., 2)
- 5 different Member IDs (e.g., 1, 2, 3, 7, 8)

---

## Step 2: Copy and Customize This SQL

Replace `X`, `Y`, and `Z1-Z5` with your actual IDs:

```sql
-- X = Your event_id
-- Y = Your group_id
-- Z1, Z2, Z3, Z4, Z5 = Five different member_ids

INSERT INTO event_reviews (
    event_id, group_id, member_id,
    organization_rating, route_rating, group_rating, 
    safety_rating, value_rating,
    comment, would_recommend, would_join_again,
    created_at, updated_at
) VALUES 
-- Review 1: Excellent (5 stars)
(X, Y, Z1, 5, 5, 5, 5, 5, 
 'Amazing hike! Well-planned route and very welcoming group.', 
 true, true, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),

-- Review 2: Very Good (4.6 stars)
(X, Y, Z2, 5, 4, 5, 5, 4, 
 'Great experience! Professional organizer and beautiful route.', 
 true, true, NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),

-- Review 3: Good (4.4 stars)
(X, Y, Z3, 4, 4, 5, 5, 4, 
 'Excellent organization and fantastic group atmosphere.', 
 true, true, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),

-- Review 4: Very Good (4.8 stars)
(X, Y, Z4, 5, 5, 4, 5, 5, 
 'Fantastic hike! Top-notch safety measures.', 
 true, true, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),

-- Review 5: Good (4.4 stars)
(X, Y, Z5, 4, 5, 4, 5, 4, 
 'Really enjoyed it! Challenging but rewarding.', 
 true, true, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');
```

---

## Step 3: Example with Real IDs

If your IDs are:
- Event ID: 5
- Group ID: 2
- Member IDs: 1, 3, 7, 8, 9

Your SQL would be:

```sql
INSERT INTO event_reviews (
    event_id, group_id, member_id,
    organization_rating, route_rating, group_rating, 
    safety_rating, value_rating,
    comment, would_recommend, would_join_again,
    created_at, updated_at
) VALUES 
(5, 2, 1, 5, 5, 5, 5, 5, 'Amazing hike! Well-planned route and very welcoming group.', true, true, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
(5, 2, 3, 5, 4, 5, 5, 4, 'Great experience! Professional organizer and beautiful route.', true, true, NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
(5, 2, 7, 4, 4, 5, 5, 4, 'Excellent organization and fantastic group atmosphere.', true, true, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
(5, 2, 8, 5, 5, 4, 5, 5, 'Fantastic hike! Top-notch safety measures.', true, true, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
(5, 2, 9, 4, 5, 4, 5, 4, 'Really enjoyed it! Challenging but rewarding.', true, true, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');
```

---

## Step 4: Run the SQL

Execute the customized SQL in your database tool.

---

## Step 5: Verify the Data

```sql
-- Check reviews were inserted
SELECT * FROM event_reviews WHERE group_id = Y;  -- Replace Y with your group_id

-- Check the auto-calculated group rating summary
SELECT * FROM group_rating_summary WHERE group_id = Y;
```

**Expected Results:**
- 5 reviews in `event_reviews` table
- 1 row in `group_rating_summary` with:
  - `average_rating`: ~4.6
  - `total_reviews`: 5
  - `recommendation_percentage`: 100

---

## Step 6: Test the UI

1. **Start frontend:** `cd frontend && npm run dev`
2. **Go to home page:** `http://localhost:5173`
3. **Check event cards:** Should show ⭐ 4.6 (5 reviews)
4. **Go to group page:** `/groups/{groupId}`
5. **Check rating card:** Should show rating breakdown in sidebar

---

## Troubleshooting

**Error: "Foreign key constraint violation"**
- Member IDs don't exist. Run: `SELECT id FROM members;` and use existing IDs.

**Error: "Duplicate key value"**
- Review already exists for that event/member combo.
- Solution: Use different member IDs or delete existing: `DELETE FROM event_reviews WHERE event_id = X;`

**Rating cards not showing:**
- Need minimum 3 reviews (you have 5 ✓)
- Check backend API is returning rating data
- Check browser console for errors

---

## Quick Copy Template

```sql
-- CUSTOMIZE THESE VALUES:
-- Event ID: ___
-- Group ID: ___
-- Member IDs: ___, ___, ___, ___, ___

INSERT INTO event_reviews (event_id, group_id, member_id, organization_rating, route_rating, group_rating, safety_rating, value_rating, comment, would_recommend, would_join_again, created_at, updated_at) VALUES 
(?, ?, ?, 5, 5, 5, 5, 5, 'Amazing hike!', true, true, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
(?, ?, ?, 5, 4, 5, 5, 4, 'Great experience!', true, true, NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
(?, ?, ?, 4, 4, 5, 5, 4, 'Excellent organization!', true, true, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
(?, ?, ?, 5, 5, 4, 5, 5, 'Fantastic hike!', true, true, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
(?, ?, ?, 4, 5, 4, 5, 4, 'Really enjoyed it!', true, true, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');
```

Replace each `?` with your actual IDs.
