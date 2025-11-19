# Actuator Path Fix - Move to /api/v1/actuator

## Problem
Render was checking the wrong health check path. It was looking at `/actuator/health` but should check `/api/v1/actuator/health` to be consistent with all other API endpoints.

## Solution
Moved all actuator endpoints from `/actuator/*` to `/api/v1/actuator/*`

---

## Changes Made

### 1. ✅ Backend Configuration

#### application-prod.properties
```properties
# Actuator (for health checks)
management.endpoints.web.exposure.include=health,info
management.endpoint.health.show-details=when-authorized
management.endpoints.web.base-path=/api/v1/actuator  # ⬅️ NEW
management.server.port=${PORT:8080}                   # ⬅️ NEW
```

#### application.properties (base)
```properties
management.endpoints.web.base-path=/api/v1/actuator  # ⬅️ NEW
```

#### application-dev.properties
```properties
management.endpoints.web.base-path=/api/v1/actuator  # ⬅️ NEW
```

---

### 2. ✅ Render Configuration

#### render.yaml
```yaml
healthCheckPath: /api/v1/actuator/health  # ⬅️ Changed from /actuator/health
```

---

### 3. ✅ Docker Health Check

#### backend/Dockerfile
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8080}/api/v1/actuator/health || exit 1
```

---

## Endpoint Structure

### Before (Inconsistent)
```
/api/v1/auth/*          ✅ Under /api/v1
/api/v1/events/*        ✅ Under /api/v1
/api/v1/groups/*        ✅ Under /api/v1
/actuator/health        ❌ NOT under /api/v1
```

### After (Consistent) ✅
```
/api/v1/auth/*              ✅ Under /api/v1
/api/v1/events/*            ✅ Under /api/v1
/api/v1/groups/*            ✅ Under /api/v1
/api/v1/actuator/health     ✅ Under /api/v1
/api/v1/actuator/info       ✅ Under /api/v1
```

---

## Available Actuator Endpoints

### Health Check (Main)
```bash
GET https://your-backend.onrender.com/api/v1/actuator/health

# Response:
{
  "status": "UP",
  "groups": ["liveness", "readiness"]
}
```

### Detailed Health (Authenticated)
```bash
GET https://your-backend.onrender.com/api/v1/actuator/health?showDetails=true
Authorization: Bearer <your-jwt-token>

# Response includes:
{
  "status": "UP",
  "components": {
    "db": {"status": "UP"},
    "diskSpace": {"status": "UP"},
    "ping": {"status": "UP"}
  }
}
```

### Application Info
```bash
GET https://your-backend.onrender.com/api/v1/actuator/info

# Response (if configured):
{
  "app": {
    "name": "HikeHub",
    "version": "1.0.0"
  }
}
```

---

## Testing

### Local Development
```bash
# Start your backend
./gradlew bootRun

# Test health endpoint
curl http://localhost:8080/api/v1/actuator/health

# Expected:
{"status":"UP"}
```

### Production (Render)
```bash
# Test health endpoint
curl https://hikehub-backend-kpkp.onrender.com/api/v1/actuator/health

# Expected:
{"status":"UP"}
```

---

## Why This Matters

### 1. **Consistency** ✅
All API endpoints now follow the same pattern: `/api/v1/*`

### 2. **API Versioning** ✅
Easy to create v2 in the future: `/api/v2/actuator/health`

### 3. **Security** ✅
Can apply versioned security rules to all `/api/v1/*` endpoints

### 4. **Documentation** ✅
Swagger/OpenAPI can document all endpoints under one base path

### 5. **Load Balancer/Proxy** ✅
Easier to route all API traffic: `*.com/api/v1/*` → Backend

---

## Deployment Steps

### 1. Commit Changes
```bash
git add -A
git commit -m "Move actuator endpoints to /api/v1/actuator"
git push origin main
```

### 2. Render Auto-Deploy
Render will automatically detect the push and redeploy.

### 3. Verify Health Check
Watch Render logs for:
```
✅ Health check: Waiting for response at /api/v1/actuator/health
✅ Health check: ✓ Passed (200 OK)
```

### 4. Test Manually
```bash
curl https://hikehub-backend-kpkp.onrender.com/api/v1/actuator/health
```

---

## Troubleshooting

### Issue: 404 Not Found on /api/v1/actuator/health

**Possible causes:**
1. Application didn't restart with new config
2. Spring Boot version doesn't support `management.endpoints.web.base-path`

**Solution:**
```bash
# Check Spring Boot version in build.gradle
# Should be 2.6+ or 3.0+

# Force restart in Render dashboard
Dashboard → Your Service → Manual Deploy → Deploy Latest Commit
```

---

### Issue: Old path /actuator/health still works

**This is OK!** Spring Boot serves actuator endpoints at both:
- `/actuator/health` (default)
- `/api/v1/actuator/health` (with base-path config)

To ONLY serve at `/api/v1/actuator/health`, add:
```properties
# Disable default actuator path
management.endpoints.web.path-mapping.health=/health
server.servlet.context-path=/api/v1
```

But **this is not necessary** for Render deployment.

---

### Issue: Health check passes but Render still shows error

**Check these:**
1. Port binding: `server.address=0.0.0.0` ✅ (already added)
2. Port configuration: `server.port=${PORT:8080}` ✅ (already set)
3. Health endpoint accessible: `curl` test passes ✅
4. Render timeout: Default is 5 minutes (should be enough)

**If still failing:**
```bash
# Check Render logs for:
"Started Application in X seconds"
"Tomcat started on port(s): 10000"

# If these show, but health check fails:
# Manually test from Render shell (if available):
curl http://localhost:10000/api/v1/actuator/health
```

---

## Files Modified

1. ✅ `backend/src/main/resources/application-prod.properties`
   - Added `management.endpoints.web.base-path=/api/v1/actuator`
   - Added `management.server.port=${PORT:8080}`

2. ✅ `backend/src/main/resources/application.properties`
   - Added `management.endpoints.web.base-path=/api/v1/actuator`

3. ✅ `backend/src/main/resources/application-dev.properties`
   - Added `management.endpoints.web.base-path=/api/v1/actuator`

4. ✅ `render.yaml`
   - Changed `healthCheckPath` from `/actuator/health` to `/api/v1/actuator/health`

5. ✅ `backend/Dockerfile`
   - Updated HEALTHCHECK curl command to use `/api/v1/actuator/health`

---

## Benefits

### Clean API Structure ✅
```
/api/v1/
  ├── actuator/
  │   ├── health
  │   └── info
  ├── auth/
  │   ├── login
  │   └── magic-link
  ├── events/
  │   ├── {id}
  │   └── upcoming
  └── groups/
      ├── {id}
      └── public
```

### Easier Frontend Integration ✅
```javascript
// All endpoints share same base
const API_BASE = 'https://your-backend.onrender.com/api/v1'

// Auth endpoints
await axios.post(`${API_BASE}/auth/login`)

// Event endpoints
await axios.get(`${API_BASE}/events/upcoming`)

// Health check (for monitoring)
await axios.get(`${API_BASE}/actuator/health`)
```

### Better Monitoring ✅
```javascript
// Frontend health check
const checkBackendHealth = async () => {
  try {
    const response = await fetch(`${API_BASE}/actuator/health`)
    return response.ok && (await response.json()).status === 'UP'
  } catch {
    return false
  }
}
```

---

## Summary

✅ **Moved**: Actuator from `/actuator/*` to `/api/v1/actuator/*`
✅ **Updated**: Render health check path
✅ **Updated**: Docker health check
✅ **Consistent**: All APIs now under `/api/v1/*`
✅ **Ready**: Deploy and test!

Render will now check the correct path: `/api/v1/actuator/health` 🎉
