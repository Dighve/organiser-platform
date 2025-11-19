# Profile Photo Implementation Guide

## Overview
Implementation of secure profile photo upload and display system for OutMeets platform.

## Security Strategy: Authenticated Cloudinary URLs

### Why This Approach?
- **Not Publicly Accessible**: Photos only viewable by authenticated platform members
- **Simple Implementation**: No complex signed URL generation
- **Cost-Effective**: Uses existing Cloudinary integration
- **Scalable**: Supports future growth

### How It Works
1. **Upload**: Profile photos uploaded to Cloudinary folder `hikemeets/profiles/`
2. **Storage**: URL stored in `members.profile_photo_url` column (already exists)
3. **Access Control**: Backend endpoint serves photos only to authenticated users
4. **Frontend**: All photo requests include JWT token in headers
5. **Fallback**: Gradient avatar with initials if no photo exists

## Security Layers

### Layer 1: Authentication Required
- All profile photo requests require valid JWT token
- Unauthenticated users cannot access photos
- Token validated on every request

### Layer 2: Member-Only Access
- Only platform members (logged in users) can view photos
- External users cannot access photos even with URL

### Layer 3: Cloudinary Folder Organization
```
hikehub/
  ├── events/        # Event photos (already exists)
  ├── groups/        # Group banners (already exists)
  └── profiles/      # Profile photos (NEW)
      └── {uuid}.webp
```

## Implementation Plan

### Backend Changes

#### 1. MemberService.java - New Methods
```java
// Update profile photo
public MemberDTO updateProfilePhoto(Long memberId, String photoUrl)

// Get member by ID (with DTO conversion)
public MemberDTO getMemberDTOById(Long memberId)

// Update member profile
public MemberDTO updateMemberProfile(Long memberId, UpdateMemberProfileRequest request)
```

#### 2. MemberController.java - New Endpoints
```java
// Upload profile photo
POST /api/v1/members/me/profile-photo
MultipartFile file

// Get member details (for member detail page)
GET /api/v1/members/{memberId}
Returns: MemberDTO with email, displayName, profilePhotoUrl

// Update profile (displayName, etc.)
PUT /api/v1/members/me
Body: UpdateMemberProfileRequest
```

#### 3. FileUploadController.java - Add Endpoint
```java
// Profile photo upload (reuse existing logic)
POST /api/v1/files/upload/profile-photo
folder = "profiles"
```

#### 4. New DTO: UpdateMemberProfileRequest.java
```java
public class UpdateMemberProfileRequest {
    private String displayName;
    private String profilePhotoUrl;
}
```

### Frontend Changes

#### 1. ProfilePage.jsx - Add Photo Upload
- ImageUpload component for profile photo
- Display name editor
- Save button with mutation
- Preview current photo

#### 2. MemberDetailPage.jsx - Real Implementation
- Fetch member data via API
- Display: photo, displayName, email, stats
- Show events attended, groups joined
- Use placeholder avatar if no photo

#### 3. Update All Components with Profile Photos
- **Layout.jsx**: User avatar in navbar
- **CommentSection.jsx**: Commenter avatars
- **GroupDetailPage.jsx**: Member avatars in Members tab
- **EventDetailPage.jsx**: Attendee avatars
- **GroupCard.jsx**: Organiser avatar (if needed)

#### 4. Create ProfileAvatar Component
Reusable component for displaying avatars:
```jsx
<ProfileAvatar 
  photoUrl={member.profilePhotoUrl}
  displayName={member.displayName}
  email={member.email}
  size="lg" // sm, md, lg, xl
/>
```

## Data Flow

### Upload Flow
1. User clicks "Upload Photo" on Profile page
2. ImageUpload component opens file picker
3. File uploaded to `/api/v1/files/upload/profile-photo`
4. Cloudinary returns URL
5. Frontend calls `/api/v1/members/me` with photoUrl
6. Backend updates `members.profile_photo_url`
7. Success toast, photo displayed immediately

### Display Flow
1. Component needs to show member photo
2. Check if `member.profilePhotoUrl` exists
3. If exists: Display image with auth headers
4. If not: Show gradient avatar with initials
5. All images use `ProfileAvatar` component

## Migration (Not Required)
The `profile_photo_url` column already exists in the `members` table, so no database migration needed.

## API Endpoints Summary

### Member Profile
- `GET /api/v1/members/{memberId}` - Get member details (authenticated)
- `GET /api/v1/members/me` - Get current user profile
- `PUT /api/v1/members/me` - Update current user profile

### File Upload
- `POST /api/v1/files/upload/profile-photo` - Upload profile photo

## Benefits

### Security
✅ Photos not publicly accessible outside platform
✅ Authentication required for all access
✅ Member-only visibility
✅ No direct Cloudinary URL exposure

### User Experience
✅ Easy photo upload with preview
✅ Consistent avatar display across platform
✅ Graceful fallback to gradient avatars
✅ Fast loading with CDN delivery

### Developer Experience
✅ Reuses existing Cloudinary integration
✅ Simple implementation, no signed URLs
✅ Reusable ProfileAvatar component
✅ Consistent patterns across codebase

## Testing Checklist

### Backend
- [ ] Upload profile photo - success
- [ ] Upload profile photo - file too large (10MB)
- [ ] Upload profile photo - invalid file type
- [ ] Update member profile - success
- [ ] Get member by ID - with photo
- [ ] Get member by ID - without photo
- [ ] Unauthenticated access - rejected

### Frontend
- [ ] Profile page - upload photo
- [ ] Profile page - update display name
- [ ] Member detail page - shows email
- [ ] Member detail page - shows photo or avatar
- [ ] Navbar - shows user photo/avatar
- [ ] Comments - show commenter photos
- [ ] Group members - show member photos
- [ ] Event attendees - show attendee photos

## Future Enhancements
- Image cropping before upload
- Photo guidelines/requirements display
- Multiple photo sizes (thumbnail, full)
- Photo moderation/reporting
- Default avatar selection (instead of gradient)
- Privacy settings (who can see your photo)

## Notes
- Profile photos stored permanently (not deleted when member leaves)
- 10MB max file size
- Supported formats: JPG, PNG, GIF, WebP
- Automatic WebP conversion for optimization
- CDN delivery for fast loading worldwide
