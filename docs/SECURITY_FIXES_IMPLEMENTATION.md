# 🔧 Security Fixes - Implementation Guide

**Priority:** URGENT - Implement before production deployment  
**Estimated Time:** 4-6 hours

---

## 🚨 Fix 1: Remove Secrets from build.gradle (30 minutes)

### Current Issue:
```groovy
// ❌ EXPOSED SECRETS
bootRun {
    environment(
        "CLOUDINARY_CLOUD_NAME": "drdttgry4",
        "CLOUDINARY_API_KEY": "478746114596374",
        "CLOUDINARY_API_SECRET": "wXiHJlL_64SuSpyTUc7ajf8KdV4"
    )
}
```

### Fix:

**Step 1: Update build.gradle**
```groovy
bootRun {
    environment(
        "CLOUDINARY_CLOUD_NAME": System.getenv("CLOUDINARY_CLOUD_NAME") ?: "demo",
        "CLOUDINARY_API_KEY": System.getenv("CLOUDINARY_API_KEY") ?: "demo_key",
        "CLOUDINARY_API_SECRET": System.getenv("CLOUDINARY_API_SECRET") ?: "demo_secret"
    )
}
```

**Step 2: Create .env.local file (NEVER commit)**
```bash
# backend/.env.local
CLOUDINARY_CLOUD_NAME=drdttgry4
CLOUDINARY_API_KEY=478746114596374
CLOUDINARY_API_SECRET=wXiHJlL_64SuSpyTUc7ajf8KdV4
```

**Step 3: Update .gitignore**
```gitignore
# Environment files
.env
.env.local
.env.*.local
*.env
```

**Step 4: Load environment variables**
```bash
# In your terminal before running
export CLOUDINARY_CLOUD_NAME=drdttgry4
export CLOUDINARY_API_KEY=478746114596374
export CLOUDINARY_API_SECRET=wXiHJlL_64SuSpyTUc7ajf8KdV4

# Or use direnv (recommended)
echo 'export CLOUDINARY_CLOUD_NAME=drdttgry4' >> .envrc
echo 'export CLOUDINARY_API_KEY=478746114596374' >> .envrc
echo 'export CLOUDINARY_API_SECRET=wXiHJlL_64SuSpyTUc7ajf8KdV4' >> .envrc
direnv allow
```

**Step 5: Rotate Cloudinary keys (IMPORTANT)**
Since the old keys were exposed in Git:
1. Go to Cloudinary Dashboard
2. Settings → Security → API Keys
3. Generate new API key/secret
4. Update your .env.local with new credentials
5. Update Railway environment variables

---

## 🔒 Fix 2: Restrict SecurityConfig Endpoints (1 hour)

### Current Issue:
```java
// ❌ TOO PERMISSIVE
.requestMatchers(
    new AntPathRequestMatcher("/api/v1/events/**"),  // Allows ALL event operations
    new AntPathRequestMatcher("/api/v1/files/**")    // Allows ALL file operations
).permitAll()
```

### Fix:

**File:** `backend/src/main/java/com/organiser/platform/config/SecurityConfig.java`

