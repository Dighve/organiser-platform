# Updated CI/CD Configuration - Staging-First Strategy

## 🎯 What Changed

### New Branch Strategy

**Before:**
- Default branch: `main`
- PRs merged to: `main` or `develop`
- Staging branch: `staging` (optional)

**After:**
- **Default branch: `staging`** ✅
- **All PRs merge to: `staging`** ✅
- Production branch: `main` (promoted from staging)

---

## 🌐 Deployment URLs

### Staging Environment

**Frontend:**
- URL: `https://outmeet-stage.netlify.app`
- Branch: `staging`
- Auto-deploy: ✅ On push to staging

**Backend:**
- URL: `https://organiser-platform.onrender.com`
- Branch: `staging`
- Auto-deploy: ✅ On push to staging

### Production Environment

**Frontend:**
- URL: `https://www.outmeets.com` (or your production domain)
- Branch: `main`
- Auto-deploy: ✅ On push to main (with approval)

**Backend:**
- URL: `https://api.outmeets.com` (or your production domain)
- Branch: `main`
- Auto-deploy: ✅ On push to main (with approval)

---

## 🔄 CI/CD Pipeline Flow

### 1. Feature Development

```bash
# Create feature branch from staging
git checkout staging
git pull origin staging
git checkout -b feature/my-feature

# Make changes
git add .
git commit -m "feat: add my feature"

# Push and create PR to staging
git push origin feature/my-feature
# Create PR on GitHub targeting staging branch
```

### 2. Pull Request to Staging

**Triggers:**
- ✅ Lint & type check
- ✅ Build validation
- ✅ Security scan
- ✅ Unit tests (backend)
- ✅ PR title validation
- ✅ Bundle size check

**On PR Approval & Merge:**
- ✅ Auto-deploy to staging environment
- ✅ Health checks run
- ✅ Smoke tests run

### 3. Promotion to Production

```bash
# After testing on staging, promote to production
git checkout main
git pull origin main
git merge staging
git push origin main

# This triggers:
# - Production deployment (requires manual approval)
# - Health checks
```

---

## 📝 Updated GitHub Actions Workflows

### Changes Made:

#### `frontend-ci.yml`
```yaml
# Before
on:
  push:
    branches: [main, develop, staging]
  pull_request:
    branches: [main, develop]

# After
on:
  push:
    branches: [staging, main]
  pull_request:
    branches: [staging]
```

#### `backend-ci.yml`
```yaml
# Same changes as frontend-ci.yml
```

#### Deployment Triggers:
- **Staging:** Deploys on push to `staging` branch
- **Production:** Deploys on push to `main` branch (requires approval)

---

## 🔧 Configuration Files Updated

### 1. `application-staging.properties`

**Added:**
```properties
# Google OAuth Configuration
spring.security.oauth2.client.registration.google.client-id=${GOOGLE_CLIENT_ID}
spring.security.oauth2.client.registration.google.client-secret=${GOOGLE_CLIENT_SECRET}
spring.security.oauth2.client.registration.google.scope=openid,profile,email
```

**Updated:**
```properties
# CORS Configuration - Staging
cors.allowed-origins=https://outmeet-stage.netlify.app

# Frontend URL
app.frontend-url=${FRONTEND_URL:https://outmeet-stage.netlify.app}
```

### 2. Frontend Build Environment

**Staging build uses:**
```bash
VITE_API_URL=https://organiser-platform.onrender.com/api/v1
VITE_GOOGLE_CLIENT_ID=${{ secrets.STAGING_GOOGLE_CLIENT_ID }}
VITE_GOOGLE_MAPS_API_KEY=${{ secrets.GOOGLE_MAPS_API_KEY }}
VITE_MIXPANEL_TOKEN=${{ secrets.STAGING_MIXPANEL_TOKEN }}
VITE_SENTRY_DSN=${{ secrets.STAGING_SENTRY_DSN }}
```

---

## 🔐 Required GitHub Secrets

### Minimum Required (4 secrets):

```bash
# Render Deployment
RENDER_API_KEY=your-render-api-key
RENDER_STAGING_SERVICE_ID=srv-xxx-staging

# Frontend Configuration
STAGING_GOOGLE_CLIENT_ID=your-staging-google-client-id
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### Recommended (2 additional secrets):

```bash
STAGING_MIXPANEL_TOKEN=your-staging-mixpanel-token
STAGING_SENTRY_DSN=your-staging-sentry-dsn
```

### Optional (Netlify - only if NOT using Git Integration):

```bash
NETLIFY_AUTH_TOKEN=your-netlify-auth-token
NETLIFY_STAGING_SITE_ID=your-staging-site-id
```

**Recommendation:** Use Netlify Git Integration instead - no secrets needed!

---

## 🚀 Deployment Process

### Automatic Staging Deployment

```
Push to staging → GitHub Actions runs → Tests pass → Deploy to:
├── Frontend: https://outmeet-stage.netlify.app
└── Backend: https://organiser-platform.onrender.com

