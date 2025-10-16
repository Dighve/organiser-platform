# Testing Guide - Organiser Platform

## Services Running

- **Backend**: http://localhost:8080
- **Frontend**: http://localhost:3002
- **Database**: MariaDB on port 3307

## Test User Account

- **Email**: `organiser@test.com`
- **Role**: MEMBER (verified organiser)
- **User ID**: 1

## Authentication Flow

Since the mail server is not running in development, you need to manually retrieve the magic link token from the database.

### Step 1: Request a Magic Link

```bash
curl -X POST http://localhost:8080/api/v1/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"organiser@test.com"}'
```

**Response:**
```json
{
  "message": "Magic link sent to your email",
  "email": "organiser@test.com"
}
```

### Step 2: Get the Magic Link Token from Database

```bash
docker exec organiser-platform-mariadb mariadb -u organiser_user -porganiser_pass organiser_platform \
  -e "SELECT token, email, expires_at FROM magic_links WHERE email='organiser@test.com' ORDER BY created_at DESC LIMIT 1;"
```

**Example Output:**
```
token                                   email                   expires_at
1658e29b-a20f-4afa-9fb8-12fc5414cb83   organiser@test.com      2025-10-16 15:35:12
```

### Step 3: Verify Magic Link and Get JWT Token

```bash
curl -s "http://localhost:8080/api/v1/auth/verify?token=YOUR_TOKEN_HERE"
```

**Example Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "type": "Bearer",
  "userId": 1,
  "email": "organiser@test.com",
  "role": "MEMBER"
}
```

### Step 4: Use JWT Token for Authenticated Requests

```bash
JWT_TOKEN="YOUR_JWT_TOKEN_HERE"

# Get my events
curl -s "http://localhost:8080/api/v1/events/organiser/my-events" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

## Quick Test Script

Run this script to get a fresh JWT token:

```bash
#!/bin/bash

# Request magic link
echo "Requesting magic link..."
curl -X POST http://localhost:8080/api/v1/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"organiser@test.com"}' 2>/dev/null

echo -e "\n\nGetting token from database..."
TOKEN=$(docker exec organiser-platform-mariadb mariadb -u organiser_user -porganiser_pass organiser_platform \
  -N -e "SELECT token FROM magic_links WHERE email='organiser@test.com' ORDER BY created_at DESC LIMIT 1;")

echo "Magic Link Token: $TOKEN"

echo -e "\nVerifying token..."
JWT_RESPONSE=$(curl -s "http://localhost:8080/api/v1/auth/verify?token=$TOKEN")

echo -e "\nJWT Response:"
echo $JWT_RESPONSE | python3 -m json.tool 2>/dev/null || echo $JWT_RESPONSE

JWT_TOKEN=$(echo $JWT_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

echo -e "\n\nJWT Token:"
echo $JWT_TOKEN

echo -e "\n\nTesting authenticated endpoint (My Events):"
curl -s "http://localhost:8080/api/v1/events/organiser/my-events" \
  -H "Authorization: Bearer $JWT_TOKEN" | python3 -m json.tool 2>/dev/null
```

Save this as `test-auth.sh`, make it executable (`chmod +x test-auth.sh`), and run it.

## Available API Endpoints

### Public Endpoints (No Authentication Required)

#### Activities
- `GET /api/v1/activities/public` - List all active activities
- `GET /api/v1/activities/public/{id}` - Get activity by ID

#### Events
- `GET /api/v1/events/public` - List all published events
- `GET /api/v1/events/public/{id}` - Get event by ID
- `GET /api/v1/events/public/search?keyword=mountain` - Search events
- `GET /api/v1/events/public/activity/{activityId}` - Filter events by activity

#### Authentication
- `POST /api/v1/auth/magic-link` - Request magic link
- `GET /api/v1/auth/verify?token=xxx` - Verify magic link

### Authenticated Endpoints (Requires JWT Token)

Add header: `Authorization: Bearer YOUR_JWT_TOKEN`

#### Events
- `GET /api/v1/events/organiser/my-events` - Get my events
- `POST /api/v1/events` - Create new event
- `POST /api/v1/events/{id}/publish` - Publish event
- `POST /api/v1/events/{id}/join` - Join event
- `POST /api/v1/events/{id}/leave` - Leave event

#### Groups
- `POST /api/v1/groups` - Create new group

## Test Data in Database

### Activities (5 total)
1. Hiking
2. Cycling
3. Running
4. Swimming
5. Yoga

### Members (4 total)
1. organiser@test.com (verified organiser)
2. user1@test.com (Alice Smith)
3. user2@test.com (Bob Johnson)
4. user3@test.com (Carol White)

### Groups (3 total)
1. Mountain Hikers (Hiking, primary organiser: organiser@test.com)
2. Bay Area Cyclists (Cycling, primary organiser: organiser@test.com)
3. Morning Runners (Running, primary organiser: organiser@test.com)

### Events (4 total)
1. **Mount Tamalpais Summit Hike** (7 days from now, INTERMEDIATE)
2. **Golden Gate Bridge Cycling Tour** (10 days from now, BEGINNER)
3. **Sunrise Run at Ocean Beach** (3 days from now, BEGINNER, FREE)
4. **Advanced Trail Running - Marin Headlands** (14 days from now, ADVANCED)

## Testing with Frontend

1. Open http://localhost:3002 in your browser
2. The frontend will show the login page
3. Enter `organiser@test.com` and click "Send Magic Link"
4. Since mail is not configured, follow the database steps above to get the token
5. Manually construct the verification URL: `http://localhost:3002/auth/verify?token=YOUR_TOKEN`
6. Visit that URL to complete authentication

## Common Test Scenarios

### Scenario 1: Browse Events as Guest
1. Visit http://localhost:3002
2. Browse the 4 published events
3. Filter by activity type
4. Search for events
5. View event details

### Scenario 2: View My Events as Organiser
1. Get JWT token (follow steps above)
2. Visit "My Events" page in frontend (requires authentication)
3. Should see 4 events created by organiser@test.com

### Scenario 3: Create New Event
1. Authenticate as organiser@test.com
2. Navigate to create event page
3. Fill in event details
4. Submit the form
5. Event should be created in DRAFT status

### Scenario 4: Join an Event
1. Authenticate as any user
2. Browse to an event detail page
3. Click "Join Event"
4. Should be added to event participants

## Troubleshooting

### Backend not responding
```bash
# Check if backend is running
curl http://localhost:8080/actuator/health

# Check backend logs
tail -f organiser-platform/backend/logs/application.log
```

### Database connection issues
```bash
# Check if MariaDB is running
docker ps | grep mariadb

# Connect to database
docker exec -it organiser-platform-mariadb mariadb -u organiser_user -porganiser_pass organiser_platform
```

### Frontend not loading
```bash
# Check if frontend is running on port 3002
lsof -i :3002

# Check frontend console in browser DevTools
```

## Notes

- JWT tokens expire after 24 hours
- Magic link tokens expire after 15 minutes
- The mail server is intentionally not running in development mode
- All test data is created with future dates (relative to NOW())
