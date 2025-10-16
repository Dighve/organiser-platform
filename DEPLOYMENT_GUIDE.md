# 🚀 HikeHub POC Deployment Guide

## 💰 Cost Overview
**Total Monthly Cost: $0** (100% FREE for POC with limited users!)

### What's Included in Free Tier:
- ✅ **Frontend (Netlify)**: Unlimited bandwidth, 100GB/month
- ✅ **Backend (Render)**: 750 hours/month (24/7 operation)
- ✅ **Database (Render PostgreSQL)**: 1GB storage (renewable every 90 days)
- ✅ **SSL Certificates**: Included
- ✅ **Custom Domain**: Supported (bring your own domain)

### Limitations to Note:
- Backend spins down after 15 min of inactivity (cold start ~30s)
- Database limited to 1GB storage
- 100 build minutes/month on Render
- Suitable for 10-50 users with light to moderate usage

---

## 📋 Prerequisites

1. **GitHub Account** (free)
2. **Render Account** - Sign up at https://render.com (free)
3. **Netlify Account** - Sign up at https://netlify.com (free)
4. Push your code to a GitHub repository

---

## 🎯 Deployment Steps

### Part 1: Deploy Backend (Render.com)

#### Step 1: Push Code to GitHub
```bash
# If not already done
cd organiser-platform
git init
git add .
git commit -m "Initial commit for deployment"
git remote add origin <your-github-repo-url>
git push -u origin main
```

#### Step 2: Create Render Account & Deploy
1. Go to https://render.com and sign up (use GitHub login)
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub repository
4. Select the repository: `organiser-platform`
5. Render will automatically detect `backend/render.yaml`
6. Click **"Apply"**

#### Step 3: Configure Environment Variables
Render will create the database and service automatically. You only need to set:

1. Go to your service → **Environment** tab
2. Add/Verify these variables:
   - `JWT_SECRET`: Generate a random 64-character string
     ```bash
     # Generate on your machine:
     openssl rand -base64 64
     ```
   - `FRONTEND_URL`: Leave blank for now (will add after frontend deployment)
   - Other variables (DATABASE_URL, etc.) are auto-populated by Render

#### Step 4: Wait for Build
- First build takes ~5-10 minutes
- Watch the logs for any errors
- Once deployed, you'll get a URL like: `https://hikehub-backend.onrender.com`
- Test health check: `https://hikehub-backend.onrender.com/actuator/health`

#### Step 5: Initialize Database (First Time Only)
The database will be automatically created with Flyway migrations when the backend starts.

---

### Part 2: Deploy Frontend (Netlify)

#### Step 1: Create Netlify Account
1. Go to https://netlify.com and sign up (use GitHub login)
2. Click **"Add new site"** → **"Import an existing project"**

#### Step 2: Connect Repository
1. Choose **GitHub**
2. Select your repository: `organiser-platform`
3. Configure build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
   - Click **"Show advanced"** and add environment variable:
     - `VITE_API_URL`: `https://hikehub-backend.onrender.com/api/v1` (use your actual Render URL)

#### Step 3: Deploy
1. Click **"Deploy site"**
2. Wait 2-3 minutes for build to complete
3. You'll get a URL like: `https://random-name-12345.netlify.app`
4. Optional: Change site name in **Site settings** → **Change site name**
   - Example: `hikehub-poc.netlify.app`

#### Step 4: Update Backend CORS
1. Go back to Render.com → Your backend service
2. Go to **Environment** tab
3. Update `FRONTEND_URL` to your Netlify URL: `https://hikehub-poc.netlify.app`
4. Save (backend will auto-redeploy)

---

### Part 3: Test Your Deployment

#### Backend Health Check
```bash
curl https://hikehub-backend.onrender.com/actuator/health
# Should return: {"status":"UP"}
```

