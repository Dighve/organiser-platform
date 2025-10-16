#!/bin/bash

echo "=========================================="
echo "Testing Join Event Flow"
echo "=========================================="
echo

# Step 1: Request magic link
echo "1. Requesting magic link for user3@test.com..."
curl -X POST http://localhost:8080/api/v1/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"user3@test.com"}' \
  -s | python3 -m json.tool

echo
echo "2. Check backend logs for magic link token..."
echo "   (In production, this would be sent via email)"
echo

# Note: In a real scenario, you'd extract the token from email
# For testing, get it from backend logs
echo "3. Verify magic link and get JWT token..."
echo "   Example: curl http://localhost:8080/api/v1/auth/verify?token=YOUR_TOKEN"
echo

echo "4. Use JWT token to join event..."
echo "   Example: curl -X POST http://localhost:8080/api/v1/events/3/join \\"
echo "     -H 'Authorization: Bearer YOUR_JWT_TOKEN'"
echo

echo "=========================================="
echo "Quick Test Commands:"
echo "=========================================="
echo
echo "# View event 3:"
echo "curl -s http://localhost:8080/api/v1/events/public/3 | jq '.currentParticipants, .participantIds'"
echo
echo "# Get all upcoming events:"
echo "curl -s 'http://localhost:8080/api/v1/events/public/upcoming?page=0&size=5' | jq '.content[] | {id, title, currentParticipants}'"
echo
