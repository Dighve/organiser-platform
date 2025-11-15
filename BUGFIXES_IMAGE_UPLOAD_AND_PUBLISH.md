# Bug Fixes: Image Upload & Event Publishing

## Issues Fixed

### 1. ❌ Image Upload Not Working
**Problem:** Uploaded images not showing in events, image URL not generated

**Root Cause:** API endpoint path was missing `/api/v1` prefix
- **Wrong:** `${API_URL}/files/upload/${folder}`
- **Correct:** `${API_URL}/api/v1/files/upload/${folder}`

**Fix Applied:**
- Updated `ImageUpload.jsx` line 51 to include proper API path
- File: `frontend/src/components/ImageUpload.jsx`

**How to Test:**
1. Start backend with Cloudinary credentials set
2. Go to Create Event page
3. Click Feature Photo upload area
4. Select an image file
5. ✅ Should see "Image uploaded successfully!" toast
6. ✅ Image preview should appear
7. ✅ Image URL should be saved (check browser DevTools Network tab)

### 2. ❌ Events Showing as "DRAFT" Status
**Problem:** Events created but staying in DRAFT status, not visible publicly

**Root Cause:** Events were created but never published
- Events default to `DRAFT` status on creation (backend line 102 in Event.java)
- CreateEventPage wasn't calling the publish API

**Fix Applied:**
- Updated `onFinalSubmit` function in CreateEventPage.jsx
- Now automatically calls `eventsAPI.publishEvent()` after creating event
- File: `frontend/src/pages/CreateEventPage.jsx` lines 131-146

**How to Test:**
1. Create a new event
2. ✅ Should see "Hike event created and published successfully!" message
3. ✅ Event should immediately appear on group page
4. ✅ Event status should be "PUBLISHED" (not DRAFT)

## Testing Checklist

### Image Upload Test
- [ ] Start backend: `cd backend && ./gradlew bootRun`
- [ ] Verify Cloudinary env vars are set:
  ```bash
  echo $CLOUDINARY_CLOUD_NAME
  echo $CLOUDINARY_API_KEY
  echo $CLOUDINARY_API_SECRET
  ```
- [ ] Start frontend: `cd frontend && npm run dev`
- [ ] Login to HikeHub
- [ ] Go to any group → Create Event
- [ ] Upload an image in Step 1 (Basics)
- [ ] Verify image preview appears
- [ ] Complete event creation
- [ ] Verify image shows on event detail page

### Event Publishing Test
- [ ] Create a new event
- [ ] Check success message says "published"
- [ ] Go to group page
- [ ] Verify event appears immediately
- [ ] Click on event
- [ ] Verify event details show correctly

## Common Issues & Solutions

### Issue: "Failed to upload image"
**Check:**
1. Backend logs - look for detailed error
2. Cloudinary credentials - verify they're correct
3. File size - must be < 10MB
4. File type - must be JPG, PNG, GIF, or WebP

**Debug:**
```bash
# Check backend logs
cd backend
./gradlew bootRun
# Look for "Uploading image to Cloudinary" message

# Verify env vars
echo $CLOUDINARY_CLOUD_NAME
echo $CLOUDINARY_API_KEY
echo $CLOUDINARY_API_SECRET
```

### Issue: Still seeing DRAFT events
**Solution:**
1. Old events created before the fix will stay in DRAFT
2. To manually publish them, use the API:
   ```bash
   curl -X POST http://localhost:8080/api/v1/events/{eventId}/publish \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```
3. Or delete old draft events and create new ones

### Issue: Image shows in preview but not after creating event
**Check:**
1. Browser console for errors
2. Network tab - verify image URL was sent in create event payload
3. Backend logs - verify imageUrl was saved
4. Check event detail page - verify imageUrl is not null

**Debug:**
```javascript
// In CreateEventPage.jsx onFinalSubmit, add console.log:
console.log('Payload:', payload)
// Check if imageUrl is included
```

## Changes Made

### File: `frontend/src/components/ImageUpload.jsx`
**Line 51:** Added `/api/v1` to API endpoint
```javascript
// Before
`${API_URL}/files/upload/${folder}`

// After  
`${API_URL}/api/v1/files/upload/${folder}`
```

### File: `frontend/src/pages/CreateEventPage.jsx`
**Lines 131-146:** Auto-publish after creation
```javascript
try {
  // Create the event
  const response = await eventsAPI.createEvent(payload)
  const eventId = response.data.id
  
  // Automatically publish the event
  await eventsAPI.publishEvent(eventId)
  
  queryClient.invalidateQueries(['groupEvents', groupId])
  queryClient.invalidateQueries(['events'])
  toast.success('🎉 Hike event created and published successfully!')
  navigate(`/groups/${groupId}`)
} catch (error) {
  console.error('Error creating event:', error)
  toast.error('Failed to create event. Please try again.')
}
```

## Deployment Notes

When deploying to Render:

1. **Cloudinary Environment Variables:**
   Make sure these are set in Render dashboard:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

2. **Frontend Build:**
   The API path fix will be included in the build

3. **Backend Restart:**
   Render will automatically restart with Cloudinary support

## Verification Commands

### Check if Cloudinary is working:
```bash
# Backend logs should show:
# "Uploading image to Cloudinary: filename.jpg (size: 1234567 bytes)"
# "Image uploaded successfully: https://res.cloudinary.com/..."
```

### Check if event is published:
```bash
# Query event by ID
curl http://localhost:8080/api/v1/events/public/{eventId}

# Response should have:
# "status": "PUBLISHED"
```

### Check if image URL is saved:
```bash
# In event response, verify:
# "imageUrl": "https://res.cloudinary.com/your_cloud/image/upload/..."
```

## Success Indicators

✅ **Image Upload Working:**
- Toast notification: "🎉 Image uploaded successfully!"
- Preview appears immediately
- Image persists after page refresh
- Image visible in Cloudinary Media Library
- Image appears on event detail page

✅ **Event Publishing Working:**
- Toast notification: "🎉 Hike event created and published successfully!"
- Event appears immediately on group page
- Event is publicly visible
- Event status is "PUBLISHED"

---

**Fix Date:** November 9, 2025  
**Status:** ✅ Ready to Test  
**Files Modified:** 2 (ImageUpload.jsx, CreateEventPage.jsx)
