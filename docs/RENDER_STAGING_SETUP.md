# Render Staging Environment Setup Guide

## 🎯 Overview

This guide shows how to set up a staging environment on Render for your backend, separate from production.

---

## 📋 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    PRODUCTION                           │
│  Backend: api.outmeets.com (Render)                    │
│  Database: PostgreSQL (Render)                         │
│  Branch: main                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                     STAGING                             │
│  Backend: staging-api.outmeets.com (Render)            │
│  Database: PostgreSQL (Render - separate)              │
│  Branch: staging                                       │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Setup Steps

### Step 1: Create Staging Web Service

1. **Go to Render Dashboard:** https://dashboard.render.com/
2. **Click "New +" → "Web Service"**
3. **Connect Repository:**
   - Select your GitHub repository
   - Grant Render access if needed

4. **Configure Service:**
   ```
   Name: outmeets-backend-staging
   Region: Oregon (US West) or closest to you
   Branch: staging
   Root Directory: backend
   Runtime: Java
   Build Command: ./gradlew build -x test
   Start Command: java -jar build/libs/*.jar
   ```

5. **Select Plan:**
   - Free tier: $0/month (sleeps after 15 min inactivity)
   - Starter: $7/month (no sleep, 512MB RAM)
   - Recommended: Starter for staging

### Step 2: Create Staging Database

1. **In Render Dashboard, click "New +" → "PostgreSQL"**
2. **Configure Database:**
   ```
   Name: outmeets-db-staging
   Database: outmeets_staging
   User: outmeets_staging
   Region: Same as web service
   PostgreSQL Version: 15
   ```

3. **Select Plan:**
   - Free tier: $0/month (1GB storage, expires in 90 days)
   - Starter: $7/month (10GB storage, no expiration)
   - Recommended: Free for testing, Starter for long-term

4. **Note the Connection Details:**
   - Internal Database URL (for web service)
   - External Database URL (for local access)

### Step 3: Configure Environment Variables

**In Web Service → Environment:**

```bash
# Database (auto-filled if you link database)
DATABASE_URL=<internal-database-url>

# Application
SPRING_PROFILES_ACTIVE=staging
JWT_SECRET=your-staging-jwt-secret-min-32-chars-long
FRONTEND_URL=https://staging.outmeets.com

# Google OAuth
GOOGLE_CLIENT_ID=your-staging-google-client-id
GOOGLE_CLIENT_SECRET=your-staging-google-client-secret

# Cloudinary (can share with production)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Optional: Email (if using)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USERNAME=your-email
# SMTP_PASSWORD=your-app-password
```

### Step 4: Link Database to Web Service

1. **Web Service → Environment → Add Environment Variable**
2. **Click "Add from Database"**
3. **Select:** `outmeets-db-staging`
4. **This auto-adds:** `DATABASE_URL`

### Step 5: Configure Custom Domain

1. **Web Service → Settings → Custom Domains**
2. **Add Custom Domain:** `staging-api.outmeets.com`
3. **Configure DNS (at your domain provider):**
   ```
   Type: CNAME
   Name: staging-api
   Value: outmeets-backend-staging.onrender.com
   TTL: 3600
   ```