```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
        .csrf(AbstractHttpConfigurer::disable)
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .authorizeHttpRequests(auth -> auth
            // Public authentication endpoints
            .requestMatchers(
                new AntPathRequestMatcher("/api/v1/auth/**")
            ).permitAll()
            
            // Public read-only event endpoints
            .requestMatchers(
                new AntPathRequestMatcher("/api/v1/events/public/search", "GET"),
                new AntPathRequestMatcher("/api/v1/events/*/calendar", "GET"),
                new AntPathRequestMatcher("/api/v1/events/*", "GET")
            ).permitAll()
            
            // Public read-only group endpoints
            .requestMatchers(
                new AntPathRequestMatcher("/api/v1/groups/public", "GET"),
                new AntPathRequestMatcher("/api/v1/groups/*", "GET"),
                new AntPathRequestMatcher("/api/v1/groups/*/members", "GET")
            ).permitAll()
            
            // Public activity types
            .requestMatchers(
                new AntPathRequestMatcher("/api/v1/activities/**", "GET")
            ).permitAll()
            
            // Public comments (read-only)
            .requestMatchers(
                new AntPathRequestMatcher("/api/v1/events/*/comments", "GET")
            ).permitAll()
            
            // Health check endpoints
            .requestMatchers(
                new AntPathRequestMatcher("/actuator/health"),
                new AntPathRequestMatcher("/api/v1/actuator/health")
            ).permitAll()
            
            // Admin endpoints - require ADMIN role
            .requestMatchers(
                new AntPathRequestMatcher("/api/v1/admin/**")
            ).hasRole("ADMIN")
            
            // Organiser endpoints - require ORGANISER or ADMIN role
            .requestMatchers(
                new AntPathRequestMatcher("/api/v1/organiser/**")
            ).hasAnyRole("ORGANISER", "ADMIN")
            
            // File uploads - require authentication
            .requestMatchers(
                new AntPathRequestMatcher("/api/v1/files/**", "POST"),
                new AntPathRequestMatcher("/api/v1/files/**", "DELETE")
            ).authenticated()
            
            // Event write operations - require authentication
            .requestMatchers(
                new AntPathRequestMatcher("/api/v1/events", "POST"),
                new AntPathRequestMatcher("/api/v1/events/*", "PUT"),
                new AntPathRequestMatcher("/api/v1/events/*", "DELETE"),
                new AntPathRequestMatcher("/api/v1/events/*/join", "POST"),
                new AntPathRequestMatcher("/api/v1/events/*/leave", "POST")
            ).authenticated()
            
            // Group write operations - require authentication
            .requestMatchers(
                new AntPathRequestMatcher("/api/v1/groups", "POST"),
                new AntPathRequestMatcher("/api/v1/groups/*", "PUT"),
                new AntPathRequestMatcher("/api/v1/groups/*", "DELETE"),
                new AntPathRequestMatcher("/api/v1/groups/*/subscribe", "POST"),
                new AntPathRequestMatcher("/api/v1/groups/*/unsubscribe", "POST")
            ).authenticated()
            
            // Comment write operations - require authentication
            .requestMatchers(
                new AntPathRequestMatcher("/api/v1/events/*/comments", "POST"),
                new AntPathRequestMatcher("/api/v1/events/comments/*", "PUT"),
                new AntPathRequestMatcher("/api/v1/events/comments/*", "DELETE")
            ).authenticated()
            
            // All other requests require authentication
            .anyRequest().authenticated()
        )
        .sessionManagement(session -> session
            .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
        )
        .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
        .addFilterBefore(securityHeadersFilter, JwtAuthenticationFilter.class);
    
    return http.build();
}
```

**Key Changes:**
- ✅ Specific GET endpoints public (read-only)
- ✅ All POST/PUT/DELETE require authentication
- ✅ File uploads require authentication
- ✅ Clear separation of public vs protected

---

## 🔑 Fix 3: Generate Strong Production JWT Secret (15 minutes)

### Current Issue:
```properties
# ❌ Weak development secret
jwt.secret=${JWT_SECRET:dev-secret-key-minimum-32-characters-long-for-hs256-algorithm}
```

### Fix:

**Step 1: Generate strong secret**
```bash
# Generate 64-character random secret
openssl rand -base64 64 | tr -d '\n'

# Example output:
# kX9mP2vR8sT4wY6zA1bC3dE5fG7hJ9kL2mN4pQ6rS8tU0vW2xY4zA6bC8dE0fG2hJ4kL6mN8pQ0rS2tU4vW6xY8zA0bC2dE4fG6h
```

**Step 2: Update application.properties**
```properties
# Development - use a different secret than production
jwt.secret=${JWT_SECRET:dev-only-secret-never-use-in-production-kX9mP2vR8sT4wY6zA1bC3dE5fG7hJ9kL}
jwt.expiration=86400000
jwt.refresh-expiration=604800000
```

**Step 3: Set in Railway environment variables**
```bash
# Railway Dashboard → Variables
JWT_SECRET=<your-64-char-secret-from-step-1>
```

**Step 4: Set in local .env.local**
```bash
# backend/.env.local
JWT_SECRET=dev-only-secret-never-use-in-production-kX9mP2vR8sT4wY6zA1bC3dE5fG7hJ9kL
```

**Important:** Use DIFFERENT secrets for dev and production!

---

## 🌐 Fix 4: Restrict CORS Headers (30 minutes)

### Current Issue:
```java
// ❌ Allows ANY header
configuration.setAllowedHeaders(Arrays.asList("*"));
configuration.setExposedHeaders(Arrays.asList("*"));
```

### Fix:

