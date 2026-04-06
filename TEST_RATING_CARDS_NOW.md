# Test Rating Cards Immediately (No Database Setup Required)

You can see the rating cards working **right now** without inserting database data by temporarily using mock data.

## Option 1: Quick Test with Mock Data (5 minutes)

### Step 1: Open GroupDetailPage.jsx

File: `frontend/src/pages/GroupDetailPage.jsx`

### Step 2: Add Mock Data Import

At the top of the file (around line 14), add:

```javascript
import { mockGroupRating } from '../mocks/reviewMockData'
```

### Step 3: Find the Rating Card Section

Search for this line (around line 487-490):

```javascript
{group?.rating && group.rating.totalReviews >= 3 && (
  <GroupRatingCardMobile rating={group.rating} />
)}
```

### Step 4: Replace with Mock Data

Change it to:

```javascript
{/* Temporarily using mock data for testing */}
<GroupRatingCardMobile rating={mockGroupRating} />
```

And find the desktop version (around line 851-856):

```javascript
{group?.rating && group.rating.totalReviews >= 3 && (
  <GroupRatingCard rating={group.rating} />
)}
```

Change it to:

```javascript
{/* Temporarily using mock data for testing */}
<GroupRatingCard rating={mockGroupRating} />
```

### Step 5: Save and View

1. Save the file
2. Go to any group page: `http://localhost:5173/groups/{any-group-id}`
3. **You'll see the rating cards!** ⭐ 4.5 (12 reviews)

---

## Option 2: Insert Real Database Data (Proper Way)

If you want real data from the database:

### Step 1: Connect to Your Database

Use any PostgreSQL client (DBeaver, pgAdmin, TablePlus, etc.)

Connection:
- Host: `localhost`
- Port: `5432`
- Database: `organiser_platform`
- User: `postgres`

### Step 2: Find Your IDs

Run this in your database:

```sql
-- Get member IDs
SELECT id, email FROM members ORDER BY id LIMIT 10;

-- Get event and group IDs  
SELECT e.id, e.title, e.group_id, g.name 
FROM events e 
JOIN groups g ON e.group_id = g.id 
LIMIT 10;
```

Write down:
- 1 event_id
- 1 group_id (from that event)
- 5 different member_ids

### Step 3: Customize and Run This SQL

Replace the numbers with YOUR actual IDs:

```sql
INSERT INTO event_reviews (
    event_id, group_id, member_id,
    organization_rating, route_rating, group_rating, 
    safety_rating, value_rating,
    comment, would_recommend, would_join_again,
    created_at, updated_at
) VALUES 
(YOUR_EVENT_ID, YOUR_GROUP_ID, YOUR_MEMBER_ID_1, 5, 5, 5, 5, 5, 'Amazing hike!', true, true, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
(YOUR_EVENT_ID, YOUR_GROUP_ID, YOUR_MEMBER_ID_2, 5, 4, 5, 5, 4, 'Great experience!', true, true, NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
(YOUR_EVENT_ID, YOUR_GROUP_ID, YOUR_MEMBER_ID_3, 4, 4, 5, 5, 4, 'Excellent!', true, true, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
(YOUR_EVENT_ID, YOUR_GROUP_ID, YOUR_MEMBER_ID_4, 5, 5, 4, 5, 5, 'Fantastic!', true, true, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
(YOUR_EVENT_ID, YOUR_GROUP_ID, YOUR_MEMBER_ID_5, 4, 5, 4, 5, 4, 'Enjoyed it!', true, true, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');
```

### Step 4: Verify

```sql
SELECT * FROM group_rating_summary WHERE group_id = YOUR_GROUP_ID;
```

You should see `average_rating: 4.6` and `total_reviews: 5`

### Step 5: Remove Mock Data from Frontend

If you added mock data in Option 1, remove it and the rating cards will now use real database data.

---

## Why Rating Cards Aren't Showing (Checklist)

- [ ] **No reviews in database** - Need at least 3 reviews
- [ ] **Backend API not implemented** - Need `/api/v1/groups/{id}/rating` endpoint
- [ ] **Frontend not fetching rating** - Check if API call is made
- [ ] **Group has <3 reviews** - Minimum 3 reviews required to show rating

---

## Quick Diagnosis

Run this in your database:

```sql
-- Check if you have any reviews
SELECT COUNT(*) FROM event_reviews;

-- Check if group_rating_summary has data
SELECT * FROM group_rating_summary;

-- Check which groups have enough reviews
SELECT group_id, total_reviews, average_rating 
FROM group_rating_summary 
WHERE total_reviews >= 3;
```

If all return 0 or empty → **You need to insert test data (Option 2)**

---

## Recommended: Start with Option 1

**Use mock data first** to see the rating cards working, then move to real database data once you're happy with the UI.

This way you can:
1. ✅ See the rating cards immediately
2. ✅ Test the UI/UX
3. ✅ Verify the design
4. ✅ Then add real data when ready
