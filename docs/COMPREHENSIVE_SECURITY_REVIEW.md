# 🔒 Comprehensive Security Review - OutMeets Platform

**Review Date:** December 8, 2025  
**Platform:** OutMeets (Hiking Events & Groups)  
**Tech Stack:** Spring Boot 3.1.5 + React + PostgreSQL

---

## 📊 Executive Summary

### Overall Security Score: **6.5/10** (Production-Ready with Improvements Needed)

**Status:** ✅ Core security implemented, but needs hardening before production deployment.

**Critical Issues:** 2 High Priority, 3 Medium Priority  
**Timeline to Production-Ready:** 2-3 days of focused work

---

## 🎯 Security Review Categories

### 1. ✅ **SecurityConfig.java Exposure Analysis**

#### Current State:
```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    // JWT-based stateless authentication
    // CORS configured for multiple origins
    // Public endpoints: /api/v1/auth/**, /api/v1/events/**, etc.
}
```

#### ✅ Strengths:
- **CSRF disabled** (correct for stateless JWT API)
- **Stateless sessions** (SessionCreationPolicy.STATELESS)
- **Method-level security** enabled (@EnableMethodSecurity)
- **Role-based access** (ADMIN, ORGANISER roles)
- **Security headers filter** implemented (SecurityHeadersFilter.java)

#### 🚨 Issues Found:

##### **HIGH RISK: Overly Permissive Public Endpoints**
```java
.requestMatchers(
    new AntPathRequestMatcher("/api/v1/events/**"),  // ❌ TOO BROAD
    new AntPathRequestMatcher("/api/v1/files/**"),   // ❌ TOO BROAD
    new AntPathRequestMatcher("/api/v1/groups/*")    // ❌ TOO BROAD
).permitAll()
```

**Problem:** These wildcards expose ALL event, file, and group endpoints publicly, including:
- File uploads (should require auth)
- Event creation/editing (should require auth)
- Group management (should require auth)

**Impact:** Unauthenticated users can potentially access protected operations.

##### **MEDIUM RISK: Overly Permissive CORS**
```java
configuration.setAllowedHeaders(Arrays.asList("*"));  // ❌ Allows ANY header
configuration.setExposedHeaders(Arrays.asList("*"));  // ❌ Exposes ALL headers
```

**Problem:** Should restrict to specific headers needed by application.

##### **LOW RISK: Debug Logging in Production**
```java
System.out.println("CORS Configuration:");  // ❌ Should use logger
```

#### ✅ Good Practices Found:
- SecurityHeadersFilter with CSP, X-Frame-Options, HSTS
- Specific CORS origins (not wildcard)
- Actuator endpoints properly exposed

---

### 2. 🚨 **Rate Limiting - MISSING (HIGH PRIORITY)**

#### Current State: **NOT IMPLEMENTED**

#### Impact:
- **Magic link abuse:** Attackers can spam email addresses
- **API abuse:** No protection against brute force attacks
- **DDoS vulnerability:** No request throttling
- **Email bombing:** Can overwhelm email service (Resend)

#### Recommended Implementation:

**Option A: Bucket4j (Recommended)**
```java
// Add dependency
implementation 'com.bucket4j:bucket4j-core:8.7.0'

// Rate limit magic link endpoint
@PostMapping("/magic-link")
@RateLimit(capacity = 5, refillTokens = 5, refillDuration = 1, unit = TimeUnit.HOURS)
public ResponseEntity<?> requestMagicLink(@RequestBody MagicLinkRequest request) {
    // 5 requests per hour per IP
}
```

**Option B: Spring Cloud Gateway (For microservices)**

**Option C: Nginx/Cloudflare (Infrastructure level)**

#### Recommended Limits:
| Endpoint | Limit | Window | Scope |
|----------|-------|--------|-------|
| `/auth/magic-link` | 5 requests | 1 hour | Per IP + Email |
| `/auth/google` | 10 requests | 1 minute | Per IP |
| `/auth/verify` | 10 requests | 5 minutes | Per IP |
| `/files/upload/*` | 20 requests | 1 hour | Per User |
| `/events` (POST) | 10 requests | 1 hour | Per User |
| `/groups` (POST) | 5 requests | 1 hour | Per User |
| Global API | 100 requests | 1 minute | Per IP |

