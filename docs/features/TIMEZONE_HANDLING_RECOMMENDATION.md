# Timezone Handling - Implementation Plan

## Current Situation

**Problem:**
- Backend stores times as `LocalDateTime` (no timezone info)
- Indian organizer sets event time: 20:00 IST
- Stored as: `"2025-11-19T20:00:00"`
- UK user sees: "20:00" and thinks it's 20:00 GMT
- **Reality:** 20:00 IST = 14:30 GMT ❌ **User confusion!**

## Recommendation: Two-Phase Approach

### Phase 1: Quick Fix (No Backend Changes) ✅

**Add timezone indicator to all time displays**

Show the **organizer's timezone** next to all event times so users know what timezone the time refers to.

**Implementation:**
```javascript
// Get user's timezone
const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

// Display with timezone
{new Date(event.eventDate).toLocaleString('en-GB', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZoneName: 'short'  // Shows "GMT", "IST", etc.
})}

// Output examples:
// "Tuesday, 19 November 2025, 20:00 IST" (for Indian user)
// "Tuesday, 19 November 2025, 14:30 GMT" (for UK user viewing same event)
```

**Where to Update:**
1. EventDetailPage.jsx - Event date/time display
2. EventCard.jsx - Event list cards
3. GroupDetailPage.jsx - Events tab
4. HomePage.jsx - Upcoming events
5. ProfilePage.jsx - User's registered events

**Pros:**
- ✅ No backend changes needed
- ✅ Quick to implement (1-2 hours)
- ✅ Clear communication to users
- ✅ Works immediately

**Cons:**
- ⚠️ Users must mentally convert if in different timezone
- ⚠️ Not automatic conversion

---

### Phase 2: Full Solution (Backend Changes Required) 🚀

**Implement proper timezone handling for global support**

For future when OutMeets expands internationally:

#### Backend Changes

**1. Add timezone field to Event model:**
```java
@Entity
public class Event {
    // Change from LocalDateTime to ZonedDateTime
    @Column(name = "event_date")
    private ZonedDateTime eventDate;
    
    @Column(name = "event_timezone")
    private String eventTimezone;  // e.g., "Asia/Kolkata"
    
    // Or simpler: Keep LocalDateTime but add timezone offset
    private LocalDateTime eventDate;
    private String timezoneOffset;  // e.g., "+05:30"
}
```

**2. Update CreateEventRequest:**
```java
@Data
public class CreateEventRequest {
    @NotNull
    private LocalDateTime eventDate;
    
    @NotBlank
    private String eventTimezone;  // Required: organizer's timezone
}
```

**3. Migration Script:**
```sql
-- Add timezone column
ALTER TABLE events ADD COLUMN event_timezone VARCHAR(50);

-- Set default timezone for existing events (adjust based on your region)
UPDATE events SET event_timezone = 'Asia/Kolkata' WHERE event_timezone IS NULL;
```

#### Frontend Changes

**1. Send timezone with event:**
```javascript
const payload = {
  // ... other fields
  eventDate: formatLocalDateTime(data.eventDate, data.startTime),
  eventTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  // Will be: "Asia/Kolkata", "Europe/London", etc.
}
```

**2. Display in user's local timezone:**
```javascript
import { format, utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz'

// Convert event time from organizer's timezone to user's timezone
const eventTimeInOrganizerTz = `${event.eventDate}` // "2025-11-19T20:00:00"
const eventTimeUtc = zonedTimeToUtc(eventTimeInOrganizerTz, event.eventTimezone)
const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
const eventTimeInUserTz = utcToZonedTime(eventTimeUtc, userTimezone)

// Display
const displayTime = format(eventTimeInUserTz, 'EEEE, d MMMM yyyy, HH:mm zzz', {
  timeZone: userTimezone
})
// Output for UK user: "Tuesday, 19 November 2025, 14:30 GMT"
// Output for Indian user: "Tuesday, 19 November 2025, 20:00 IST"
```

**3. Show both times for clarity:**
```javascript
<div>
  <p className="font-bold">
    {format(eventTimeInUserTz, 'HH:mm zzz')} {/* User's time */}
  </p>
  {userTimezone !== event.eventTimezone && (
    <p className="text-sm text-gray-600">
      ({format(eventTimeInOrganizerTz, 'HH:mm zzz')} organizer's time)
    </p>
  )}
</div>
```

