# Render Deployment Checklist ✅

## Pre-Deployment Verification

### ✅ 1. PostgreSQL Migrations
- [x] V1.1__Combined_schema.sql - All 12 tables
- [x] V2__Insert_test_data.sql - Sample data
- [x] V3__Update_event_participants_schema.sql - Schema updates
- [x] V4__Update_member_with_is_organiser_schema.sql - Organiser flag
- [x] Migrations located in `backend/src/main/resources/db/migration/postgresql/`

### ✅ 2. Configuration Files
- [x] `backend/render.yaml` - Render service definition
- [x] `backend/src/main/resources/application-prod.properties` - Production config
- [x] `backend/build.gradle` - PostgreSQL driver included
- [x] `backend/build.gradle` - PostgreSQL migrations not excluded

### ✅ 3. Database Configuration
- [x] Uses `DATABASE_URL` environment variable
- [x] PostgreSQL driver configured
- [x] Flyway configured to use postgresql migrations
- [x] Hibernate validation mode set

### ✅ 4. Code Repository
- [ ] Code committed to Git
- [ ] Code pushed to GitHub/GitLab/Bitbucket

## Deployment Steps

### Step 1: Prepare Repository
```bash
cd /Users/vikumar/Projects/CascadeProjects/windsurf-project/organiser-platform

# Check status
git status

# Add all changes
git add .

# Commit
git commit -m "Fix PostgreSQL migrations for Render deployment"

# Push to remote
git push origin main
```

### Step 2: Deploy to Render

#### Option A: Using Render Dashboard (Easiest)
1. Go to https://dashboard.render.com/
2. Click **"New +"** → **"Blueprint"**
3. Connect your repository
4. Select `/organiser-platform/backend/render.yaml`
5. Review the configuration:
   - Web Service: `hikehub-backend`
   - Database: `hikehub-db` (PostgreSQL)
   - Region: Oregon (free tier)
6. Click **"Apply"**
7. Wait for deployment (5-10 minutes)

#### Option B: Using Render CLI
```bash
# Install Render CLI (if not already installed)
npm install -g render-cli

# Login
render login

# Deploy
cd backend
render-cli deploy
```

### Step 3: Monitor Deployment

1. **Check Build Logs**
   - Go to: `https://dashboard.render.com/web/<your-service-id>`
   - Look for successful Gradle build
   - Verify JAR file created: `build/libs/platform-1.0.0.jar`

2. **Check Application Logs**
   - Look for Spring Boot startup
   - Verify Flyway migrations executed:
     ```
     Flyway: Successfully applied 4 migrations
     ```
   - Check for connection to database:
     ```
     HikariPool-1 - Starting...
     HikariPool-1 - Start completed.
     ```

3. **Verify Health Endpoint**
   ```bash
   curl https://your-app.onrender.com/actuator/health
   ```
   Expected response:
   ```json
   {"status":"UP"}
   ```

### Step 4: Verify Database

1. **Check Migration History**
   - Go to Render Dashboard → Database → Connect
   - Run:
     ```sql
     SELECT * FROM flyway_schema_history ORDER BY installed_rank;
     ```
   - Should show 4 migrations executed

2. **Check Tables**
   ```sql
   \dt
   ```
   Should list all 12 tables:
   - activities
   - members
   - groups
   - group_co_organisers
   - events
   - event_organisers
   - event_participants
   - event_additional_images
   - event_requirements
   - event_included_items
   - subscriptions
   - magic_links

3. **Check Sample Data**
   ```sql
   SELECT COUNT(*) FROM activities;  -- Should return 5
   SELECT COUNT(*) FROM members;     -- Should return 4
   SELECT COUNT(*) FROM groups;      -- Should return 3
   SELECT COUNT(*) FROM events;      -- Should return 4
   ```

## Post-Deployment Configuration

### Set Environment Variables (if needed)

In Render Dashboard → Web Service → Environment:

1. **JWT_SECRET** (auto-generated, but you can set custom)
   ```
   JWT_SECRET=your-super-secret-key-change-in-production
   ```

2. **FRONTEND_URL** (after deploying frontend)
   ```
   FRONTEND_URL=https://your-app.netlify.app
   ```

### Test API Endpoints

1. **Health Check**
   ```bash
   curl https://your-app.onrender.com/actuator/health
   ```

2. **Get Activities**
   ```bash
   curl https://your-app.onrender.com/api/activities
   ```

3. **Get Events**
   ```bash
   curl https://your-app.onrender.com/api/events?page=0&size=10
   ```

## Troubleshooting

### Build Fails
- ❌ **Error**: "Task bootJar not found"
  - ✅ **Fix**: Run `./gradlew clean build` locally first to verify
  
- ❌ **Error**: "Could not find PostgreSQL driver"
  - ✅ **Fix**: Check `build.gradle` has `runtimeOnly 'org.postgresql:postgresql:42.6.0'`

### Migration Fails
- ❌ **Error**: "Migration checksum mismatch"
  - ✅ **Fix**: In Render dashboard, delete database and recreate (loses data!)
  - ✅ **Or**: Set `spring.flyway.validate-on-migrate=false` in application-prod.properties

- ❌ **Error**: "Table already exists"
  - ✅ **Fix**: Database not clean. Render free tier auto-creates, so this shouldn't happen on first deploy

### Application Fails to Start
- ❌ **Error**: "Cannot connect to database"
  - ✅ **Fix**: Check DATABASE_URL is set in Render environment
  - ✅ **Fix**: Verify database service is running

- ❌ **Error**: "JWT secret not configured"
  - ✅ **Fix**: Set JWT_SECRET in Render environment variables

### Cold Starts (Free Tier)
- ⚠️ **Issue**: App spins down after 15 minutes of inactivity
- ✅ **Expected**: 30-second cold start on first request
- ℹ️ **Upgrade**: Consider $7/month Starter plan to keep app always running

## Success Criteria

Your deployment is successful when:

✅ Build completes without errors  
✅ Application starts successfully  
✅ All 4 Flyway migrations executed  
✅ All 12 tables created in database  
✅ Sample data inserted (5 activities, 4 members, 3 groups, 4 events)  
✅ Health endpoint returns `{"status":"UP"}`  
✅ API endpoints return data  
✅ CORS configured for frontend  

## Next Steps

1. **Deploy Frontend to Netlify**
   - Follow: `DEPLOYMENT_GUIDE.md` → Frontend section
   - Update `FRONTEND_URL` in Render backend

2. **Test End-to-End**
   - Login flow
   - Browse events
   - Register for events
   - Create groups (if organizer)

3. **Monitor Usage**
   - Check Render dashboard for metrics
   - Monitor free tier limits (1GB database storage)
   - Consider upgrading if needed

## Support

- **Render Docs**: https://render.com/docs
- **Render Status**: https://status.render.com/
- **Community**: https://community.render.com/

---

**HikeHub Backend Deployment Status**: ✅ Ready for Render! 🚀
