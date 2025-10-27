# Testing Checklist - Partial Event Preview Feature

## ✅ Pre-Testing Setup

### Backend
- [ ] Backend is running on `http://localhost:8080`
- [ ] Database is accessible
- [ ] At least 2 test users exist
- [ ] At least 1 test group exists
- [ ] At least 1 test event exists in that group

### Frontend
- [ ] Frontend is running on `http://localhost:5173`
- [ ] Browser cache cleared
- [ ] Developer console open (F12)

### Test Data Setup
```sql
-- Verify test data exists
SELECT * FROM members LIMIT 2;
SELECT * FROM groups LIMIT 1;
SELECT * FROM events WHERE group_id = <group_id>;
SELECT * FROM subscriptions WHERE group_id = <group_id>;
```

---

## 🧪 Test Suite

### Test 1: Non-Member Views Event (Primary Test) ⭐

**Setup:**
- User A: NOT a member of "Bangalore Hikers" group
- Event: "Summit Trek" in "Bangalore Hikers" group

**Steps:**
1. Login as User A
2. Navigate to event URL directly: `/events/{eventId}`

**Expected Results:**
- ✅ Page loads (no crash)
- ✅ Event name visible: "Summit Trek"
- ✅ Event date visible: "Friday, November 15, 2024"
- ✅ Event time visible: "2:00 PM"
- ✅ Activity type badge visible: "Hiking"
- ✅ Organiser name visible
- ✅ Event image visible

**About This Event Section:**
- ✅ Section header visible: "About This Event"
- ✅ Lock icon displayed (purple gradient circle)
- ✅ Text: "Only shown to members"
- ✅ "Join Group" button visible (gradient purple-pink-orange)
- ❌ Description text NOT visible

**Event Details Section:**
- ✅ Section header visible: "Event Details"
- ✅ Date/Time card visible with calendar icon
- ✅ Dashed border box for locked content
- ✅ Lock icon in locked area
- ✅ Text: "Location and other details only shown to members"
- ✅ "Join Group" button in locked area
- ❌ Location NOT visible
- ❌ Difficulty level NOT visible
- ❌ Distance NOT visible
- ❌ Duration NOT visible

**Sections Completely Hidden:**
- ❌ Requirements section NOT rendered
- ❌ Included Items section NOT rendered
- ❌ Participants section NOT rendered

**Sidebar:**
- ❌ Price NOT visible
- ❌ Participant count NOT visible
- ❌ Progress bar NOT visible
- ✅ Lock icon visible
- ✅ "Members Only Event" text visible
- ✅ "Join the group to view full details and register" text visible
- ✅ "Join Group to Participate" button visible
- ❌ "Join Event" button NOT visible

**Comments Section:**
- ✅ "Comments (0)" header visible
- ✅ Lock icon displayed
- ✅ "Members Only" text visible
- ✅ "Join the group to view and post comments" text visible
- ❌ Comment input NOT visible
- ❌ Existing comments NOT visible

**Console Check:**
- [ ] No JavaScript errors
- [ ] 403 response visible in Network tab
- [ ] No infinite retry loops

---

### Test 2: Member Views Event (Access Granted) ✅

**Setup:**
- User B: ACTIVE member of "Bangalore Hikers" group
- Same event: "Summit Trek"

**Steps:**
1. Login as User B
2. Navigate to same event URL

**Expected Results:**
- ✅ Page loads completely
- ✅ Event name, date, time visible
- ✅ Full description visible (no lock icon)
- ✅ Location visible: "Skandagiri Base"
- ✅ Difficulty level visible: "Intermediate"
- ✅ Distance visible: "8 km"
- ✅ Duration visible: "4 hours"
- ✅ Requirements section visible (if any)
- ✅ Included Items section visible (if any)
- ✅ Participants section visible with list
- ✅ Price visible in sidebar: "$25" or "Free"
- ✅ Participant count visible: "15/30"
- ✅ Progress bar visible
- ✅ "Join Event" button visible
- ✅ Comments section fully functional
- ✅ Can post new comments
- ✅ Can view existing comments

**Console Check:**
- [ ] No errors
- [ ] 200 response for event API
- [ ] 200 response for comments API

---

### Test 3: Group Organiser Views Event (Full Access) 👑

**Setup:**
- User C: Organiser (creator) of "Bangalore Hikers" group
- May or may not have ACTIVE subscription
- Same event

**Steps:**
1. Login as User C (organiser)
2. Navigate to event

**Expected Results:**
- ✅ Full access to all content (even without subscription)
- ✅ All sections visible
- ✅ "You're the organiser" badge visible
- ✅ "Delete Event" button visible
- ✅ Can post comments
- ✅ Can view all content

---

### Test 4: Join Group Flow (Conversion Test) 🔄

**Setup:**
- User A (non-member) viewing locked event

**Steps:**
1. View event as non-member (locked state)
2. Click any "Join Group" button
3. Should navigate to `/groups` page
4. Find and join "Bangalore Hikers" group
5. Navigate back to event
6. Verify full access granted

**Expected Results:**
- ✅ "Join Group" button navigates to `/groups`
- ✅ After joining group, event becomes fully accessible
- ✅ No more lock icons
- ✅ All content visible

---

### Test 5: Direct Link Sharing (Social Test) 🔗

**Setup:**
- Event URL shared via social media/email

**Steps:**
1. Copy event URL: `http://localhost:5173/events/123`
2. Open in incognito/private window (not logged in)
3. View page

