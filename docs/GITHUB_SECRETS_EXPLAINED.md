# GitHub Secrets - What You Actually Need

## 🎯 Overview

This guide explains which GitHub secrets are **actually required** for your CI/CD pipeline and why.

---

## ✅ Required Secrets (Minimum Setup)

### 1. **Render Deployment** (Backend)

```bash
RENDER_API_KEY=your-render-api-key
RENDER_STAGING_SERVICE_ID=srv-xxx-staging
RENDER_PRODUCTION_SERVICE_ID=srv-xxx-production
```

**Why needed:**
- GitHub Actions needs to trigger deployments on Render
- API key authenticates the deployment request
- Service IDs identify which Render service to deploy to

**How to get:**
1. Render Dashboard → Account Settings → API Keys → Create API Key
2. Render Dashboard → Web Service → Settings → Service ID

---

### 2. **Netlify Deployment** (Frontend) - OPTIONAL

```bash
NETLIFY_AUTH_TOKEN=your-netlify-auth-token
NETLIFY_STAGING_SITE_ID=your-staging-site-id
NETLIFY_PRODUCTION_SITE_ID=your-production-site-id
```

**Why needed:**
- Only if using GitHub Actions to deploy to Netlify
- **NOT NEEDED** if using Netlify Git Integration (recommended)

**Recommendation:** Use Netlify Git Integration instead - no secrets needed!

---

## 🔧 Environment-Specific Secrets

These secrets are used to build the frontend with correct API URLs and keys:

### 3. **Google OAuth Client IDs**

```bash
STAGING_GOOGLE_CLIENT_ID=your-staging-client-id
PRODUCTION_GOOGLE_CLIENT_ID=your-production-client-id
```

**Why needed:**
- Frontend needs Google OAuth client ID to enable "Sign in with Google"
- Different IDs for staging vs production (different authorized origins)
- Embedded in frontend build as `VITE_GOOGLE_CLIENT_ID`

**How to get:**
1. Google Cloud Console → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID
3. Staging: Add `https://outmeet-stage.netlify.app` as authorized origin
4. Production: Add `https://www.outmeets.com` as authorized origin

**What happens without it:**
- ❌ "Sign in with Google" button won't work
- ✅ Magic link authentication still works

---

### 4. **Google Maps API Key**

```bash
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

**Why needed:**
- Frontend uses Google Maps to show event locations
- Used in both staging and production
- Embedded in frontend build as `VITE_GOOGLE_MAPS_API_KEY`

**How to get:**
1. Google Cloud Console → APIs & Services → Credentials
2. Create API Key
3. Restrict to Maps JavaScript API
4. Add allowed origins (staging + production URLs)

**What happens without it:**
- ❌ Maps won't load on event detail pages
- ❌ Location picker won't work when creating events
- ✅ Rest of app still works

---

### 5. **Mixpanel Tokens** - OPTIONAL

```bash
STAGING_MIXPANEL_TOKEN=your-staging-token
PRODUCTION_MIXPANEL_TOKEN=your-production-token
```

**Why needed:**
- Frontend sends analytics events to Mixpanel
- Different tokens for staging vs production (separate analytics)
- Embedded in frontend build as `VITE_MIXPANEL_TOKEN`

**How to get:**
1. Mixpanel Dashboard → Project Settings → Project Token

**What happens without it:**
- ⚠️ Analytics won't be tracked
- ✅ App still works normally

**Recommendation:** Optional for staging, recommended for production

---

### 6. **Sentry DSN** - OPTIONAL

```bash
STAGING_SENTRY_DSN=your-staging-sentry-dsn
PRODUCTION_SENTRY_DSN=your-production-sentry-dsn
```

**Why needed:**
- Frontend sends error reports to Sentry
- Different DSNs for staging vs production
- Embedded in frontend build as `VITE_SENTRY_DSN`

**How to get:**
1. Sentry Dashboard → Project Settings → Client Keys (DSN)

**What happens without it:**
- ⚠️ Errors won't be reported to Sentry
- ✅ App still works (errors caught by ErrorBoundary)

**Recommendation:** Optional for staging, recommended for production

---

## 📊 Summary Table

| Secret | Required? | Used For | Impact if Missing |
|--------|-----------|----------|-------------------|
| **RENDER_API_KEY** | ✅ Yes | Deploy backend | ❌ Deployment fails |
| **RENDER_STAGING_SERVICE_ID** | ✅ Yes | Identify staging service | ❌ Deployment fails |
| **RENDER_PRODUCTION_SERVICE_ID** | ⚠️ Only for prod | Identify prod service | ❌ Prod deploy fails |
| **NETLIFY_AUTH_TOKEN** | ❌ No* | Deploy frontend | ⚠️ Use Git Integration |
| **NETLIFY_STAGING_SITE_ID** | ❌ No* | Identify staging site | ⚠️ Use Git Integration |
| **NETLIFY_PRODUCTION_SITE_ID** | ❌ No* | Identify prod site | ⚠️ Use Git Integration |
| **STAGING_GOOGLE_CLIENT_ID** | ✅ Yes | Google OAuth | ❌ Google login broken |
| **PRODUCTION_GOOGLE_CLIENT_ID** | ⚠️ Only for prod | Google OAuth | ❌ Google login broken |
| **GOOGLE_MAPS_API_KEY** | ✅ Yes | Show maps | ❌ Maps broken |
| **STAGING_MIXPANEL_TOKEN** | ❌ No | Analytics | ⚠️ No analytics |
| **PRODUCTION_MIXPANEL_TOKEN** | ❌ No | Analytics | ⚠️ No analytics |
| **STAGING_SENTRY_DSN** | ❌ No | Error tracking | ⚠️ No error reports |
| **PRODUCTION_SENTRY_DSN** | ❌ No | Error tracking | ⚠️ No error reports |

\* Not needed if using Netlify Git Integration (recommended)

---

## 🚀 Minimal Setup (Staging Only)

For a basic staging deployment, you only need:

```bash
# Required (3 secrets)
RENDER_API_KEY=your-render-api-key
RENDER_STAGING_SERVICE_ID=srv-xxx
STAGING_GOOGLE_CLIENT_ID=your-google-client-id

