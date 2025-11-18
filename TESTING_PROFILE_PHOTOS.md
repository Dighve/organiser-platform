# Testing Profile Photos - Quick Guide

## 🚀 Quick Start

### Prerequisites:
1. ✅ Backend running on `http://localhost:8080`
2. ✅ Frontend running on `http://localhost:5173`
3. ✅ Cloudinary credentials set in `backend/src/main/resources/application.properties`
4. ✅ Logged in as a user

---

## 🧪 Test Scenarios

### Scenario 1: Upload Profile Photo
**Steps:**
1. Navigate to Profile page (`/profile`)
2. Click "Edit Profile" button
3. Click "Upload Photo" area in the profile photo section
4. Select an image file (JPG, PNG, GIF, or WebP)
5. Wait for upload progress (1-3 seconds)
6. Preview image appears
7. Click "Save Changes"
8. Profile refreshes with new photo

**Expected Results:**
- ✅ Upload shows progress indicator
- ✅ Preview displays immediately
- ✅ Green success toast: "Profile updated successfully!"
- ✅ Photo appears in navbar immediately
- ✅ Photo visible on profile page

**Edge Cases to Test:**
- Try uploading file > 10MB (should fail with error)
- Try uploading .pdf or .txt (should fail with error)
- Try uploading very small image (< 10KB)
- Try uploading very large resolution (4K+)

---

### Scenario 2: Change Display Name
**Steps:**
1. Navigate to Profile page (`/profile`)
2. Click "Edit Profile" button
3. Click on the display name field (large text input)
4. Type a new name (e.g., "John Smith")
5. Click "Save Changes"

**Expected Results:**
- ✅ Green success toast appears
- ✅ New name shows on profile page
- ✅ New name appears in navbar
- ✅ New name shows in comments you've made
- ✅ New name shows in group/event member lists

**Edge Cases to Test:**
- Very long name (100+ chars) - should be limited
- Special characters (emoji, accents)
- Empty name - should show email as fallback
- Single letter name

---

### Scenario 3: View Member Detail Page
**Steps:**
1. Go to any group page
2. Click on Members tab
3. Click on any member card
4. View member detail page

**Expected Results:**
- ✅ Profile photo or initials display
- ✅ Display name shown (or "OutMeets Member")
- ✅ Email address visible
- ✅ Organiser badge if applicable
- ✅ Clean, modern UI

**Edge Cases to Test:**
- Member with no profile photo (should show initials)
- Member with no display name (should show "OutMeets Member")
- Invalid member ID (should show friendly error)
- Non-existent member (404 handling)

---

### Scenario 4: Profile Photos in Comments
**Steps:**
1. Navigate to any event detail page
2. Scroll to Comments section
3. Post a new comment
4. View your profile photo next to your comment
5. View other members' photos in their comments

**Expected Results:**
- ✅ Your photo shows in comment input
- ✅ Your photo shows next to posted comment
- ✅ Other members' photos visible
- ✅ Members without photos show initials
- ✅ Hover effects work

---

### Scenario 5: Profile Photos in Groups
**Steps:**
1. Navigate to any group detail page
2. View About tab - see member circles
3. Click Members tab - see full member list
4. Click any member to view their profile

**Expected Results:**
- ✅ 8 member circles show in About tab
- ✅ Photos or initials displayed correctly
- ✅ Organiser badge/crown visible
- ✅ Clicking circle navigates to Members tab
- ✅ Clicking member card goes to member detail

---

### Scenario 6: Profile Photos in Events
**Steps:**
1. Navigate to any event detail page
2. Scroll to Participants/Attendees section
3. View list of attendees
4. Click any attendee to view their profile

**Expected Results:**
- ✅ All attendees show photo or initials
- ✅ Host badge on organiser
- ✅ Hover effects work
- ✅ Click navigates to member detail page

---

### Scenario 7: Navbar Profile Photo
**Steps:**
1. After uploading profile photo
2. Check top-right navbar
3. Your photo should display in user dropdown button

**Expected Results:**
- ✅ Profile photo visible in navbar
- ✅ Display name shown next to photo
- ✅ White border around photo
- ✅ Dropdown still works correctly
- ✅ Photo updates immediately after profile save

---

## 🐛 Common Issues & Solutions

### Issue: "Failed to upload file"
**Possible Causes:**
- Cloudinary credentials not set
- File too large (> 10MB)
- Invalid file type
- Network error

**Solution:**
1. Check `application.properties` has Cloudinary credentials
2. Verify file size < 10MB
3. Use JPG, PNG, GIF, or WebP
4. Check browser console for detailed error

