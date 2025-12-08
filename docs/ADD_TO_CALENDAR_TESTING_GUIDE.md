# Add to Calendar - Testing Guide

## 🧪 Complete Testing Workflow

### Prerequisites
- Backend server running on `http://localhost:8080`
- Frontend running on `http://localhost:5173`
- User account created and logged in
- At least one group and event created

## 📋 Step-by-Step Testing

### Test 1: Basic Flow - Join Event and Add to Calendar

#### Step 1: Navigate to Event
```
1. Go to http://localhost:5173
2. Click on any upcoming event
3. Verify you see the event detail page
```

#### Step 2: Join the Event
```
1. Click "Join Event" button (purple-pink gradient)
2. Wait for success toast: "🎉 Joined event and group successfully!"
3. Page should refresh automatically
```

#### Step 3: Verify Calendar Button Appears
```
✅ Expected Result:
- Green "Add to Calendar" button appears in sidebar
- Button shows: Calendar icon + "Add to Calendar" + Dropdown arrow
- Button has gradient: green-600 → emerald-600 → teal-600
```

#### Step 4: Open Calendar Dropdown
```
1. Click "Add to Calendar" button
2. Dropdown menu opens with 5 options:
   - 📅 Google Calendar
   - 🍎 Apple Calendar
   - 📧 Outlook
   - 🟣 Yahoo Calendar
   - 💾 Download ICS
3. Each option has gradient icon and hover effect
```

#### Step 5: Test Google Calendar
```
1. Click "Google Calendar" option
2. New browser tab opens
3. Google Calendar page loads with pre-filled event:
   ✅ Event title matches
   ✅ Date and time correct
   ✅ Location filled in
   ✅ Description includes all details (difficulty, distance, gear)
4. Click "Save" in Google Calendar
5. Event appears in your Google Calendar
```

#### Step 6: Test Apple Calendar (ICS Download)
```
1. Go back to event page
2. Click "Add to Calendar" → "Apple Calendar"
3. File downloads: {event_name}.ics
4. Open the .ics file
5. Calendar.app opens (macOS) or prompts to open
6. Event details pre-filled
7. Click "Add" to save to calendar
```

#### Step 7: Test ICS Download
```
1. Click "Add to Calendar" → "Download ICS"
2. File downloads with event name
3. Open file in any calendar app (Outlook, Thunderbird, etc.)
4. Verify all details present
```

### Test 2: Privacy Controls

#### Test 2.1: Non-Member Access
```
1. Log out
2. Create a new account (different email)
3. Navigate to the event URL directly
4. Click "Join Event" (don't complete join)
5. Try to access: http://localhost:8080/api/v1/events/public/{eventId}/calendar

✅ Expected Result:
- 403 Forbidden error
- Message: "You must be a member of the group to add this event to your calendar"
```

#### Test 2.2: After Leaving Event
```
1. Join an event (calendar button appears)
2. Click "Leave Event"
3. Confirm leave action

✅ Expected Result:
- Calendar button disappears immediately
- "Join Event" button appears again
```

### Test 3: Edge Cases

#### Test 3.1: Past Event
```
1. Create an event with past date
2. Join the event
3. Navigate to event detail page

✅ Expected Result:
- Calendar button does NOT appear
- Only "Leave Event" button shown
```

#### Test 3.2: Event Without End Time
```
1. Create event with only start time (no end time)
2. Set estimated duration: 4 hours
3. Join event
4. Add to Google Calendar

✅ Expected Result:
- End time calculated as: start time + 4 hours
- Calendar entry shows correct duration
```

#### Test 3.3: Event Without Duration or End Time
```
1. Create event with only start time
2. Leave duration and end time empty
3. Join event
4. Add to calendar

✅ Expected Result:
- End time defaults to: start time + 3 hours
- Calendar entry shows 3-hour duration
```

