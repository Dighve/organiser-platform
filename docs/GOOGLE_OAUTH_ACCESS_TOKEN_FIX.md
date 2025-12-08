# Google OAuth Access Token Fix

## Problem

Getting error: `"Google authentication failed: null"`

The issue was that `useGoogleLogin` hook returns an **access token**, but the backend was trying to verify it as an **ID token** using Google's ID token verifier.

## Root Cause

**Frontend:** `useGoogleLogin` returns `tokenResponse.access_token`
**Backend:** Expected an ID token and tried to verify with `GoogleIdTokenVerifier`

Result: Verification failed because access tokens can't be verified the same way as ID tokens.

## Solution

Changed the backend to verify the access token by calling Google's userinfo endpoint instead of using the ID token verifier.

### Backend Changes (GoogleOAuth2Service.java)

**Before:**
```java
// Tried to verify access token as ID token
GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(...)
    .setAudience(Collections.singletonList(googleClientId))
    .build();

GoogleIdToken idToken = verifier.verify(request.getIdToken());
// This failed because access_token is not an ID token
```

**After:**
```java
// Verify access token by calling Google's userinfo API
HttpClient client = HttpClient.newHttpClient();
HttpRequest httpRequest = HttpRequest.newBuilder()
        .uri(URI.create("https://www.googleapis.com/oauth2/v3/userinfo"))
        .header("Authorization", "Bearer " + accessToken)
        .GET()
        .build();

HttpResponse<String> httpResponse = client.send(httpRequest, 
        HttpResponse.BodyHandlers.ofString());

if (httpResponse.statusCode() != 200) {
    throw new RuntimeException("Invalid Google access token");
}

// Parse user info from Google
JsonObject userInfo = JsonParser.parseString(httpResponse.body()).getAsJsonObject();
```

### Frontend Changes (LoginModal.jsx)

Frontend now:
1. Gets access token from `useGoogleLogin`
2. Calls Google's userinfo API to get user data
3. Sends both access token and user info to backend

```javascript
const googleLogin = useGoogleLogin({
  onSuccess: async (tokenResponse) => {
    // Use access token to get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenResponse.access_token}`,
      },
    })
    
    const userInfo = await userInfoResponse.json()
    
    // Send to backend
    const response = await authAPI.authenticateWithGoogle({
      idToken: tokenResponse.access_token,
      redirectUrl: returnUrl,
      userInfo: userInfo
    })
  }
})
```

## How It Works Now

1. **User clicks "Continue with Google"**
2. **Google OAuth popup** opens
3. **User selects account**
4. **Frontend receives** access token
5. **Frontend calls** Google's userinfo API with access token
6. **Google returns** user data (email, name, picture)
7. **Frontend sends** access token + user info to backend
8. **Backend verifies** access token by calling Google's userinfo API again
9. **Backend creates/updates** user in database
10. **Backend returns** JWT token
11. **User is logged in** ✅

## Why This Approach

### Access Token vs ID Token

**Access Token:**
- Used to access Google APIs
- Verified by calling Google's userinfo endpoint
- What `useGoogleLogin` returns

**ID Token:**
- Contains user identity information
- Verified using Google's ID token verifier
- What `GoogleLogin` component returns

### Security

Both approaches are secure:
- Access token is verified by calling Google's API
- Only valid tokens return user data
- Backend still creates its own JWT token
- No sensitive data exposed

## Testing

1. **Restart backend** (to load new code)
2. **Refresh frontend** (Cmd+Shift+R)
3. **Click Login** → "Continue with Google"
4. **Select Google account**
5. **Should see:** "🎉 Signed in with Google!"
6. **Verify:** User profile appears in header

## Files Modified

**Backend:**
- `GoogleOAuth2Service.java` - Changed from ID token verification to access token verification

**Frontend:**
- `LoginModal.jsx` - Added userinfo API call before sending to backend

## Alternative Approaches Considered

### 1. Use GoogleLogin Component
- Returns ID token directly
- But we wanted custom button styling
- ❌ Rejected: Less UI control

### 2. Use Authorization Code Flow
- More secure (client secret on backend)
- But requires backend redirect handling
- ❌ Rejected: More complex setup

### 3. Current: Access Token + Userinfo API
- Simple and secure
- Works with custom button
- ✅ Chosen: Best balance

## Build Status

✅ Backend compiles successfully
✅ Frontend builds successfully
✅ Ready for testing

## Next Steps

1. Restart backend server
2. Test Google OAuth login
3. Verify user creation in database
4. Test cross-tab sync
5. Commit changes