---

### 3. 🔑 **Client ID & Secret Management**

#### Current State:

**Development (application.properties):**
```properties
# ❌ EXPOSED IN CODE
jwt.secret=${JWT_SECRET:dev-secret-key-minimum-32-characters-long-for-hs256-algorithm}
cloudinary.api-secret=${CLOUDINARY_API_SECRET:your_api_secret}
spring.security.oauth2.client.registration.google.client-secret=${GOOGLE_CLIENT_SECRET:your_google_client_secret}
```

**Production (application-prod.properties):**
```properties
# ✅ GOOD - Uses environment variables
jwt.secret=${JWT_SECRET}
cloudinary.api-secret=${CLOUDINARY_API_SECRET}
```

**build.gradle:**
```groovy
// ❌ CRITICAL: SECRETS HARDCODED IN BUILD FILE
bootRun {
    environment(
        "CLOUDINARY_CLOUD_NAME": "drdttgry4",
        "CLOUDINARY_API_KEY": "478746114596374",
        "CLOUDINARY_API_SECRET": "wXiHJlL_64SuSpyTUc7ajf8KdV4"  // ❌ EXPOSED!
    )
}
```

#### 🚨 Critical Issues:

##### **URGENT: Cloudinary Secrets Exposed in Git**
- **File:** `build.gradle` lines 124-127
- **Risk:** Anyone with repo access has full Cloudinary access
- **Impact:** Can delete/modify all uploaded images, incur costs

##### **HIGH: Weak Development JWT Secret**
- **Current:** "dev-secret-key-minimum-32-characters-long-for-hs256-algorithm"
- **Risk:** Predictable, may be used in production accidentally

##### **MEDIUM: No Secret Rotation Strategy**
- JWT secrets never expire
- No mechanism to invalidate old tokens
- Compromised secrets = full system compromise

#### ✅ Recommendations:

##### **Immediate Actions:**
1. **Remove secrets from build.gradle:**
```groovy
bootRun {
    environment(
        "CLOUDINARY_CLOUD_NAME": System.getenv("CLOUDINARY_CLOUD_NAME") ?: "demo",
        "CLOUDINARY_API_KEY": System.getenv("CLOUDINARY_API_KEY") ?: "demo_key",
        "CLOUDINARY_API_SECRET": System.getenv("CLOUDINARY_API_SECRET") ?: "demo_secret"
    )
}
```

2. **Generate strong production JWT secret:**
```bash
# Generate 64-character random secret
openssl rand -base64 64 | tr -d '\n'
# Example: kX9mP2vR8sT4wY6zA1bC3dE5fG7hJ9kL2mN4pQ6rS8tU0vW2xY4zA6bC8dE0fG2h
```

3. **Use environment variables everywhere:**
```bash
# .env.local (NEVER commit)
JWT_SECRET=your-strong-64-char-secret
CLOUDINARY_API_SECRET=your-cloudinary-secret
GOOGLE_CLIENT_SECRET=your-google-secret
```

4. **Add .env.local to .gitignore:**
```gitignore
.env.local
.env.*.local
```

##### **Long-term Solutions:**
- **AWS Secrets Manager** or **HashiCorp Vault** for production
- **Secret rotation** every 90 days
- **Separate secrets** per environment (dev/staging/prod)
- **Audit logging** for secret access

---

### 4. 👥 **Role-Based Access Control (RBAC) Review**

#### Current Implementation:

**Member.java:**
```java
@Column(name = "is_organiser", nullable = false)
private Boolean isOrganiser = false;  // Simple boolean flag
```

**SecurityConfig.java:**
```java
.requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
.requestMatchers("/api/v1/organiser/**").hasAnyRole("ORGANISER", "ADMIN")
```

#### ✅ Current Roles:
1. **MEMBER** (default) - Can join groups/events, comment
2. **ORGANISER** - Can create groups/events (isOrganiser = true)
3. **ADMIN** - Full system access

#### 🤔 Should You Add More Roles?

**Answer: NO - Current structure is sufficient for MVP/Production**

#### Why Current Structure Works:

