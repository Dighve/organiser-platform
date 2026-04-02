# CORS Configuration Quick Reference

## Environment Variables for Deployment

### Production (Main Branch)
```bash
SPRING_PROFILES_ACTIVE=prod
```
**Allowed Origins:** `https://hikehub-poc.netlify.app`, `https://www.outmeets.com`

---

### Staging (Staging Branch)
```bash
SPRING_PROFILES_ACTIVE=staging
```
**Allowed Origin:** `https://outmeet-stage.netlify.app`

---

### Local Development
```bash
# No environment variable needed (defaults to dev)
```
**Allowed Origins:** All localhost ports (3000, 3002, 3003, 5173, etc.)

---

## Railway Deployment

### Production Service
1. Go to Railway project → Production service
2. **Variables** tab → Add:
   ```
   SPRING_PROFILES_ACTIVE=prod
   ```
3. Deploy from `main` branch

### Staging Service
1. Go to Railway project → Staging service
2. **Variables** tab → Add:
   ```
   SPRING_PROFILES_ACTIVE=staging
   ```
3. Deploy from `staging` branch

---

## Render Deployment

### Production Service
1. Go to Render dashboard → Production service
2. **Environment** tab → Add:
   ```
   SPRING_PROFILES_ACTIVE=prod
   ```
3. Deploy from `main` branch

### Staging Service
1. Go to Render dashboard → Staging service
2. **Environment** tab → Add:
   ```
   SPRING_PROFILES_ACTIVE=staging
   ```
3. Deploy from `staging` branch

---

## Verification

### Check Active Profile
Look for this in backend logs:
```
The following 1 profile is active: "prod"
```

### Check Allowed Origins
Backend will log CORS configuration on startup (if debugging enabled).

### Test CORS
```bash
# Production - should work
curl -H "Origin: https://www.outmeets.com" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS https://your-backend.com/api/v1/events

# Staging - should fail in production
curl -H "Origin: https://outmeet-stage.netlify.app" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS https://your-backend.com/api/v1/events
```

---

## Common Issues

| Issue | Solution |
|-------|----------|
| CORS error in production | Verify `SPRING_PROFILES_ACTIVE=prod` is set |
| Staging URL works in prod | Check environment variable, should be `prod` not `staging` |
| Localhost works in prod | **This is a problem!** Verify profile is `prod` |
| Nothing works | Check backend logs for active profile |

---

## Files to Check

- **Local:** `application.properties` → `cors.allowed-origins`
- **Staging:** `application-staging.properties` → `cors.allowed-origins`
- **Production:** `application-prod.properties` → `cors.allowed-origins`

---

## Quick Commands

```bash
# Local development
./gradlew bootRun

# Test with staging profile locally
SPRING_PROFILES_ACTIVE=staging ./gradlew bootRun

# Test with prod profile locally
SPRING_PROFILES_ACTIVE=prod ./gradlew bootRun
```

---

**Full Documentation:** See `ENVIRONMENT_BASED_CORS_CONFIGURATION.md`
