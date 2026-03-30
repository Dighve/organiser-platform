# Netlify Auto-Deploy Setup Guide

## 🎯 Overview

Netlify can automatically deploy your frontend when you push to GitHub. There are two methods:
1. **Git Integration** (Recommended) - Netlify watches your repo
2. **GitHub Actions** (More control) - You control when to deploy

---

## Method 1: Git Integration (Recommended)

### ✅ Pros
- Zero configuration in GitHub Actions
- Automatic deploy previews for PRs
- Netlify handles everything
- Deploy logs in Netlify dashboard

### ❌ Cons
- Less control over when deployments happen
- Can't run custom checks before deploy

### Setup Steps

#### 1. Connect Repository to Netlify

**Via Netlify Dashboard:**

1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Click "Add new site" → "Import an existing project"
3. Choose "GitHub" as your Git provider
4. Authorize Netlify to access your repositories
5. Select your repository: `organiser-platform`

#### 2. Configure Build Settings

**Base directory:** `frontend`

**Build command:** `npm run build`

**Publish directory:** `frontend/dist`

**Branch to deploy:** 
- Production: `main`
- Staging: `staging`

#### 3. Set Environment Variables

**Netlify Dashboard → Site Settings → Environment Variables:**

```bash
# Production Site
VITE_API_URL=https://api.outmeets.com/api/v1
VITE_GOOGLE_CLIENT_ID=your-production-google-client-id
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
VITE_MIXPANEL_TOKEN=your-production-mixpanel-token
VITE_SENTRY_DSN=your-production-sentry-dsn
```

#### 4. Create Staging Site

**For staging environment:**

1. Repeat steps 1-3 for staging site
2. Use different environment variables:

```bash
# Staging Site
VITE_API_URL=https://staging-api.outmeets.com/api/v1
VITE_GOOGLE_CLIENT_ID=your-staging-google-client-id
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
VITE_MIXPANEL_TOKEN=your-staging-mixpanel-token
VITE_SENTRY_DSN=your-staging-sentry-dsn
```

3. Set branch to deploy: `staging`

#### 5. Configure Branch Deploys

**Netlify Dashboard → Site Settings → Build & deploy → Continuous deployment:**

**Production site:**
- Production branch: `main`
- Branch deploys: `All` or `None` (your choice)
- Deploy previews: `Any pull request against your production branch`

**Staging site:**
- Production branch: `staging`
- Branch deploys: `None`
- Deploy previews: `Any pull request against staging branch`

#### 6. Set Custom Domains

**Production:**
1. Site Settings → Domain management → Add custom domain
2. Domain: `www.outmeets.com`
3. Configure DNS:
   ```
   CNAME www your-site.netlify.app
   ```

**Staging:**
1. Site Settings → Domain management → Add custom domain
2. Domain: `staging.outmeets.com`
3. Configure DNS:
   ```
   CNAME staging your-staging-site.netlify.app
   ```

### How It Works

```
Push to main → Netlify detects push → Builds → Deploys to production
Push to staging → Netlify detects push → Builds → Deploys to staging
Create PR → Netlify creates deploy preview → Comments on PR
```

---

## Method 2: GitHub Actions (More Control)

### ✅ Pros
- Full control over deployment process
- Can run custom checks before deploy
- Can deploy only after tests pass
- Centralized CI/CD in GitHub

### ❌ Cons
- More configuration required
- Need to manage Netlify tokens
- Deploy logs split between GitHub and Netlify

### Setup Steps

#### 1. Get Netlify Tokens

**Personal Access Token:**
1. Netlify Dashboard → User Settings → Applications
2. Click "New access token"
3. Name: `GitHub Actions`
4. Copy token (save it securely)

**Site IDs:**
1. Production site → Site Settings → General → Site details
2. Copy "API ID" (this is your site ID)
3. Repeat for staging site

#### 2. Add GitHub Secrets

**Repository → Settings → Secrets and variables → Actions:**