#### Test 3.4: Event With Special Characters
```
1. Create event with title: "Peak District: Sunrise Hike & Coffee ☕"
2. Join and add to calendar

✅ Expected Result:
- Special characters properly escaped
- Event appears correctly in calendar
- No encoding errors
```

### Test 4: Calendar Data Verification

#### Test 4.1: Check API Response
```
1. Join an event
2. Open browser DevTools → Network tab
3. Click "Add to Calendar" button
4. Find request: GET /api/v1/events/public/{id}/calendar
5. Check response:

Expected JSON:
{
  "title": "Event Title",
  "description": "Event description\n\nDifficulty: Intermediate\nDistance: 12.5 km\nElevation Gain: 450 m\nEstimated Duration: 4 hours\n\nRequired Gear: Hiking boots, Water bottle",
  "location": "Peak District, UK",
  "startTime": "2025-01-15T09:00:00Z",
  "endTime": "2025-01-15T13:00:00Z",
  "organiserName": "John Smith",
  "eventUrl": "https://www.outmeets.com/events/123"
}
```

#### Test 4.2: Verify ICS File Content
```
1. Download ICS file
2. Open in text editor
3. Verify format:

BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//OutMeets//Hiking Events//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
DTSTART:20250115T090000Z
DTEND:20250115T130000Z
DTSTAMP:20241208T...
ORGANIZER:CN=John Smith
UID:...@outmeets.com
SUMMARY:Event Title
DESCRIPTION:Event description\n\nDifficulty: Intermediate...
LOCATION:Peak District, UK
URL:https://www.outmeets.com/events/123
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR
```

### Test 5: UI/UX Testing

#### Test 5.1: Dropdown Behavior
```
1. Click "Add to Calendar" button
2. Dropdown opens

✅ Test:
- Click outside dropdown → Closes
- Click another calendar option → Closes after selection
- Press ESC key → Closes (if implemented)
- Hover over options → Shows hover effect
```

#### Test 5.2: Button States
```
1. Before joining:
   - "Join Event" button visible
   - No calendar button

2. After joining:
   - "✅ You're registered!" message
   - "Add to Calendar" button visible
   - "Leave Event" button visible

3. After leaving:
   - Back to "Join Event" button
   - No calendar button
```

#### Test 5.3: Mobile Responsive
```
1. Open event page on mobile (or resize browser to mobile width)
2. Join event
3. Verify calendar button:
   ✅ Full width on mobile
   ✅ Dropdown menu fits screen
   ✅ Touch-friendly tap targets
   ✅ No horizontal scroll
```

### Test 6: Multi-Calendar Testing

#### Test 6.1: Google Calendar
```
URL Format:
https://calendar.google.com/calendar/render?action=TEMPLATE&text=Event+Title&details=Description&location=Location&dates=20250115T090000Z/20250115T130000Z

✅ Verify:
- Opens in new tab
- All fields pre-filled
- Can save to calendar
```

#### Test 6.2: Outlook
```
URL Format:
https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=Event+Title&body=Description&location=Location&startdt=2025-01-15T09:00:00Z&enddt=2025-01-15T13:00:00Z

✅ Verify:
- Opens Outlook.com
- Event details correct
- Can add to Outlook calendar
```

#### Test 6.3: Yahoo Calendar
```
URL Format:
https://calendar.yahoo.com/?v=60&title=Event+Title&desc=Description&in_loc=Location&st=20250115T090000Z&et=20250115T130000Z

✅ Verify:
- Opens Yahoo Calendar
- Details pre-filled
- Can save event
```

### Test 7: Error Handling

#### Test 7.1: Network Error
```
1. Stop backend server
2. Join event (will fail)
3. Try to click "Add to Calendar"

✅ Expected:
- Calendar data query fails gracefully
- Button doesn't appear or shows error state
- No console errors
```

#### Test 7.2: Invalid Event ID
```
1. Navigate to: /events/99999
2. Try to access calendar data

✅ Expected:
- 404 Not Found error
- Graceful error handling
```

## 🎨 Visual Verification Checklist

