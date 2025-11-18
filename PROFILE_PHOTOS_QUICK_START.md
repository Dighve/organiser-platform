# Profile Photos - Quick Start Guide

## 🎯 What's New

Users can now:
- ✅ Upload profile photos to their account
- ✅ Set a custom display name
- ✅ View other members' profiles with photos
- ✅ See photos everywhere: navbar, comments, groups, events

---

## 🚀 Quick Test (2 minutes)

### 1. Upload Your Photo
```
1. Go to Profile page (click your name in navbar)
2. Click "Edit Profile"
3. Upload a photo
4. Add your name
5. Click "Save Changes"
```

### 2. See It Everywhere
- Check navbar (top-right) - your photo appears
- Go to any event - post a comment - your photo shows
- Join a group - your photo shows in members list
- View event attendees - photos visible

---

## 📋 Implementation Summary

### Backend Changes:
```java
// New Endpoints
GET  /api/v1/members/{memberId}       // Get member details
PUT  /api/v1/members/me               // Update profile
POST /api/v1/files/upload/profile-photo // Upload photo

// New DTO
UpdateMemberProfileRequest {
  displayName: String (optional)
  profilePhotoUrl: String (optional)
}
```

### Frontend Changes:
```javascript
// New Component
<ProfileAvatar 
  member={memberData} 
  size="md" 
  showBadge={true} 
  badgeType="organiser" 
/>

// Updated Pages
- ProfilePage.jsx      // Photo upload & editing
- MemberDetailPage.jsx // Show member info
- Layout.jsx           // Navbar photo
- CommentSection.jsx   // Commenter photos
- GroupDetailPage.jsx  // Member photos
- EventDetailPage.jsx  // Attendee photos
```

---

## 🔧 Setup Required

### 1. Cloudinary Credentials
Add to `backend/src/main/resources/application.properties`:
```properties
cloudinary.cloud-name=your_cloud_name
cloudinary.api-key=your_api_key
cloudinary.api-secret=your_api_secret
```

### 2. Start Services
```bash
# Backend
cd organiser-platform/backend
./gradlew bootRun

# Frontend
cd organiser-platform/frontend
npm run dev
```

### 3. Test
- Navigate to http://localhost:5173
- Log in
- Go to Profile
- Upload photo

---

## 📂 Key Files

### Backend:
```
backend/src/main/java/com/organiser/platform/
├── controller/
│   ├── FileUploadController.java  ← profile-photo upload endpoint
│   └── MemberController.java       ← member CRUD endpoints
├── service/
│   └── MemberService.java          ← profile update logic
└── dto/
    └── UpdateMemberProfileRequest.java ← NEW
```

### Frontend:
```
frontend/src/
├── components/
│   └── ProfileAvatar.jsx           ← NEW reusable component
├── pages/
│   ├── ProfilePage.jsx             ← Complete rebuild
│   └── MemberDetailPage.jsx        ← Real API integration
└── lib/
    └── api.js                      ← New member endpoints
```

---

## 🎨 ProfileAvatar Component

### Usage:
```jsx
import ProfileAvatar from './components/ProfileAvatar'

// Basic usage
<ProfileAvatar member={memberData} size="md" />

// With badge
<ProfileAvatar 
  member={memberData} 
  size="lg" 
  showBadge={true} 
  badgeType="organiser" 
/>
```

### Sizes:
- `xs` - 6x6 (24px)
- `sm` - 8x8 (32px)
- `md` - 10x10 (40px) ← Default
- `lg` - 12x12 (48px)
- `xl` - 16x16 (64px)
- `2xl` - 20x20 (80px)
- `3xl` - 32x32 (128px)

### Features:
- Shows photo if available
- Falls back to gradient + initials
- Organiser/Host badges
- Hover effects
- Consistent styling

---

## 🧪 Testing Checklist

**Basic Flow:**
- [ ] Upload profile photo
- [ ] Change display name
- [ ] Save profile
- [ ] View photo in navbar
- [ ] View photo in comments
- [ ] View member detail page

**Edge Cases:**
- [ ] Upload file > 10MB (should fail)
- [ ] Upload wrong file type (should fail)
- [ ] Member with no photo (initials)
- [ ] Member with no name (shows email)
- [ ] Long display names (truncated)

---

## 🐛 Common Issues

### Photo not showing?
1. Check Cloudinary credentials set
2. Hard refresh (Cmd+Shift+R)
3. Check Network tab for errors
4. Verify image URL returned from API

### Upload failing?
1. File size < 10MB?
2. File type JPG/PNG/GIF/WebP?
3. Cloudinary credentials correct?
4. Check backend logs

### Initials not showing?
1. Display name or email set?
2. Check ProfileAvatar props
3. Inspect element in browser

---

## 📚 Documentation

- **Full Summary:** `PROFILE_PHOTO_COMPLETE_SUMMARY.md`
- **Testing Guide:** `TESTING_PROFILE_PHOTOS.md`
- **Implementation Plan:** `PROFILE_PHOTO_IMPLEMENTATION.md`

---

## 🎉 Success Metrics

✅ **11/12 tasks complete**
- Backend: 3 files modified, 1 new DTO
- Frontend: 8 files modified, 1 new component
- Photos display in 6+ locations
- Secure Cloudinary storage
- No database migrations needed

---

## 🔜 Next Steps

1. **Test** - Run through test scenarios
2. **Deploy** - Add Cloudinary env vars to production
3. **Monitor** - Check upload success rate
4. **Iterate** - Gather user feedback

---

**Status:** ✅ Ready for Testing  
**Date:** November 18, 2025  
**Version:** OutMeets v1.0

---

*For detailed testing instructions, see `TESTING_PROFILE_PHOTOS.md`*
