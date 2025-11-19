# Email Domain Fix - From hikehub-poc.netlify.app to www.outmeets.com

## Problem
Resend magic link emails were using the old domain `https://hikehub-poc.netlify.app` instead of the production domain `https://www.outmeets.com`

**Example of incorrect email link:**
```
https://hikehub-poc.netlify.app/auth/verify?token=3e13a685-2b73-4eeb-a0fe-ee2c56c455d2
```

**Correct email link should be:**
```
https://www.outmeets.com/auth/verify?token=3e13a685-2b73-4eeb-a0fe-ee2c56c455d2
```

---

## Root Cause

The `app.frontend-url` configuration in `application-prod.properties` had the old domain as its default fallback value:

```properties
# OLD (WRONG)
app.frontend-url=${FRONTEND_URL:https://hikehub-poc.netlify.app}

# NEW (FIXED)
app.frontend-url=${FRONTEND_URL:https://www.outmeets.com}
```

---

## What Was Fixed

### ✅ 1. Updated Production Config
**File**: `backend/src/main/resources/application-prod.properties`

```properties
# Email Configuration (Resend)
app.frontend-url=${FRONTEND_URL:https://www.outmeets.com}

# CORS
spring.web.cors.allowed-origins=${FRONTEND_URL:https://www.outmeets.com}
```

### ✅ 2. Added Development Config
**File**: `backend/src/main/resources/application-dev.properties`

```properties
# Frontend URL (for email magic links in development)
app.frontend-url=${FRONTEND_URL:http://localhost:5173}

# Email Configuration (Resend - for development)
resend.api-key=${RESEND_API_KEY:}
app.email.from=${EMAIL_FROM:onboarding@resend.dev}
```

### ✅ 3. CORS Already Configured
**File**: `SecurityConfig.java`

```java
configuration.setAllowedOrigins(Arrays.asList(
    // ... other origins ...
    "https://www.outmeets.com/"  // ✅ Already present
));
```

---

## How It Works

### Configuration Priority
```
1. Environment Variable: ${FRONTEND_URL}
   ↓ (if not set)
2. Fallback Default: https://www.outmeets.com
```

### Email Service Usage
```java
// EmailService.java
@Value("${app.frontend-url:http://localhost:3000}")
private String frontendUrl;

public void sendMagicLink(String email, String token) {
    String verificationUrl = frontendUrl + "/auth/verify?token=" + token;
    // Now uses: https://www.outmeets.com/auth/verify?token=...
}
```

---

## Testing

### 1. Development (Local)
```bash
# Backend should use: http://localhost:5173
# Test magic link email:
curl -X POST http://localhost:8080/api/v1/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Check console/logs for email link
# Should show: http://localhost:5173/auth/verify?token=...
```

### 2. Production (Railway/Render)
```bash
# After deployment, test:
curl -X POST https://your-api.railway.app/api/v1/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Check email received from Resend
# Should show: https://www.outmeets.com/auth/verify?token=...
```

---

## Deployment Instructions

### Option 1: Use Default (Recommended) ⭐
The code now has the correct default (`https://www.outmeets.com`), so you don't need to set any environment variables!

Just deploy and it will work automatically.

### Option 2: Set Environment Variable (Optional)
If you want explicit control, set this in Railway/Render:

**Railway:**
```bash
# Go to: Your Project > Variables
# Add:
FRONTEND_URL=https://www.outmeets.com
```

**Render:**
```bash
# Go to: Dashboard > Your Service > Environment
# Add:
FRONTEND_URL=https://www.outmeets.com
```

---

## Verification Checklist

After deployment, verify:

- [ ] Request a magic link to your email
- [ ] Check the email from Resend
- [ ] Verify link starts with `https://www.outmeets.com/auth/verify`
- [ ] Click the link and ensure it works
- [ ] Check user is logged in successfully

---

## Files Modified

1. ✅ `backend/src/main/resources/application-prod.properties`
   - Updated `app.frontend-url` default from `hikehub-poc.netlify.app` → `www.outmeets.com`
   - Updated `spring.web.cors.allowed-origins` default

2. ✅ `backend/src/main/resources/application-dev.properties`
   - Added `app.frontend-url` for development (`localhost:5173`)
   - Added email configuration for consistency

---

## Environment-Specific Behavior

| Environment | Profile | Frontend URL |
|-------------|---------|--------------|
| Local Development | `dev` | `http://localhost:5173` |
| Production (Railway) | `prod` | `https://www.outmeets.com` |
| Production (Render) | `prod` | `https://www.outmeets.com` |

---

## Rollback Plan

If you need to rollback to the old domain:

```properties
# In application-prod.properties
app.frontend-url=${FRONTEND_URL:https://hikehub-poc.netlify.app}
```

Or set environment variable:
```bash
FRONTEND_URL=https://hikehub-poc.netlify.app
```

---

## Related Configuration

### Netlify Frontend
Make sure your frontend is deployed to: `https://www.outmeets.com`

If using custom domain on Netlify:
1. Go to: Site Settings > Domain Management
2. Add custom domain: `www.outmeets.com`
3. Configure DNS (CNAME record)
4. SSL auto-provisioned by Netlify

### Resend Email Settings
- **From Address**: Configured via `app.email.from` (default: `onboarding@resend.dev`)
- **API Key**: Set via `RESEND_API_KEY` environment variable
- **Email Template**: Uses `frontendUrl` to generate magic link

---

## Next Steps

1. ✅ Commit these changes (already done in previous commit)
2. 🚀 Deploy to Railway/Render
3. ✅ Test magic link email
4. 🎉 Users receive correct links to `www.outmeets.com`

---

## Common Issues

### Issue: Still receiving old domain in emails
**Solution**: 
- Clear backend cache/restart backend service
- Verify `FRONTEND_URL` environment variable is not set to old domain
- Check Resend email logs

### Issue: CORS errors when clicking link
**Solution**: 
- `www.outmeets.com` is already in CORS allowed origins
- Ensure frontend is deployed to exact domain (with or without trailing slash)
- Check browser console for specific CORS error

### Issue: Development emails have wrong URL
**Solution**:
- Should use `http://localhost:5173` by default
- If wrong, check `application-dev.properties` is being loaded
- Verify `spring.profiles.active=dev` in development

---

## Summary

✅ **Fixed**: Default production URL now uses `www.outmeets.com`
✅ **Added**: Development configuration for local testing  
✅ **Verified**: CORS already supports `www.outmeets.com`
✅ **Ready**: Deploy and test!

Magic link emails will now use the correct domain for your production deployment! 🎉