##### **1. Simplicity = Security**
- Fewer roles = fewer permission bugs
- Easy to understand and maintain
- Matches Meetup.com model (Member vs Organiser)

##### **2. Context-Based Permissions**
Your app uses **resource-based authorization**, not just role-based:
```java
// GroupService.java
public void updateGroup(Long groupId, CreateGroupRequest request, Long userId) {
    Group group = groupRepository.findById(groupId)...;
    if (!group.getOrganiser().getId().equals(userId)) {
        throw new UnauthorizedException("Only organiser can update");
    }
}
```

This is **BETTER** than adding a "GROUP_ADMIN" role because:
- Permissions are per-group, not global
- User can be organiser of Group A but member of Group B
- More flexible and secure

##### **3. Event Host is Already Handled**
```java
// Event.java
@ManyToOne
@JoinColumn(name = "host_id")
private Member host;  // ✅ Already tracks who's hosting
```

No need for "HOST" role - it's a relationship, not a permission level.

#### ❌ When You WOULD Need More Roles:

You'd need additional roles if you had:
- **Moderators** - Can delete comments, ban users (you don't have this)
- **Premium Members** - Pay for extra features (you don't have this)
- **Co-Organisers** - Multiple organisers per group (you don't have this)
- **Regional Admins** - Admins for specific locations (you don't have this)

#### ✅ Recommendation: **Keep Current Structure**

**But improve authorization checks:**

```java
// Add to GroupService.java
public boolean isGroupOrganiser(Long userId, Long groupId) {
    Group group = groupRepository.findById(groupId)...;
    return group.getOrganiser().getId().equals(userId);
}

// Add to EventService.java  
public boolean isEventHost(Long userId, Long eventId) {
    Event event = eventRepository.findById(eventId)...;
    return event.getHost().getId().equals(userId);
}

// Use @PreAuthorize annotations
@PreAuthorize("@groupService.isGroupOrganiser(authentication.principal.id, #groupId)")
@PutMapping("/groups/{groupId}")
public ResponseEntity<GroupDTO> updateGroup(@PathVariable Long groupId, ...) {
    // Only group organiser can access
}
```

#### Future Enhancement (Phase 2):
If you add **co-organisers** feature, consider:
```java
@Entity
public class GroupRole {
    @ManyToOne
    private Group group;
    
    @ManyToOne
    private Member member;
    
    @Enumerated(EnumType.STRING)
    private RoleType roleType;  // ORGANISER, CO_ORGANISER, MODERATOR
}
```

But **NOT needed now**.

---

### 5. 🛡️ **Additional Security Checks**

#### A. JWT Token Security

**Current Implementation:**
```java
// JwtUtil.java
jwt.expiration=86400000  // 24 hours ✅
jwt.refresh-expiration=604800000  // 7 days ✅
```

##### ✅ Good:
- Reasonable expiration times
- HS256 signing algorithm (secure for single-server)
- Token validation checks expiration

##### 🚨 Issues:
1. **No token blacklisting** - Logout doesn't invalidate tokens
2. **No refresh token rotation** - Refresh tokens never change
3. **No token revocation** - Can't force logout compromised accounts

##### Recommendations:

**Option 1: Token Blacklist (Simple)**
```java
@Service
public class TokenBlacklistService {
    private final Cache<String, Boolean> blacklist = Caffeine.newBuilder()
        .expireAfterWrite(24, TimeUnit.HOURS)
        .maximumSize(10_000)
        .build();
    
    public void blacklistToken(String token) {
        blacklist.put(token, true);
    }
    
    public boolean isBlacklisted(String token) {
        return blacklist.getIfPresent(token) != null;
    }
}
```

**Option 2: Redis-based (Scalable)**
```java
// Use Redis for distributed token blacklist
@Autowired
private RedisTemplate<String, String> redisTemplate;

public void blacklistToken(String token, long expirationMs) {
    redisTemplate.opsForValue().set(
        "blacklist:" + token, 
        "true", 
        expirationMs, 
        TimeUnit.MILLISECONDS
    );
}
```

---

#### B. Input Validation

**Current State:**
```java
@Valid @RequestBody MagicLinkRequest request  // ✅ Using Spring Validation
```

##### ✅ Good:
- `@Valid` annotations used
- Email format validation
- Max length constraints

##### 🚨 Missing:
1. **No SQL injection tests** (JPA protects, but should verify)
2. **No XSS sanitization** (React escapes, but backend should too)
3. **No file upload content validation** (relies on Cloudinary)

##### Recommendations:

**Add input sanitization:**
```java
@Service
public class InputSanitizationService {
    private final PolicyFactory policy = Sanitizers.FORMATTING.and(Sanitizers.LINKS);
    
    public String sanitizeHtml(String input) {
        return policy.sanitize(input);
    }
}

// Use in controllers
@PostMapping("/events")
public ResponseEntity<EventDTO> createEvent(@Valid @RequestBody CreateEventRequest request) {
    request.setDescription(sanitizationService.sanitizeHtml(request.getDescription()));
    // ...
}
```

---

#### C. File Upload Security

**Current Implementation:**
```java
spring.servlet.multipart.max-file-size=10MB  // ✅
spring.servlet.multipart.max-request-size=10MB  // ✅
```

##### ✅ Good:
- Size limits enforced
- Cloudinary handles malicious files
- UUID-based filenames (no path traversal)

##### 🚨 Missing:
1. **No MIME type validation** beyond extension
2. **No virus scanning** (Cloudinary does basic checks)
3. **No rate limiting** on uploads

##### Recommendations:

**Add file validation:**
```java
@Service
public class FileValidationService {
    private static final List<String> ALLOWED_TYPES = Arrays.asList(
        "image/jpeg", "image/png", "image/gif", "image/webp"
    );
    
    public void validateFile(MultipartFile file) {
        // Check MIME type
        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            throw new InvalidFileTypeException("Only images allowed");
        }
        
        // Check magic bytes (prevents MIME spoofing)
        byte[] bytes = file.getBytes();
        if (!isValidImageMagicBytes(bytes)) {
            throw new InvalidFileException("File is not a valid image");
        }
    }
    
    private boolean isValidImageMagicBytes(byte[] bytes) {
        // Check for JPEG: FF D8 FF
        // Check for PNG: 89 50 4E 47
        // Check for GIF: 47 49 46 38
        // Check for WebP: 52 49 46 46
        // Implementation...
    }
}
```

---

#### D. Database Security

**Current State:**
```java
spring.jpa.hibernate.ddl-auto=validate  // ✅ Safe for production
spring.datasource.hikari.maximum-pool-size=5  // ✅ Reasonable
```

##### ✅ Good:
- JPA prevents SQL injection
- Connection pooling configured
- Flyway migrations for schema control

##### 🚨 Missing:
1. **No database connection encryption** (SSL/TLS)
2. **No query timeout limits**
3. **No prepared statement caching**

##### Recommendations:

**Add connection encryption:**
```properties
# application-prod.properties
spring.datasource.url=${DATABASE_URL}?sslmode=require&sslrootcert=/path/to/cert.pem
spring.jpa.properties.hibernate.connection.provider_disables_autocommit=true
spring.jpa.properties.hibernate.query.plan_cache_max_size=2048
spring.jpa.properties.hibernate.query.plan_parameter_metadata_max_size=128
```

---

#### E. Logging & Monitoring

**Current State:**
```java
logging.level.root=INFO  // ✅
management.endpoints.web.exposure.include=health,info,metrics  // ✅
```

##### ✅ Good:
- Actuator health checks enabled
- Reasonable log levels

##### 🚨 Missing:
1. **No security event logging** (failed logins, permission denials)
2. **No audit trail** (who did what, when)
3. **No anomaly detection** (unusual activity patterns)

##### Recommendations:

**Add security logging:**
```java
@Aspect
@Component
public class SecurityAuditAspect {
    private static final Logger logger = LoggerFactory.getLogger("SECURITY_AUDIT");
    
    @AfterThrowing(pointcut = "execution(* com.organiser.platform..*(..))", throwing = "ex")
    public void logSecurityException(JoinPoint joinPoint, Exception ex) {
        if (ex instanceof UnauthorizedException || ex instanceof AccessDeniedException) {
            logger.warn("Security violation: {} - Method: {} - User: {}", 
                ex.getMessage(), 
                joinPoint.getSignature(), 
                SecurityContextHolder.getContext().getAuthentication().getName()
            );
        }
    }
    
    @Around("@annotation(org.springframework.web.bind.annotation.PostMapping)")
    public Object logDataModification(ProceedingJoinPoint joinPoint) throws Throwable {
        String user = SecurityContextHolder.getContext().getAuthentication().getName();
        logger.info("Data modification by: {} - Method: {}", user, joinPoint.getSignature());
        return joinPoint.proceed();
    }
}
```

---

#### F. Google OAuth Security

**Current Implementation:**
```java
@PostMapping("/google")
public ResponseEntity<AuthResponse> authenticateWithGoogle(
    @Valid @RequestBody GoogleAuthRequest request) {
    return ResponseEntity.ok(googleOAuth2Service.authenticateWithGoogle(request));
}
```

##### ✅ Good:
- Uses official Google API client
- Verifies ID token signature
- Checks email verified flag

##### 🚨 Missing:
1. **No rate limiting** on OAuth endpoint
2. **No CSRF protection** for OAuth flow
3. **Client secret in environment variables** (good) but no rotation

##### Recommendations:

**Add OAuth state parameter:**
```java
// Generate random state for CSRF protection
String state = UUID.randomUUID().toString();
session.setAttribute("oauth_state", state);

// Verify state on callback
if (!request.getState().equals(session.getAttribute("oauth_state"))) {
    throw new InvalidStateException("CSRF token mismatch");
}
```

---

## 📋 Priority Action Plan

### 🚨 URGENT (Before Production - 1 Day)

1. **Remove secrets from build.gradle** ✅ Critical
   - Move to environment variables
   - Rotate Cloudinary keys
   - Add to .gitignore

2. **Fix SecurityConfig public endpoints** ✅ Critical
   - Restrict `/api/v1/files/**` to authenticated users
   - Restrict `/api/v1/events` POST/PUT/DELETE to authenticated users
   - Keep only GET endpoints public

3. **Generate strong production JWT secret** ✅ Critical
   - Use `openssl rand -base64 64`
   - Store in Railway/Netlify environment variables

4. **Restrict CORS headers** ✅ High
   - Change from `"*"` to specific headers
   - `["Authorization", "Content-Type", "Accept"]`

### 🔥 HIGH PRIORITY (Week 1 - 2 Days)

5. **Implement rate limiting** ✅ High
   - Add Bucket4j dependency
   - Limit magic link endpoint (5/hour per IP+email)
   - Limit file uploads (20/hour per user)

6. **Add token blacklisting** ✅ High
   - Implement in-memory cache (Caffeine)
   - Add logout endpoint that blacklists token
   - Check blacklist in JwtAuthenticationFilter

7. **Add security logging** ✅ High
   - Log failed authentication attempts
   - Log permission denials
   - Log suspicious activity (multiple failed logins)

### ⚠️ MEDIUM PRIORITY (Week 2 - 2 Days)

8. **Add file upload validation** ✅ Medium
   - Validate MIME types
   - Check magic bytes
   - Add virus scanning (ClamAV or Cloudinary)

9. **Improve input sanitization** ✅ Medium
   - Add OWASP Java HTML Sanitizer
   - Sanitize all user-generated content
   - Add XSS tests

10. **Database connection encryption** ✅ Medium
    - Enable SSL/TLS for PostgreSQL
    - Add connection timeout limits
    - Enable prepared statement caching

### 📌 LOW PRIORITY (Week 3 - 1 Day)

11. **Add @PreAuthorize annotations** ✅ Low
    - Method-level security for sensitive operations
    - Cleaner than manual checks

12. **Implement audit logging** ✅ Low
    - Track who created/updated/deleted resources
    - Store in separate audit table

13. **Add security monitoring dashboard** ✅ Low
    - Grafana + Prometheus
    - Alert on suspicious patterns

---

## 🎯 Production Readiness Checklist

### Before Deploying to Railway/Netlify:

- [ ] Secrets removed from build.gradle
- [ ] Strong JWT secret generated (64+ chars)
- [ ] CORS headers restricted to specific list
- [ ] SecurityConfig endpoints properly restricted
- [ ] Rate limiting implemented (at least for auth endpoints)
- [ ] Token blacklisting implemented
- [ ] Security logging enabled
- [ ] HTTPS enforced (Railway does this automatically)
- [ ] Database connection encrypted
- [ ] File upload validation added
- [ ] Environment variables set in Railway
- [ ] Google OAuth credentials configured for production domain
- [ ] Cloudinary keys rotated after removing from Git
- [ ] Security headers verified (SecurityHeadersFilter)
- [ ] Actuator endpoints secured (health only)

---

## 🔍 Testing Recommendations

### Security Testing Checklist:

1. **Authentication Tests:**
   - [ ] Try accessing protected endpoints without token
   - [ ] Try using expired JWT token
   - [ ] Try using invalid JWT signature
   - [ ] Test rate limiting on magic link endpoint
   - [ ] Test Google OAuth with invalid ID token

2. **Authorization Tests:**
   - [ ] Try updating someone else's group
   - [ ] Try deleting someone else's event
   - [ ] Try accessing admin endpoints as regular user
   - [ ] Test group membership privacy (non-members can't see details)

3. **Input Validation Tests:**
   - [ ] Try SQL injection in search fields
   - [ ] Try XSS in event descriptions
   - [ ] Try path traversal in file uploads
   - [ ] Try uploading non-image files
   - [ ] Try uploading files > 10MB

4. **CORS Tests:**
   - [ ] Try requests from unauthorized origin
   - [ ] Verify preflight OPTIONS requests work
   - [ ] Test with credentials (cookies)

5. **Rate Limiting Tests:**
   - [ ] Send 10 magic link requests in 1 minute
   - [ ] Send 100 API requests in 1 minute
   - [ ] Verify 429 Too Many Requests response

---

## 📚 Recommended Security Libraries

### Add to build.gradle:

```groovy
// Rate limiting
implementation 'com.bucket4j:bucket4j-core:8.7.0'

// Input sanitization
implementation 'com.googlecode.owasp-java-html-sanitizer:owasp-java-html-sanitizer:20220608.1'

// Security headers (already have custom filter)
// implementation 'io.github.wimdeblauwe:spring-boot-security-headers:1.0.0'

// Redis for distributed token blacklist (optional)
// implementation 'org.springframework.boot:spring-boot-starter-data-redis'
```

---

## 🎓 Security Best Practices Summary

### ✅ What You're Doing Right:
1. JWT-based stateless authentication
2. Spring Security with method-level security
3. Security headers filter (CSP, HSTS, X-Frame-Options)
4. Input validation with @Valid
5. JPA preventing SQL injection
6. Cloudinary handling file security
7. HTTPS-ready configuration
8. Separate dev/prod configurations

### 🚨 What Needs Immediate Attention:
1. Remove secrets from build.gradle
2. Fix overly permissive SecurityConfig endpoints
3. Implement rate limiting
4. Restrict CORS headers
5. Generate strong production JWT secret

### 📈 What Would Make It Enterprise-Grade:
1. Token blacklisting/revocation
2. Comprehensive security logging
3. Audit trail for all data modifications
4. Advanced rate limiting (per-user, per-endpoint)
5. Database connection encryption
6. File upload virus scanning
7. Anomaly detection and alerting
8. Secret rotation strategy
9. Penetration testing
10. Security incident response plan

---

## 💡 Final Recommendation

**Current Security Level:** 6.5/10 - Good foundation, needs hardening

**Path to Production:**
1. **Day 1:** Fix URGENT items (secrets, SecurityConfig, JWT secret, CORS)
2. **Day 2-3:** Implement HIGH priority items (rate limiting, token blacklist, logging)
3. **Week 2:** Add MEDIUM priority items (file validation, input sanitization)
4. **Week 3:** LOW priority items (audit logging, monitoring)

**After Week 1:** ✅ Safe for production with real users  
**After Week 3:** ✅ Enterprise-grade security

---

## 📞 Questions?

If you need help implementing any of these recommendations, let me know which area to focus on first!

**Recommended Order:**
1. Fix secrets in build.gradle (30 min)
2. Fix SecurityConfig endpoints (1 hour)
3. Implement rate limiting (2-3 hours)
4. Add token blacklisting (1-2 hours)
5. Security logging (1 hour)

Total time to production-ready: **1-2 days of focused work**
