# Minimal CI/CD Setup - Core Deployment Only

## 🎯 Overview

This is the **minimal CI/CD setup** focused purely on deployment. Optional features like Google OAuth, Maps, Mixpanel, and Sentry are excluded and will be added later via separate PRs.

---

## ✅ Required GitHub Secrets (Only 2!)

```bash
# Render Deployment
RENDER_API_KEY=your-render-api-key
RENDER_STAGING_SERVICE_ID=srv-xxx-staging
```

**That's it!** No other GitHub secrets needed for basic deployment.

---

## 🚀 What This Setup Does

### ✅ Included (Core Deployment):
- Lint and type checking
- Build validation
- Security scanning
- Unit tests (backend)
- Auto-deploy to Render (backend)
- Auto-deploy to Netlify (frontend)
- Health checks
- Smoke tests

### ❌ Excluded (To Be Added Later):
- Google OAuth configuration
- Google Maps API key
- Mixpanel analytics
- Sentry error tracking

---

## 📝 Frontend Build Configuration

**Current setup:**
```bash
# Only API URL is configured in CI/CD
VITE_API_URL=https://organiser-platform.onrender.com/api/v1
```

**Features that won't work (until configured separately):**
- ⚠️ "Sign in with Google" button (magic link still works)
- ⚠️ Google Maps on event pages
- ⚠️ Analytics tracking
- ⚠️ Sentry error reporting

**Features that work:**
- ✅ Magic link authentication
- ✅ All core app functionality
- ✅ Event creation and management
- ✅ Group management
- ✅ Comments and replies
- ✅ Image uploads (Cloudinary)
- ✅ Push notifications

---

## 🔧 Backend Configuration (Render)

**Required environment variables in Render Dashboard:**

```bash
# Auto-generated
DATABASE_URL=postgresql://...

# Required
JWT_SECRET=your-jwt-secret-min-32-chars
FRONTEND_URL=https://outmeet-stage.netlify.app

# Image uploads
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (optional)
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=noreply@outmeets.com

# Push notifications (optional)
PUSH_VAPID_PUBLIC=your-vapid-public-key
PUSH_VAPID_PRIVATE=your-vapid-private-key
```

**NOT needed right now:**
- ~~GOOGLE_CLIENT_ID~~
- ~~GOOGLE_CLIENT_SECRET~~

---

## 🌐 Deployment URLs

### Staging:
- **Frontend:** https://outmeet-stage.netlify.app
- **Backend:** https://organiser-platform.onrender.com

### Production (when ready):
- **Frontend:** https://www.outmeets.com
- **Backend:** https://api.outmeets.com

---

## 🔄 Deployment Flow

```
Push to staging
    ↓
GitHub Actions runs
    ├── Lint & type check ✅
    ├── Build (with API URL only) ✅
    ├── Security scan ✅
    └── Tests ✅
    ↓
Deploy to Render ✅
    ↓
Deploy to Netlify ✅
    ↓
Health checks ✅
    ↓
Done! 🎉
```

---

## 📋 Setup Steps

### 1. Add GitHub Secrets

**Repository → Settings → Secrets and variables → Actions:**

```bash
RENDER_API_KEY=your-render-api-key
RENDER_STAGING_SERVICE_ID=srv-xxx-staging
```

**How to get:**
- **RENDER_API_KEY:** Render Dashboard → Account Settings → API Keys → Create API Key
- **RENDER_STAGING_SERVICE_ID:** Render Dashboard → Web Service → Settings → Service ID

### 2. Configure Render Environment Variables

**Render Dashboard → Web Service → Environment:**

Add the required variables listed above (DATABASE_URL, JWT_SECRET, etc.)

### 3. Set Up Netlify Git Integration

