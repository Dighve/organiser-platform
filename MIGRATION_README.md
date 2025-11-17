# HikeHub Migration to New Render Account

## 📋 Quick Start

Your Render database trial has expired. This guide will help you migrate to a fresh Render account to get a new 90-day free database trial.

### What You Need:
1. ✅ New Render account (different email)
2. ✅ 30-40 minutes of time
3. ✅ Cloudinary credentials (already have them)
4. ✅ GitHub repository access

---

## 🚀 Three Simple Steps

### 1️⃣ Deploy to New Render Account (15 minutes)
- Sign up for new Render account
- Connect GitHub repository
- Deploy using Blueprint (automatic from `render.yaml`)

### 2️⃣ Set Environment Variables (10 minutes)
- Add Cloudinary credentials in Render dashboard
- Update Netlify with new backend URL

### 3️⃣ Test Everything (10 minutes)
- Create account, groups, events
- Upload images
- Verify all features work

---

## 📚 Documentation Files

I've created 4 comprehensive guides for you:

### 1. **MIGRATION_CHECKLIST.md** ⭐ START HERE
   - Step-by-step checklist
   - Check off items as you complete them
   - Fastest way to migrate
   - **Estimated time: 35-40 minutes**

### 2. **RENDER_MIGRATION_GUIDE.md**
   - Complete detailed guide
   - Troubleshooting for common issues
   - Screenshots and explanations
   - Reference when you need help

### 3. **ENV_VARIABLES_REFERENCE.md**
   - Quick copy-paste for environment variables
   - All Cloudinary credentials
   - Netlify configuration
   - Easy reference card

### 4. **render.yaml** (Updated)
   - Blueprint configuration file
   - Includes all environment variables
   - Ready for deployment
   - No changes needed!

---

## 🎯 Recommended Workflow

```
1. Open MIGRATION_CHECKLIST.md
2. Follow steps in order
3. Check off each item
4. Refer to RENDER_MIGRATION_GUIDE.md if you need help
5. Use ENV_VARIABLES_REFERENCE.md for quick copy-paste
```

---

## 🔑 Key Information

### Your Backend URL (after deployment):
```
https://hikehub-backend.onrender.com
```
(Or similar - check Render dashboard)

### Your Frontend URL (stays the same):
```
https://hikehub-poc.netlify.app
```

### Cloudinary Credentials (ready to use):
```
Cloud Name: drdttgry4
API Key: 478746114596374
API Secret: wXiHJlL_64SuSpyTUc7ajf8KdV4
```

---

## ⚡ What's Different in New Account?

### Same:
- ✅ Same codebase
- ✅ Same features
- ✅ Same Cloudinary account
- ✅ Same frontend (Netlify)

### Different:
- 🔄 New backend URL
- 🔄 New database (empty - fresh start)
- 🔄 New Render service names
- 🔄 New 90-day database trial

### You'll Need to Recreate:
- Users (everyone signs up again)
- Groups
- Events
- Comments
- Member data

**Note:** This is a fresh start - no data migration needed since the old database is disabled.

---

## 📊 Migration Overview

```
OLD RENDER ACCOUNT                    NEW RENDER ACCOUNT
├─ Database (expired)        →        ├─ Database (new 90-day trial)
├─ Backend service           →        ├─ Backend service (new URL)
└─ Environment variables     →        └─ Environment variables (manual setup)

NETLIFY (unchanged)
└─ Frontend (update API URL only)
```

---

## 🎬 Step-by-Step Summary

### Part 1: Render Setup
1. Sign up: render.com/signup (new email)
2. New → Blueprint → Connect GitHub
3. Select HikeHub repo → Apply
4. Wait for deployment (5-10 min)

### Part 2: Configure
1. Add Cloudinary variables (3 total)
2. Save changes
3. Wait for auto-redeploy (3-5 min)

### Part 3: Update Frontend
1. Netlify → Environment variables
2. Update VITE_API_URL
3. Trigger redeploy (1-2 min)

### Part 4: Test
1. Create account
2. Create group & event
3. Upload images
4. Verify everything works

---

## 🛠️ Technical Details

### What render.yaml Does:
- Creates PostgreSQL database (hikehub-db)
- Creates web service (hikehub-backend)
- Sets up Java 17 environment
- Configures auto-deploy from GitHub
- Links database to backend
- Auto-generates JWT secret