4. **Wait for DNS propagation** (5-60 minutes)
5. **Render auto-provisions SSL certificate** (Let's Encrypt)

### Step 6: Configure Auto-Deploy

**Web Service → Settings → Build & Deploy:**

1. **Auto-Deploy:** `Yes`
2. **Branch:** `staging`
3. **Build Filter:** (optional)
   ```
   Paths: backend/**
   ```
   This only deploys when backend files change

### Step 7: Test Deployment

```bash
# Push to staging branch
git checkout staging
git push origin staging

# Render will automatically:
# 1. Detect push
# 2. Build application
# 3. Run database migrations (if configured)
# 4. Deploy new version
# 5. Health check

# Check deployment
curl https://staging-api.outmeets.com/actuator/health
```

---

## 🔄 GitHub Actions Integration

### Get Render API Key

1. **Render Dashboard → Account Settings**
2. **API Keys → Create API Key**
3. **Name:** `GitHub Actions`
4. **Copy key** (save securely)

### Get Service IDs

1. **Web Service → Settings → General**
2. **Copy Service ID** (starts with `srv-`)
3. Repeat for production service

### Add GitHub Secrets

**Repository → Settings → Secrets and variables → Actions:**

```bash
# Render
RENDER_API_KEY=your-render-api-key
RENDER_STAGING_SERVICE_ID=srv-xxx-staging
RENDER_PRODUCTION_SERVICE_ID=srv-xxx-production
```

### GitHub Actions Workflow

Already configured in `.github/workflows/backend-ci.yml`:

```yaml
deploy-staging:
  name: Deploy to Staging
  steps:
    - name: Deploy to Render (Staging)
      uses: johnbeynon/render-deploy-action@v0.0.8
      with:
        service-id: ${{ secrets.RENDER_STAGING_SERVICE_ID }}
        api-key: ${{ secrets.RENDER_API_KEY }}
        wait-for-success: true
```

---

## 📊 Monitoring

### Health Checks

**Render automatically monitors:**
- HTTP health check endpoint
- Response time
- Error rate
- Uptime

**Configure Health Check:**
1. Web Service → Settings → Health Check Path
2. Set to: `/actuator/health`
3. Render pings every 30 seconds

### Logs

**View Logs:**
1. Web Service → Logs tab
2. Real-time streaming logs
3. Filter by severity

**CLI Access:**
```bash
# Install Render CLI
npm install -g @render/cli

# Login
render login

# View logs
render logs --service=outmeets-backend-staging --tail
```

### Metrics

**Render Dashboard shows:**
- CPU usage
- Memory usage
- Request count
- Response time
- Error rate

---

## 🔧 Database Management

### Access Database

**Via psql:**
```bash
# Get external database URL from Render dashboard
psql <external-database-url>

# Example
psql postgresql://user:pass@dpg-xxx.oregon-postgres.render.com/outmeets_staging
```

**Via GUI (DBeaver, pgAdmin):**
```
Host: dpg-xxx.oregon-postgres.render.com
Port: 5432
Database: outmeets_staging
Username: outmeets_staging
Password: <from Render dashboard>
SSL: Required
```

### Run Migrations

**Automatic (on deploy):**
Render runs your start command which includes Flyway migrations.

**Manual:**
```bash
# Via Render Shell
render shell --service=outmeets-backend-staging
./gradlew flywayMigrate

# Or via local connection
SPRING_DATASOURCE_URL=<external-database-url> \
./gradlew flywayMigrate
```

### Backup Database

**Automatic Backups:**
- Free tier: No automatic backups
- Starter+: Daily automatic backups

**Manual Backup:**
```bash
# Via pg_dump
pg_dump <external-database-url> > staging_backup.sql

# Restore
psql <external-database-url> < staging_backup.sql
```

---

## 🔐 Security

### Environment Variables

**Best Practices:**
- ✅ Use different secrets for staging/production
- ✅ Rotate secrets regularly
- ✅ Never commit secrets to Git
- ✅ Use Render's environment variables (encrypted at rest)

### Database Access

**Restrict Access:**
1. Database → Settings → Allowed IP Addresses
2. Add your IPs for local access
3. Render services auto-allowed

### SSL/TLS

**Automatic:**
- Render auto-provisions SSL certificates
- Forces HTTPS on custom domains
- Database connections use SSL

---

## 💰 Cost Optimization

### Free Tier Limits

**Web Service:**
- 750 hours/month (enough for 1 service)
- Sleeps after 15 min inactivity
- 30-60 second cold start
- 512MB RAM

**Database:**
- 1GB storage
- Expires after 90 days
- Shared CPU
- No automatic backups

### Upgrade Recommendations

**For Staging:**
- Web Service: Starter ($7/month) - No sleep
- Database: Free tier OK for testing

**For Production:**
- Web Service: Starter+ ($25/month) - More RAM
- Database: Starter ($7/month) - 10GB + backups

---

## 🐛 Troubleshooting

### Issue: Service won't start

**Check:**
1. Build logs for errors
2. Environment variables set correctly
3. Database connection working
4. Port configuration (Render uses PORT env var)

**Solution:**
```bash
# Check logs
render logs --service=outmeets-backend-staging

# Verify env vars
render env --service=outmeets-backend-staging

# Test database connection
psql <external-database-url>
```

### Issue: Database connection fails

**Check:**
1. DATABASE_URL correct?
2. Database service running?
3. SSL required? (yes for Render)

**Solution:**
```bash
# Test connection
psql <database-url>

# Check SSL requirement
# Add to application.properties:
spring.datasource.url=${DATABASE_URL}?sslmode=require
```

### Issue: Slow cold starts

**Cause:** Free tier sleeps after 15 min inactivity

**Solutions:**
1. Upgrade to Starter plan ($7/month)
2. Use cron job to ping every 10 minutes
3. Accept cold starts for staging (acceptable)

### Issue: Build fails

**Check:**
1. Gradle wrapper executable? (`chmod +x gradlew`)
2. Java version correct? (17)
3. Dependencies available?

**Solution:**
```bash
# Test build locally
cd backend
./gradlew clean build

# Check Render build logs
# Settings → Build Command
```

---

## 🔄 Deployment Workflow

### Automatic Deploy (Recommended)

```bash
# Push to staging branch
git checkout staging
git merge develop
git push origin staging

# Render automatically:
# 1. Detects push
# 2. Builds application
# 3. Runs tests (if configured)
# 4. Deploys
# 5. Health checks
```

### Manual Deploy

```bash
# Via Render Dashboard
# Web Service → Manual Deploy → Deploy latest commit

# Via Render CLI
render deploy --service=outmeets-backend-staging
```

### Rollback

```bash
# Via Dashboard
# Web Service → Events → Find previous deploy → Rollback

# Via CLI
render rollback --service=outmeets-backend-staging
```

---

## 📋 Comparison: Staging vs Production

| Feature | Staging | Production |
|---------|---------|------------|
| **Branch** | staging | main |
| **Domain** | staging-api.outmeets.com | api.outmeets.com |
| **Database** | Separate instance | Separate instance |
| **Plan** | Free or Starter | Starter+ |
| **Auto-Deploy** | ✅ Yes | ✅ Yes (with approval) |
| **Sleep** | Yes (free) / No (paid) | No |
| **Backups** | Manual | Automatic |
| **Purpose** | Testing | Live users |

---

## ✅ Checklist

### Initial Setup
- [ ] Create staging web service on Render
- [ ] Create staging database on Render
- [ ] Link database to web service
- [ ] Configure environment variables
- [ ] Set up custom domain
- [ ] Enable auto-deploy from staging branch
- [ ] Test deployment

### GitHub Integration
- [ ] Get Render API key
- [ ] Get service IDs (staging + production)
- [ ] Add GitHub secrets
- [ ] Test GitHub Actions workflow

### Verification
- [ ] Health check endpoint works
- [ ] Database migrations run
- [ ] API endpoints accessible
- [ ] CORS configured correctly
- [ ] SSL certificate active

---

## 📚 Resources

- **Render Docs:** https://render.com/docs
- **Render Dashboard:** https://dashboard.render.com/
- **Render Status:** https://status.render.com/
- **Support:** https://render.com/support

---

**Last Updated:** March 30, 2026  
**Version:** 1.0  
**Status:** ✅ Ready to Implement
