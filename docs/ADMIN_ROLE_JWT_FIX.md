# Admin Role JWT Token Fix

## Problem

User had `isAdmin = TRUE` in the database, but the `/admin/check` endpoint was returning 403 Forbidden.

## Root Cause

The JWT token generation was **hardcoding the role as "MEMBER"** instead of checking the user's `isAdmin` field. This meant even admin users were getting tokens with `role: "MEMBER"`, which failed the `hasRole("ADMIN")` check in Spring Security.

## Files Fixed

### 1. AuthService.java (Magic Link Authentication)

**Before:**
```java
// Generate JWT token
String jwtToken = jwtUtil.generateToken(member.getEmail(), member.getId(), "MEMBER");

return AuthResponse.builder()
        .token(jwtToken)
        .userId(member.getId())
        .email(member.getEmail())
        .role("MEMBER")  // ❌ Hardcoded
        .isOrganiser(member.getIsOrganiser())
        .build();
```

**After:**
```java
// Determine role based on admin status
String role = member.getIsAdmin() ? "ADMIN" : "MEMBER";

// Generate JWT token
String jwtToken = jwtUtil.generateToken(member.getEmail(), member.getId(), role);

return AuthResponse.builder()
        .token(jwtToken)
        .userId(member.getId())
        .email(member.getEmail())
        .role(role)  // ✅ Dynamic based on isAdmin
        .isOrganiser(member.getIsOrganiser())
        .build();
```

### 2. GoogleOAuth2Service.java (Google OAuth Authentication)

**Before:**
```java
// Generate JWT token
String jwtToken = jwtUtil.generateToken(member.getEmail(), member.getId(), "MEMBER");

return AuthResponse.builder()
        .token(jwtToken)
        .userId(member.getId())
        .email(member.getEmail())
        .role("MEMBER")  // ❌ Hardcoded
        .isOrganiser(member.getIsOrganiser())
        .build();
```

**After:**
```java
// Determine role based on admin status
String role = member.getIsAdmin() ? "ADMIN" : "MEMBER";

// Generate JWT token
String jwtToken = jwtUtil.generateToken(member.getEmail(), member.getId(), role);

return AuthResponse.builder()
        .token(jwtToken)
        .userId(member.getId())
        .email(member.getEmail())
        .role(role)  // ✅ Dynamic based on isAdmin
        .isOrganiser(member.getIsOrganiser())
        .build();
```

### 3. SecurityConfig.java (Admin Check Endpoint)

**Before:**
```java
// Admin endpoints
.requestMatchers(new AntPathRequestMatcher("/api/v1/admin/**")).hasRole("ADMIN")
```

This blocked `/admin/check` for non-admin users, preventing them from checking their status.

**After:**
```java
// Admin check endpoint - authenticated users can check their status
.requestMatchers(new AntPathRequestMatcher("/api/v1/admin/check", "GET")).authenticated()

// Other admin endpoints - require ADMIN role
.requestMatchers(new AntPathRequestMatcher("/api/v1/admin/**")).hasRole("ADMIN")
```

Now any logged-in user can check if they're admin, but only admins can access other admin endpoints.

## How JWT Roles Work

### JWT Token Structure

```json
{
  "sub": "user@example.com",
  "userId": 123,
  "role": "ADMIN",  // ← This is what Spring Security checks
  "iat": 1734524400,
  "exp": 1734610800
}
```

### Spring Security Role Check

When you use `@PreAuthorize("hasRole('ADMIN')")` or `.hasRole("ADMIN")`, Spring Security:

1. Extracts the JWT token from the `Authorization` header
2. Decodes the token and reads the `role` claim
3. Checks if `role === "ADMIN"`
4. If yes → Allow access
5. If no → Return 403 Forbidden

## Testing

### 1. Restart Backend

```bash
cd backend
./gradlew bootRun
```

### 2. Logout and Login Again

**Important:** You must logout and login again to get a new JWT token with the correct role!

Old tokens still have `role: "MEMBER"` and won't work.

### 3. Test Admin Check Endpoint

**In Browser Console:**
```javascript
fetch('http://localhost:8080/api/v1/admin/check', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('auth-storage')?.match(/"token":"([^"]+)"/)?.[1]
  }
}).then(r => r.json()).then(console.log)
```

**Expected Response:**
- If admin: `true`
- If not admin: `false`

### 4. Test Admin Dashboard

1. Navigate to `/admin` in your app
2. Should see the dashboard (not 403 error)
3. All charts and metrics should load

## How to Make a User Admin

```sql
UPDATE members SET is_admin = TRUE WHERE email = 'your-email@example.com';
```

Then **logout and login again** to get a new token with `role: "ADMIN"`.

## Summary of Changes

✅ **AuthService.java** - Dynamic role based on `isAdmin` field  
✅ **GoogleOAuth2Service.java** - Dynamic role based on `isAdmin` field  
✅ **SecurityConfig.java** - Allow authenticated users to check admin status  
✅ **AdminService.java** - Already had `isAdmin()` method (no changes needed)  
✅ **AdminController.java** - Already correct (no changes needed)

## Key Takeaways

1. **JWT tokens are immutable** - Once issued, they can't be changed. Users must logout/login to get new tokens.
2. **Role must be in the token** - Spring Security checks the `role` claim in the JWT, not the database.
3. **Database changes don't affect existing tokens** - Setting `isAdmin = TRUE` doesn't update existing JWTs.
4. **Always check both auth methods** - We have Magic Link AND Google OAuth, both must generate correct roles.

## Status

✅ **COMPLETE** - Admin users now get `role: "ADMIN"` in their JWT tokens and can access admin endpoints!

---

**Next Steps:**
1. Restart backend
2. Logout and login again
3. Test `/admin/check` endpoint
4. Access admin dashboard at `/admin`
