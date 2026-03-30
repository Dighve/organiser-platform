# CI/CD Setup Guide - GitHub Actions + Staging Environment

## 🎯 Overview

This guide covers the complete CI/CD pipeline setup with GitHub Actions for error catching and staging environment deployment.

## 📋 Table of Contents

1. [GitHub Actions Workflows](#github-actions-workflows)
2. [Staging Environment Setup](#staging-environment-setup)
3. [GitHub Secrets Configuration](#github-secrets-configuration)
4. [Branch Strategy](#branch-strategy)
5. [Pre-commit Hooks](#pre-commit-hooks)
6. [Deployment Process](#deployment-process)
7. [Troubleshooting](#troubleshooting)

---

## 🔄 GitHub Actions Workflows

### 1. Frontend CI/CD (`frontend-ci.yml`)

**Triggers:**
- Push to `main`, `develop`, `staging` branches
- Pull requests to `main`, `develop`
- Only when frontend files change

**Jobs:**

#### Lint & Type Check
- ✅ Runs ESLint
- ✅ Checks for `console.log` statements
- ✅ Validates code quality
- ❌ Fails on linting errors

#### Build (Matrix: staging, production)
- ✅ Builds for both environments
- ✅ Creates environment-specific `.env.production`
- ✅ Validates build output
- ✅ Checks bundle size (warns if > 10MB)
- ✅ Uploads build artifacts

#### Security Scan
- ✅ Runs `npm audit`
- ✅ Checks for hardcoded secrets
- ⚠️ Warnings only (doesn't fail build)

#### Deploy to Staging
- ✅ Deploys to Netlify staging site
- ✅ Only on `staging` or `develop` branches
- ✅ Comments on PR with preview URL

#### Deploy to Production
- ✅ Deploys to Netlify production site
- ✅ Only on `main` branch
- ✅ Requires manual approval (GitHub environment)

#### Smoke Tests
- ✅ Checks homepage accessibility
- ✅ Tests critical pages (/events, /groups)
- ✅ Validates no JavaScript errors

### 2. Backend CI/CD (`backend-ci.yml`)

**Triggers:**
- Push to `main`, `develop`, `staging` branches
- Pull requests to `main`, `develop`
- Only when backend files change

**Jobs:**

#### Lint & Test
- ✅ Runs Checkstyle
- ✅ Runs unit tests with PostgreSQL
- ✅ Generates test coverage report
- ✅ Uploads test results
- ❌ Fails on test failures

#### Build (Matrix: staging, production)
- ✅ Builds JAR for both environments
- ✅ Validates JAR file creation
- ✅ Uploads build artifacts

#### Security Scan
- ✅ Runs dependency check
- ✅ Checks for hardcoded secrets
- ✅ Checks for SQL injection vulnerabilities
- ⚠️ Warnings only (doesn't fail build)

#### Deploy to Staging
- ✅ Deploys to Render staging
- ✅ Auto-triggered on push
- ✅ Only on `staging` or `develop` branches
- ✅ Comments on PR with API URL

#### Deploy to Production
- ✅ Deploys to Render production
- ✅ Auto-triggered on push
- ✅ Only on `main` branch
- ✅ Requires manual approval

#### Health Check
- ✅ Checks API health endpoint
- ✅ Validates database connection
- ✅ Tests critical endpoints
- ❌ Fails if health check fails

### 3. PR Checks (`pr-checks.yml`)

**Triggers:**
- All pull requests

**Jobs:**

#### Validate PR
- ✅ Checks PR title format (conventional commits)
- ✅ Warns about breaking changes
- ✅ Checks for large files
- ✅ Counts TODO/FIXME comments

#### Changed Files Detection
- ✅ Detects which parts changed (frontend/backend/docs)
- ✅ Runs appropriate checks only

#### Frontend/Backend Checks
- ✅ Runs linting and build
- ✅ Comments on PR with results

#### Bundle Size Check
- ✅ Compares bundle size with base branch
- ⚠️ Warns if size increased > 10%

---

## 🌍 Staging Environment Setup

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    PRODUCTION                           │
│  Frontend: www.outmeets.com (Netlify)                  │
│  Backend: api.outmeets.com (Render)                    │
│  Database: PostgreSQL (Render)                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                     STAGING                             │
│  Frontend: staging.outmeets.com (Netlify)              │
│  Backend: staging-api.outmeets.com (Render)            │
│  Database: PostgreSQL (Render - separate instance)     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   DEVELOPMENT                           │
│  Frontend: localhost:5173                              │
│  Backend: localhost:8080                               │
│  Database: PostgreSQL (local or Docker)                │
└─────────────────────────────────────────────────────────┘
```

### Netlify Setup

#### 1. Create Staging Site

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Create staging site
cd frontend
netlify init

# Configure site
# Site name: outmeets-staging
# Build command: npm run build
# Publish directory: dist
```

#### 2. Configure Environment Variables

**Netlify Dashboard → Site Settings → Environment Variables:**

```bash
VITE_API_URL=https://staging-api.outmeets.com/api/v1
VITE_GOOGLE_CLIENT_ID=your-staging-google-client-id
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
VITE_MIXPANEL_TOKEN=your-staging-mixpanel-token
VITE_SENTRY_DSN=your-staging-sentry-dsn
```

#### 3. Configure Custom Domain

**Netlify Dashboard → Domain Settings:**

1. Add custom domain: `staging.outmeets.com`
2. Configure DNS:
   ```
   CNAME staging outmeets-staging.netlify.app
   ```
3. Enable HTTPS (automatic with Let's Encrypt)

### Render Setup

**See detailed guide:** `docs/RENDER_STAGING_SETUP.md`

#### 1. Create Staging Web Service

**Render Dashboard:**
1. Click "New +" → "Web Service"
2. Connect GitHub repository
3. Configure:
   - Name: `outmeets-backend-staging`
   - Branch: `staging`
   - Root Directory: `backend`
   - Build Command: `./gradlew build -x test`
   - Start Command: `java -jar build/libs/*.jar`

#### 2. Add PostgreSQL Database

**Render Dashboard:**
1. Click "New +" → "PostgreSQL"
2. Name: `outmeets-db-staging`
3. Link to web service

#### 3. Configure Environment Variables

**Render Dashboard → Environment:**

```bash
# Database (auto-generated)
DATABASE_URL=postgresql://...

# Application
SPRING_PROFILES_ACTIVE=staging
JWT_SECRET=your-staging-jwt-secret-min-32-chars
FRONTEND_URL=https://staging.outmeets.com

# Google OAuth
GOOGLE_CLIENT_ID=your-staging-google-client-id
GOOGLE_CLIENT_SECRET=your-staging-google-client-secret

# Cloudinary (can share with production)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

#### 4. Configure Custom Domain

**Render Dashboard → Settings → Custom Domains:**

1. Add custom domain: `staging-api.outmeets.com`
2. Configure DNS:
   ```
   CNAME staging-api outmeets-backend-staging.onrender.com
   ```

---

## 🔐 GitHub Secrets Configuration

### Repository Secrets

**Settings → Secrets and variables → Actions → New repository secret**

#### Frontend Secrets

```bash
# Netlify
NETLIFY_AUTH_TOKEN=your-netlify-auth-token
NETLIFY_STAGING_SITE_ID=your-staging-site-id
NETLIFY_PRODUCTION_SITE_ID=your-production-site-id

# Staging Environment
STAGING_API_URL=https://staging-api.outmeets.com/api/v1
STAGING_GOOGLE_CLIENT_ID=your-staging-google-client-id
STAGING_MIXPANEL_TOKEN=your-staging-mixpanel-token
STAGING_SENTRY_DSN=your-staging-sentry-dsn

# Production Environment
PRODUCTION_API_URL=https://api.outmeets.com/api/v1
PRODUCTION_GOOGLE_CLIENT_ID=your-production-google-client-id
PRODUCTION_MIXPANEL_TOKEN=your-production-mixpanel-token
PRODUCTION_SENTRY_DSN=your-production-sentry-dsn

# Shared
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

#### Backend Secrets

```bash
# Render
RENDER_API_KEY=your-render-api-key
RENDER_STAGING_SERVICE_ID=srv-xxx-staging
RENDER_PRODUCTION_SERVICE_ID=srv-xxx-production
```

### How to Get Tokens

#### Netlify Auth Token
```bash
# Method 1: CLI
netlify login
cat ~/.netlify/config.json

# Method 2: Dashboard
# User Settings → Applications → Personal access tokens → New access token
```

#### Render API Key
```bash
# Render Dashboard
# Account Settings → API Keys → Create API Key
```

#### Site/Service IDs
```bash
# Netlify Site ID
# Dashboard → Site Settings → General → Site details → API ID

# Render Service ID
# Web Service → Settings → General → Service ID (starts with srv-)
```

---

## 🌿 Branch Strategy

### Branch Structure

```
main (production)
  ↑
  └── staging (pre-production)
       ↑
       └── develop (development)
            ↑
            └── feature/* (feature branches)
```

### Workflow

#### 1. Feature Development
```bash
# Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/add-user-profile

# Make changes
git add .
git commit -m "feat: add user profile page"

# Push and create PR to develop
git push origin feature/add-user-profile
```

#### 2. Testing on Staging
```bash
# Merge to staging for testing
git checkout staging
git pull origin staging
git merge develop
git push origin staging

# This triggers:
# - CI/CD pipeline
# - Deploy to staging environment
# - Smoke tests
```

#### 3. Production Release
```bash
# After testing, merge to main
git checkout main
git pull origin main
git merge staging
git push origin main

# This triggers:
# - CI/CD pipeline
# - Deploy to production (requires approval)
# - Health checks
```

### PR Title Format

**Conventional Commits:**
```
feat: add new feature
fix: resolve bug
docs: update documentation
style: format code
refactor: restructure code
perf: improve performance
test: add tests
chore: update dependencies
ci: update CI/CD
```

**Examples:**
```
feat: add user profile page
fix: resolve login timeout issue
docs: update deployment guide
refactor: optimize API calls
```

---

## 🪝 Pre-commit Hooks

### Setup

```bash
# Install husky
cd frontend
npm install --save-dev husky

# Initialize husky
npm run prepare

# Pre-commit hook is already configured in .husky/pre-commit
```

### What Gets Checked

#### Frontend
- ✅ ESLint (code quality)
- ✅ No `console.log` statements
- ✅ No `debugger` statements

#### Backend
- ✅ No `System.out.println` statements
- ✅ Proper logging (slf4j)

### Manual Run

```bash
# Run pre-commit checks manually
.husky/pre-commit

# Or run linter directly
cd frontend && npm run lint
```

### Bypass (Emergency Only)

```bash
# Skip pre-commit hooks (NOT RECOMMENDED)
git commit --no-verify -m "emergency fix"
```

---

## 🚀 Deployment Process

### Automatic Deployments

#### Staging
```bash
# Push to staging branch
git push origin staging

# Triggers:
# 1. Frontend CI/CD
# 2. Backend CI/CD
# 3. Deploy to staging
# 4. Smoke tests
# 5. PR comment with URLs
```

#### Production
```bash
# Push to main branch
git push origin main

# Triggers:
# 1. Frontend CI/CD
# 2. Backend CI/CD
# 3. Wait for manual approval
# 4. Deploy to production
# 5. Health checks
```

### Manual Deployments

#### Frontend (Netlify)
```bash
cd frontend
npm run build

# Deploy to staging
netlify deploy --site=outmeets-staging --dir=dist

# Deploy to production
netlify deploy --site=outmeets-production --dir=dist --prod
```

#### Backend (Render)
```bash
# Via Render Dashboard
# Web Service → Manual Deploy → Deploy latest commit

# Or trigger via API
curl -X POST https://api.render.com/v1/services/$SERVICE_ID/deploys \
  -H "Authorization: Bearer $RENDER_API_KEY"
```

### Rollback

#### Netlify
```bash
# Dashboard → Deploys → Find previous deploy → Publish deploy
# Or via CLI:
netlify rollback
```

#### Render
```bash
# Dashboard → Events → Find previous deploy → Rollback
```

---

## 🔍 Monitoring & Alerts

### GitHub Actions

**View Workflow Runs:**
- Repository → Actions tab
- Filter by workflow, branch, status
- View logs for each job

**Set Up Notifications:**
- Settings → Notifications → Actions
- Email on workflow failure
- Slack/Discord webhooks (optional)

### Staging Environment

**Health Checks:**
```bash
# Frontend
curl https://staging.outmeets.com

# Backend
curl https://staging-api.outmeets.com/actuator/health

# Database
curl https://staging-api.outmeets.com/actuator/health | jq '.components.db'
```

**Logs:**
```bash
# Render logs
# Dashboard → Logs tab (real-time streaming)

# Netlify logs
netlify logs
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Build Fails on GitHub Actions

**Symptom:** Build fails with dependency errors

**Solution:**
```bash
# Clear npm cache
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build

# Update GitHub Actions cache
# Settings → Actions → Caches → Delete all caches
```

#### 2. Environment Variables Not Working

**Symptom:** App works locally but fails on staging

**Solution:**
```bash
# Check GitHub Secrets
# Settings → Secrets → Verify all secrets are set

# Check Netlify environment variables
netlify env:list

# Check Render environment variables
# Dashboard → Environment tab
```

#### 3. Deployment Succeeds but Site Broken

**Symptom:** Deployment successful but site shows errors

**Solution:**
```bash
# Check browser console for errors
# Check API endpoint is correct
# Verify CORS settings on backend
# Check backend logs in Render dashboard
```

#### 4. Tests Fail on CI but Pass Locally

**Symptom:** Tests pass locally but fail on GitHub Actions

**Solution:**
```bash
# Run tests with same environment as CI
cd backend
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/outmeets_test \
SPRING_DATASOURCE_USERNAME=postgres \
SPRING_DATASOURCE_PASSWORD=postgres \
./gradlew test

# Check for hardcoded values
# Check for timezone issues
# Check for file path issues
```

#### 5. Pre-commit Hook Not Running

**Symptom:** Commits succeed without running checks

**Solution:**
```bash
# Reinstall husky
cd frontend
rm -rf .husky
npm run prepare

# Make hook executable
chmod +x .husky/pre-commit

# Test manually
.husky/pre-commit
```

### Debug Commands

```bash
# Check GitHub Actions logs
gh run list
gh run view <run-id>

# Check Netlify deployment
netlify status
netlify open

# Check Render deployment
# Dashboard → Service → Events tab

# Test API endpoints
curl -v https://staging-api.outmeets.com/api/v1/events/public

# Check DNS
dig staging.outmeets.com
dig staging-api.outmeets.com
```

---

## 📊 CI/CD Metrics

### Key Metrics to Track

1. **Build Success Rate**
   - Target: > 95%
   - Track: GitHub Actions dashboard

2. **Build Time**
   - Frontend: < 5 minutes
   - Backend: < 10 minutes
   - Track: GitHub Actions logs

3. **Deployment Frequency**
   - Staging: Multiple times per day
   - Production: 1-2 times per week
   - Track: GitHub Actions history

4. **Failed Deployments**
   - Target: < 5%
   - Track: GitHub Actions + Netlify/Render logs

5. **Rollback Rate**
   - Target: < 2%
   - Track: Deployment history

---

## 🎯 Best Practices

### 1. Always Test on Staging First
```bash
# Never push directly to main
# Always test on staging before production
develop → staging → main
```

### 2. Keep Branches Up to Date
```bash
# Regularly sync with develop
git checkout feature/my-feature
git pull origin develop
git merge develop
```

### 3. Write Meaningful Commit Messages
```bash
# Good
git commit -m "feat: add user authentication with JWT"

# Bad
git commit -m "update stuff"
```

### 4. Review CI/CD Logs
```bash
# Always check logs after deployment
# Even if deployment succeeds
# Look for warnings and errors
```

### 5. Monitor Staging Environment
```bash
# Test critical flows on staging
# Check error tracking (Sentry/Mixpanel)
# Verify API responses
```

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Netlify Documentation](https://docs.netlify.com/)
- [Render Documentation](https://render.com/docs)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Husky Documentation](https://typicode.github.io/husky/)

---

**Last Updated:** March 30, 2026  
**Version:** 1.0  
**Status:** ✅ Ready for Implementation
