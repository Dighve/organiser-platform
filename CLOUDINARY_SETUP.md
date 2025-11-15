# Cloudinary Setup Guide

## Quick Setup (5 minutes)

### 1. Create Cloudinary Account

1. Go to [https://cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
2. Sign up with email or GitHub
3. Choose the **FREE plan** (no credit card required)

### 2. Get Your Credentials

After signing up, you'll be redirected to the Dashboard:

1. Look for the **Account Details** section
2. Copy these three values:
   - **Cloud Name** (e.g., `dk1abc2def`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (click "Reveal" to see it, e.g., `abcdefghijklmnopqrst`)

### 3. Configure Local Development

**Option A: Using Environment Variables (Recommended)**

```bash
export CLOUDINARY_CLOUD_NAME=your_cloud_name
export CLOUDINARY_API_KEY=your_api_key
export CLOUDINARY_API_SECRET=your_api_secret
```

**Option B: Create application-dev.properties**

Create `backend/src/main/resources/application-dev.properties`:

```properties
cloudinary.cloud-name=your_cloud_name
cloudinary.api-key=your_api_key
cloudinary.api-secret=your_api_secret
```

Then update `application.properties`:
```properties
spring.profiles.active=dev
```

### 4. Configure Render Production

In your Render dashboard:

1. Go to your backend service
2. Click **Environment** tab
3. Add these environment variables:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```
4. Click **Save Changes**
5. Your service will automatically redeploy

### 5. Test the Setup

**Local Testing:**

```bash
cd backend
./gradlew bootRun
```

Create an event and try uploading an image. Check the logs for:
```
Uploading image to Cloudinary: photo.jpg (size: 1234567 bytes)
Image uploaded successfully: https://res.cloudinary.com/...
```

**Production Testing:**

After deploying, create a test event on your production site and upload an image.

## Free Tier Limits

Cloudinary's free tier is generous:

| Resource | Free Tier | Notes |
|----------|-----------|-------|
| Storage | 25 GB | Plenty for thousands of event photos |
| Bandwidth | 25 GB/month | ~50,000 image views/month |
| Transformations | 25,000/month | Auto-optimization counts as 1 per image |
| Credits | 0.5/month | Advanced features (we don't use these) |

**For HikeHub:**
- Average event photo after optimization: ~500KB - 1MB
- With 1000 active events: ~1GB storage used
- Storage usage: **✅ Well within limits**

## Folder Structure

Your images will be organized as:

```
cloudinary.com/your_cloud_name/
└── hikehub/
    ├── events/
    │   ├── {uuid}.jpg
    │   ├── {uuid}.png
    │   └── ...
    └── groups/
        ├── {uuid}.jpg
        └── ...
```

## Cloudinary Dashboard Features

### View Uploaded Images

1. Go to **Media Library**
2. Navigate to `hikehub/events` folder
3. View all uploaded event photos

### Monitor Usage

1. Go to **Dashboard**
2. Check usage graphs:
   - Storage Used
   - Bandwidth Used
   - Transformations Used

### Image Optimization

All images are automatically optimized:
- **Format:** Auto-converted to WebP for supported browsers
- **Quality:** `auto:good` - 80-90% quality, 40-60% size reduction
- **CDN:** Delivered via Cloudinary's global CDN

## Security Best Practices

### ✅ DO:
- Store credentials as environment variables
- Use HTTPS URLs only (we do this automatically)
- Rotate API keys periodically
- Monitor usage in Cloudinary dashboard

### ❌ DON'T:
- Commit credentials to Git
- Share API secrets publicly
- Use the same credentials across multiple projects
- Hardcode credentials in source code

## Troubleshooting

### "Could not resolve com.cloudinary" during build

**Solution:** Run Gradle with dependency refresh:
```bash
./gradlew clean build --refresh-dependencies
```

### "Invalid API Key" errors

**Solution:**
1. Verify credentials are correct in Cloudinary dashboard
2. Check environment variables are set
3. Restart your backend application

### Images not uploading

**Solution:**
1. Check backend logs for detailed error messages
2. Verify file meets requirements (10MB max, JPG/PNG/GIF/WebP)
3. Test Cloudinary API directly:
   ```bash
   curl -X POST \
     -F "file=@test.jpg" \
     -F "upload_preset=unsigned_preset" \
     https://api.cloudinary.com/v1_1/{your_cloud_name}/image/upload
   ```

### 401 Unauthorized from backend

**Solution:**
1. Ensure user is logged in
2. Check JWT token is valid
3. Verify Spring Security configuration allows file uploads

## Advanced Configuration (Optional)

### Custom Upload Presets

1. Go to **Settings** → **Upload**
2. Click **Add upload preset**
3. Configure:
   - Signing Mode: Signed
   - Folder: hikehub/events
   - Transformations: Quality auto:good

### Upload Restrictions

Add to your preset:
- Max file size: 10MB
- Allowed formats: jpg, png, gif, webp
- Max dimensions: 4000x4000

### Backup Strategy

Cloudinary keeps your images safe, but for extra safety:

1. Go to **Settings** → **Backup**
2. Enable automatic backups (optional, paid feature)
3. Or periodically export via API (for free tier users)

## Cost Management

### Monitor Your Usage

Set up usage alerts:

1. Go to **Settings** → **Notifications**
2. Enable **Usage Alerts**
3. Set threshold to 80% of free tier limits

### What if you exceed free tier?

1. **Storage (25GB):** Consider:
   - Compressing images before upload
   - Deleting old event images
   - Upgrading to paid plan ($0.0034/GB/month)

2. **Bandwidth (25GB):** This means ~50,000 image loads/month
   - Very unlikely to hit for a small app
   - If reached, images still work, just shows overage on bill

3. **Transformations (25,000):** Each image load = 1 transformation
   - Cache images in browser to reduce transformations
   - Use CDN effectively (we do this automatically)

## Migration from URL-based Images

If you have existing events with URL-based images:

1. Old URL-based images will continue to work
2. New uploads will go to Cloudinary
3. Optionally migrate old images:

```bash
# Run this script to migrate existing images
# (Create a migration script if needed)
```

## Support & Resources

- **Cloudinary Docs:** [https://cloudinary.com/documentation](https://cloudinary.com/documentation)
- **API Reference:** [https://cloudinary.com/documentation/image_upload_api_reference](https://cloudinary.com/documentation/image_upload_api_reference)
- **Community:** [https://community.cloudinary.com](https://community.cloudinary.com)
- **Support:** Available via dashboard (free tier = community support)

## Checklist

Use this checklist when setting up:

### Local Development
- [ ] Cloudinary account created
- [ ] Credentials copied from dashboard
- [ ] Environment variables set
- [ ] Backend builds successfully
- [ ] Test upload works
- [ ] Images visible in Cloudinary Media Library

### Production (Render)
- [ ] Environment variables set in Render
- [ ] Backend deployed successfully
- [ ] Test upload in production
- [ ] Verify images load via CDN
- [ ] Monitor usage in Cloudinary dashboard

---

**Need Help?** Check the [FILE_UPLOAD_IMPLEMENTATION.md](./FILE_UPLOAD_IMPLEMENTATION.md) for technical details.
