# White Screen Fix - Event Detail Page (Production)

## Issue
Production deployment at https://www.outmeets.com/events/7 showed a white screen instead of the expected "Login to Join" view for unauthenticated users or non-members.

**Environment:** Production only (worked fine on localhost)

## Root Cause

### Problem 1: Incorrect Error Handling Logic
The error handling condition in EventDetailPage.jsx (line 358) was:

```javascript
if (!isLoading && !event && !error) {
  // Show "Event not found" page
}
```

This condition only showed the error page when there was **NO error**. When a 403 error occurred (access denied for non-members):
- `error` existed (403 response)
- `event` was null
- Condition was **FALSE** (because error exists)
- Component fell through to render with incomplete `displayEvent` fallback object
- Missing required fields caused white screen in production

### Problem 2: Incomplete Fallback Object
The `displayEvent` fallback object (line 336) was missing several fields that the component tried to access:

```javascript
const displayEvent = event || {
  title: 'Members Only Event',
  activityTypeName: 'Hiking',
  organiserName: 'Event Organiser',
  imageUrl: null,
  eventDate: new Date().toISOString(),
  // Missing: startTime, groupName, groupId, description, participantIds, currentParticipants
}
```

### Problem 3: Direct Property Access on Null Event
Line 984 accessed `event.groupName` directly without null checking:

```javascript
{event.groupName && (  // ❌ Crashes when event is null
  <div>
    <p>{event.groupName}</p>
    <button onClick={() => navigate(`/groups/${event.groupId}`)}>
```

**Error:** `Cannot read properties of undefined (reading 'groupName')`

When a 403 error occurs, `event` is `null`, causing the crash.

### Problem 4: Production Console Removal
`vite.config.js` had `drop_console: true` which removed all console.error statements in production, making debugging harder.

## Solution

### Fix 1: Improved Error Handling
Updated the error handling logic to properly distinguish between 403 errors (which should render partial view) and other errors (which should show error page):

```javascript
// Event not found - Show if not loading and no event data
// BUT: Allow 403 errors to pass through (they render partial view with "Join" buttons)
if (!isLoading && !event && error) {
  // Check if it's a 403 error (access denied - non-member viewing members-only event)
  const is403 = error?.response?.status === 403 || 
                error?.status === 403 ||
                (error?.message && error.message.includes('403'))
  
  // For 403 errors, continue to render (partial view with join buttons)
  // For other errors, show error page
  if (!is403) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 flex items-center justify-center px-4">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-10 text-center max-w-md">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Event not found</h2>
          <p className="text-gray-600 mb-6">The event you're looking for doesn't exist or has been removed.</p>
          <button 
            onClick={() => navigate('/')} 
            className="py-3 px-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all transform hover:scale-105"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }
}
```

### Fix 2: Complete Fallback Object
Enhanced the `displayEvent` fallback object with all required fields:

```javascript
const displayEvent = event || {
  title: 'Members Only Event',
  activityTypeName: 'Hiking',
  organiserName: 'Event Organiser',
  imageUrl: null,
  eventDate: new Date().toISOString(),
  startTime: '09:00',
  groupName: 'Private Group',
  groupId: null,
  description: '',
  participantIds: [],
  currentParticipants: 0,
}
```

### Fix 3: Use displayEvent Instead of event
Changed direct `event` property access to use `displayEvent` (which has fallback values):

**Before (line 984):**
```javascript
{event.groupName && (  // ❌ Crashes when event is null
  <div>
    <p>{event.groupName}</p>
    <button onClick={() => navigate(`/groups/${event.groupId}`)}>
```

**After:**
```javascript
{displayEvent.groupName && (  // ✅ Safe - uses fallback when event is null
  <div>
    <p>{displayEvent.groupName}</p>
    <button onClick={() => navigate(`/groups/${displayEvent.groupId}`)}>
```

## Expected Behavior After Fix

### For Unauthenticated Users (Not Logged In)
1. Visit event page → See partial event info (title, date, organiser)
2. See "Join Event" buttons with lock icons
3. Click "Join Event" → Login modal opens
4. After login → Auto-joins event and group

### For Authenticated Non-Members
1. Visit event page → See partial event info
2. See "Join Event" buttons
3. Click "Join Event" → Joins group and event in one action
4. Content unlocks immediately

### For Group Members
1. Visit event page → See full event details
2. All sections visible (description, location, participants, comments)
3. Can join/leave event

### For Event Not Found (404)
1. Visit invalid event ID → See "Event not found" error page
2. "Back to Home" button to navigate away

## Files Modified
- `frontend/src/pages/EventDetailPage.jsx` (lines 336-383)

## Testing Checklist
- [x] Build succeeds without errors
- [ ] Unauthenticated user sees partial view with "Join Event" buttons
- [ ] Login modal opens when clicking "Join Event"
- [ ] After login, user auto-joins event
- [ ] Group members see full event details
- [ ] Invalid event ID shows "Event not found" page
- [ ] No white screens in production

## Deployment Steps
1. Build frontend: `npm run build` (completed ✅)
2. Deploy to Netlify (automatic on git push)
3. Test on production: https://www.outmeets.com/events/7
4. Verify all user flows work correctly

## Related Issues
- Privacy controls: MEMORY[963f689e-13dc-4dc4-8dda-db5c23768476]
- One-click join pattern: MEMORY[c99a486b-35c5-4c5b-bd42-87a501dce34c]

## Status
✅ **Fixed** - Ready for deployment

Build completed successfully with no errors.
