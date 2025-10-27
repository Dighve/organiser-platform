# Testing Group Membership Privacy Feature

## Quick Test Guide

### Prerequisites
- Backend running on `http://localhost:8080`
- Frontend running on `http://localhost:5173`
- At least 2 test users:
  - User A: Member of "Bangalore Hikers" group
  - User B: NOT a member of "Bangalore Hikers" group

---

## Test Scenarios

### ✅ Test 1: Group Member Can View Event
**As User A (Group Member):**
1. Login to the application
2. Navigate to an event in "Bangalore Hikers" group
3. **Expected Result:**
   - ✅ Full event details displayed
   - ✅ Can see all event information
   - ✅ Comments section visible with all comments
   - ✅ Can post new comments

---

### ❌ Test 2: Non-Member Cannot View Event
**As User B (Non-Member):**
1. Login to the application
2. Try to access an event URL directly (e.g., `/events/123`)
3. **Expected Result:**
   - ❌ Event details NOT shown
   - 🔒 "Members Only Event" message displayed
   - 🔒 Lock icon with purple gradient
   - ✅ "Browse Groups" button visible
   - ✅ "Back to Events" button visible

**Screenshot Expected:**
```
┌─────────────────────────────────────┐
│         🔒                          │
│   Members Only Event                │
│                                     │
│ This event is private and only     │
│ available to members of the group.  │
│                                     │
│ [Back to Events] [Browse Groups]   │
└─────────────────────────────────────┘
```

---

### ❌ Test 3: Non-Member Cannot View Comments
**As User B (Non-Member):**
1. (Assuming you modified the page to show comments section)
2. Try to view comments on a group event
3. **Expected Result:**
   - 🔒 "Members Only" message in comments section
   - ❌ Comments NOT displayed
   - ❌ Cannot see existing comments
   - ❌ Comment form NOT shown

**Screenshot Expected:**
```
┌─────────────────────────────────────┐
│ 💬 Comments (0)                    │
├─────────────────────────────────────┤
│         🔒                          │
│     Members Only                    │
│                                     │
│ Join the group to view and post    │
│ comments.                           │
│                                     │
│ Only group members can participate  │
│ in event discussions.               │
└─────────────────────────────────────┘
```

---

### ✅ Test 4: Group Organiser Has Full Access
**As Group Organiser:**
1. Login as the user who created "Bangalore Hikers"
2. Navigate to any event in that group
3. **Expected Result:**
   - ✅ Full access regardless of subscription status
   - ✅ Can view all event details
   - ✅ Can view and post comments
   - ✅ Can see attendees

---

### ❌ Test 5: API Direct Access (Postman/cURL)

**Test Event Endpoint:**
```bash
# Without authentication (should fail)
curl http://localhost:8080/api/v1/events/public/1

# Expected Response:
# Status: 403 Forbidden or 500
# Body: { "message": "Access denied. You must be a member..." }
```

**Test Comments Endpoint:**
```bash
# As non-member
curl -H "Authorization: Bearer <non-member-token>" \
  http://localhost:8080/api/v1/events/1/comments

# Expected Response:
# Status: 403 Forbidden or 500
# Body: { "message": "Access denied. You must be a member..." }
```

**Test as Member:**
```bash
# As member
curl -H "Authorization: Bearer <member-token>" \
  http://localhost:8080/api/v1/events/public/1

# Expected Response:
# Status: 200 OK
# Body: { "data": { ... event details ... } }
```

---

## Browser Console Tests

### Check API Responses
Open browser DevTools (F12) → Network tab:

1. **Navigate to event as non-member:**
   - Look for request to `/api/v1/events/public/123`
   - **Expected:** Status 403 or 500
   - **Response:** Error message about group membership

2. **Navigate to event as member:**
   - Look for request to `/api/v1/events/public/123`
   - **Expected:** Status 200
   - **Response:** Full event data

---

## Common Issues & Fixes

### Issue 1: Still seeing event details as non-member
**Fix:** 
- Clear browser cache and reload
- Check if backend was restarted after code changes
- Verify GroupService.isMemberOfGroup() is being called

### Issue 2: Member cannot see event
**Fix:**
- Check if subscription status is ACTIVE in database
- Verify user is actually a member (check subscriptions table)
- Check if user is the group organiser

### Issue 3: 500 Error instead of 403
**Fix:**
- Check backend logs for stack trace
- Verify all service methods are injected properly
- Ensure Authentication import is correct in controllers

### Issue 4: Lombok errors in IDE
**Note:** These are IDE cache issues, not real errors
- Run `./gradlew clean build` to verify code compiles
- Restart IDE if needed
- These won't affect runtime behavior

---

## Database Verification

### Check Group Membership
```sql
-- Check if user is member of group
SELECT * FROM subscriptions 
WHERE member_id = <user_id> 
  AND group_id = <group_id>
  AND status = 'ACTIVE';

-- Check who's the group organiser
SELECT id, name, primary_organiser_id 
FROM groups 
WHERE id = <group_id>;
```

### Sample Test Data
```sql
-- Create test group
INSERT INTO groups (name, description, primary_organiser_id, created_at) 
VALUES ('Test Hikers', 'Test group', 1, NOW());

-- Add member to group (active subscription)
INSERT INTO subscriptions (member_id, group_id, status, subscription_date) 
VALUES (2, 1, 'ACTIVE', NOW());

-- Create test event
INSERT INTO events (title, description, group_id, event_date, created_at) 
VALUES ('Test Hike', 'Test event', 1, NOW() + INTERVAL 7 DAY, NOW());
```

---

## Success Criteria

### ✅ All tests should pass if:
1. Non-members see "Members Only" UI for events
2. Non-members see "Members Only" UI for comments
3. Group members can view all event details
4. Group organisers have full access
5. API returns proper 403/500 errors for unauthorized access
6. Frontend gracefully handles errors with user-friendly messages

### ⚠️ Known Limitations:
- Comments section still renders if event loads successfully
- No caching of membership status (queries DB on every request)
- Error messages are generic RuntimeExceptions (not custom exceptions)

---

## Next Steps (Optional Enhancements)

1. **Add custom exceptions:** Create `GroupMembershipException` instead of RuntimeException
2. **Cache membership checks:** Use Spring Cache for `isMemberOfGroup()` results
3. **Add audit logging:** Log all access denial events
4. **Participants endpoint:** Apply same protection to `/api/v1/events/{id}/participants`
5. **Better error responses:** Return proper error DTOs with error codes
6. **Toast notifications:** Show toast when access is denied
7. **Redirect to group page:** Add direct link to join the specific group

---

## Rollback Plan

If feature causes issues:

1. **Quick disable:** Comment out membership checks in service methods
2. **Revert commits:** 
   ```bash
   git revert <commit-hash>
   ```
3. **Database:** No rollback needed (no schema changes)
4. **Frontend:** Remove error handling UI, revert to previous version

---

**Last Updated:** October 27, 2025  
**Feature Status:** ✅ Complete and Ready for Testing