**File:** `backend/src/main/java/com/organiser/platform/config/SecurityConfig.java`

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    
    // Allowed origins (specific domains only)
    configuration.setAllowedOrigins(Arrays.asList(
        "http://localhost:5173",           // Vite dev server
        "http://localhost:3000",           // Alternative dev port
        "https://www.outmeets.com",        // Production domain
        "https://outmeets.netlify.app"     // Netlify preview
    ));
    
    // Allowed HTTP methods
    configuration.setAllowedMethods(Arrays.asList(
        "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"
    ));
    
    // ✅ FIXED: Specific headers only
    configuration.setAllowedHeaders(Arrays.asList(
        "Authorization",
        "Content-Type",
        "Accept",
        "X-Requested-With",
        "Cache-Control"
    ));
    
    // ✅ FIXED: Expose only necessary headers
    configuration.setExposedHeaders(Arrays.asList(
        "Authorization",
        "Content-Type",
        "X-Total-Count"
    ));
    
    configuration.setAllowCredentials(true);
    configuration.setMaxAge(3600L);
    
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
}
```

**Key Changes:**
- ✅ Only specific headers allowed
- ✅ Only necessary headers exposed
- ✅ Specific origins (no wildcards)
- ✅ Removed debug logging

---

## ⏱️ Fix 5: Implement Rate Limiting (2-3 hours)

### Step 1: Add Bucket4j Dependency

**File:** `backend/build.gradle`

```groovy
dependencies {
    // ... existing dependencies ...
    
    // Rate limiting
    implementation 'com.bucket4j:bucket4j-core:8.7.0'
    implementation 'com.bucket4j:bucket4j-caffeine:8.7.0'
}
```

### Step 2: Create Rate Limiting Service

**File:** `backend/src/main/java/com/organiser/platform/service/RateLimitService.java`

```java
package com.organiser.platform.service;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class RateLimitService {
    
    private final Cache<String, Bucket> cache;
    
    public RateLimitService() {
        this.cache = Caffeine.newBuilder()
            .expireAfterWrite(1, TimeUnit.HOURS)
            .maximumSize(100_000)
            .build();
    }
    
    /**
     * Magic link rate limit: 5 requests per hour per IP+email
     */
    public Bucket resolveMagicLinkBucket(String key) {
        return cache.get(key, k -> createMagicLinkBucket());
    }
    
    private Bucket createMagicLinkBucket() {
        Bandwidth limit = Bandwidth.classic(5, Refill.intervally(5, Duration.ofHours(1)));
        return Bucket.builder()
            .addLimit(limit)
            .build();
    }
    
    /**
     * Google OAuth rate limit: 10 requests per minute per IP
     */
    public Bucket resolveOAuthBucket(String key) {
        return cache.get(key, k -> createOAuthBucket());
    }
    
    private Bucket createOAuthBucket() {
        Bandwidth limit = Bandwidth.classic(10, Refill.intervally(10, Duration.ofMinutes(1)));
        return Bucket.builder()
            .addLimit(limit)
            .build();
    }
    
    /**
     * File upload rate limit: 20 requests per hour per user
     */
    public Bucket resolveFileUploadBucket(String key) {
        return cache.get(key, k -> createFileUploadBucket());
    }
    
    private Bucket createFileUploadBucket() {
        Bandwidth limit = Bandwidth.classic(20, Refill.intervally(20, Duration.ofHours(1)));
        return Bucket.builder()
            .addLimit(limit)
            .build();
    }
    
    /**
     * General API rate limit: 100 requests per minute per IP
     */
    public Bucket resolveGeneralApiBucket(String key) {
        return cache.get(key, k -> createGeneralApiBucket());
    }
    
    private Bucket createGeneralApiBucket() {
        Bandwidth limit = Bandwidth.classic(100, Refill.intervally(100, Duration.ofMinutes(1)));
        return Bucket.builder()
            .addLimit(limit)
            .build();
    }
    
    /**
     * Check if request is allowed
     */
    public boolean tryConsume(Bucket bucket) {
        return bucket.tryConsume(1);
    }
    
    /**
     * Get available tokens (for debugging)
     */
    public long getAvailableTokens(Bucket bucket) {
        return bucket.getAvailableTokens();
    }
}
```

### Step 3: Create Rate Limit Exception

**File:** `backend/src/main/java/com/organiser/platform/exception/RateLimitExceededException.java`

```java
package com.organiser.platform.exception;