**Netlify Dashboard:**
1. New site → Import from Git
2. Connect GitHub repository
3. Configure:
   - Branch: `staging`
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`
4. Add environment variable:
   ```
   VITE_API_URL=https://organiser-platform.onrender.com/api/v1
   ```

### 4. Test Deployment

```bash
git push origin staging
```

Check:
- GitHub Actions tab (should show green checkmarks)
- https://outmeet-stage.netlify.app (frontend should load)
- https://organiser-platform.onrender.com/api/v1/actuator/health (should return UP)

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Frontend loads at https://outmeet-stage.netlify.app
- [ ] Backend health check passes
- [ ] Can view public events
- [ ] Can view public groups
- [ ] Magic link authentication works
- [ ] Can create events (after login)
- [ ] Can upload images
- [ ] Comments and replies work

**Not working (expected):**
- [ ] ~~"Sign in with Google" button~~ (will add later)
- [ ] ~~Google Maps on event pages~~ (will add later)
- [ ] ~~Analytics tracking~~ (will add later)
- [ ] ~~Sentry error reporting~~ (will add later)

---

## 🔜 Future Enhancements (Separate PRs)

### PR 1: Google OAuth Integration
**Add GitHub secrets:**
```bash
STAGING_GOOGLE_CLIENT_ID
PRODUCTION_GOOGLE_CLIENT_ID
```

**Add Render env vars:**
```bash
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
```

**Update frontend-ci.yml** to include `VITE_GOOGLE_CLIENT_ID`

### PR 2: Google Maps Integration
**Add GitHub secret:**
```bash
GOOGLE_MAPS_API_KEY
```

**Update frontend-ci.yml** to include `VITE_GOOGLE_MAPS_API_KEY`

### PR 3: Mixpanel Analytics
**Add GitHub secrets:**
```bash
STAGING_MIXPANEL_TOKEN
PRODUCTION_MIXPANEL_TOKEN
```

**Update frontend-ci.yml** to include `VITE_MIXPANEL_TOKEN`

### PR 4: Sentry Error Tracking
**Add GitHub secrets:**
```bash
STAGING_SENTRY_DSN
PRODUCTION_SENTRY_DSN
```

**Update frontend-ci.yml** to include `VITE_SENTRY_DSN`

---

## 🐛 Troubleshooting

### Issue: Deployment not triggering

**Check:**
1. GitHub secrets added correctly?
2. Pushed to `staging` branch?
3. Files changed in `frontend/` or `backend/`?

**Solution:**
```bash
# Verify secrets
# GitHub → Settings → Secrets → Check both secrets exist

# Verify branch
git branch
# Should show * staging

# Trigger manually
git commit --allow-empty -m "trigger: test deployment"
git push origin staging
```

### Issue: Frontend shows blank page

**Check:**
1. Netlify environment variable set?
2. Build succeeded?
3. Browser console for errors?

**Solution:**
```bash
# Check Netlify environment variables
# Netlify Dashboard → Site Settings → Environment variables
# Should have: VITE_API_URL=https://organiser-platform.onrender.com/api/v1

# Check build logs
# Netlify Dashboard → Deploys → Latest deploy → Deploy log
```

### Issue: Backend health check fails

**Check:**
1. Render deployment succeeded?
2. Database connected?
3. Environment variables set?

**Solution:**
```bash
# Test health endpoint
curl https://organiser-platform.onrender.com/api/v1/actuator/health

# Check Render logs
# Render Dashboard → Logs tab

# Verify environment variables
# Render Dashboard → Environment tab
```

---

## 📊 What Works vs What Doesn't

### ✅ Fully Functional:
- Magic link authentication
- Event browsing (public)
- Group browsing (public)
- Event creation and management
- Group creation and management
- Comments and replies
- Image uploads
- Push notifications
- Email notifications
- User profiles
- Legal agreements

### ⚠️ Temporarily Disabled:
- Google OAuth ("Sign in with Google" button)
- Google Maps (location display and picker)
- Analytics tracking (Mixpanel)
- Error reporting (Sentry)

---

## 🎯 Benefits of Minimal Setup

1. **Faster Initial Deployment**
   - Only 2 GitHub secrets needed
   - Less configuration complexity
   - Quicker to test and verify

2. **Incremental Feature Addition**
   - Add features one at a time
   - Test each integration separately
   - Easier to debug issues

3. **Cleaner Separation of Concerns**
   - Core deployment separate from optional features
   - Each feature has its own PR and testing
   - Better git history

4. **Reduced Risk**
   - Fewer moving parts initially
   - Core functionality proven first
   - Optional features added when ready

---

## 📚 Related Documentation

- **Full CI/CD Guide:** `docs/CI_CD_SETUP_GUIDE.md`
- **GitHub Secrets Explained:** `docs/GITHUB_SECRETS_EXPLAINED.md`
- **Updated Configuration:** `docs/UPDATED_CI_CD_CONFIGURATION.md`
- **Netlify Setup:** `docs/NETLIFY_AUTO_DEPLOY_SETUP.md`
- **Render Setup:** `docs/RENDER_STAGING_SETUP.md`

---

**Last Updated:** April 2, 2026  
**Version:** 1.0  
**Status:** ✅ Minimal Setup - Core Deployment Only
