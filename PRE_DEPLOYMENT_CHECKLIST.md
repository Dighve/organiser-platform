# ✅ Pre-Deployment Checklist

Before deploying to production, ensure all items are checked:

## 🔧 Code & Configuration

### Backend
- [x] PostgreSQL driver added to build.gradle
- [x] Production profile created (application-prod.properties)
- [x] Render.yaml configuration created
- [ ] All sensitive data removed from code (API keys, passwords, etc.)
- [ ] Database migrations tested locally
- [ ] Backend builds successfully: `./gradlew clean build`
- [ ] Health check endpoint works: `/actuator/health`

### Frontend  
- [x] Netlify.toml configuration created
- [x] Environment template created
- [ ] Frontend builds successfully: `npm run build`
- [ ] No hardcoded API URLs (using VITE_API_URL env var)
- [ ] Error handling implemented for API calls
- [ ] Loading states for async operations

## 📁 Repository

- [ ] Code pushed to GitHub
- [ ] `.gitignore` includes sensitive files (.env, .env.local, etc.)
- [ ] README updated with deployment info
- [ ] Deployment guides added to repository
- [ ] All dependencies listed in package.json / build.gradle

## 🔐 Security

- [ ] No API keys or secrets in code
- [ ] JWT_SECRET will be generated (not committed)
- [ ] Database credentials managed by hosting provider
- [ ] CORS properly configured
- [ ] Input validation on all forms
- [ ] SQL injection prevention (using JPA/Hibernate)
- [ ] XSS prevention in frontend

## 🧪 Testing

- [ ] Test user registration locally
- [ ] Test user login locally
- [ ] Test creating groups locally
- [ ] Test creating events locally
- [ ] Test RSVP functionality locally
- [ ] API endpoints return proper error messages
- [ ] Frontend handles API errors gracefully

## 📊 Monitoring Setup (Optional but Recommended)

- [ ] Plan to check Render logs regularly
- [ ] Plan to check Netlify logs regularly
- [ ] Consider setting up error tracking (Sentry - free tier)
- [ ] Consider setting up uptime monitoring (UptimeRobot - free)

## 💾 Backup Plan

- [ ] Plan for database backups (weekly export from Render)
- [ ] Document backup procedure
- [ ] Test database restore locally

## 📋 Deployment Accounts

- [ ] GitHub account created
- [ ] Render.com account created (or Railway)
- [ ] Netlify.com account created
- [ ] GitHub repository is public or connected to deployment platforms

## 🎯 Post-Deployment Testing

### After Backend Deployment
- [ ] Health check endpoint responds
- [ ] Logs show successful startup
- [ ] Database connection successful
- [ ] No error 500s in logs

### After Frontend Deployment
- [ ] Site loads without errors
- [ ] API connection successful
- [ ] Can create account
- [ ] Can login
- [ ] Can create group
- [ ] Can create event
- [ ] Images/assets load properly
- [ ] Mobile responsive

## 📝 Documentation

- [ ] Deployment guides reviewed
- [ ] Backend URL documented
- [ ] Frontend URL documented  
- [ ] Admin credentials created (if needed)
- [ ] Tester accounts planned

## 🚀 Go/No-Go Decision

**Ready to deploy when:**
- All "Code & Configuration" items checked
- All "Repository" items checked
- All "Security" items checked
- At least 70% of "Testing" items checked

**DO NOT deploy if:**
- Sensitive data is in code
- Backend doesn't build
- Frontend doesn't build
- Critical functionality broken locally

---

## 🎯 Quick Pre-Deployment Commands

Run these locally before deploying:

```bash
# Backend - Verify build
cd backend
./gradlew clean build
./gradlew test

# Frontend - Verify build
cd frontend
npm install
npm run build
npm run lint

# Check for secrets (optional but recommended)
git secrets --scan  # If you have git-secrets installed

# Verify .env is not tracked
git status  # Should not show .env files
```

---

## ✅ All Checks Passed?

Great! Choose your deployment path:

1. **Free Option**: Follow [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
2. **Better UX**: Follow [DEPLOYMENT_RAILWAY.md](./DEPLOYMENT_RAILWAY.md)
3. **Compare Options**: See [DEPLOYMENT_OPTIONS.md](./DEPLOYMENT_OPTIONS.md)

---

**Last Updated**: Created for initial deployment
**Next Review**: After first successful deployment