public class RateLimitExceededException extends RuntimeException {
    public RateLimitExceededException(String message) {
        super(message);
    }
}
```

### Step 4: Update Global Exception Handler

**File:** `backend/src/main/java/com/organiser/platform/exception/GlobalExceptionHandler.java`

```java
@ExceptionHandler(RateLimitExceededException.class)
public ResponseEntity<ErrorResponse> handleRateLimitExceeded(RateLimitExceededException ex) {
    ErrorResponse error = new ErrorResponse(
        HttpStatus.TOO_MANY_REQUESTS.value(),
        ex.getMessage(),
        LocalDateTime.now()
    );
    return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(error);
}
```

### Step 5: Apply Rate Limiting to AuthController

**File:** `backend/src/main/java/com/organiser/platform/controller/AuthController.java`

```java
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {
    
    private final AuthService authService;
    private final GoogleOAuth2Service googleOAuth2Service;
    private final RateLimitService rateLimitService;
    
    @PostMapping("/magic-link")
    public ResponseEntity<Map<String, String>> requestMagicLink(
            @Valid @RequestBody MagicLinkRequest request,
            HttpServletRequest httpRequest) {
        
        // Rate limiting: 5 requests per hour per IP+email
        String clientIp = getClientIp(httpRequest);
        String rateLimitKey = clientIp + ":" + request.getEmail();
        Bucket bucket = rateLimitService.resolveMagicLinkBucket(rateLimitKey);
        
        if (!rateLimitService.tryConsume(bucket)) {
            throw new RateLimitExceededException(
                "Too many magic link requests. Please try again in 1 hour."
            );
        }
        
        authService.requestMagicLink(request);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Magic link sent to your email");
        response.put("email", request.getEmail());
        
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/google")
    public ResponseEntity<AuthResponse> authenticateWithGoogle(
            @Valid @RequestBody GoogleAuthRequest request,
            HttpServletRequest httpRequest) {
        
        // Rate limiting: 10 requests per minute per IP
        String clientIp = getClientIp(httpRequest);
        Bucket bucket = rateLimitService.resolveOAuthBucket(clientIp);
        
        if (!rateLimitService.tryConsume(bucket)) {
            throw new RateLimitExceededException(
                "Too many authentication attempts. Please try again in 1 minute."
            );
        }
        
        return ResponseEntity.ok(googleOAuth2Service.authenticateWithGoogle(request));
    }
    
    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
```

### Step 6: Apply Rate Limiting to FileUploadController

**File:** `backend/src/main/java/com/organiser/platform/controller/FileUploadController.java`

```java
@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
public class FileUploadController {
    
    private final FileUploadService fileUploadService;
    private final RateLimitService rateLimitService;
    
    @PostMapping("/upload/event-photo")
    public ResponseEntity<Map<String, String>> uploadEventPhoto(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        
        // Rate limiting: 20 uploads per hour per user
        String userEmail = authentication.getName();
        Bucket bucket = rateLimitService.resolveFileUploadBucket(userEmail);
        
        if (!rateLimitService.tryConsume(bucket)) {
            throw new RateLimitExceededException(
                "Upload limit exceeded. Please try again in 1 hour."
            );
        }
        
        String imageUrl = fileUploadService.uploadFile(file, "event-photo");
        return ResponseEntity.ok(Map.of("imageUrl", imageUrl));
    }
    
    // Apply same pattern to other upload endpoints...
}
```

---

## 🚫 Fix 6: Implement Token Blacklisting (1-2 hours)

### Step 1: Create Token Blacklist Service

**File:** `backend/src/main/java/com/organiser/platform/service/TokenBlacklistService.java`

```java
package com.organiser.platform.service;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class TokenBlacklistService {
    
    private final Cache<String, Boolean> blacklist;
    
    public TokenBlacklistService() {
        this.blacklist = Caffeine.newBuilder()
            .expireAfterWrite(24, TimeUnit.HOURS)  // Match JWT expiration
            .maximumSize(10_000)
            .build();
    }
    
    /**
     * Add token to blacklist
     */
    public void blacklistToken(String token) {
        blacklist.put(token, true);
        log.info("Token blacklisted: {}", token.substring(0, 20) + "...");
    }
    
    /**
     * Check if token is blacklisted
     */
    public boolean isBlacklisted(String token) {
        return blacklist.getIfPresent(token) != null;
    }
    
    /**
     * Remove token from blacklist (for testing)
     */
    public void removeFromBlacklist(String token) {
        blacklist.invalidate(token);
    }
    
    /**
     * Clear all blacklisted tokens (for testing)
     */
    public void clearBlacklist() {
        blacklist.invalidateAll();
    }
}
```

### Step 2: Update JwtAuthenticationFilter

**File:** `backend/src/main/java/com/organiser/platform/security/JwtAuthenticationFilter.java`

```java
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;
    private final TokenBlacklistService tokenBlacklistService;  // ✅ Add this
    
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        
        final String authHeader = request.getHeader("Authorization");
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }
        
        final String jwt = authHeader.substring(7);
        
        // ✅ Check if token is blacklisted
        if (tokenBlacklistService.isBlacklisted(jwt)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("Token has been revoked");
            return;
        }
        
        final String userEmail = jwtUtil.extractUsername(jwt);
        
        if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = userDetailsService.loadUserByUsername(userEmail);
            
            if (jwtUtil.validateToken(jwt, userDetails)) {
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                    userDetails,
                    null,
                    userDetails.getAuthorities()
                );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }
        
        filterChain.doFilter(request, response);
    }
}
```

### Step 3: Add Logout Endpoint

**File:** `backend/src/main/java/com/organiser/platform/controller/AuthController.java`

```java
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {
    
    private final AuthService authService;
    private final GoogleOAuth2Service googleOAuth2Service;
    private final RateLimitService rateLimitService;
    private final TokenBlacklistService tokenBlacklistService;  // ✅ Add this
    
    // ... existing endpoints ...
    
    /**
     * Logout - blacklist the current JWT token
     */
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String jwt = authHeader.substring(7);
            tokenBlacklistService.blacklistToken(jwt);
        }
        
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }
}
```

### Step 4: Update Frontend to Call Logout

**File:** `frontend/src/lib/api.js`

```javascript
// Add to authAPI
export const authAPI = {
  // ... existing methods ...
  
  logout: async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await api.post('/auth/logout');
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};
```

**File:** `frontend/src/stores/authStore.js`

```javascript
// Update logout method
logout: async () => {
  await authAPI.logout();  // ✅ Call backend to blacklist token
  set({ user: null, token: null, isAuthenticated: false });
},
```

---

## 📊 Testing the Fixes

### Test 1: Verify Secrets Removed
```bash
# Should NOT find any secrets
git grep "wXiHJlL_64SuSpyTUc7ajf8KdV4"
git grep "478746114596374"

