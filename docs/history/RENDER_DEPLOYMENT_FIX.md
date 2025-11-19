# Render Deployment Fix - Port Binding Issue

## Error Messages
```
❌ Port scan timeout reached, no open ports detected. 
   Bind your service to at least one port.

❌ Waiting for internal health check to return a successful response code at: 
   hikehub-backend-kpkp.onrender.com:10000/actuator/health
```

---

## Root Cause
Spring Boot was not binding to `0.0.0.0` (all network interfaces), which prevented Render from detecting the open port.

---

## ✅ Fixes Applied

### 1. **Added Server Address Binding**
**File**: `backend/src/main/resources/application-prod.properties`

```properties
# Server Configuration - Render provides PORT env var
server.port=${PORT:8080}
server.address=0.0.0.0  # ⬅️ NEW: Bind to all interfaces
server.compression.enabled=true
```

**Why this fixes it:**
- `0.0.0.0` means "listen on ALL network interfaces"
- Render needs this to detect the port is open
- Without it, app only listens on `localhost` (127.0.0.1)

### 2. **Updated Frontend URL in render.yaml**
```yaml
- key: FRONTEND_URL
  value: https://www.outmeets.com  # ⬅️ Fixed from hikehub-poc
```

---

## How Render Health Checks Work

### Render's Health Check Process:
```
1. Render starts your Docker container
2. Waits for port to be open (detects with port scan)
3. Once port open, starts hitting /actuator/health
4. Expects HTTP 200 response within timeout (usually 5 minutes)
5. If successful, marks deployment as "Live"
```

### Your Configuration:
```yaml
# render.yaml
healthCheckPath: /actuator/health
```

This tells Render to check: `http://your-service.onrender.com:10000/actuator/health`

---

## Deployment Steps

### 1. Commit and Push Changes
```bash
git add -A
git commit -m "Fix Render port binding and update frontend URL"
git push origin main
```

### 2. Render Auto-Deploy
Render will automatically detect the push and start redeploying.

### 3. Monitor Deployment Logs
Go to Render dashboard → Your service → Logs

**Look for these success indicators:**
```
✅ Started Application in X.XXX seconds
✅ Tomcat started on port(s): 10000 (http)
✅ Netty started on port(s): 10000
✅ Health check passed
```

**Common error patterns to watch for:**
```
❌ Failed to configure a DataSource (database connection issue)
❌ Port 10000 is already in use
❌ java.lang.OutOfMemoryError (insufficient memory)
❌ Connection refused (database not ready)
```

---

## Troubleshooting Steps

### Issue 1: Database Connection Fails
**Error**: `Failed to configure a DataSource`

**Solution**: Check Render dashboard environment variables:
```bash
# These should be set automatically by Render:
DATABASE_URL=postgres://user:password@host:5432/database
```

**If missing**, manually link database:
1. Go to: Service → Environment
2. Add variable: `DATABASE_URL`
3. Click "Add from database" → Select `hikehub-db`

---

### Issue 2: Health Check Still Failing
**Error**: `Health check timeout`

**Debug steps:**

1. **Check if app is actually starting:**
   ```bash
   # In Render logs, search for:
   "Started Application"
   "Tomcat started on port"
   ```

2. **Test health endpoint manually:**
   ```bash
   # SSH into Render shell (if available) or use local test:
   curl http://localhost:10000/actuator/health
   
   # Expected response:
   {"status":"UP"}
   ```

3. **Check database connectivity:**
   ```bash
   # Look for in logs:
   "HikariPool-1 - Start completed"
   
   # Or errors like:
   "Connection refused"
   "Connection timed out"
   ```

---

### Issue 3: Out of Memory
**Error**: `java.lang.OutOfMemoryError`

**Solution**: Adjust Java memory settings in `render.yaml`:

```yaml
envVars:
  - key: JAVA_TOOL_OPTIONS
    value: "-Xmx512m -Xms256m"  # Adjust for free tier (512MB RAM)
```

For Render free tier:
- Total RAM: 512MB
- Recommended: `-Xmx400m` (leaves room for OS)

---

### Issue 4: Port Already in Use
**Error**: `Address already in use`

**Solution**: This is rare on Render, but if it happens:
1. Try manual restart in Render dashboard
2. Check for zombie processes (Render should handle this)
3. Contact Render support

---

## Verify Deployment Success

### 1. Check Health Endpoint
```bash
curl https://hikehub-backend-kpkp.onrender.com/actuator/health
```

**Expected response:**
```json
{
  "status": "UP",
  "groups": ["liveness", "readiness"]
}
```

