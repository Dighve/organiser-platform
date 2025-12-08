# Google OAuth Setup Guide

## Overview

OutMeets now uses **Google OAuth as the primary authentication method** with magic link as a fallback option. This provides instant, secure sign-in matching Meetup.com's UX.

## Why Google OAuth?

✅ **Instant sign-in** - No email delays, 1-2 clicks
✅ **Cross-browser** - Works everywhere, no localStorage dependency  
✅ **Better UX** - Stays in same tab, no context switching
✅ **Higher conversion** - 20-40% better than email-based auth
✅ **Mobile-friendly** - No app switching issues
✅ **Trusted** - Users familiar with "Sign in with Google"

## Setup Steps

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name: "OutMeets" (or your app name)
4. Click "Create"

### 2. Enable Google+ API

1. In the sidebar, go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click "Enable"

### 3. Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" (for public app)
3. Click "Create"

**App Information:**
- App name: `OutMeets`
- User support email: Your email
- App logo: (Optional) Upload your logo
- Application home page: `https://www.outmeets.com`
- Application privacy policy: `https://www.outmeets.com/privacy`
- Application terms of service: `https://www.outmeets.com/terms`

**Scopes:**
- Click "Add or Remove Scopes"
- Select:
  - `.../auth/userinfo.email`
  - `.../auth/userinfo.profile`
- Click "Update"

**Test Users** (for development):
- Add your email and team emails

Click "Save and Continue"

### 4. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: "Web application"
4. Name: "OutMeets Web Client"

**Authorized JavaScript origins:**
```
http://localhost:5173
http://localhost:3000
https://www.outmeets.com
https://outmeets.com
```

**Authorized redirect URIs:**
```
http://localhost:5173
http://localhost:3000
https://www.outmeets.com
https://outmeets.com
```

5. Click "Create"
6. **IMPORTANT:** Copy the Client ID and Client Secret

### 5. Configure Backend

Add to `application.properties`:

```properties
# Google OAuth2
spring.security.oauth2.client.registration.google.client-id=YOUR_GOOGLE_CLIENT_ID
spring.security.oauth2.client.registration.google.client-secret=YOUR_GOOGLE_CLIENT_SECRET
```

Add to `application-prod.properties`:

```properties
# Google OAuth2 (Production)
spring.security.oauth2.client.registration.google.client-id=${GOOGLE_CLIENT_ID}
spring.security.oauth2.client.registration.google.client-secret=${GOOGLE_CLIENT_SECRET}
```

### 6. Configure Frontend

Create `.env.local`:

```bash
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
```

Update `.env.production`:

```bash
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
```

### 7. Test Locally

1. Start backend: `./gradlew bootRun`
2. Start frontend: `npm run dev`
3. Click "Join Event" on any event
4. Click "Continue with Google"
5. Select your Google account
6. Should see "🎉 Signed in with Google!"
7. Should auto-join the event

## Authentication Flow

### Google OAuth (Primary)

```
1. User clicks "Join Event" (not logged in)
2. Login modal opens
3. User clicks "Continue with Google"
4. Google popup appears (same tab)
5. User selects account
6. Frontend receives Google ID token
7. Frontend sends token to backend: POST /api/v1/auth/google
8. Backend verifies token with Google
9. Backend creates/updates user
10. Backend returns JWT token
11. Frontend stores token and user data
12. Modal closes
13. User auto-joins event ✅
```

### Magic Link (Fallback)

```
1. User clicks "Join Event" (not logged in)
2. Login modal opens
3. User clicks "Continue with Email"
4. User enters email
5. Backend sends magic link
6. User clicks link in email
7. Backend verifies token
8. Backend returns JWT token
9. Frontend stores token
10. Redirects to event page
11. User auto-joins event ✅
```

## Security

**Backend Verification:**
- Google ID token verified using Google API client library
- Token signature validated
- Email verified flag checked
- User created/updated in database
- JWT token generated and returned

**Frontend:**
- Google OAuth library handles popup/redirect
- ID token sent to backend (never stored)
- Only JWT token stored in localStorage
- Auto-join flow preserved with returnUrl

## Environment Variables

### Development

**Backend (.env or application.properties):**
```properties
spring.security.oauth2.client.registration.google.client-id=YOUR_CLIENT_ID
spring.security.oauth2.client.registration.google.client-secret=YOUR_CLIENT_SECRET
```

**Frontend (.env.local):**
```bash
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID
```

### Production

**Backend (Railway/Render):**
```
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```

**Frontend (Netlify):**
```
VITE_GOOGLE_CLIENT_ID=your_client_id
```

## Troubleshooting

### "Google sign-in failed"
- Check Client ID is correct in frontend
- Check Client Secret is correct in backend
- Verify authorized origins include your domain
- Check browser console for errors

### "Invalid ID token"
- Ensure backend has Google API client library
- Check Client ID matches in frontend and backend
- Verify token is being sent correctly

### "Email not verified"
- User must verify email with Google first
- Check Google account settings

### "Redirect URI mismatch"
- Add your domain to authorized redirect URIs
- Include both http://localhost:5173 and production URL
- Wait 5 minutes for Google to propagate changes

## Testing Checklist

- [ ] Local development works (localhost:5173)
- [ ] Google button appears in login modal
- [ ] Clicking Google opens popup
- [ ] Selecting account signs in successfully
- [ ] User profile created in database
- [ ] Auto-join event works after Google sign-in
- [ ] Magic link fallback still works
- [ ] Production deployment works
- [ ] Mobile browsers work
- [ ] Incognito mode works

## Benefits Over Magic Link

| Feature | Google OAuth | Magic Link |
|---------|-------------|------------|
| Speed | ⚡ Instant (1-2 sec) | 📧 30-60 seconds |
| Steps | 2 clicks | 5+ steps |
| Context | ✅ Same tab | ❌ Email app switch |
| Mobile | ✅ Seamless | ❌ Browser confusion |
| Conversion | ✅ 20-40% higher | ❌ Lower |
| Email issues | ✅ None | ❌ Spam, delays |

## Cost

**Google OAuth:** FREE
- 100,000 requests/day
- No credit card required
- No usage limits for basic auth

## Support

If you encounter issues:
1. Check Google Cloud Console for errors
2. Verify all environment variables
3. Check browser console for frontend errors
4. Check backend logs for verification errors
5. Ensure authorized origins are correct

## Next Steps

1. ✅ Complete setup above
2. ✅ Test locally
3. ✅ Deploy to production
4. ✅ Update authorized origins for production domain
5. ✅ Test on mobile devices
6. 🎉 Enjoy instant sign-in!