# Should return empty
```

### Test 2: Test Rate Limiting
```bash
# Send 6 magic link requests (should fail on 6th)
for i in {1..6}; do
  curl -X POST http://localhost:8080/api/v1/auth/magic-link \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com"}'
  echo "\nRequest $i"
done

# Expected: First 5 succeed, 6th returns 429 Too Many Requests
```

### Test 3: Test Token Blacklisting
```bash
# 1. Login and get token
TOKEN=$(curl -X POST http://localhost:8080/api/v1/auth/google \
  -H "Content-Type: application/json" \
  -d '{"idToken":"..."}' | jq -r '.token')

# 2. Use token (should work)
curl http://localhost:8080/api/v1/members/me \
  -H "Authorization: Bearer $TOKEN"

# 3. Logout
curl -X POST http://localhost:8080/api/v1/auth/logout \
  -H "Authorization: Bearer $TOKEN"

# 4. Try using token again (should fail)
curl http://localhost:8080/api/v1/members/me \
  -H "Authorization: Bearer $TOKEN"

# Expected: 401 Unauthorized "Token has been revoked"
```

### Test 4: Test SecurityConfig Restrictions
```bash
# Should FAIL (no auth)
curl -X POST http://localhost:8080/api/v1/files/upload/event-photo \
  -F "file=@test.jpg"

# Should FAIL (no auth)
curl -X POST http://localhost:8080/api/v1/events \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Event"}'

# Should SUCCEED (public read)
curl http://localhost:8080/api/v1/events/1
```

---

## ✅ Deployment Checklist

Before deploying to Railway:

- [ ] Secrets removed from build.gradle
- [ ] .env.local added to .gitignore
- [ ] Strong JWT secret generated
- [ ] SecurityConfig endpoints restricted
- [ ] CORS headers restricted
- [ ] Rate limiting implemented
- [ ] Token blacklisting implemented
- [ ] All tests passing
- [ ] Environment variables set in Railway:
  - [ ] JWT_SECRET (64+ chars)
  - [ ] CLOUDINARY_CLOUD_NAME
  - [ ] CLOUDINARY_API_KEY
  - [ ] CLOUDINARY_API_SECRET (rotated)
  - [ ] GOOGLE_CLIENT_ID
  - [ ] GOOGLE_CLIENT_SECRET
  - [ ] DATABASE_URL
  - [ ] FRONTEND_URL

---

## 🎯 Next Steps

After implementing these fixes:

1. **Week 1:** Deploy to Railway and test in production
2. **Week 2:** Implement MEDIUM priority fixes (file validation, input sanitization)
3. **Week 3:** Add security logging and monitoring
4. **Week 4:** Penetration testing and security audit

**Estimated Total Time:** 4-6 hours for all URGENT fixes

Need help with any specific implementation? Let me know!
