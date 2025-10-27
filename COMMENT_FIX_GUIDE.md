# Comment Feature - 403 Error Fix Guide

## What Was Fixed

### 1. ✅ Flyway Migrations Created
Created database migration files for comment tables:
- `V5__Add_comment_tables.sql` (MariaDB version)
- `postgresql/V5__Add_comment_tables.sql` (PostgreSQL version)

These will automatically create the `event_comments` and `event_comment_replies` tables when the backend starts.

### 2. ✅ Security Configuration Updated
Updated `SecurityConfig.java` to properly handle comment endpoints:

**Before:** All `/api/v1/events/**` endpoints were public (permitAll)

**After:** More granular control:
- ✅ **GET** `/api/v1/events/*/comments` - Public (anyone can view comments)
- 🔒 **POST/PUT/DELETE** comment endpoints - Require authentication
- ✅ **GET** `/api/v1/events/public/**` - Public (event details, participants)
- 🔒 All other `/api/v1/events/**` endpoints - Require authentication

## How to Test

### Step 1: Restart Backend
The backend needs to restart for Flyway to run the migrations:

```bash
cd organiser-platform/backend

# Stop the current backend (Ctrl+C if running)

# Start it again
./gradlew bootRun
```

**Watch for these log messages:**
```
Flyway: Migrating schema to version 5 - Add comment tables
Flyway: Successfully applied 1 migration
```

### Step 2: Verify Database Tables
Once the backend starts, the following tables should exist:
- `event_comments`
- `event_comment_replies`

### Step 3: Test Comment Endpoints

#### A. View Comments (No Auth Required) ✅
```bash
# Should work without authentication
curl http://localhost:8080/api/v1/events/1/comments
```

Expected: `200 OK` with comment array (empty if no comments yet)

#### B. Create Comment (Auth Required) 🔒
```bash
# Will FAIL without token
curl -X POST http://localhost:8080/api/v1/events/1/comments \
  -H "Content-Type: application/json" \
  -d '{"content": "Test comment"}'

# Expected: 401 or 403 error
```

```bash
# Will SUCCEED with valid token
curl -X POST http://localhost:8080/api/v1/events/1/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{"content": "Test comment"}'

# Expected: 200 OK with created comment
```

### Step 4: Test in Frontend

1. **Navigate** to any event detail page
2. **Scroll down** to the comment section
3. **Without login**:
   - Should see existing comments
   - Should see "Login to join the conversation" message
4. **After login**:
   - Should see textarea to add comments
   - Can post comments
   - Can reply to comments
   - Can edit/delete own comments

## Common Issues & Solutions

### Issue: 403 Error on GET Comments
**Cause:** Backend not restarted after adding new endpoints  
**Solution:** Restart backend server

### Issue: 404 Error on Comments
**Cause:** Flyway migration hasn't run yet  
**Solution:** 
1. Check backend logs for Flyway migration messages
2. Verify tables exist in database
3. Restart backend if needed

### Issue: 401 Error on POST Comment
**Cause:** No authentication token provided  
**Solution:** This is expected! User must be logged in to post comments

### Issue: Token provided but still 403
**Cause:** Invalid or expired JWT token  
**Solution:** 
1. Log out and log back in to get fresh token
2. Check browser console for token issues
3. Verify JWT_SECRET matches in backend

## API Endpoints Reference

### Public Endpoints (No Auth)
- `GET /api/v1/events/{eventId}/comments` - View all comments

### Authenticated Endpoints
- `POST /api/v1/events/{eventId}/comments` - Create comment
- `PUT /api/v1/events/comments/{commentId}` - Update comment
- `DELETE /api/v1/events/comments/{commentId}` - Delete comment
- `POST /api/v1/events/comments/{commentId}/replies` - Create reply
- `PUT /api/v1/events/replies/{replyId}` - Update reply
- `DELETE /api/v1/events/replies/{replyId}` - Delete reply

## Database Schema

### event_comments
```sql
- id (BIGINT, PRIMARY KEY)
- event_id (BIGINT, FK -> events.id)
- member_id (BIGINT, FK -> members.id)
- content (TEXT)
- edited (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### event_comment_replies
```sql
- id (BIGINT, PRIMARY KEY)
- comment_id (BIGINT, FK -> event_comments.id)
- member_id (BIGINT, FK -> members.id)
- content (TEXT)
- edited (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## Success Indicators

✅ Backend starts without errors  
✅ Flyway migration V5 runs successfully  
✅ Can view comments without login  
✅ Cannot post comments without login (401/403 is correct)  
✅ Can post comments when logged in  
✅ Can reply to comments when logged in  
✅ Can edit/delete own comments only  

---

**Last Updated:** October 2025  
**Status:** Ready for testing after backend restart
