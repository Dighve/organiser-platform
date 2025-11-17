# HikeHub Migration Checklist - New Render Account

Follow these steps in order. Check off each item as you complete it.

---

## Part 1: Render Setup (15-20 minutes)

### Step 1: Create New Render Account
- [ ] Go to https://render.com/signup
- [ ] Sign up with a NEW email (different from old account)
- [ ] Verify email address
- [ ] Complete onboarding

### Step 2: Deploy Using Blueprint
- [ ] Click "New +" → "Blueprint"
- [ ] Connect your GitHub account
- [ ] Select HikeHub repository
- [ ] Render detects `render.yaml` file
- [ ] Click "Apply" to deploy
- [ ] Wait 5-10 minutes for initial deployment
- [ ] Verify status shows "Live" (green circle)

### Step 3: Add Environment Variables
- [ ] Go to "hikehub-backend" service
- [ ] Click "Environment" tab
- [ ] Add: `CLOUDINARY_CLOUD_NAME` = `drdttgry4`
- [ ] Add: `CLOUDINARY_API_KEY` = `478746114596374`
- [ ] Add: `CLOUDINARY_API_SECRET` = `wXiHJlL_64SuSpyTUc7ajf8KdV4`
- [ ] (Optional) Add: `RESEND_API_KEY` = `<your-key>`
- [ ] Click "Save Changes"
- [ ] Wait 3-5 minutes for auto-redeploy

### Step 4: Verify Backend
- [ ] Status shows "Live"
- [ ] Copy your backend URL (e.g., `https://hikehub-backend.onrender.com`)
- [ ] Open: `https://hikehub-backend.onrender.com/actuator/health`
- [ ] Should see: `{"status":"UP"}`
- [ ] Check logs for "Started PlatformApplication"

---

## Part 2: Frontend Update (5 minutes)

### Step 5: Update Netlify
- [ ] Go to https://app.netlify.com
- [ ] Select "hikehub-poc" site
- [ ] Go to "Site configuration" → "Environment variables"
- [ ] Update `VITE_API_URL` with your NEW Render backend URL
- [ ] Click "Save"
- [ ] Go to "Deploys" tab
- [ ] Click "Trigger deploy" → "Clear cache and deploy site"
- [ ] Wait 1-2 minutes

### Step 6: Verify Frontend
- [ ] Open: `https://hikehub-poc.netlify.app`
- [ ] Site loads without errors
- [ ] Open browser console (F12) - no CORS errors
- [ ] Check Network tab - API calls go to new backend URL

---

## Part 3: Testing (10 minutes)

### Step 7: Test User Authentication
- [ ] Click "Sign Up"
- [ ] Create a new test account
- [ ] Verify email/password login works
- [ ] Check JWT token in browser storage

### Step 8: Test Core Features
- [ ] Create a hiking group
- [ ] Upload group cover photo (tests Cloudinary)
- [ ] Create a hiking event
- [ ] Upload event photo (tests Cloudinary)
- [ ] Join the group
- [ ] RSVP to the event
- [ ] Post a comment on the event

### Step 9: Verify Data Persistence
- [ ] Log out
- [ ] Log back in
- [ ] Verify your group and event are still there
- [ ] Check member count is correct

---

## Part 4: Final Checks

### Step 10: Monitor Logs
- [ ] Render Dashboard → hikehub-backend → Logs
- [ ] No error messages
- [ ] Successful API requests logged
- [ ] Database queries working

### Step 11: Browser Testing
- [ ] Test in Chrome
- [ ] Test in Firefox or Safari
- [ ] Test on mobile (responsive design)
- [ ] All images load correctly

### Step 12: Clean Up
- [ ] Delete test data if needed
- [ ] Create production-ready groups/events
- [ ] Update any documentation with new URLs
- [ ] Save Render backend URL for reference

---

## Troubleshooting Reference

### If Backend Build Fails:
1. Check Render logs for errors
2. Verify `backend/build.gradle` has all dependencies
3. Check Java version is 17
4. Retry deployment

### If Database Connection Fails:
1. Go to database service → verify "Available"
2. Check DATABASE_URL is populated
3. Restart web service
4. Check logs for PostgreSQL errors

### If Images Don't Upload:
1. Verify Cloudinary variables are correct
2. Test credentials at cloudinary.com
3. Check browser console for errors
4. Redeploy backend

### If CORS Errors Appear:
1. Verify FRONTEND_URL matches Netlify URL exactly
2. Check CORS in `application-prod.properties`
3. Redeploy backend
4. Clear browser cache

### If API Calls Fail:
1. Check VITE_API_URL in Netlify
2. Verify backend is "Live"
3. Test health endpoint
4. Check browser Network tab for exact error

---

## Quick Links

- **Render Dashboard:** https://dashboard.render.com
- **Netlify Dashboard:** https://app.netlify.com
- **Cloudinary Dashboard:** https://cloudinary.com/console
- **Backend Health Check:** `https://<your-service>.onrender.com/actuator/health`

---

## Environment Variables Quick Copy

### Render (Backend):
```
CLOUDINARY_CLOUD_NAME=drdttgry4
CLOUDINARY_API_KEY=478746114596374
CLOUDINARY_API_SECRET=wXiHJlL_64SuSpyTUc7ajf8KdV4
```

### Netlify (Frontend):
```
VITE_API_URL=https://hikehub-backend.onrender.com
```
(Replace with your actual backend URL)

---

## Success Criteria

✅ Backend status: "Live"
✅ Database status: "Available"
✅ Health endpoint returns `{"status":"UP"}`
✅ Frontend loads without errors
✅ Can create account and login
✅ Can create groups and events
✅ Can upload images
✅ All features working

---

## Time Estimate

- Part 1: 15-20 minutes
- Part 2: 5 minutes
- Part 3: 10 minutes
- Part 4: 5 minutes

**Total: 35-40 minutes**

---

## Notes

- **Database expires in 90 days** - Set a reminder
- **Cold starts are normal** - First request takes 30-60s
- **Free tier limitations** - Suitable for 10-50 users
- **Automatic deploys** - Pushes to GitHub trigger redeployment

---

## After Migration

- [ ] Share new backend URL with team (if any)
- [ ] Update any external integrations
- [ ] Monitor performance for first 24 hours
- [ ] Set calendar reminder for database expiry (90 days)

---

**🎉 Once all items are checked, your migration is complete!**

For detailed help, see: `RENDER_MIGRATION_GUIDE.md`
For environment variables, see: `ENV_VARIABLES_REFERENCE.md`
