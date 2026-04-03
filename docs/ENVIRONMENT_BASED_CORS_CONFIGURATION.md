# Environment-Based CORS Configuration

## Overview

The CORS (Cross-Origin Resource Sharing) configuration is now environment-aware, ensuring that only the appropriate frontend origins are allowed based on the deployment environment.

## Configuration by Environment

### Local Development (`application.properties`)
**Active Profile:** `dev` (default)

**Allowed Origins:**
- `http://localhost:3000`
- `http://localhost:3002`
- `http://localhost:3003`
- `http://127.0.0.1:3002`
- `http://localhost:5173`
- `http://192.168.0.114:3000`

**Usage:** Automatically used when running locally without specifying a profile.

```bash
# Local development (uses dev profile by default)
./gradlew bootRun
```

---

### Staging Environment (`application-staging.properties`)
**Active Profile:** `staging`

**Allowed Origins:**
- `https://outmeet-stage.netlify.app`

**Usage:** Deploy to staging backend with `SPRING_PROFILES_ACTIVE=staging` environment variable.

```bash
# Railway/Render staging deployment
SPRING_PROFILES_ACTIVE=staging
```

---

### Production Environment (`application-prod.properties`)
**Active Profile:** `prod`

**Allowed Origins:**
- `https://hikehub-poc.netlify.app`
- `https://www.outmeets.com`

**Usage:** Deploy to production backend with `SPRING_PROFILES_ACTIVE=prod` environment variable.

```bash
# Railway/Render production deployment
SPRING_PROFILES_ACTIVE=prod
```

---

## How It Works

### 1. SecurityConfig.java
The `SecurityConfig` class now uses Spring's `@Value` annotation to inject allowed origins from properties files:

```java
@Value("${cors.allowed-origins}")
private String allowedOrigins;

@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    
    // Parse comma-separated origins from properties
    List<String> origins = Arrays.asList(allowedOrigins.split(","));
    configuration.setAllowedOrigins(origins);
    
    // ... rest of configuration
}
```

### 2. Properties Files
Each environment has its own `cors.allowed-origins` property:

**application.properties (dev):**
```properties
cors.allowed-origins=http://localhost:3000,http://localhost:3002,http://localhost:3003,http://127.0.0.1:3002,http://localhost:5173,http://192.168.0.114:3000
```

**application-staging.properties:**
```properties
cors.allowed-origins=https://outmeet-stage.netlify.app
```

**application-prod.properties:**
```properties
cors.allowed-origins=https://hikehub-poc.netlify.app,https://www.outmeets.com
```

---

## Git Branch Strategy

### Main Branch (Production)
**File:** `application-prod.properties`
```properties
cors.allowed-origins=https://hikehub-poc.netlify.app,https://www.outmeets.com
```

### Staging Branch
**File:** `application-staging.properties`
```properties
cors.allowed-origins=https://outmeet-stage.netlify.app
```

### Local Development
**File:** `application.properties`
```properties
cors.allowed-origins=http://localhost:3000,http://localhost:3002,http://localhost:3003,http://127.0.0.1:3002,http://localhost:5173,http://192.168.0.114:3000
```

---

## Deployment Instructions

### Railway/Render Production Deployment

1. **Set Environment Variable:**
   ```
   SPRING_PROFILES_ACTIVE=prod
   ```

2. **Deploy from main branch**
   - Backend will use `application-prod.properties`
   - Only `https://hikehub-poc.netlify.app` and `https://www.outmeets.com` allowed

### Railway/Render Staging Deployment

1. **Set Environment Variable:**
   ```
   SPRING_PROFILES_ACTIVE=staging
   DATABASE_URL=<your_render_postgres_url>
   ```

2. **Deploy from staging branch**
   - Backend will use `application-staging.properties`
   - Only `https://outmeet-stage.netlify.app` allowed
   - **Important:** `DatabaseConfig.java` handles URL conversion for both `prod` and `staging` profiles

### Local Development

1. **No environment variable needed** (defaults to `dev` profile)
2. **Run backend:**
   ```bash
   cd backend
   ./gradlew bootRun
   ```
3. All localhost origins allowed

---

## Security Improvements