#### Frontend
1. Visit your Netlify URL: `https://hikehub-poc.netlify.app`
2. Try creating an account
3. Try logging in
4. Create a group/event

**Note**: First request after inactivity may take 30 seconds (cold start).

---

## 🔒 Security Checklist

- [x] JWT_SECRET is randomly generated
- [x] HTTPS enabled by default (Render & Netlify)
- [x] CORS configured properly
- [x] Database credentials managed by Render
- [x] Environment variables not committed to Git
- [ ] Consider adding rate limiting for production
- [ ] Set up monitoring/alerts (optional)

---

## 📊 Monitoring & Logs

### Backend Logs (Render)
1. Go to Render Dashboard
2. Click on your service
3. Click **"Logs"** tab
4. View real-time logs

### Frontend Logs (Netlify)
1. Go to Netlify Dashboard
2. Click on your site
3. Click **"Deploys"** → Select a deploy → **"Deploy log"**

### Database Management
1. Render Dashboard → PostgreSQL database
2. Click **"Connect"** → Get connection string
3. Use tools like pgAdmin or DBeaver to connect

---

## 🔄 Updating Your Application

### Backend Updates
```bash
# Make your changes
git add .
git commit -m "Update backend"
git push origin main
# Render auto-deploys from main branch
```

### Frontend Updates
```bash
# Make your changes
git add .
git commit -m "Update frontend"
git push origin main
# Netlify auto-deploys from main branch
```

---

## 💡 Upgrading to Paid Plans (When Needed)

### When to Consider Upgrading:
- More than 50 active users
- Need faster response times (no cold starts)
- Need more than 1GB database storage
- Need better uptime guarantees

### Recommended Next Tier:
**Render Starter Plan**: ~$7/month per service
- No cold starts (always running)
- More CPU/memory
- Better support

**Netlify Pro**: $19/month
- More build minutes
- Better analytics
- Team features

---

## 🆘 Troubleshooting

### Backend won't start
1. Check Render logs for errors
2. Verify DATABASE_URL is set correctly
3. Ensure JWT_SECRET is set
4. Check if PostgreSQL database is running

### Frontend can't connect to backend
1. Verify VITE_API_URL in Netlify environment variables
2. Check CORS settings in backend
3. Ensure backend is running (check Render dashboard)
4. Clear browser cache

### Database issues
1. Check if database has spun down (free tier spins down after 90 days)
2. Verify database connection in Render logs
3. Check Flyway migrations ran successfully

### Cold start is too slow
- This is expected on free tier
- Consider upgrading to paid plan ($7/month) for always-on instance
- Or use a cron job to ping your backend every 14 minutes to keep it warm

---

## 🎉 Success!

Your HikeHub POC is now live and accessible to anyone with the URL!

**Share these URLs with your testers:**
- Frontend: `https://your-site.netlify.app`
- Backend API: `https://your-backend.onrender.com/api/v1`

**Next Steps:**
1. Share the frontend URL with a few friends/testers
2. Gather feedback
3. Monitor usage in Render/Netlify dashboards
4. Decide if you need to upgrade based on usage patterns

---

## 📞 Support Resources

- **Render Docs**: https://render.com/docs
- **Netlify Docs**: https://docs.netlify.com
- **Render Community**: https://community.render.com
- **Netlify Community**: https://answers.netlify.com

---

## 🔐 Important Security Notes

1. **Never commit** `.env` files with real credentials
2. **Rotate JWT_SECRET** periodically
3. **Monitor** access logs for suspicious activity
4. **Backup** database regularly (export from Render)
5. **Set up** alerts for service downtime

---

## 💾 Database Backup (Important!)

Free tier database expires after 90 days. To backup:

```bash
# Get connection string from Render dashboard
pg_dump <CONNECTION_STRING> > backup.sql

# Or use Render dashboard → Database → "Backup" tab
```

---

**Estimated Total Setup Time**: 30-45 minutes

Good luck with your POC! 🚀