### 2. Check API Endpoints
```bash
# Test public endpoint (no auth needed)
curl https://hikehub-backend-kpkp.onrender.com/api/v1/activities

# Should return list of activities
```

### 3. Test Magic Link Email
```bash
curl -X POST https://hikehub-backend-kpkp.onrender.com/api/v1/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com"}'

# Check your email for magic link
# Link should be: https://www.outmeets.com/auth/verify?token=...
```

---

## Render Configuration Checklist

### Environment Variables (Set in Render Dashboard)

**Required:**
- ✅ `DATABASE_URL` - Auto-set by Render when you link the database
- ✅ `JWT_SECRET` - Auto-generated or set manually
- ✅ `SPRING_PROFILES_ACTIVE=prod` - Set in render.yaml

**Optional (for full functionality):**
- ⚠️ `RESEND_API_KEY` - For magic link emails
- ⚠️ `EMAIL_FROM` - Set in render.yaml (default: onboarding@resend.dev)
- ⚠️ `CLOUDINARY_CLOUD_NAME` - For image uploads
- ⚠️ `CLOUDINARY_API_KEY` - For image uploads
- ⚠️ `CLOUDINARY_API_SECRET` - For image uploads
- ⚠️ `FRONTEND_URL` - Set in render.yaml (https://www.outmeets.com)

### Render.yaml Settings
```yaml
type: web
env: docker
dockerfilePath: ./backend/Dockerfile
dockerContext: ./backend
healthCheckPath: /actuator/health  # ✅ Correct
plan: free  # ✅ Free tier
region: oregon  # ✅ Free tier available
```

---

## Common Render Free Tier Limitations

### Cold Starts
- ⚠️ Free services spin down after 15 minutes of inactivity
- First request after spin-down takes ~30-60 seconds
- Subsequent requests are fast

### Memory
- 512MB RAM total
- Java heap: Max 400-450MB recommended
- Monitor with: Render dashboard → Metrics

### Build Time
- Free tier: 15 minute build timeout
- Your build: ~5-8 minutes (should be fine)
- If timeout: Consider pre-building JAR locally

---

## Alternative: Deploy to Railway (Recommended)

If Render continues to have issues, Railway is more reliable:

**Advantages:**
- No cold starts ($5/month starter plan)
- Better build performance
- Easier configuration
- Automatic HTTPS
- Built-in metrics

**See**: `RAILWAY_PRODUCTION_DEPLOYMENT.md` for migration guide

---

## Quick Fix Script

If deployment is still failing, try this emergency fix:

```bash
# 1. Force rebuild
cd organiser-platform/backend
./gradlew clean build -x test

# 2. Test locally first
docker build -t hikehub-test .
docker run -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=dev \
  -e PORT=8080 \
  hikehub-test

# 3. Test health endpoint
curl http://localhost:8080/actuator/health

# 4. If local works, redeploy to Render
git add -A
git commit -m "Force rebuild"
git push origin main
```

---

## Expected Render Logs (Success)

```
==> Cloning from https://github.com/...
==> Building with Docker...
==> Dockerfile detected
==> Building image...
==> Build completed successfully
==> Starting service...
==> Detected port 10000
==> Health check: Waiting for response at /actuator/health
==> Health check: ✓ Passed (200 OK)
==> Your service is live 🎉
==> https://hikehub-backend-kpkp.onrender.com
```

---

## Files Modified

1. ✅ `backend/src/main/resources/application-prod.properties`
   - Added `server.address=0.0.0.0`

2. ✅ `render.yaml`
   - Updated `FRONTEND_URL` to `https://www.outmeets.com`

---

## Next Steps

1. ✅ Commit changes
2. ✅ Push to GitHub
3. ⏳ Wait for Render auto-deploy (~5-10 minutes)
4. ✅ Check deployment logs
5. ✅ Test health endpoint
6. ✅ Test API endpoints
7. ✅ Update Netlify `VITE_API_URL` to Render URL

---

## Support Resources

- **Render Docs**: https://render.com/docs/web-services
- **Spring Boot on Render**: https://render.com/docs/deploy-spring-boot
- **Health Checks**: https://render.com/docs/health-checks
- **Render Community**: https://community.render.com

---

## Summary

✅ **Added**: `server.address=0.0.0.0` to bind to all interfaces
✅ **Updated**: Frontend URL to `www.outmeets.com`
✅ **Ready**: Deploy and monitor logs

The port binding fix should resolve the "no open ports detected" error! 🚀