**Dependencies:**
```bash
npm install date-fns date-fns-tz
```

---

## Comparison: Different Approaches

| Approach | Backend Changes | Accuracy | UX | Complexity |
|----------|----------------|----------|-----|-----------|
| **Phase 1: Show Timezone** | None | Partial | Good | Low |
| **Phase 2: Full Timezone** | Yes (migration) | Perfect | Excellent | Medium |
| **Store UTC Only** | Yes (migration) | Perfect | Excellent | Medium-High |
| **Do Nothing** | None | ❌ Wrong | ❌ Poor | None |

## Industry Standards

**How other platforms handle this:**

### Meetup.com
- Stores: UTC timestamp + organizer timezone
- Displays: User's local time with note about organizer timezone
- Example: "7:00 PM GMT (8:00 PM organiser's time)"

### Eventbrite
- Stores: UTC timestamp + event timezone
- Displays: User's local time automatically
- Shows "Convert to your timezone" button

### Facebook Events
- Stores: UTC timestamp
- Displays: User's local time automatically
- No timezone confusion

## Implementation Priority

### For OutMeets (Hiking Platform)

**Current Priority: Phase 1** ✅

Why?
1. **Local Focus:** Most hiking groups are local
   - Peak District Hikers → UK members only
   - Himalayan Trekkers → Indian members only
   - Cross-timezone participation is rare

2. **Quick Win:** Implement in hours, not days
   - No backend changes
   - No database migration
   - Immediate clarity

3. **Sufficient:** For 90% of use cases
   - Users in same region see same time with timezone label
   - Clear communication prevents confusion

**Future Priority: Phase 2** 🔮

When?
- Platform expands internationally
- Cross-border hiking events become common
- Users frequently complain about timezone confusion
- You have development bandwidth for migration

## Code Example: Phase 1 Implementation

### EventDetailPage.jsx

**Before:**
```javascript
<p className="text-gray-700 flex items-center gap-2">
  <Calendar className="h-5 w-5" />
  {new Date(event.eventDate).toLocaleDateString()}
</p>
```

**After:**
```javascript
<p className="text-gray-700 flex items-center gap-2">
  <Calendar className="h-5 w-5" />
  {new Date(event.eventDate).toLocaleString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'  // ← This adds timezone!
  })}
</p>
```

### Create Reusable Component

```javascript
// components/EventTime.jsx
export default function EventTime({ date, className }) {
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  
  return (
    <div className={className}>
      <p className="font-bold text-lg">
        {new Date(date).toLocaleString('en-GB', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short'
        })}
      </p>
      <p className="text-sm text-gray-500">
        Your timezone: {userTimezone}
      </p>
    </div>
  )
}
```

## Migration Path (If Implementing Phase 2)

### Step 1: Add timezone column (backward compatible)
```sql
ALTER TABLE events ADD COLUMN event_timezone VARCHAR(50);
```

### Step 2: Default existing events
```sql
UPDATE events SET event_timezone = 'Asia/Kolkata' WHERE event_timezone IS NULL;
```

### Step 3: Update API to accept timezone
```java
// Make optional first (backward compatible)
private String eventTimezone;
```

### Step 4: Frontend sends timezone
```javascript
eventTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone
```

### Step 5: Make timezone required
```java
@NotBlank(message = "Event timezone is required")
private String eventTimezone;
```

### Step 6: Update frontend displays
- Add date-fns-tz library
- Convert times for display
- Show both organizer and user time

## Testing Scenarios

### Phase 1 Testing
1. ✅ Indian user creates event at 20:00 IST
2. ✅ UK user views event, sees "20:00 IST"
3. ✅ UK user understands it's India time, not UK time

### Phase 2 Testing
1. ✅ Indian user creates event at 20:00 IST
2. ✅ UK user views event, sees "14:30 GMT" (automatically converted)
3. ✅ Tooltip shows: "20:00 IST organizer's time"
4. ✅ No manual conversion needed

## Conclusion

**Recommendation:** 
- **Now:** Implement Phase 1 (show timezone labels)
- **Later:** Implement Phase 2 when needed (full timezone support)

This approach balances:
- ✅ Quick implementation
- ✅ Clear communication
- ✅ Room for future enhancement
- ✅ No breaking changes

---

**Created:** 2025-11-19  
**Status:** Recommendation - Awaiting approval  
**Priority:** High (Phase 1), Medium (Phase 2)
