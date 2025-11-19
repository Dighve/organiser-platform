# File Upload Implementation Guide

## Overview

HikeHub now supports direct image uploads from users' computers using **Cloudinary** as the cloud storage provider. This replaces the previous URL-based image input system.

## Why Cloudinary?

- ✅ **Perfect for Render.com deployment** - Render's ephemeral filesystem doesn't persist uploaded files
- ✅ **Generous free tier** - 25GB storage, 25GB bandwidth/month, 25,000 transformations
- ✅ **Automatic optimization** - Images are automatically optimized for web delivery
- ✅ **CDN delivery** - Fast image delivery worldwide
- ✅ **Image transformations** - Automatic format conversion (WebP), quality optimization
- ✅ **Easy integration** - Simple Java SDK

## Architecture

### Backend (Spring Boot)

**New Files:**
1. `FileUploadService.java` - Handles Cloudinary uploads with validation
2. `FileUploadController.java` - REST endpoints for file uploads
3. `CloudinaryConfig.java` - Cloudinary SDK configuration

**Key Features:**
- File validation (type, size, format)
- Max file size: 10MB
- Allowed formats: JPG, JPEG, PNG, GIF, WebP
- Automatic image optimization (quality: auto:good, format: auto)
- Organized folder structure: `hikehub/events/` and `hikehub/groups/`
- Image deletion support

**Endpoints:**
- `POST /api/v1/files/upload/event-photo` - Upload event feature photo
- `POST /api/v1/files/upload/group-banner` - Upload group banner
- `DELETE /api/v1/files/delete?imageUrl={url}` - Delete an image

### Frontend (React)

**New Component:**
- `ImageUpload.jsx` - Beautiful drag-and-drop style upload component

**Features:**
- Click-to-upload interface
- Instant preview
- Upload progress indicator
- File validation (client-side)
- Beautiful HikeHub-styled design with purple-pink gradients
- Helpful tips for users
- Remove/replace functionality

**Integration:**
- Added to CreateEventPage BASICS step (above description)
- Can be reused for group banners and other image uploads

## Setup Instructions

### 1. Get Cloudinary Account (Free)

1. Sign up at [Cloudinary.com](https://cloudinary.com)
2. Go to Dashboard
3. Copy your credentials:
   - Cloud Name
   - API Key
   - API Secret

### 2. Configure Backend (Local Development)

Add to your local environment variables or create `application-dev.properties`:

```properties
cloudinary.cloud-name=your_cloud_name
cloudinary.api-key=your_api_key
cloudinary.api-secret=your_api_secret
```

### 3. Configure Backend (Render Production)

In your Render dashboard, add environment variables:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4. Build Backend

The Cloudinary dependency will be automatically downloaded:

```bash
cd backend
./gradlew build
```

### 5. Frontend Setup

No additional configuration needed! The frontend communicates with the backend API which handles Cloudinary operations.

## Usage

### For Developers

**Using the ImageUpload Component:**

```jsx
import ImageUpload from '../components/ImageUpload'

<ImageUpload
  value={imageUrl}
  onChange={(url) => setImageUrl(url)}
  folder="event-photo"  // or "group-banner"
/>
```

**Props:**
- `value` (string) - Current image URL
- `onChange` (function) - Callback when image is uploaded, receives the Cloudinary URL
- `folder` (string) - Folder type: "event-photo" or "group-banner"

### For Users

1. Click the upload area in the Create Event page (Step 1: Basics)
2. Select an image from your computer
3. Wait for upload to complete (usually 1-3 seconds)
4. Preview appears immediately
5. Click "Remove" to delete and upload a different image

## File Structure

```
backend/
├── src/main/java/com/organiser/platform/
│   ├── config/
│   │   └── CloudinaryConfig.java          # Cloudinary bean configuration
│   ├── controller/
│   │   └── FileUploadController.java      # Upload endpoints
│   └── service/
│       └── FileUploadService.java         # Upload logic & validation
└── build.gradle                            # Added cloudinary-http44:1.36.0

frontend/
└── src/
    ├── components/
    │   └── ImageUpload.jsx                 # Reusable upload component
    └── pages/
        └── CreateEventPage.jsx             # Integrated in BASICS step
```

## Image Storage Organization

Cloudinary folder structure:

```
hikehub/
├── events/
│   ├── {uuid}.jpg
│   ├── {uuid}.png
│   └── ...
└── groups/
    ├── {uuid}.jpg
    └── ...
```

Each uploaded image gets a unique UUID as its filename to prevent conflicts.

## Validation

### Backend Validation
- File must not be empty
- Max size: 10MB
- Allowed extensions: jpg, jpeg, png, gif, webp
- Content-Type validation

### Frontend Validation
- Same file type restrictions
- Size check before upload
- User-friendly error messages via toast notifications

## Image Optimization

Cloudinary automatically applies:
- **Quality**: `auto:good` - Optimal quality/size balance
- **Format**: `auto` - Serves WebP to supported browsers, falls back to original format
- **CDN**: All images served via Cloudinary's global CDN

## Security

- ✅ Uploads require authentication (JWT token)
- ✅ File type validation (both client and server)
- ✅ File size limits enforced
- ✅ Cloudinary API credentials stored as environment variables
- ✅ Public IDs are UUIDs (unpredictable)

## Cost Estimates

Cloudinary Free Tier:
- 25GB storage
- 25GB bandwidth/month
- 25,000 transformations/month

**Example Usage:**
- Average event photo: 2-5MB
- After optimization: 500KB-1MB
- With 1000 events: ~1GB storage used
- 10,000 page views/month: ~10GB bandwidth

**Conclusion:** Free tier is sufficient for 100-500 active events.

## Troubleshooting

### Upload fails with "Failed to upload image"

1. Check Cloudinary credentials are set correctly
2. Verify the backend can connect to Cloudinary API
3. Check backend logs for detailed error messages
4. Ensure file meets validation requirements (size, type)

### Images not displaying after upload

1. Verify the imageUrl is being saved to the database
2. Check browser console for CORS errors
3. Verify Cloudinary URLs are accessible (try opening in browser)

### "401 Unauthorized" errors

1. Ensure user is logged in
2. Check JWT token is valid and being sent with requests
3. Verify backend authentication is properly configured

## Future Enhancements

Potential improvements:
- [ ] Image cropping/editing before upload
- [ ] Multiple image uploads for event galleries
- [ ] Drag-and-drop upload support
- [ ] Thumbnail generation for image lists
- [ ] Image compression options
- [ ] Upload progress bar with percentage
- [ ] Support for user profile photos

## Deployment Checklist

Before deploying to production:

- [ ] Cloudinary account created
- [ ] Environment variables set in Render
- [ ] Backend built with Cloudinary dependency
- [ ] Test upload functionality in staging
- [ ] Verify images are accessible via Cloudinary URLs
- [ ] Monitor Cloudinary usage in dashboard

## Support

For issues related to:
- **Backend:** Check `FileUploadService.java` logs
- **Frontend:** Check browser console for errors
- **Cloudinary:** Visit [Cloudinary Docs](https://cloudinary.com/documentation)

---

**Implementation Date:** November 2024  
**Version:** 1.0  
**Status:** ✅ Production Ready