### Auto-Configured:
- DATABASE_URL
- JWT_SECRET
- SPRING_PROFILES_ACTIVE
- JAVA_TOOL_OPTIONS

### Manual Setup Required:
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET
- (Optional) RESEND_API_KEY

---

## ⏱️ Time Breakdown

| Task | Time |
|------|------|
| Create Render account | 2 min |
| Deploy Blueprint | 10 min |
| Add environment variables | 5 min |
| Update Netlify | 3 min |
| Testing | 10 min |
| Buffer for issues | 10 min |
| **TOTAL** | **40 min** |

---

## 🚨 Common Issues & Quick Fixes

### Build Fails
- **Check:** Logs in Render dashboard
- **Fix:** Verify Java 17, retry deployment

### Database Connection Error
- **Check:** DATABASE_URL populated
- **Fix:** Verify database is "Available"

### Images Don't Upload
- **Check:** Cloudinary variables correct
- **Fix:** Redeploy backend after adding variables

### CORS Errors
- **Check:** FRONTEND_URL matches Netlify
- **Fix:** Update variable, redeploy

### API Calls Fail
- **Check:** Netlify VITE_API_URL
- **Fix:** Update to new backend URL

---

## ✅ Success Indicators

You'll know migration succeeded when:
- ✅ Render backend shows "Live" status
- ✅ Health endpoint returns `{"status":"UP"}`
- ✅ Frontend loads without errors
- ✅ Can create account and login
- ✅ Can upload images
- ✅ No CORS errors in console

---

## 📞 Need Help?

### Render Issues:
- Check logs: Dashboard → Service → Logs
- Render docs: render.com/docs

### Frontend Issues:
- Browser console (F12)
- Network tab for API errors
- Netlify deploy logs

### Code Issues:
- Verify `render.yaml` is correct
- Check `application-prod.properties`
- Review backend logs

---

## 🎉 After Migration

### Immediate:
- [ ] Test all features
- [ ] Create initial groups/events
- [ ] Invite users to sign up again

### Within 1 week:
- [ ] Monitor logs for errors
- [ ] Check database usage
- [ ] Verify performance

### Set Reminder:
- [ ] 90 days from now: Database trial expires
- [ ] Consider paid tier or migrate again

---

## 💰 Cost Breakdown

### Current Setup (Free):
- Render Web Service: **$0/month** (free tier)
- Render Database: **$0/month** (90-day trial)
- Netlify Frontend: **$0/month** (free tier)
- Cloudinary: **$0/month** (free tier)

**Total: $0/month for 90 days**

### After 90 Days:
- Option 1: Upgrade database ($7/month)
- Option 2: Migrate to another new account
- Option 3: Switch to Railway ($5-8/month, no trials)

---

## 🔐 Security Notes

- ✅ JWT_SECRET auto-generated (secure)
- ✅ Cloudinary credentials in env vars (not in code)
- ✅ Database URL auto-populated (secure)
- ✅ HTTPS everywhere (Render + Netlify)
- ✅ No sensitive data in render.yaml

---

## 📈 What to Monitor

### First 24 Hours:
- Deployment logs
- Error rates
- API response times
- Image upload success rate

### Ongoing:
- Database size (1GB limit)
- Request counts
- Cold start frequency (15 min inactivity)

---

## 🎓 Learning Resources

- **Render Docs:** https://render.com/docs
- **PostgreSQL on Render:** https://render.com/docs/databases
- **Netlify Deployment:** https://docs.netlify.com
- **Cloudinary Setup:** https://cloudinary.com/documentation

---

## 📝 Final Checklist

Before you start:
- [ ] Have new email for Render account
- [ ] Know GitHub repo URL
- [ ] Have Cloudinary credentials ready
- [ ] Have 40 minutes available
- [ ] Opened MIGRATION_CHECKLIST.md

After completion:
- [ ] Backend is "Live"
- [ ] Frontend deployed
- [ ] All env variables set
- [ ] Test account created
- [ ] Images uploading
- [ ] No errors in logs

---

## 🚀 Ready to Start?

**Open `MIGRATION_CHECKLIST.md` and follow the steps!**

Good luck! The migration is straightforward if you follow the checklist. 

---

**Created:** November 2025  
**Platform:** HikeHub Organiser Platform  
**Migration Type:** Render Free Trial Renewal