```bash
NETLIFY_AUTH_TOKEN=your-personal-access-token
NETLIFY_PRODUCTION_SITE_ID=your-production-site-id
NETLIFY_STAGING_SITE_ID=your-staging-site-id
```

#### 3. GitHub Actions Workflow

The workflow is already configured in `.github/workflows/frontend-ci.yml`:

```yaml
deploy-staging:
  name: Deploy to Staging
  runs-on: ubuntu-latest
  needs: [build, security-scan]
  if: github.ref == 'refs/heads/staging'
  
  steps:
    - name: Deploy to Netlify (Staging)
      uses: nwtgck/actions-netlify@v2
      with:
        publish-dir: './frontend/dist'
        production-branch: staging
        github-token: ${{ secrets.GITHUB_TOKEN }}
        deploy-message: "Deploy from GitHub Actions"
        alias: staging
      env:
        NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
        NETLIFY_SITE_ID: ${{ secrets.NETLIFY_STAGING_SITE_ID }}
```

#### 4. Disable Netlify Auto-Deploy

**Important:** If using GitHub Actions, disable Netlify's auto-deploy:

1. Netlify Dashboard → Site Settings → Build & deploy
2. Click "Stop builds" or "Clear build settings"
3. This prevents double deployments

### How It Works

```
Push to staging → GitHub Actions runs → Tests pass → Builds → Deploys to Netlify
Push to main → GitHub Actions runs → Tests pass → Manual approval → Deploys to Netlify
```

---

## Comparison

| Feature | Git Integration | GitHub Actions |
|---------|----------------|----------------|
| Setup Complexity | ⭐ Easy | ⭐⭐⭐ Complex |
| Auto-deploy | ✅ Yes | ✅ Yes |
| Deploy Previews | ✅ Automatic | ❌ Manual |
| Custom Checks | ❌ No | ✅ Yes |
| Test Before Deploy | ❌ No | ✅ Yes |
| Deployment Control | ❌ Limited | ✅ Full |
| Logs Location | Netlify only | GitHub + Netlify |
| Recommended For | Simple projects | Complex CI/CD |

---

## Recommended Setup

### For Your Project: **Git Integration**

**Why:**
1. ✅ Simpler setup (no GitHub secrets needed)
2. ✅ Automatic deploy previews for PRs
3. ✅ Netlify handles build optimization
4. ✅ Less maintenance
5. ✅ Your GitHub Actions already handle testing/linting

**Configuration:**

```
Production Site (www.outmeets.com)
├── Branch: main
├── Auto-deploy: ✅ Enabled
└── Deploy previews: ✅ Enabled

Staging Site (staging.outmeets.com)
├── Branch: staging
├── Auto-deploy: ✅ Enabled
└── Deploy previews: ✅ Enabled
```

### Remove GitHub Actions Deploy Steps

Since you'll use Git Integration, remove the deploy steps from `.github/workflows/frontend-ci.yml`:

**Keep:**
- ✅ Lint & Type Check
- ✅ Build (for validation)
- ✅ Security Scan
- ✅ Bundle Size Check

**Remove:**
- ❌ Deploy to Staging
- ❌ Deploy to Production
- ❌ Smoke Tests (Netlify does this)

---

## Testing Auto-Deploy

### Test Staging Deploy

```bash
# Make a change
echo "# Test" >> README.md
git add README.md
git commit -m "test: verify auto-deploy"
git push origin staging

# Check Netlify Dashboard
# Site Settings → Deploys
# Should see new deploy in progress
```

### Test Production Deploy

```bash
# Merge to main
git checkout main
git merge staging
git push origin main

# Check Netlify Dashboard
# Should see production deploy
```

### Test Deploy Preview

```bash
# Create PR from feature branch
git checkout -b feature/test
echo "# Test" >> README.md
git add README.md
git commit -m "feat: test deploy preview"
git push origin feature/test

# Create PR on GitHub
# Netlify will comment with preview URL
```

---

## Troubleshooting

### Issue: Netlify not deploying

