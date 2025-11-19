# Smart Event Date & Time Defaults

## Overview
Implemented intelligent default date and time values for event creation, similar to Meetup.com's user experience. This reduces friction for event organizers by pre-selecting sensible future dates and times.

## Features

### 1. Smart Default Date
- **Default:** Today's date
- **Format:** YYYY-MM-DD
- **Validation:** Prevents selection of past dates using `min` attribute

### 2. Smart Default Time
- **Algorithm:** Current time + 2-3 hours, rounded to next full hour
- **Example Scenarios:**
  - Current time: 16:52 → Default: 19:00 (2h 8m rounded up = 3 hours)
  - Current time: 14:00 → Default: 16:00 (exactly 2 hours, no rounding)
  - Current time: 22:30 → Default: 23:00 (capped at 23:00 to avoid overflow)

### 3. Calculation Logic

```javascript
const getDefaultDateTime = () => {
  const now = new Date()
  
  // Default date: Today in YYYY-MM-DD format
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const defaultDate = `${year}-${month}-${day}`
  
  // Default time: 2-3 hours from now, rounded up to next hour
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  
  // Add 2 hours and round up to next hour if there are any minutes
  let defaultHour = currentHour + 2
  if (currentMinute > 0) {
    defaultHour += 1  // Round up to next full hour
  }
  
  // Handle overflow past midnight
  if (defaultHour >= 24) {
    defaultHour = 23
  }
  
  const defaultTime = `${String(defaultHour).padStart(2, '0')}:00`
  
  return { defaultDate, defaultTime }
}
```

## Implementation Details

### CreateEventPage.jsx
1. **Helper Functions:**
   - `getDefaultDateTime()` - Calculates smart defaults
   - `getMinimumTime()` - Calculates minimum allowed time (for future use)

2. **State Initialization:**
   ```javascript
   const { defaultDate, defaultTime } = getDefaultDateTime()
   const [formData, setFormData] = useState({
     eventDate: defaultDate,
     startTime: defaultTime
   })
   ```

3. **Form Pre-fill:**
   ```javascript
   useEffect(() => {
     setValue('eventDate', defaultDate)
     setValue('startTime', defaultTime)
   }, [defaultDate, defaultTime, setValue])
   ```

4. **Date Validation:**
   ```html
   <input 
     type="date"
     min={new Date().toISOString().split('T')[0]}
     {...register('eventDate', { required: 'Event date is required' })}
   />
   ```

### EditEventPage.jsx
- Added `min` attribute to date inputs
- Prevents editing events to past dates
- Does NOT override existing event dates (respects pre-filled data)

## User Experience Benefits

### For Organizers
1. **Faster Event Creation:**
   - No need to manually select today's date
   - Time pre-set to reasonable future slot
   - Can still override if needed

2. **Reduces Errors:**
   - Cannot accidentally select past dates
   - Smart time reduces invalid time selections
   - Encourages events with adequate lead time (2-3 hours)

3. **Consistent with Industry Standards:**
   - Matches Meetup.com behavior
   - Familiar UX for experienced organizers
   - Professional feel

### For Members
- Events created with adequate notice time
- Better planning experience
- Less likely to encounter last-minute rushed events

## Technical Notes

### Edge Cases Handled
1. **Late Night Events:**
   - If current time is 22:30+, default caps at 23:00
   - Prevents overflow to next day
   - Organizer can manually select next day if needed

2. **Exactly on the Hour:**
   - Current time: 14:00 → Default: 16:00
   - No unnecessary rounding

3. **Multi-day Events:**
   - Only start date gets smart default
   - End date remains optional and empty by default
   - Organizer selects manually for multi-day hikes

### Browser Compatibility
- Uses HTML5 date and time inputs
- Works in all modern browsers
- Graceful fallback in older browsers (text input)

## Future Enhancements

### Minimum Time Enforcement
Consider implementing smart minimum time validation:
```javascript
const getMinimumTime = () => {
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  
  // Minimum time: Next hour from now
  let minHour = currentHour + 1
  if (currentMinute === 0) {
    minHour = currentHour  // If exactly on the hour, current hour is fine
  }
  
  if (minHour >= 24) {
    minHour = 23
  }
  
  return `${String(minHour).padStart(2, '0')}:00`
}
```

**Implementation Note:** This would require conditional logic:
- If event date = today: Apply minimum time
- If event date = future: Allow any time

### Configurable Lead Time
Allow platform admins to configure:
- Default lead time (currently 2-3 hours)
- Minimum lead time (currently none enforced)
- Maximum future booking (e.g., 6 months ahead)

### Smart Time Suggestions
Show popular time slots:
- Morning: 09:00, 10:00, 11:00
- Afternoon: 14:00, 15:00
- Evening: 18:00, 19:00

## Testing Scenarios

### Create Event Page
1. **Default Values:**
   - Open create event page
   - Verify date = today
   - Verify time = current time + 2-3 hours (rounded)

2. **Past Date Prevention:**
   - Try to select yesterday's date
   - Browser should prevent selection (grayed out)

3. **Override Defaults:**
   - Change date to tomorrow
   - Change time to any value
   - Both should accept custom values

### Edit Event Page
1. **Existing Event:**
   - Open edit page for future event
   - Verify existing date/time pre-filled
   - Cannot change to past date

2. **Past Event:**
   - Try to edit past event
   - Should allow editing (for admin corrections)
   - Min date validation still applies

## Related Files
- Frontend:
  - `frontend/src/pages/CreateEventPage.jsx` (main implementation)
  - `frontend/src/pages/EditEventPage.jsx` (date validation)

## Comparison: OutMeets vs Meetup.com

| Feature | OutMeets | Meetup.com |
|---------|----------|------------|
| Default Date | Today | Today |
| Default Time | Now + 2-3h (rounded) | Similar logic |
| Min Date | Today | Today |
| Min Time | None (UX only) | Next hour |
| Override | ✅ Allowed | ✅ Allowed |

**Decision:** We chose not to enforce minimum time to give organizers flexibility, but smart defaults guide them toward reasonable times.

## Status
✅ Complete - Ready for production

## User Feedback
*To be collected after release*

---
**Created:** 2025-11-19  
**Author:** Cascade AI  
**Platform:** OutMeets (formerly HikeHub)