Health checks run → Smoke tests run → Done! ✅
```

### Manual Production Deployment

```
Push to main → GitHub Actions runs → Tests pass → Wait for approval

Manual approval required → Deploy to:
├── Frontend: https://www.outmeets.com
└── Backend: https://api.outmeets.com

Health checks run → Done! ✅
```

---

## 📊 Environment Variables Explained

### Why You Need Each Secret:

#### **STAGING_GOOGLE_CLIENT_ID**
- **Purpose:** Enables "Sign in with Google" button
- **Used in:** Frontend build (`VITE_GOOGLE_CLIENT_ID`)
- **Without it:** Google OAuth won't work, only magic link available
- **How to get:** Google Cloud Console → OAuth 2.0 Client ID
  - Add authorized origin: `https://outmeet-stage.netlify.app`

#### **GOOGLE_MAPS_API_KEY**
- **Purpose:** Shows maps on event detail pages
- **Used in:** Frontend build (`VITE_GOOGLE_MAPS_API_KEY`)
- **Without it:** Maps won't load, location picker broken
- **How to get:** Google Cloud Console → API Key
  - Enable Maps JavaScript API
  - Add both staging and production URLs

#### **STAGING_MIXPANEL_TOKEN** (Optional)
- **Purpose:** Tracks user analytics
- **Used in:** Frontend build (`VITE_MIXPANEL_TOKEN`)
- **Without it:** No analytics tracking
- **How to get:** Mixpanel Dashboard → Project Token

#### **STAGING_SENTRY_DSN** (Optional)
- **Purpose:** Error reporting and monitoring
- **Used in:** Frontend build (`VITE_SENTRY_DSN`)
- **Without it:** Errors not reported to Sentry (still caught by ErrorBoundary)
- **How to get:** Sentry Dashboard → Client Keys (DSN)

---

## 🔧 Render Environment Variables

Set these in **Render Dashboard → Environment** (NOT GitHub Secrets):

```bash
# Auto-generated
DATABASE_URL=postgresql://...

# Required
JWT_SECRET=your-jwt-secret-min-32-chars
FRONTEND_URL=https://outmeet-stage.netlify.app
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

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

---

## ✅ Setup Checklist

### Initial Setup:

- [ ] Set default branch to `staging` on GitHub
- [ ] Add required GitHub secrets (minimum 4)
- [ ] Configure Render environment variables
- [ ] Set up Netlify Git Integration (recommended)
- [ ] Test deployment to staging

### Verification:

- [ ] Push to staging triggers deployment
- [ ] Frontend deploys to `https://outmeet-stage.netlify.app`
- [ ] Backend deploys to `https://organiser-platform.onrender.com`
- [ ] Health checks pass
- [ ] Google OAuth works
- [ ] Maps load correctly
- [ ] Analytics tracked (if configured)

### Production Setup (when ready):

- [ ] Add production GitHub secrets
- [ ] Configure production Render service
- [ ] Set up production Netlify site
- [ ] Test promotion from staging to main

---

## 🎯 Key Benefits

### Staging-First Approach:

1. **Safer Deployments**
   - All changes tested on staging first
   - Production only gets proven code

2. **Faster Iteration**
   - Staging is default - no extra steps
   - Quick feedback loop

3. **Better Testing**
   - Real environment testing before production
   - Catch issues early

4. **Cleaner Git History**
   - Main branch only has production-ready code
   - Staging shows current development state

---

## 📚 Related Documentation

- **GitHub Secrets Explained:** `docs/GITHUB_SECRETS_EXPLAINED.md`
- **Netlify Auto-Deploy:** `docs/NETLIFY_AUTO_DEPLOY_SETUP.md`
- **Render Staging Setup:** `docs/RENDER_STAGING_SETUP.md`
- **CI/CD Setup Guide:** `docs/CI_CD_SETUP_GUIDE.md`
- **Quick Start:** `docs/CI_CD_QUICK_START.md`

---

## 🆘 Troubleshooting

### Issue: Deployment not triggering

**Check:**
1. Push is to `staging` branch?
2. Files changed are in `frontend/` or `backend/`?
3. GitHub Actions enabled?

**Solution:**
```bash
# Verify branch
git branch

# Check GitHub Actions
# Repository → Actions tab
```

### Issue: Health checks failing

**Check:**
1. Backend deployed successfully?
2. Database connected?
3. Correct API URL?

**Solution:**
```bash
# Test health endpoint
curl https://organiser-platform.onrender.com/api/v1/actuator/health

# Check Render logs
# Render Dashboard → Logs tab
```

### Issue: Google OAuth not working

**Check:**
1. `STAGING_GOOGLE_CLIENT_ID` secret set?
2. Authorized origin includes staging URL?
3. Frontend built with correct env vars?

**Solution:**
```bash
# Verify in Google Cloud Console
# Authorized origins should include:
# https://outmeet-stage.netlify.app
```

---

**Last Updated:** April 2, 2026  
**Version:** 2.0  
**Status:** ✅ Updated for Staging-First Strategy