**Check:**
1. Repository connected? (Site Settings → Build & deploy → Link repository)
2. Branch configured? (Site Settings → Build & deploy → Production branch)
3. Build settings correct? (Base directory, build command, publish directory)

**Solution:**
```bash
# Trigger manual deploy
netlify deploy --prod --dir=frontend/dist
```

### Issue: Build fails on Netlify

**Check:**
1. Environment variables set? (Site Settings → Environment variables)
2. Node version correct? (Add `NODE_VERSION=18` env var)
3. Build command correct? (`npm run build` not `npm build`)

**Solution:**
```bash
# Test build locally with production env
cd frontend
npm run build
# If this works, check Netlify env vars
```

### Issue: Deploy preview not created

**Check:**
1. Deploy previews enabled? (Site Settings → Build & deploy → Deploy previews)
2. PR against correct branch? (Should be against main or staging)
3. Netlify GitHub app installed? (GitHub → Settings → Applications)

**Solution:**
```bash
# Reinstall Netlify GitHub app
# GitHub → Settings → Applications → Netlify → Configure
# Grant access to repository
```

### Issue: Wrong environment variables

**Symptom:** Site deploys but API calls fail

**Solution:**
```bash
# Check environment variables
# Netlify Dashboard → Site Settings → Environment variables
# Verify VITE_API_URL is correct for environment

# Production should have: https://api.outmeets.com/api/v1
# Staging should have: https://staging-api.outmeets.com/api/v1
```

---

## Monitoring Deployments

### Netlify Dashboard

**View Deploys:**
1. Site → Deploys tab
2. See all deployments with status
3. Click deploy for logs

**Deploy Notifications:**
1. Site Settings → Build & deploy → Deploy notifications
2. Add email notification
3. Add Slack webhook (optional)

### GitHub Integration

**PR Comments:**
- Netlify automatically comments on PRs with:
  - ✅ Deploy preview URL
  - ✅ Build logs link
  - ✅ Deploy status

**Commit Status:**
- Netlify adds status checks to commits:
  - ✅ Build succeeded
  - ❌ Build failed

---

## Best Practices

### 1. Use Branch-Specific Sites

```
Production site → main branch → www.outmeets.com
Staging site → staging branch → staging.outmeets.com
```

### 2. Enable Deploy Previews

- Test changes before merging
- Share preview with team
- Catch issues early

### 3. Set Deploy Notifications

- Email on deploy failure
- Slack notification for production deploys
- Monitor deploy frequency

### 4. Use Environment Variables

- Never commit secrets
- Use different values for staging/production
- Rotate tokens regularly

### 5. Monitor Build Times

- Keep builds under 5 minutes
- Optimize dependencies
- Use build cache

---

## Quick Reference

### Netlify CLI Commands

```bash
# Install
npm install -g netlify-cli

# Login
netlify login

# Link site
netlify link

# Deploy to staging
netlify deploy --dir=frontend/dist

# Deploy to production
netlify deploy --prod --dir=frontend/dist

# View site info
netlify status

# View environment variables
netlify env:list

# Open site in browser
netlify open
```

### Important URLs

- **Netlify Dashboard:** https://app.netlify.com/
- **Production Site:** https://www.outmeets.com
- **Staging Site:** https://staging.outmeets.com
- **Netlify Docs:** https://docs.netlify.com/

---

## Summary

### Recommended Setup: Git Integration

**Steps:**
1. ✅ Connect GitHub repo to Netlify
2. ✅ Create production site (main branch)
3. ✅ Create staging site (staging branch)
4. ✅ Set environment variables for each
5. ✅ Configure custom domains
6. ✅ Enable deploy previews
7. ✅ Test by pushing to staging

**Result:**
- Auto-deploy on every push
- Deploy previews for every PR
- Zero GitHub Actions configuration needed
- Simple and reliable

---

**Last Updated:** March 30, 2026  
**Version:** 1.0  
**Status:** ✅ Ready to Implement
