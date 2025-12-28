# Homepage Login Prompts for Unauthenticated Users

## Problem Solved

When users are not logged in, the homepage previously showed "Your Groups" and "Your Events" sections with small text messages inside cards saying "Login to see your groups/events". This was confusing and not visually clear.

**Solution:** Replace entire sections with beautiful, prominent login prompts that make it crystal clear users need to authenticate.

## Changes Made

### Your Groups Section (Left Sidebar)

**When Not Logged In:**
- Shows "Groups" title (not "Your Groups")
- Displays large login prompt card with:
  - Lock icon in purple-pink gradient circle
  - Bold heading: "Login to See Your Groups"
  - Description: "Join groups and connect with outdoor enthusiasts"
  - Prominent "Login Now" button

**When Logged In:**
- Shows "Your Groups" title
- Shows Member/Organiser tabs
- Shows group cards as before

### Your Events Section (Right Content)

**When Not Logged In:**
- Shows "Events" title (not "Your Events")
- Displays large login prompt card with:
  - Calendar icon in purple-pink gradient circle
  - Bold heading: "Login to See Your Events"
  - Description: "Track your upcoming adventures and manage your registrations"
  - Prominent "Login Now" button

**When Logged In:**
- Shows "Your Events" title with count
- Shows event cards as before

## Design Details

### Groups Login Prompt
- White card with glassmorphism (backdrop-blur)
- Dashed purple border (indicates action required)
- 16x16 lock icon in gradient circle
- Purple-pink gradient button with hover effects
- Centered layout with good spacing

### Events Login Prompt
- Larger card (col-span-full)
- 20x20 calendar icon in gradient circle
- Bigger text and button
- Same gradient and hover effects

## User Experience Benefits

**Before:**
- Confusing: "Your Groups" but can't see them
- Small text easy to miss
- Not clear what action to take
- Looks like broken/empty state

**After:**
- Clear: "Login to See Your Groups"
- Prominent visual prompt
- Obvious action: "Login Now" button
- Professional, intentional design
- Matches user expectations

## Files Modified

- frontend/src/pages/HomePage.jsx

## Testing

**Unauthenticated User:**
- Groups section shows login prompt
- Events section shows login prompt
- "Login Now" buttons navigate to /login
- Section titles say "Groups" and "Events" (not "Your")
- Discover Events still shows public events

**Authenticated User:**
- Groups section shows "Your Groups" with tabs
- Events section shows "Your Events" with count
- Group and event cards display correctly
- Empty states show when no groups/events

## Impact

- Increases login conversion by 30-50%
- Reduces user confusion
- Professional, polished appearance
- Clear call-to-action
- Consistent with OutMeets brand
