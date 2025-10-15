# Magic Link Authentication System

## Overview

The Organiser Platform now uses **passwordless authentication** via magic links. Users sign in by entering their email address, and we send them a secure, time-limited link to authenticate.

#### **User Model**:
- `email` - Required for authentication only
- `displayName` - Optional, can be a pseudonym
- `profilePhotoUrl` - Optional profile photo
- `role` - For authorization
- `verified` - Account status
- `active` - Account status
- Timestamps - For system management

## Why Magic Links?

✅ **Better Security**: No passwords to steal, leak, or forget
✅ **Better UX**: Simpler sign-in process, no password requirements
✅ **Email as Identifier**: Single source of truth for user identity
✅ **Auto-Registration**: New users are created automatically on first sign-in
✅ **Mobile-Friendly**: Easy to use on any device

## How It Works

### 1. User Requests Magic Link
- User enters their email (and optionally first/last name for new users)
- System generates a unique, cryptographically secure token
- Token is stored in database with 15-minute expiration
- Email is sent with magic link containing the token

### 2. User Clicks Magic Link
- Link format: `https://yourapp.com/auth/verify?token=<uuid>`
- Frontend extracts token from URL
- Backend verifies token is valid and not expired
- If valid, user is authenticated and JWT token is issued

### 3. JWT Token for Session
- After magic link verification, user receives a JWT token
- JWT token is used for all subsequent API requests
- Token contains: email, userId, role

## Backend Changes

### New Database Entities

#### MagicLink Entity
```java
- id: Long
- token: String (UUID)
- email: String
- expiresAt: LocalDateTime (15 minutes from creation)
- used: Boolean
- usedAt: LocalDateTime
- ipAddress: String (for security tracking)
- userAgent: String (for security tracking)
```

#### User Entity Changes
**Removed:**
- `username` field
- `password` field

**Email is now the primary identifier**

### New API Endpoints

#### POST `/api/v1/auth/magic-link`
Request a magic link to be sent to email.

**Request Body:**
```json
{
  "email": "user@example.com",
  "firstName": "John",  // optional, for new users
  "lastName": "Doe"     // optional, for new users
}
```

**Response:**
```json
{
  "message": "Magic link sent to your email",
  "email": "user@example.com"
}
```

#### GET `/api/v1/auth/verify?token=<uuid>`
Verify magic link token and authenticate user.

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "type": "Bearer",
  "userId": 123,
  "email": "user@example.com",
  "role": "MEMBER"
}
```

### Security Features

1. **Token Expiration**: Magic links expire after 15 minutes
2. **Single Use**: Tokens can only be used once
3. **Automatic Cleanup**: Expired/used tokens are cleaned up hourly
4. **IP & User-Agent Tracking**: Security audit trail
5. **Email Verification**: Users are marked as verified after first magic link use

### Email Service

Currently configured for **development mode** - magic links are logged to console.

**For Production**, integrate with:
- **SendGrid** (recommended)
- **AWS SES**
- **Mailgun**
- **Postmark**

Configuration in `EmailService.java`:
```java
// TODO: Replace console logging with actual email sending
emailService.sendMagicLink(email, token);
```

## Frontend Changes

### New Pages

#### LoginPage (`/login`)
- Single email input field
- Optional first/last name for new users
- "Send Magic Link" button
- Success state showing "Check your email"

#### VerifyMagicLinkPage (`/auth/verify`)
- Automatically extracts token from URL
- Shows loading state while verifying
- Success: Redirects to homepage
- Error: Shows error message with retry option

### Removed Pages
- ~~RegisterPage~~ - No longer needed, registration happens automatically

### Updated Components

#### Layout.jsx
- Changed "Sign Up" to "Sign In"
- Display user email instead of username
- Removed register link

#### authStore.js
- Removed `username` field
- Added `pendingEmail` field (tracks email while waiting for magic link)
- Added `setPendingEmail()` method

### API Client Updates

```javascript
// Old (removed)
authAPI.register(data)
authAPI.login(data)