### Before (Hardcoded)
```java
configuration.setAllowedOrigins(Arrays.asList(
    "http://localhost:3000",
    "http://localhost:3002",
    // ... all environments mixed together
    "https://www.outmeets.com",
    "https://outmeet-stage.netlify.app"
));
configuration.setAllowedHeaders(Arrays.asList("*")); // ⚠️ Too permissive
```

**Issues:**
- ❌ All origins allowed in all environments
- ❌ Staging URL in production
- ❌ Localhost URLs in production
- ❌ Wildcard headers (`*`)

### After (Environment-Based)
```java
@Value("${cors.allowed-origins}")
private String allowedOrigins;

List<String> origins = Arrays.asList(allowedOrigins.split(","));
configuration.setAllowedOrigins(origins);
configuration.setAllowedHeaders(Arrays.asList(
    "Authorization",
    "Content-Type",
    "Accept",
    "Origin",
    "X-Requested-With"
)); // ✅ Specific headers only
```

**Benefits:**
- ✅ Environment-specific origins
- ✅ No staging URLs in production
- ✅ No localhost in production
- ✅ Specific headers only (no wildcards)
- ✅ Easy to manage via properties files

---

## Testing

### Test Local Development
```bash
cd backend
./gradlew bootRun

# Should allow requests from:
# - http://localhost:5173 (Vite dev server)
# - http://localhost:3000 (alternative port)
```

### Test Staging
```bash
# Set profile to staging
export SPRING_PROFILES_ACTIVE=staging
./gradlew bootRun

# Should ONLY allow requests from:
# - https://outmeet-stage.netlify.app

# Should REJECT requests from:
# - http://localhost:5173
# - https://www.outmeets.com
```

### Test Production
```bash
# Set profile to prod
export SPRING_PROFILES_ACTIVE=prod
./gradlew bootRun

# Should ONLY allow requests from:
# - https://hikehub-poc.netlify.app
# - https://www.outmeets.com

# Should REJECT requests from:
# - http://localhost:5173
# - https://outmeet-stage.netlify.app
```

---

## Adding New Origins

### For Local Development
Edit `application.properties`:
```properties
cors.allowed-origins=http://localhost:3000,http://localhost:3002,http://localhost:3003,http://127.0.0.1:3002,http://localhost:5173,http://192.168.0.114:3000,http://localhost:8080
```

### For Staging
Edit `application-staging.properties`:
```properties
cors.allowed-origins=https://outmeet-stage.netlify.app,https://new-staging-url.netlify.app
```

### For Production
Edit `application-prod.properties`:
```properties
cors.allowed-origins=https://hikehub-poc.netlify.app,https://www.outmeets.com,https://new-production-url.com
```

---

## Troubleshooting

### CORS Error in Browser Console
```
Access to XMLHttpRequest at 'https://api.outmeets.com/api/v1/events' from origin 'https://wrong-domain.com' has been blocked by CORS policy
```

**Solution:**
1. Check which profile is active: `SPRING_PROFILES_ACTIVE`
2. Verify the origin is in the correct properties file
3. Restart backend after changing properties

### Wrong Origins Allowed
**Check active profile:**
```bash
# In backend logs, look for:
The following 1 profile is active: "prod"
```

**Verify environment variable:**
```bash
echo $SPRING_PROFILES_ACTIVE
```

### Localhost Not Working in Production
**This is expected!** Production should NOT allow localhost origins.

**Solution:** Use local development profile:
```bash
# Remove or change SPRING_PROFILES_ACTIVE
unset SPRING_PROFILES_ACTIVE
./gradlew bootRun
```

---

## Files Modified

1. **SecurityConfig.java**
   - Added `@Value("${cors.allowed-origins}")` injection
   - Removed hardcoded origins
   - Restricted allowed headers (removed wildcard)

2. **application.properties**
   - Added `cors.allowed-origins` for local development

3. **application-prod.properties**
   - Added `cors.allowed-origins` for production

4. **application-staging.properties** (NEW)
   - Created staging profile with staging-only origins

---

## Summary

✅ **Local Development:** All localhost ports allowed  
✅ **Staging:** Only `https://outmeet-stage.netlify.app` allowed  
✅ **Production:** Only `https://hikehub-poc.netlify.app` and `https://www.outmeets.com` allowed  
✅ **Security:** No wildcards, environment-specific origins  
✅ **Maintainability:** Easy to update via properties files  
✅ **Git Strategy:** Different configs per branch/environment  

**Status:** ✅ Complete - Ready for deployment
