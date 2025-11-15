# 🚀 Quick Start: Image Upload Feature

## Get Started in 5 Minutes!

### Step 1: Get Cloudinary Credentials (2 minutes)

1. **Sign up:** [https://cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
2. **Copy credentials** from the dashboard:
   - Cloud Name (e.g., `dk1abc2def`)
   - API Key (e.g., `123456789012345`)
   - API Secret (click "Reveal" to see it)

### Step 2: Set Environment Variables (1 minute)

**For Mac/Linux:**
```bash
export CLOUDINARY_CLOUD_NAME=your_cloud_name
export CLOUDINARY_API_KEY=your_api_key
export CLOUDINARY_API_SECRET=your_api_secret
```

**For Windows:**
```cmd
set CLOUDINARY_CLOUD_NAME=your_cloud_name
set CLOUDINARY_API_KEY=your_api_key
set CLOUDINARY_API_SECRET=your_api_secret
```

### Step 3: Start Backend (1 minute)

```bash
cd backend
./gradlew bootRun
```

Wait for: `Started PlatformApplication in X seconds`

### Step 4: Start Frontend (1 minute)

Open a new terminal:

```bash
cd frontend
npm run dev
```

Visit: http://localhost:3003

### Step 5: Test Upload! 🎉

1. **Login** to your HikeHub account
2. Go to any **Group page**
3. Click **"Create Event"**
4. You'll see the new **Feature Photo** upload section in Step 1
5. **Click the upload area** and select an image
6. Watch it upload and preview!

## ✅ What to Expect

### In the Create Event Page (Step 1: Basics)

**Before Upload:**
- Large purple-gradient upload button
- "Upload Feature Photo" text
- Icon with upload symbol
- Helpful tips below

**During Upload (1-3 seconds):**
- Spinning loader icon
- "Uploading..." text
- Preview appears immediately

**After Upload:**
- Full image preview
- Green checkmark with "Image uploaded" text
- Hover to see "Remove" button
- Success toast notification

### In Cloudinary Dashboard

1. Go to **Media Library**
2. Navigate to `hikehub` → `events`
3. See your uploaded images!

## 🎨 Design Preview

The upload component features:
- **Purple-pink gradient** styling (matches HikeHub brand)
- **Large preview** after upload
- **Upload tips** in blue gradient box
- **Hover effects** for remove button
- **Toast notifications** for feedback

## 📝 Testing Checklist

Try these scenarios:

### Valid Uploads
- [ ] Upload JPG image (< 10MB)
- [ ] Upload PNG image (< 10MB)
- [ ] Upload GIF image (< 10MB)
- [ ] Upload WebP image (< 10MB)
- [ ] Remove and replace image

### Validation
- [ ] Try uploading 11MB file → Should show error
- [ ] Try uploading .txt file → Should show error
- [ ] Try uploading without login → Should require auth

### Visual Tests
- [ ] Preview shows immediately after selection
- [ ] Hover shows remove button
- [ ] Upload spinner appears during upload
- [ ] Success toast appears
- [ ] Image persists after page refresh

## 🐛 Common Issues

### Issue: "Build failed" or import errors

**Solution:**
```bash
cd backend
./gradlew clean build --refresh-dependencies
```

### Issue: "Upload failed"

**Checks:**
1. Are environment variables set? → `echo $CLOUDINARY_CLOUD_NAME`
2. Is backend running? → Check console for errors
3. Is file < 10MB and valid format?

### Issue: "401 Unauthorized"

**Solution:** Make sure you're logged in! The upload requires authentication.

### Issue: Environment variables not working

**Solution for IntelliJ/IDE:**
1. Edit Run Configuration
2. Add environment variables there
3. Or create `application-dev.properties`:
   ```properties
   cloudinary.cloud-name=your_value
   cloudinary.api-key=your_value
   cloudinary.api-secret=your_value
   ```

## 🎯 Next Steps

Once testing works locally:

### Deploy to Render

1. **Add environment variables** in Render dashboard:
   ```
   CLOUDINARY_CLOUD_NAME=your_value
   CLOUDINARY_API_KEY=your_value
   CLOUDINARY_API_SECRET=your_value
   ```

2. **Deploy:** Render will auto-deploy on next push

3. **Test:** Create event in production and upload image

### Monitor Usage

Check Cloudinary dashboard:
- **Storage:** How much space used
- **Bandwidth:** How many times images loaded
- **Transformations:** How many times optimized

Free tier is very generous - should handle hundreds of events easily!

## 📚 Documentation

For more details:
- **Setup Guide:** [CLOUDINARY_SETUP.md](./CLOUDINARY_SETUP.md)
- **Technical Docs:** [FILE_UPLOAD_IMPLEMENTATION.md](./FILE_UPLOAD_IMPLEMENTATION.md)
- **Feature Summary:** [IMAGE_UPLOAD_SUMMARY.md](./IMAGE_UPLOAD_SUMMARY.md)

## 💡 Pro Tips

1. **Test with different image sizes** - Cloudinary optimizes automatically
2. **Check browser DevTools Network tab** - See upload speed
3. **Visit Cloudinary Media Library** - See all uploaded images
4. **Try removing and re-uploading** - Tests full flow
5. **Check backend logs** - Shows Cloudinary upload details

## 🎊 Success Criteria

You'll know it's working when:
- ✅ Image uploads in 1-3 seconds
- ✅ Preview appears immediately
- ✅ Success toast notification shows
- ✅ Image appears in Cloudinary dashboard
- ✅ Image loads when viewing the event
- ✅ Image persists after page refresh

## 🙋 Need Help?

1. **Backend logs:** Check console where `./gradlew bootRun` is running
2. **Frontend logs:** Check browser console (F12)
3. **Cloudinary:** Check Media Library for uploaded images
4. **Network:** Check Network tab for failed requests

---

**Ready to test?** Follow the 5 steps above and start uploading! 🚀

**Implementation Complete!** All code is ready - just needs Cloudinary credentials.
