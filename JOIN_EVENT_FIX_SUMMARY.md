# Join Event Fix Summary

## Issues Fixed

### 1. **Frontend API Endpoint Error** ✅
**Problem:** Frontend was calling `/api/v1/events/public/3/join` (incorrect)  
**Solution:** Fixed to `/api/v1/events/3/join` (correct)

**File Changed:** `frontend/src/lib/api.js`
```javascript
// Before ❌
joinEvent: (id) => api.post(`/events/public/${id}/join`),

// After ✅
joinEvent: (id) => api.post(`/events/${id}/join`),
```

---

### 2. **Backend StackOverflowError - Circular Reference** ✅
**Problem:** Hibernate entities had circular references in `hashCode()` and `toString()` methods, causing infinite loops when joining events.

**Solution:** Added `@EqualsAndHashCode` and `@ToString` annotations to exclude bidirectional relationships.

**Files Changed:**
- `backend/src/main/java/com/organiser/platform/model/Event.java`
- `backend/src/main/java/com/organiser/platform/model/EventParticipant.java`

```java
// Event.java
@EqualsAndHashCode(exclude = {"participants", "eventOrganisers", "group"})
@ToString(exclude = {"participants", "eventOrganisers", "group"})
public class Event { ... }

// EventParticipant.java
@EqualsAndHashCode(exclude = {"member", "event"})
@ToString(exclude = {"member", "event"})
public class EventParticipant { ... }
```

---

## How to Test

### Complete Flow:

#### 1. **Request Magic Link**
```bash
curl -X POST http://localhost:8080/api/v1/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"user3@test.com"}'
```

Response:
```json
{"message":"Magic link sent to your email","email":"user3@test.com"}
```

#### 2. **Get Token from Backend Logs**
In development, the magic link token is logged:
```
Magic Link for: user3@test.com
Link: http://localhost:3000/auth/verify?token=abc-def-123
```

#### 3. **Verify Magic Link & Get JWT**
```bash
curl "http://localhost:8080/api/v1/auth/verify?token=abc-def-123"
```

Response:
```json
{
  "token": "eyJhbGc...",
  "userId": 4,
  "email": "user3@test.com",
  "role": "MEMBER"
}
```

#### 4. **Join Event**
```bash
curl -X POST "http://localhost:8080/api/v1/events/3/join" \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json"
```

Success Response:
```json
{
  "id": 3,
  "title": "Sunrise Run at Ocean Beach",
  "currentParticipants": 3,
  "participantIds": [2, 3, 4],
  ...
}
```

---

## API Endpoints Reference

### Public Endpoints (No Auth Required)
- `GET /api/v1/events/public/{id}` - Get event details
- `GET /api/v1/events/public/upcoming` - List upcoming events
- `GET /api/v1/events/public/activity/{activityId}` - Events by activity
- `GET /api/v1/events/public/group/{groupId}` - Events by group

### Authenticated Endpoints (JWT Required)
- `POST /api/v1/events/{id}/join` - Join an event
- `POST /api/v1/events/{id}/leave` - Leave an event
- `POST /api/v1/events` - Create new event (organiser only)
- `DELETE /api/v1/events/{id}` - Delete event (organiser only)

### Authentication Endpoints
- `POST /api/v1/auth/magic-link` - Request magic link
- `GET /api/v1/auth/verify?token={token}` - Verify magic link

---

## Test Results ✅

**Test:** User2 (userId: 3) joins Event 3
- ✅ Magic link generated successfully
- ✅ JWT token received
- ✅ Join event succeeded
- ✅ `currentParticipants` increased from 0 to 3
- ✅ `participantIds` now includes userId 3
- ✅ No StackOverflowError
- ✅ No circular reference issues

---

## Frontend Integration

### Update your frontend code:

```javascript
// services/eventService.js
import api from '../lib/api';

export const joinEvent = async (eventId) => {
  try {
    const response = await api.joinEvent(eventId);
    return response.data;
  } catch (error) {
    if (error.response?.status === 400) {
      // Already joined or event full
      throw new Error(error.response.data.message);
    }
    throw error;
  }
};

// Usage in component
const handleJoinEvent = async () => {
  try {
    const updatedEvent = await joinEvent(eventId);
    console.log(`Successfully joined! Participants: ${updatedEvent.currentParticipants}`);
  } catch (error) {
    console.error('Failed to join event:', error.message);
  }
};
```

---

## Notes

1. **Authentication**: This platform uses passwordless authentication via magic links
2. **Email in Development**: Magic links are logged to console in development
3. **JWT Expiry**: Tokens expire after 24 hours
4. **Duplicate Prevention**: The unique constraint prevents users from joining the same event twice

---

## Quick Test Script

Run the provided test script:
```bash
./test-join-event.sh
```

Or manually test:
```bash
# View event participants
curl -s http://localhost:8080/api/v1/events/public/3 | jq '.currentParticipants, .participantIds'
```

---

**Status:** ✅ All issues resolved and tested
**Date:** 2025-10-16