**Expected Results:**
- ✅ Page loads with partial preview
- ✅ Event name, date, time visible
- ✅ All other sections locked
- ❌ No errors (even without authentication)
- ✅ "Login to Join" button visible in sidebar

---

### Test 6: Mobile Responsiveness 📱

**Steps:**
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test at different screen sizes:
   - Mobile: 375px
   - Tablet: 768px
   - Desktop: 1920px

**Expected Results:**
- ✅ Lock icons scale properly
- ✅ "Join Group" buttons remain accessible
- ✅ Layout doesn't break
- ✅ Text remains readable
- ✅ Buttons don't overflow

---

### Test 7: Edge Cases

#### 7a: Event with No Optional Fields
**Setup:**
- Event with no requirements, no included items, minimal info

**Expected Results:**
- ✅ Page still renders correctly
- ✅ Empty sections don't show
- ✅ No JavaScript errors

#### 7b: Very Long Event Name
**Setup:**
- Event name > 100 characters

**Expected Results:**
- ✅ Title doesn't break layout
- ✅ Text wraps or truncates gracefully

#### 7c: Future Date Event
**Setup:**
- Event scheduled far in the future

**Expected Results:**
- ✅ Date formats correctly
- ✅ No date parsing errors

#### 7d: Past Event
**Setup:**
- Event from the past

**Expected Results:**
- ✅ Still renders correctly
- ✅ No special handling needed (yet)

---

### Test 8: Performance Check ⚡

**Steps:**
1. Open event as non-member
2. Check Network tab in DevTools
3. Monitor API calls

**Expected Results:**
- ✅ Only 1 API call to `/api/v1/events/public/{id}`
- ✅ API returns 403 error
- ✅ No retry loops
- ✅ Page loads in < 2 seconds
- ✅ No memory leaks

---

### Test 9: Browser Compatibility 🌐

**Test on:**
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)

**Check:**
- ✅ CSS gradients render correctly
- ✅ Lock icons display
- ✅ Buttons work
- ✅ No layout issues

---

### Test 10: Accessibility (A11y) ♿

**Steps:**
1. Use keyboard only (Tab, Enter, Space)
2. Navigate through locked sections

**Expected Results:**
- ✅ Can tab through all "Join Group" buttons
- ✅ Lock icons have proper ARIA labels
- ✅ Screen reader friendly
- ✅ Proper heading hierarchy (h1, h2)
- ✅ Sufficient color contrast

---

## 🐛 Known Issues to Watch For

### Issue 1: Event Data Null
**Symptom:** White screen or crash when event is null
**Check:** displayEvent fallback object is used
**Fix:** Already implemented with placeholder object

### Issue 2: Infinite Retry Loop
**Symptom:** Multiple 403 requests in Network tab
**Check:** Retry disabled for 403 errors
**Fix:** Already implemented with retry logic

### Issue 3: Comments Not Loading
**Symptom:** Comments section shows loading forever
**Check:** CommentSection handles 403 gracefully
**Fix:** Already implemented

### Issue 4: Lombok Errors
**Symptom:** IDE shows red errors
**Impact:** None - these are IDE cache issues
**Action:** Can be ignored, or restart IDE

---

## ✅ Success Criteria

The feature is working correctly if:

1. ✅ Non-members see partial preview (not full block)
2. ✅ Event name, date, time always visible
3. ✅ All sensitive details locked with 🔒 icons
4. ✅ "Join Group" buttons work and navigate correctly
5. ✅ Members see full content
6. ✅ Organisers have full access
7. ✅ No JavaScript errors in console
8. ✅ Mobile responsive
9. ✅ Page loads quickly (< 2s)
10. ✅ Comments section properly locked

---

## 🚨 Failure Scenarios

Stop and fix if:

- ❌ White screen or crash on non-member access
- ❌ Error: "Cannot read property 'X' of null"
- ❌ Infinite retry loop (check Network tab)
- ❌ "Join Group" button doesn't work
- ❌ Members can't see full content
- ❌ Layout breaks on mobile
- ❌ Console shows JavaScript errors

---

## 📊 Testing Progress Tracker

```
Test 1: Non-Member Views Event          [ ]
Test 2: Member Views Event               [ ]
Test 3: Organiser Views Event            [ ]
Test 4: Join Group Flow                  [ ]
Test 5: Direct Link Sharing              [ ]
Test 6: Mobile Responsiveness            [ ]
Test 7: Edge Cases                       [ ]
Test 8: Performance Check                [ ]
Test 9: Browser Compatibility            [ ]
Test 10: Accessibility                   [ ]
```

**Overall Status:** [ ] PASS / [ ] FAIL

---

## 🎯 Quick Smoke Test (2 minutes)

If you're short on time, run this minimal test:

1. [ ] Login as non-member
2. [ ] View event → See partial preview with locks
3. [ ] Click "Join Group" → Navigate to /groups
4. [ ] Login as member
5. [ ] View same event → See full content
6. [ ] Check console → No errors

If all pass ✅ → Feature likely working!

---

## 📝 Bug Report Template

If you find a bug, document it:

```markdown
**Bug Title:** [Short description]

**Severity:** Critical / High / Medium / Low

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**


**Actual Result:**


**Environment:**
- Browser: 
- OS: 
- User Role: Non-member / Member / Organiser

**Console Errors:**
```
[paste error here]
```

**Screenshots:**
[attach if possible]
```

---

**Happy Testing! 🚀**

Remember: The goal is a smooth experience for non-members to discover events and be encouraged to join groups!
