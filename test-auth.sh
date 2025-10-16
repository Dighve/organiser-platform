#!/bin/bash

echo "=========================================="
echo "Testing Organiser Platform Authentication"
echo "=========================================="

# Request magic link
echo -e "\n1. Requesting magic link for organiser@test.com..."
RESPONSE=$(curl -s -X POST http://localhost:8080/api/v1/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"organiser@test.com"}')

echo "Response: $RESPONSE"

# Get token from database
echo -e "\n2. Getting magic link token from database..."
sleep 1
TOKEN=$(docker exec organiser-platform-mariadb mariadb -u organiser_user -porganiser_pass organiser_platform \
  -N -e "SELECT token FROM magic_links WHERE email='organiser@test.com' ORDER BY created_at DESC LIMIT 1;" 2>/dev/null)

if [ -z "$TOKEN" ]; then
    echo "ERROR: Could not retrieve token from database"
    exit 1
fi

echo "Magic Link Token: $TOKEN"

# Verify token and get JWT
echo -e "\n3. Verifying magic link token..."
JWT_RESPONSE=$(curl -s "http://localhost:8080/api/v1/auth/verify?token=$TOKEN")

echo "JWT Response:"
echo "$JWT_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$JWT_RESPONSE"

# Extract JWT token
JWT_TOKEN=$(echo $JWT_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$JWT_TOKEN" ]; then
    echo "ERROR: Could not extract JWT token"
    exit 1
fi

echo -e "\n4. JWT Token extracted successfully!"
echo "JWT: ${JWT_TOKEN:0:50}..."

# Test authenticated endpoint - Get my events
echo -e "\n5. Testing authenticated endpoint: Get My Events"
echo "=========================================="
MY_EVENTS=$(curl -s "http://localhost:8080/api/v1/events/organiser/my-events" \
  -H "Authorization: Bearer $JWT_TOKEN")

echo "$MY_EVENTS" | python3 -m json.tool 2>/dev/null || echo "$MY_EVENTS"

# Test public endpoint - Get all activities
echo -e "\n6. Testing public endpoint: Get All Activities"
echo "=========================================="
ACTIVITIES=$(curl -s "http://localhost:8080/api/v1/activities/public")

echo "$ACTIVITIES" | python3 -m json.tool 2>/dev/null || echo "$ACTIVITIES"

# Test public endpoint - Get all events
echo -e "\n7. Testing public endpoint: Get All Events"
echo "=========================================="
ALL_EVENTS=$(curl -s "http://localhost:8080/api/v1/events/public?page=0&size=5")

echo "$ALL_EVENTS" | python3 -m json.tool 2>/dev/null || echo "$ALL_EVENTS"

echo -e "\n=========================================="
echo "Testing Complete!"
echo "=========================================="
echo -e "\nYou can use this JWT token in your requests:"
echo "$JWT_TOKEN"
echo -e "\nExample usage:"
echo "curl -H \"Authorization: Bearer $JWT_TOKEN\" http://localhost:8080/api/v1/events/organiser/my-events"