# Highly Recommended (1 secret)
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Optional (2 secrets)
STAGING_MIXPANEL_TOKEN=your-mixpanel-token  # For analytics
STAGING_SENTRY_DSN=your-sentry-dsn          # For error tracking
```

**Total: 4-6 secrets** (instead of 13)

---

## 🔐 Backend Secrets (Render Environment Variables)

These are **NOT** GitHub secrets - they're set in Render Dashboard:

```bash
# Database (auto-generated by Render)
DATABASE_URL=postgresql://...

# Application
JWT_SECRET=your-jwt-secret-min-32-chars
FRONTEND_URL=https://outmeet-stage.netlify.app

# Google OAuth (backend verification)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Cloudinary (image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (Resend)
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=noreply@outmeets.com
```

**Where to set:** Render Dashboard → Web Service → Environment

---

## 🎯 Recommended Setup

### For Staging:

**GitHub Secrets (4):**
```bash
RENDER_API_KEY
RENDER_STAGING_SERVICE_ID
STAGING_GOOGLE_CLIENT_ID
GOOGLE_MAPS_API_KEY
```

**Render Environment Variables (8):**
```bash
DATABASE_URL              # Auto-generated
JWT_SECRET
FRONTEND_URL
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

**Netlify:** Use Git Integration (no secrets needed)

### For Production:

Add these GitHub secrets:
```bash
RENDER_PRODUCTION_SERVICE_ID
PRODUCTION_GOOGLE_CLIENT_ID
PRODUCTION_MIXPANEL_TOKEN    # Recommended
PRODUCTION_SENTRY_DSN        # Recommended
```

---

## ❓ FAQ

### Q: Why do I need different Google Client IDs for staging and production?

**A:** Google OAuth requires you to specify authorized origins (domains). Staging uses `https://outmeet-stage.netlify.app` and production uses `https://www.outmeets.com`. You need separate client IDs with different authorized origins.

### Q: Can I use the same Google Maps API key for both environments?

**A:** Yes! You can use the same API key for both staging and production. Just add both domains to the allowed origins in Google Cloud Console.

### Q: Do I need Netlify secrets if I use Git Integration?

**A:** No! Netlify Git Integration handles deployment automatically when you push to GitHub. You only need Netlify secrets if you want GitHub Actions to control the deployment.

### Q: What happens if I don't set Mixpanel or Sentry?

**A:** The app works fine, but you won't get analytics or error tracking. These are optional but recommended for production.

### Q: Can I skip Google OAuth and just use magic links?

**A:** Yes! Magic link authentication works independently. Google OAuth is optional but provides better UX (2-3 seconds vs 30-60 seconds).

---

## 🔧 How to Add Secrets

### GitHub Secrets:

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add name and value
5. Click **Add secret**

### Render Environment Variables:

1. Go to Render Dashboard
2. Select your web service
3. Click **Environment** tab
4. Click **Add Environment Variable**
5. Add key and value
6. Click **Save Changes**

### Netlify Environment Variables:

1. Go to Netlify Dashboard
2. Select your site
3. Click **Site settings** → **Environment variables**
4. Click **Add a variable**
5. Add key and value
6. Click **Create variable**

---

## ✅ Verification Checklist

After adding secrets, verify:

- [ ] GitHub Actions can deploy to Render
- [ ] Frontend builds with correct API URL
- [ ] Google OAuth "Sign in with Google" works
- [ ] Maps load on event detail pages
- [ ] Analytics events tracked (if Mixpanel configured)
- [ ] Errors reported to Sentry (if configured)

---

**Last Updated:** April 2, 2026  
**Version:** 2.0  
**Status:** ✅ Updated for Staging-First Strategy
