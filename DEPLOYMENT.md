# 🚀 HikeHub Deployment Guide

Simple, step-by-step guide to deploy HikeHub to production using free tier services.

## 📋 Overview

- **Backend**: Render.com (Free tier)
- **Frontend**: Netlify (Free tier)
- **Database**: PostgreSQL on Render (Free tier)
- **Email**: Resend.com (Free tier)
- **Total Cost**: $0/month

## 🎯 Prerequisites

1. GitHub account (to connect repositories)
2. [Render.com](https://render.com) account
3. [Netlify](https://netlify.com) account
4. [Resend.com](https://resend.com) account (for email)
5. Your code pushed to GitHub

## 🗄️ Step 1: Deploy Database (Render)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `hikehub-db`
   - **Database**: `hikehub`
   - **User**: (auto-generated)
   - **Region**: Choose closest to your users
   - **Plan**: **Free**
4. Click **"Create Database"**
5. **Save the connection details** (you'll need the Internal Database URL)

## 🔧 Step 2: Deploy Backend (Render)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `hikehub-api`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Java`
   - **Build Command**: `./gradlew build -x test`
   - **Start Command**: `java -jar build/libs/*.jar`
   - **Plan**: **Free**

5. **Add Environment Variables**:
   ```
   DATABASE_URL=<your-internal-database-url>
   DATABASE_USERNAME=<your-db-username>
   DATABASE_PASSWORD=<your-db-password>
   JWT_SECRET=<generate-a-long-random-string-min-32-chars>
   RESEND_API_KEY=<your-resend-api-key>
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   SPRING_PROFILES_ACTIVE=prod
   ```

6. Click **"Create Web Service"**
7. Wait for deployment (5-10 minutes)
8. **Save your backend URL** (e.g., `https://hikehub-api.onrender.com`)

### Generate JWT Secret

```bash
# On Mac/Linux
openssl rand -base64 32

# Or use any random string generator (min 32 characters)
```

## 🎨 Step 3: Deploy Frontend (Netlify)

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect to GitHub and select your repository
4. Configure:
   - **Branch**: `main`
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`

5. **Add Environment Variable**:
   - Go to **Site settings** → **Environment variables**
   - Add: `VITE_API_BASE_URL` = `https://hikehub-api.onrender.com/api/v1`

6. Click **"Deploy site"**
7. Wait for deployment (2-3 minutes)
8. Your site will be live at `https://random-name-12345.netlify.app`

### Optional: Custom Domain

1. In Netlify, go to **Domain settings**
2. Click **"Add custom domain"**
3. Follow instructions to configure DNS

## 📧 Step 4: Set Up Email (Resend)

1. Go to [Resend Dashboard](https://resend.com/overview)
2. Click **"API Keys"** → **"Create API Key"**
3. Copy the API key
4. Add to Render backend environment variables:
   - `RESEND_API_KEY`: Your API key
   - `RESEND_FROM_EMAIL`: `noreply@yourdomain.com`

### Verify Domain (for production)

1. In Resend, go to **"Domains"**
2. Add your domain
3. Add DNS records (TXT, MX) to your domain provider
4. Verify domain

## ✅ Step 5: Test Deployment

1. **Visit your frontend URL**
2. **Test magic link login**:
   - Enter your email
   - Check your inbox for magic link
   - Click the link to log in
3. **Create a test event** or **browse groups**

## 🔄 Automatic Deployments

Both Render and Netlify automatically deploy when you push to GitHub:

- **Backend**: Push to `main` → Render rebuilds
- **Frontend**: Push to `main` → Netlify rebuilds

## ⚙️ Environment Variables Reference

### Backend (Render)

```bash
# Database (from Render PostgreSQL)
DATABASE_URL=postgresql://user:pass@host:5432/dbname
DATABASE_USERNAME=your_username
DATABASE_PASSWORD=your_password

# JWT
JWT_SECRET=your-super-secret-key-min-32-characters-long

# Email (from Resend)
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Profile
SPRING_PROFILES_ACTIVE=prod
```

### Frontend (Netlify)

```bash
VITE_API_BASE_URL=https://your-backend.onrender.com/api/v1
```

## 🐛 Troubleshooting

### Backend won't start
- Check Render logs: **Dashboard** → **Your Service** → **Logs**
- Verify all environment variables are set
- Ensure DATABASE_URL is the **Internal Database URL**

### Frontend can't connect to backend
- Verify `VITE_API_BASE_URL` is correct
- Check browser console for CORS errors
- Ensure backend is running (check Render status)

### Magic link emails not sending
- Verify `RESEND_API_KEY` is correct
- Check Resend dashboard for email logs
- For testing, use Resend's test domain

### Cold starts (Free tier limitation)
- Render free tier spins down after 15 minutes of inactivity
- First request after inactivity takes ~30 seconds
- This is normal for free tier

## 💰 Costs

**Free Tier Limits:**
- **Render**: 750 hours/month (enough for 1 service 24/7)
- **Netlify**: 100GB bandwidth, 300 build minutes/month
- **Render PostgreSQL**: 1GB storage, shared CPU
- **Resend**: 100 emails/day, 3,000 emails/month

**Perfect for:**
- Personal projects
- POC/MVP
- Small communities (10-100 users)

**Upgrade when:**
- Need faster response times (no cold starts)
- More than 100 daily active users
- Need more than 1GB database storage

## 🚀 Going to Production

For production with more users, upgrade to:

**Render:**
- Starter plan: $7/month (no cold starts)
- PostgreSQL: $7/month (256MB RAM, 1GB storage)

**Total**: ~$14/month for production-ready setup

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Netlify Documentation](https://docs.netlify.com)
- [Resend Documentation](https://resend.com/docs)

---

**Need help?** Open an issue on GitHub or check the logs in Render/Netlify dashboards.
