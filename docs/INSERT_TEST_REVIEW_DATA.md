# How to Insert Test Review Data

Quick guide to add test reviews to your database for testing rating cards.

## Step 1: Find Your Database IDs

First, you need to find the actual IDs from your database. Connect to your database and run these queries:

### Find Event IDs
```sql
SELECT id, title, group_id, event_date 
FROM events 
WHERE group_id IS NOT NULL 
ORDER BY id 
LIMIT 5;
```

### Find Member IDs
```sql
SELECT id, email, display_name 
FROM members 
ORDER BY id 
LIMIT 10;
```

### Find Group IDs
```sql
SELECT id, name 
FROM groups 
ORDER BY id 
LIMIT 5;
```

**Write down these IDs - you'll need them in Step 2!**

---

## Step 2: Update the SQL Script

1. Open the file: `backend/src/main/resources/db/test-data/insert_test_reviews.sql`

2. Find all lines with comments like:
   - `-- CHANGE THIS: Your event ID`
   - `-- CHANGE THIS: Your group ID`
   - `-- CHANGE THIS: Reviewer member ID`

3. Replace the placeholder numbers with your actual IDs:
   ```sql
   -- BEFORE:
   event_id = 1, -- CHANGE THIS: Your event ID
   
   -- AFTER (example):
   event_id = 42, -- Your actual event ID
   ```

**Important Rules:**
- All 5 reviews should use the **same event_id** and **group_id**
- Each review must use a **different reviewer_id**
- Reviewer IDs must be members who are **NOT the event organizer**
- Use members who have actually joined the event (or add them as participants first)

---

## Step 3: Run the SQL Script

### Option A: Using Database GUI (Recommended)

If you're using a database GUI like DBeaver, pgAdmin, or DataGrip:

1. Open the SQL script file
2. Connect to your database
3. Execute the script
4. Check for any errors

### Option B: Using Command Line

```bash
# Navigate to the backend directory
cd backend/src/main/resources/db/test-data

# Run the script (adjust connection details as needed)
psql -U your_username -d organiser_platform -f insert_test_reviews.sql
```

### Option C: Using Spring Boot Application

The migration file `V44__insert_test_review_data.sql` will run automatically when you start the backend, but you need to update the IDs first.

---

## Step 4: Verify the Data

After inserting the reviews, verify they were added correctly:

### Check Reviews Were Inserted
```sql
SELECT * FROM event_reviews WHERE group_id = 1; -- Use your group ID
```

You should see 5 reviews.

### Check Group Rating Calculation
```sql
SELECT 
  group_id,
  COUNT(*) as total_reviews,
  ROUND(AVG(overall_rating), 1) as avg_rating,
  ROUND(AVG(organization_rating), 1) as avg_organization,
  ROUND(AVG(route_rating), 1) as avg_route,
  ROUND(AVG(group_atmosphere_rating), 1) as avg_atmosphere,
  ROUND(AVG(safety_rating), 1) as avg_safety,
  ROUND(AVG(value_rating), 1) as avg_value,
  ROUND(100.0 * SUM(CASE WHEN would_recommend THEN 1 ELSE 0 END) / COUNT(*), 0) as recommendation_pct
FROM event_reviews
WHERE group_id = 1 -- Use your group ID
GROUP BY group_id;
```

**Expected Results:**
- Total Reviews: 5
- Average Rating: ~4.6 stars
- Recommendation %: 100%

---

## Step 5: Test the UI

Now you can test the rating cards!

### Test Event Cards
1. Go to `http://localhost:5173` (home page)
2. Look at event cards in the grid
3. **Expected:** Event cards show ⭐ 4.6 (5 reviews) below the group name

### Test Group Detail Page
1. Navigate to the group page: `http://localhost:5173/groups/{groupId}`
2. Look at the sidebar (desktop) or below banner (mobile)
3. **Expected:** 
   - Large rating card showing 4.6 stars
   - Category breakdowns with progress bars
   - 100% recommendation percentage

### Test Event Detail Page
1. Navigate to the event page: `http://localhost:5173/events/{eventId}`
2. Look at the group card section
3. **Expected:** Group rating displayed below group name

---

## Troubleshooting

### Issue: "Foreign key constraint violation"

**Cause:** The reviewer_id doesn't exist in the members table.

**Solution:** 
1. Check which member IDs exist: `SELECT id FROM members;`
2. Use only existing member IDs in your script

---

### Issue: "Duplicate key value violates unique constraint"

**Cause:** A review already exists for this event/reviewer combination.

**Solution:**
1. Delete existing reviews: `DELETE FROM event_reviews WHERE event_id = X;`
2. Or use different reviewer IDs

---

### Issue: "Rating cards not showing on UI"

**Possible Causes:**
1. Group has less than 3 reviews (minimum required)
2. Backend API not returning rating data
3. Frontend not fetching rating data

**Solution:**
1. Verify you have ≥3 reviews: `SELECT COUNT(*) FROM event_reviews WHERE group_id = X;`
2. Check backend logs for errors
3. Check browser console for API errors
4. Verify the backend rating calculation endpoint is implemented

---

## Quick Copy-Paste Template

Here's a quick template you can copy and modify:

```sql
-- Replace X, Y, Z with your actual IDs
INSERT INTO event_reviews (
    event_id, group_id, reviewer_id,
    organization_rating, route_rating, group_atmosphere_rating, 
    safety_rating, value_rating, overall_rating,
    comment, would_recommend, would_join_again,
    created_at, updated_at
) VALUES 
(X, Y, Z, 5, 5, 5, 5, 5, 5.0, 'Amazing experience!', true, true, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
(X, Y, Z+1, 5, 4, 5, 5, 4, 4.6, 'Great hike!', true, true, NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
(X, Y, Z+2, 4, 4, 5, 5, 4, 4.4, 'Very good!', true, true, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
(X, Y, Z+3, 5, 5, 4, 5, 5, 4.8, 'Excellent!', true, true, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
(X, Y, Z+4, 4, 5, 4, 5, 4, 4.4, 'Really enjoyed it!', true, true, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');
```

Where:
- X = Your event_id
- Y = Your group_id  
- Z = First reviewer_id (then Z+1, Z+2, etc. for other reviewers)

---

## Next Steps

After successfully inserting test data:

1. ✅ Verify rating cards appear on event cards
2. ✅ Verify rating cards appear on group detail page
3. ✅ Test mobile responsive design
4. ✅ Test with different numbers of reviews (3, 5, 10, etc.)
5. ✅ Test edge cases (1 review, 2 reviews - should not show)

---

## Files Reference

- **SQL Script:** `backend/src/main/resources/db/test-data/insert_test_reviews.sql`
- **Migration:** `backend/src/main/resources/db/migration/postgresql/V44__insert_test_review_data.sql`
- **Testing Guide:** `docs/REVIEW_UI_TESTING_GUIDE.md`