### Button Appearance
- [ ] Green gradient (green-600 → emerald-600 → teal-600)
- [ ] Calendar icon on left
- [ ] "Add to Calendar" text in center
- [ ] Dropdown chevron on right
- [ ] Hover effect: darker gradient + scale-105
- [ ] Shadow effect on hover

### Dropdown Menu
- [ ] White background with backdrop blur
- [ ] 2px gray border
- [ ] Shadow-2xl
- [ ] Rounded-xl corners
- [ ] Fade-in animation

### Calendar Options
- [ ] 5 options visible
- [ ] Each has gradient icon box
- [ ] Emoji icons: 📅 🍎 📧 🟣 💾
- [ ] Hover: purple-pink gradient background
- [ ] Text gradient on hover
- [ ] Download icon for ICS option

### Helper Text
- [ ] Bottom of dropdown
- [ ] Purple-pink gradient background
- [ ] Text: "💡 Choose your preferred calendar app"
- [ ] Small text size

## 📊 Performance Testing

### Load Time
```
1. Join event
2. Measure time for calendar button to appear
✅ Expected: < 500ms
```

### API Response Time
```
1. Click "Add to Calendar"
2. Check Network tab for /calendar endpoint
✅ Expected: < 200ms response time
```

### File Download Speed
```
1. Click "Download ICS"
2. Measure download time
✅ Expected: Instant (file is tiny, <1KB)
```

## 🐛 Known Issues to Watch For

### Potential Issues:
1. **Timezone Conversion**: Verify times display in user's local timezone
2. **Special Characters**: Test with emojis, quotes, apostrophes in event title
3. **Long Descriptions**: Test with very long event descriptions
4. **No Location**: Test events without location set
5. **Multi-Day Events**: Test events spanning multiple days

## ✅ Success Criteria

### Must Pass:
- [ ] Calendar button appears after joining event
- [ ] All 5 calendar providers work
- [ ] Event details correctly populated in calendar
- [ ] Privacy controls work (non-members blocked)
- [ ] Past events don't show calendar button
- [ ] ICS file downloads and opens correctly
- [ ] Dropdown closes on outside click
- [ ] Mobile responsive
- [ ] No console errors
- [ ] Smooth animations

## 🚀 Production Deployment Checklist

Before deploying to production:

1. **Environment Variables**
   - [ ] Update `eventUrl` in CalendarEventDTO to production domain
   - [ ] Currently: `https://www.outmeets.com/events/{id}`
   - [ ] Verify domain is correct

2. **Testing**
   - [ ] Test all calendar providers in production
   - [ ] Test on real mobile devices
   - [ ] Test with real hiking events
   - [ ] Verify timezone handling across different regions

3. **Monitoring**
   - [ ] Track calendar button click rate
   - [ ] Monitor which calendar providers are most popular
   - [ ] Track API errors for /calendar endpoint

## 📝 Test Report Template

```markdown
## Add to Calendar Test Report

**Date**: [Date]
**Tester**: [Name]
**Environment**: [Dev/Staging/Production]

### Test Results

| Test Case | Status | Notes |
|-----------|--------|-------|
| Join event and see button | ✅/❌ | |
| Google Calendar | ✅/❌ | |
| Apple Calendar | ✅/❌ | |
| Outlook | ✅/❌ | |
| Yahoo Calendar | ✅/❌ | |
| ICS Download | ✅/❌ | |
| Privacy controls | ✅/❌ | |
| Past event handling | ✅/❌ | |
| Mobile responsive | ✅/❌ | |

### Issues Found
1. [Issue description]
2. [Issue description]

### Recommendations
1. [Recommendation]
2. [Recommendation]
```

## 🎉 Happy Testing!

If all tests pass, you have a production-ready "Add to Calendar" feature that rivals Meetup.com! 🚀

---

**Questions or Issues?** Check the full documentation in `ADD_TO_CALENDAR_FEATURE.md`