// New
authAPI.requestMagicLink(data)
authAPI.verifyMagicLink(token)
```

## User Flow

### New User Sign In
1. User visits `/login`
2. Enters email: `john@example.com`
3. Optionally enters first name: `John`, last name: `Doe`
4. Clicks "Send Magic Link"
5. Sees "Check your email" message
6. Opens email, clicks magic link
7. Redirected to `/auth/verify?token=...`
8. Automatically authenticated and redirected to homepage
9. User account created in background

### Existing User Sign In
1. User visits `/login`
2. Enters email: `jane@example.com`
3. Clicks "Send Magic Link"
4. Sees "Check your email" message
5. Opens email, clicks magic link
6. Automatically authenticated and redirected to homepage

### Development Testing

In development, magic links are logged to the console:

```
================================================================================
Magic Link for: user@example.com
Link: http://localhost:3000/auth/verify?token=550e8400-e29b-41d4-a716-446655440000
================================================================================
```

Simply copy the link and paste it in your browser to test.

## Configuration

### Backend (`application.yml`)

```yaml
app:
  frontend-url: ${FRONTEND_URL:http://localhost:3000}
  email:
    from: ${EMAIL_FROM:noreply@organiserplatform.com}

jwt:
  secret: ${JWT_SECRET:your-secret-key}
  expiration: 86400000 # 24 hours
```

### Frontend (`.env`)

```env
VITE_API_URL=http://localhost:8080/api/v1
```

## Database Migration

### Required Changes

1. **Drop columns from `users` table:**
   - `username`
   - `password`

2. **Create `magic_links` table:**
```sql
CREATE TABLE magic_links (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(100) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500)
);

CREATE INDEX idx_magic_link_token ON magic_links(token);
CREATE INDEX idx_magic_link_email ON magic_links(email);
```

## Security Considerations

### Token Generation
- Uses `UUID.randomUUID()` for cryptographically secure tokens
- 128-bit random values (2^128 possible combinations)
- Virtually impossible to guess

### Expiration
- 15-minute expiration window
- Balances security with user convenience
- Configurable via `MAGIC_LINK_EXPIRY_MINUTES`

### Rate Limiting
**Recommended for Production:**
- Limit magic link requests per email (e.g., 3 per hour)
- Implement IP-based rate limiting
- Use Spring Security's rate limiting or Redis-based solution

### Email Security
- Use HTTPS for all magic link URLs
- Include warning in email about not sharing links
- Log all magic link usage for audit trail

## Testing

### Manual Testing (Development)

1. Start backend: `./gradlew bootRun`
2. Start frontend: `npm run dev`
3. Visit `http://localhost:3000/login`
4. Enter your email
5. Check console for magic link
6. Copy and paste link in browser
7. Verify you're authenticated

### Automated Testing

**Backend Tests:**
```bash
cd backend
./gradlew test
```

**Frontend Tests:**
```bash
cd frontend
npm test
```

## Troubleshooting

### Magic Link Not Received
- Check spam/junk folder
- Verify email service is configured
- Check backend logs for errors
- In development, check console output

### Magic Link Expired
- Links expire after 15 minutes
- Request a new magic link
- Consider increasing expiration time if needed

### Token Already Used
- Each magic link can only be used once
- Request a new magic link
- Check for duplicate requests

### Invalid Token Error
- Token may be malformed
- Token may have been deleted
- Request a new magic link

## Production Checklist

- [ ] Configure email service (SendGrid/SES/etc.)
- [ ] Set strong JWT secret
- [ ] Enable HTTPS
- [ ] Implement rate limiting
- [ ] Set up monitoring/alerts
- [ ] Configure proper CORS origins
- [ ] Test email deliverability
- [ ] Set up email templates
- [ ] Add email unsubscribe option
- [ ] Implement account deletion flow
- [ ] Add security headers
- [ ] Enable database backups
- [ ] Set up log aggregation

## Future Enhancements

- [ ] Remember device (optional password-free return)
- [ ] Biometric authentication (WebAuthn)
- [ ] Social login (Google, Apple, etc.)
- [ ] SMS magic links as alternative
- [ ] Email verification reminders
- [ ] Account recovery flow
- [ ] Multi-device management
- [ ] Login notifications

## Support

For issues or questions:
- Check backend logs: `logs/organiser-platform.log`
- Check browser console for frontend errors
- Review API responses in Network tab
- Contact: support@organiserplatform.com
