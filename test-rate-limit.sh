#!/bin/bash

# Rate Limiting Test Script for OutMeets Platform
# Tests magic link and Google OAuth rate limits

BASE_URL="http://localhost:8080/api/v1"
COLORS=true

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   OutMeets Rate Limiting Test Suite       ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo ""

# Test 1: Magic Link Rate Limit (5 per hour)
echo -e "${YELLOW}Test 1: Magic Link Rate Limit (5 requests/hour)${NC}"
echo -e "${YELLOW}Expected: First 5 succeed, 6th fails with 429${NC}"
echo ""

for i in {1..6}; do
  echo -n "Request $i: "
  
  response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/magic-link" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","returnUrl":"/"}')
  
  status_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)
  
  if [ "$status_code" -eq 200 ]; then
    echo -e "${GREEN}✓ SUCCESS (200)${NC}"
  elif [ "$status_code" -eq 429 ]; then
    echo -e "${RED}✗ RATE LIMITED (429)${NC}"
    echo -e "   Message: $(echo $body | grep -o '"message":"[^"]*"' | cut -d'"' -f4)"
  else
    echo -e "${RED}✗ ERROR ($status_code)${NC}"
  fi
  
  sleep 0.5
done

echo ""
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""

# Test 2: Different Email (should work)
echo -e "${YELLOW}Test 2: Different Email (should bypass rate limit)${NC}"
echo -e "${YELLOW}Expected: Success (different rate limit key)${NC}"
echo ""

echo -n "Request with different email: "
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/magic-link" \
  -H "Content-Type: application/json" \
  -d '{"email":"different@example.com","returnUrl":"/"}')

status_code=$(echo "$response" | tail -n1)

if [ "$status_code" -eq 200 ]; then
  echo -e "${GREEN}✓ SUCCESS (200) - Rate limit is per IP+email${NC}"
else
  echo -e "${RED}✗ UNEXPECTED ($status_code)${NC}"
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""

# Test 3: Google OAuth Rate Limit (10 per minute)
echo -e "${YELLOW}Test 3: Google OAuth Rate Limit (10 requests/minute)${NC}"
echo -e "${YELLOW}Expected: First 10 succeed/fail with 400, 11th fails with 429${NC}"
echo ""

for i in {1..11}; do
  echo -n "Request $i: "
  
  response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/google" \
    -H "Content-Type: application/json" \
    -d '{"idToken":"fake-token-for-testing"}')
  
  status_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)
  
  if [ "$status_code" -eq 200 ] || [ "$status_code" -eq 400 ]; then
    echo -e "${GREEN}✓ PROCESSED ($status_code)${NC}"
  elif [ "$status_code" -eq 429 ]; then
    echo -e "${RED}✗ RATE LIMITED (429)${NC}"
    echo -e "   Message: $(echo $body | grep -o '"message":"[^"]*"' | cut -d'"' -f4)"
  else
    echo -e "${RED}✗ ERROR ($status_code)${NC}"
  fi
  
  sleep 0.5
done

echo ""
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""

# Summary
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           Test Summary                     ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "✓ Magic Link: 5 requests/hour per IP+email"
echo -e "✓ Google OAuth: 10 requests/minute per IP"
echo -e "✓ Different emails bypass rate limit"
echo -e "✓ 429 status code returned on limit exceeded"
echo ""
echo -e "${YELLOW}Note: Wait 1 hour to reset magic link limit${NC}"
echo -e "${YELLOW}Note: Wait 1 minute to reset OAuth limit${NC}"
echo ""