---

### Issue: Photo not showing after upload
**Possible Causes:**
- Cache not invalidated
- Profile not refreshed
- Cloudinary URL incorrect

**Solution:**
1. Hard refresh page (Cmd+Shift+R / Ctrl+Shift+F5)
2. Check Network tab - verify image URL returned
3. Open image URL directly in browser
4. Check Cloudinary console for uploaded image

---

### Issue: Initials not showing correctly
**Possible Causes:**
- Display name is empty string
- Email not available
- Component logic issue

**Solution:**
1. Check if display name is set (not null/empty)
2. Verify email exists in user object
3. Check ProfileAvatar component rendering
4. Inspect element - see what's actually rendered

---

### Issue: Avatar not clickable in group/event
**Expected Behavior:**
- Member cards/avatars should be clickable
- Should navigate to `/members/{id}`

**Solution:**
- Verify `onClick` handler present
- Check `navigate` function imported
- Ensure `cursor-pointer` class applied

---

## 📊 Verification Checklist

### Backend Verification:
- [ ] Profile photo endpoint returns 200 status
- [ ] Cloudinary receives and stores images
- [ ] Member DTO includes `profilePhotoUrl`
- [ ] Update endpoint returns updated member data
- [ ] Images visible in Cloudinary console under `hikehub/profiles/`

### Frontend Verification:
- [ ] ProfileAvatar component renders correctly
- [ ] ImageUpload component works for profiles
- [ ] Profile page edit/save flow works
- [ ] Member detail page shows real data
- [ ] Photos visible in navbar, comments, groups, events
- [ ] Cache invalidation works (updates propagate)

### UI/UX Verification:
- [ ] All hover effects work
- [ ] Transitions smooth (200-300ms)
- [ ] Colors match OutMeets brand (purple-pink-orange)
- [ ] Responsive on mobile/tablet/desktop
- [ ] Loading states show correctly
- [ ] Error messages clear and helpful

---

## 🔍 Debug Tips

### Check API Responses:
```bash
# Get member details
curl http://localhost:8080/api/v1/members/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Update profile
curl -X PUT http://localhost:8080/api/v1/members/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"displayName":"John Smith","profilePhotoUrl":"https://..."}'
```

### Check React Query Cache:
```javascript
// In browser console
window.__REACT_QUERY_DEVTOOLS__ = true;
// Reload page, open React Query Devtools
```

### Check Cloudinary Upload:
1. Open Network tab in browser
2. Upload a file
3. Look for POST to `/api/v1/files/upload/profile-photo`
4. Check response - should have `imageUrl`
5. Open `imageUrl` in new tab - should show image

---

## 📝 Test Data Suggestions

### Good Test Images:
- Professional headshot (500x500px, 200KB)
- Landscape photo (1920x1080px, 2MB)
- Square photo (800x800px, 500KB)
- Small image (100x100px, 10KB)

### Edge Case Images:
- Maximum size (exactly 10MB)
- Very large resolution (4000x6000px)
- Animated GIF
- WebP format (modern browsers)
- Portrait orientation (tall)

### Test Names:
- "John Smith" (normal)
- "José García" (accents)
- "李明" (unicode)
- "VeryLongNameThatGoesOnForever" (long)
- "A" (single letter)
- "" (empty - should show email)

---

## ✅ Sign-Off Criteria

### Functionality:
- [x] Can upload profile photo
- [x] Can change display name
- [x] Can view member details
- [x] Photos display in all locations
- [x] Initials show as fallback

### Performance:
- [ ] Upload completes in < 5 seconds
- [ ] Images load quickly (CDN)
- [ ] No layout shift when images load
- [ ] Cache invalidation immediate

### UX:
- [ ] Clear feedback on all actions
- [ ] Error messages helpful
- [ ] Loading states visible
- [ ] Responsive on all devices
- [ ] Accessible (keyboard navigation)

---

## 🎯 Priority Test Cases

**P0 (Must Work):**
1. Upload profile photo
2. View photo in navbar
3. View photo in profile page
4. Edit display name

**P1 (Should Work):**
5. Photos in comments
6. Photos in group members
7. Photos in event attendees
8. Member detail page

**P2 (Nice to Have):**
9. Hover effects
10. Smooth transitions
11. Cache invalidation
12. Error handling

---

**Happy Testing! 🎉**

*If you encounter any issues not covered here, check the browser console for errors and the Network tab for failed requests.*
