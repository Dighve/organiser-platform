# Add to Calendar - Organiser Access Fix

## Problem
The "Add to Calendar" button was not visible to event organisers on the event detail page. It was only shown to users who had explicitly joined the event (`hasJoined` condition).

## Root Cause
The button was conditionally rendered only in the "REGISTERED USER VIEW" section:
```jsx
hasJoined ? (
  /* REGISTERED USER VIEW - Show Add to Calendar and Leave button */
  {!isPastEvent && calendarData && (
    <AddToCalendar calendarData={calendarData} />
  )}
) : (
  /* Other views */
)
```

**Issue:** Organisers don't necessarily join their own events, so they couldn't access the calendar feature.

## Solution
Added the "Add to Calendar" button to the organiser view section, right after the Publish button (if DRAFT) and before the Edit button.

### Code Change

**File:** `frontend/src/pages/EventDetailPage.jsx`

**Added:**
```jsx
{/* Add to Calendar Button for Organiser */}
{calendarData && (
  <AddToCalendar calendarData={calendarData} />
)}
```

**Location:** Inside the organiser's future event section, between Publish and Edit buttons.

### Button Order for Organisers (Future Events):

1. **Publish Event** (if status = DRAFT) - Green gradient
2. **Add to Calendar** (NEW) - Blue gradient with calendar icon
3. **Edit Event** - Purple-pink gradient
4. **Delete Event** - Red gradient

## User Experience

### Before Fix:
- ❌ Organiser creates event
- ❌ Organiser cannot add event to their calendar
- ❌ Must join own event to see "Add to Calendar" button
- ❌ Confusing UX

### After Fix:
- ✅ Organiser creates event
- ✅ "Add to Calendar" button visible immediately
- ✅ Can add to Google Calendar, Apple Calendar, Outlook, etc.
- ✅ No need to join own event
- ✅ Intuitive UX

## Access Control

### Who Can See "Add to Calendar":

1. **Event Organiser:** ✅ Always (if calendarData available)
2. **Registered Participants:** ✅ Always (if joined and not past event)
3. **Non-Members:** ❌ No access (must join first)
4. **Past Events:** ❌ No button shown (event already happened)

## Backend Support

The backend already supports organisers accessing calendar data:

**EventService.java - getCalendarData():**
```java
// Check if user is organiser OR has joined the event
boolean isOrganiser = event.getOrganiser().getId().equals(memberId);
boolean hasJoined = event.getParticipants().stream()
    .anyMatch(p -> p.getMember().getId().equals(memberId));

if (!isOrganiser && !hasJoined) {
    throw new AccessDeniedException("Must join event to get calendar data");
}
```

✅ Organisers bypass the join check and can access calendar data.

## Testing Scenarios

### Test 1: Organiser with Published Event
1. Login as organiser
2. Create and publish an event
3. View event detail page
4. **Expected:** "Add to Calendar" button visible
5. Click button
6. **Expected:** Calendar options modal opens

### Test 2: Organiser with Draft Event
1. Login as organiser
2. Create event (leave as DRAFT)
3. View event detail page
4. **Expected:** "Add to Calendar" button visible (below Publish button)
5. Click button
6. **Expected:** Calendar options modal opens

### Test 3: Organiser with Past Event
1. Login as organiser
2. View past event detail page
3. **Expected:** No "Add to Calendar" button (event ended)
4. **Expected:** Only "Copy Event" button shown

### Test 4: Regular User (Joined Event)
1. Login as regular user
2. Join an event
3. View event detail page
4. **Expected:** "Add to Calendar" button visible
5. **Expected:** "Leave Event" button also visible

### Test 5: Regular User (Not Joined)
1. Login as regular user
2. View event detail page (not joined)
3. **Expected:** No "Add to Calendar" button
4. **Expected:** Only "Join Event" button shown

## Benefits

✅ **Organisers Can Plan:** Add their own events to personal calendars  
✅ **Better UX:** No need to join own event to get calendar access  
✅ **Consistent Behavior:** Matches Meetup.com (organisers can add to calendar)  
✅ **Time Management:** Organisers can track all their events in one calendar  
✅ **Professional:** Shows all calendar options (Google, Apple, Outlook, Yahoo, ICS)  

## Related Features

- **Add to Calendar Modal:** Shows after joining event (MEMORY - ADD_TO_CALENDAR_QUICK_SUMMARY.md)
- **Calendar Data API:** Backend endpoint for .ics file generation
- **Event Organiser Privileges:** Organisers have full access to their events

## Files Modified

**Frontend:**
- `frontend/src/pages/EventDetailPage.jsx`
  - Added `AddToCalendar` component to organiser view
  - Positioned between Publish and Edit buttons
  - Conditional on `calendarData` availability

**Backend:**
- No changes required (already supports organiser access)

## Deployment Notes

- ✅ No database migrations required
- ✅ No environment variables needed
- ✅ Frontend-only change
- ✅ Backward compatible
- ✅ No breaking changes
- ✅ Safe to deploy immediately

## Future Enhancements

1. **Auto-Add to Calendar:** Automatically add to organiser's calendar on event creation
2. **Calendar Sync:** Two-way sync with Google Calendar
3. **Reminders:** Send calendar reminders before event
4. **Recurring Events:** Support for repeating events in calendar
5. **Timezone Support:** Better timezone handling in calendar invites

---

**Status:** ✅ Complete - Organisers can now add events to calendar

**Impact:** Medium - Improves organiser experience and calendar management
