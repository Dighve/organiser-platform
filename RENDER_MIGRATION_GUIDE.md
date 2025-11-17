# HikeHub - Render Migration Guide (New Account)

This guide will help you migrate HikeHub to a fresh Render account to get a new database trial.

## Prerequisites

✅ New Render account (different email than your old account)
✅ GitHub repository access
✅ Cloudinary credentials (cloud name, API key, API secret)
✅ (Optional) Resend API key for email functionality

---

## Step 1: Create New Render Account

1. Go to [https://render.com/signup](https://render.com/signup)
2. Sign up with a **different email** than your old account
3. Verify your email address
4. Complete the onboarding process

---

## Step 2: Connect GitHub Repository

1. In Render Dashboard, click **"New +"** → **"Blueprint"**
2. Click **"Connect GitHub"**
3. Authorize Render to access your GitHub account
4. Select your HikeHub repository from the list
5. Click **"Connect"**

---

## Step 3: Deploy Using Blueprint

1. After connecting the repo, Render will detect `render.yaml`
2. You'll see a preview showing:
   - **Web Service**: hikehub-backend
   - **Database**: hikehub-db (PostgreSQL)
3. Click **"Apply"** to start deployment

**⏳ Initial deployment takes 5-10 minutes**

---

## Step 4: Set Environment Variables in Render Dashboard

After the blueprint is applied, you need to set the environment variables that are marked with `sync: false`:

### 4.1 Go to Your Web Service

1. In Render Dashboard, click on **"hikehub-backend"**
2. Go to **"Environment"** tab

### 4.2 Add Cloudinary Variables

Click **"Add Environment Variable"** for each:

| Key | Value | Where to Find |
|-----|-------|---------------|
| `CLOUDINARY_CLOUD_NAME` | Your cloud name | Cloudinary Dashboard |
| `CLOUDINARY_API_KEY` | Your API key | Cloudinary Dashboard |
| `CLOUDINARY_API_SECRET` | Your API secret | Cloudinary Dashboard → Settings → Access Keys |

**Your existing Cloudinary credentials from old deployment:**
- Cloud Name: `drdttgry4`
- API Key: `478746114596374`
- API Secret: `wXiHJlL_64SuSpyTUc7ajf8KdV4`

### 4.3 Add Email Variables (Optional)

If you have a Resend API key:

| Key | Value |
|-----|-------|
| `RESEND_API_KEY` | Your Resend API key |

If you don't have one, skip this - the app will work without email.

### 4.4 Verify Auto-Generated Variables

These should already be set automatically:

- ✅ `DATABASE_URL` - Auto-populated from database
- ✅ `JWT_SECRET` - Auto-generated
- ✅ `SPRING_PROFILES_ACTIVE` - Set to "prod"
- ✅ `FRONTEND_URL` - Set to your Netlify URL
- ✅ `JAVA_TOOL_OPTIONS` - Set to "-Xmx512m"

### 4.5 Save and Deploy

1. Click **"Save Changes"**
2. Render will automatically redeploy with the new variables
3. Wait 3-5 minutes for redeployment

---

## Step 5: Verify Backend Deployment

### 5.1 Check Service Status

1. Go to **"hikehub-backend"** service
2. Wait for status to show **"Live"** (green circle)
3. Look for **"Deploy succeeded"** in the logs

### 5.2 Get Your Backend URL

Your backend URL will be:
```
https://hikehub-backend.onrender.com
```

Or similar (check the service dashboard for exact URL)

### 5.3 Test Health Endpoint

Open in browser:
```
https://hikehub-backend.onrender.com/actuator/health
```

You should see:
```json
{"status":"UP"}
```

### 5.4 Check Database Connection

Look at the logs for:
```
✅ Flyway migration completed successfully
✅ HikariPool - Start completed
✅ Started PlatformApplication
```

---

## Step 6: Update Frontend (Netlify)

### 6.1 Update API URL in Netlify

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Select your **hikehub-poc** site
3. Go to **"Site configuration"** → **"Environment variables"**
4. Update `VITE_API_URL` to your new Render backend URL:
   ```
   https://hikehub-backend.onrender.com
   ```
5. Click **"Save"**

### 6.2 Trigger Redeploy

1. Go to **"Deploys"** tab
2. Click **"Trigger deploy"** → **"Clear cache and deploy site"**
3. Wait 1-2 minutes for deployment

---

## Step 7: Test the Application

### 7.1 Open Your Frontend

Go to: `https://hikehub-poc.netlify.app`

### 7.2 Test User Registration

1. Click **"Sign Up"**
2. Create a new account
3. Check if you can log in

### 7.3 Test Core Features

- ✅ Create a hiking group
- ✅ Upload group cover photo (Cloudinary)
- ✅ Create a hiking event
- ✅ Upload event photo (Cloudinary)
- ✅ Join a group
- ✅ RSVP to an event
- ✅ Post a comment

---

## Troubleshooting

### Issue: Build Failed

**Check logs for:**
- Gradle build errors
- Missing dependencies
- Memory issues

**Solution:**
- Check `backend/build.gradle` for correct dependencies
- Ensure Java 17 is specified in build

### Issue: Database Connection Failed

**Check:**
- DATABASE_URL is set correctly
- Database service is "Available"
- Look for PostgreSQL errors in logs

**Solution:**
- Go to database service → Check status
- Restart web service if needed

### Issue: 500 Errors on API Calls

**Check logs for:**
- Missing environment variables
- Cloudinary connection errors
- JWT secret issues

**Solution:**
- Verify all env vars are set correctly
- Check Cloudinary credentials
- Restart service after adding variables

### Issue: CORS Errors in Frontend

**Check:**
- `FRONTEND_URL` env var matches your Netlify URL
- CORS configuration in `application-prod.properties`

**Solution:**
- Update `FRONTEND_URL` to exact Netlify URL
- Redeploy backend

### Issue: Images Not Uploading

**Check:**
- Cloudinary env vars are correct
- Check browser console for errors
- Check backend logs for Cloudinary errors

**Solution:**
- Verify Cloudinary credentials
- Test credentials at cloudinary.com
- Check file size limits (10MB max)

---

## Important Notes

### Database Free Trial

- ✅ **90 days free** PostgreSQL database
- ✅ **1GB storage**
- ✅ After 90 days, you'll need to upgrade or migrate again

### Cold Starts

- Backend spins down after **15 minutes** of inactivity
- First request after spin-down takes **30-60 seconds**
- This is normal for free tier

### Monitoring

Check Render Dashboard regularly:
- **Logs**: View real-time application logs
- **Metrics**: CPU, Memory, Request counts
- **Events**: Deploy history, restarts

---

## Environment Variables Reference

### Auto-Configured (No Action Needed)
```bash
DATABASE_URL=postgresql://...         # From database
JWT_SECRET=<auto-generated>           # Auto-generated
SPRING_PROFILES_ACTIVE=prod
JAVA_TOOL_OPTIONS=-Xmx512m
```

### Manual Configuration Required
```bash
# Cloudinary (Required for image uploads)
CLOUDINARY_CLOUD_NAME=drdttgry4
CLOUDINARY_API_KEY=478746114596374
CLOUDINARY_API_SECRET=wXiHJlL_64SuSpyTUc7ajf8KdV4

# Frontend URL (Update if different)
FRONTEND_URL=https://hikehub-poc.netlify.app

# Email (Optional)
RESEND_API_KEY=<your-resend-api-key>
EMAIL_FROM=onboarding@resend.dev
```

---

## Next Steps After Migration

1. ✅ Test all features thoroughly
2. ✅ Create test data (groups, events)
3. ✅ Monitor logs for any errors
4. ✅ Set up database backups (if needed)
5. ✅ Update documentation with new URLs

---

## Support

If you encounter issues:

1. **Check Render Logs**: Dashboard → Service → Logs
2. **Check Browser Console**: F12 → Console tab
3. **Check Network Tab**: F12 → Network tab
4. **Review this guide**: Most issues are covered in Troubleshooting

---

## Summary Checklist

- [ ] Created new Render account
- [ ] Connected GitHub repository
- [ ] Deployed using Blueprint
- [ ] Added Cloudinary environment variables
- [ ] Verified backend is "Live"
- [ ] Tested health endpoint
- [ ] Updated Netlify VITE_API_URL
- [ ] Redeployed frontend
- [ ] Tested user registration
- [ ] Tested core features
- [ ] Verified image uploads work

**Total Time: ~20-30 minutes**

🎉 **Congratulations! Your HikeHub is now running on fresh Render infrastructure!**
