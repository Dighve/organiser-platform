# Welcome Screen Feature Flag

## Overview

The welcome screen feature flag allows admins to control whether unauthenticated users see the welcome screen on the homepage or go directly to the discover events view.

**Feature Flag Key:** `WELCOME_SCREEN_ENABLED`

**Default State:** `true` (enabled)

## How It Works

### User Experience

**When Enabled (true):**
- Unauthenticated users see the beautiful welcome screen with:
  - Animated gradient background
  - "Your next hike is one tap away" messaging
  - "Discover Events" and "Login / Sign Up" buttons
  - Brand messaging and activity tags
- After clicking "Discover Events", users see the main homepage with events

**When Disabled (false):**
- Unauthenticated users go directly to the discover events view
- No welcome screen is shown
- Users can still login via the header navigation

### Admin Control

Admins can toggle this feature flag through the Admin Dashboard:

1. Navigate to Admin Dashboard → Feature Flags
2. Find "Welcome Screen" in the list
3. Toggle the switch to enable/disable
4. Changes take effect immediately (cached for 5 minutes on frontend)

## Implementation Details

### Backend

**Database Migration:** `V38__add_welcome_screen_feature_flag.sql`
```sql
INSERT INTO feature_flags (flag_key, flag_name, description, is_enabled) 
VALUES (
    'WELCOME_SCREEN_ENABLED', 
    'Welcome Screen', 
    'Enables the welcome screen for unauthenticated users on the homepage. When disabled, users see the discover events view directly.', 
    true
);
```

**Service Constant:** `FeatureFlagService.java`
```java
public static final String WELCOME_SCREEN_ENABLED = "WELCOME_SCREEN_ENABLED";
```

**API Endpoint:** `GET /api/v1/admin/feature-flags/map`
- Public endpoint (no authentication required)
- Returns all feature flags as a map
- Cached for performance

### Frontend

**Feature Flag Query:** `HomePage.jsx`
```javascript
const { data: featureFlags } = useQuery({
  queryKey: ['featureFlags'],
  queryFn: () => featureFlagsAPI.getFeatureFlagsMap(),
  staleTime: 5 * 60 * 1000, // 5 minutes cache
  refetchOnWindowFocus: false,
})
```

**Conditional Rendering:**
```javascript
const isWelcomeScreenEnabled = featureFlags?.WELCOME_SCREEN_ENABLED ?? true

if (showDiscover && isWelcomeScreenEnabled) {
  return <WelcomeScreen onDiscoverClick={handleDiscoverClick} />
}
```

## Use Cases

### Enable Welcome Screen (Default)
**When to use:**
- Launching new marketing campaigns
- Want to showcase brand messaging
- Need to explain platform value proposition
- Targeting new user acquisition

**Benefits:**
- Better first impression
- Clear value proposition
- Guided onboarding experience
- Higher engagement with brand messaging

### Disable Welcome Screen
**When to use:**
- A/B testing conversion rates
- Reducing friction for returning users
- Mobile-first optimization
- Quick access to events is priority

**Benefits:**
- Faster time to content
- Reduced bounce rate
- Better for SEO (content visible immediately)
- Simpler user flow

## Performance Considerations

**Caching Strategy:**
- Feature flags cached for 5 minutes on frontend
- Backend uses Spring Cache for fast lookups
- Changes take effect within 5 minutes max
- No page reload required

**Default Behavior:**
- If feature flags fail to load, defaults to `true` (enabled)
- Ensures welcome screen shows even if API is down
- Graceful degradation

## Testing

### Manual Testing

**Test Enabled State:**
1. Set `WELCOME_SCREEN_ENABLED = true` in admin dashboard
2. Open homepage in incognito/private window
3. Verify welcome screen appears
4. Click "Discover Events"
5. Verify main homepage shows

**Test Disabled State:**
1. Set `WELCOME_SCREEN_ENABLED = false` in admin dashboard
2. Wait 5 minutes or clear browser cache
3. Open homepage in incognito/private window
4. Verify discover events view shows immediately
5. Verify no welcome screen appears

**Test Authenticated Users:**
- Authenticated users should NEVER see welcome screen
- Feature flag only affects unauthenticated users
- Test with logged-in account to verify

### API Testing

**Get Feature Flags:**
```bash
curl http://localhost:8080/api/v1/admin/feature-flags/map
```

**Expected Response:**
```json
{
  "GOOGLE_MAPS_ENABLED": true,
  "WELCOME_SCREEN_ENABLED": true,
  ...
}
```

**Update Feature Flag (Admin Only):**
```bash
curl -X PUT http://localhost:8080/api/v1/admin/feature-flags/WELCOME_SCREEN_ENABLED \
  -H "Authorization: Bearer <admin-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"isEnabled": false}'
```

## Analytics Integration

Track welcome screen behavior with Mixpanel:

**Events Tracked:**
- `Welcome Screen Viewed` - When welcome screen is shown
- `Discover Events Clicked` - When user clicks discover button
- `Login Modal Opened` - When user clicks login from welcome screen

**Properties:**
- `feature_flag_enabled`: true/false
- `platform`: ios/android/desktop/pwa
- `is_pwa`: boolean

## Troubleshooting

### Welcome Screen Not Showing When Enabled

**Check:**
1. Feature flag value in database: `SELECT * FROM feature_flags WHERE flag_key = 'WELCOME_SCREEN_ENABLED'`
2. Browser cache (clear and retry)
3. User authentication state (logged-in users never see it)
4. localStorage `hasDiscovered` value (clear to reset)

**Solution:**
```javascript
// Clear localStorage to reset
localStorage.removeItem('hasDiscovered')
// Reload page
window.location.reload()
```

### Welcome Screen Still Showing When Disabled

**Check:**
1. Frontend cache (5-minute stale time)
2. Feature flag API response
3. Browser console for errors

**Solution:**
- Wait 5 minutes for cache to expire
- Or hard refresh: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)

### Feature Flag Not Updating

**Check:**
1. Admin permissions (only admins can update)
2. Backend cache (Spring Cache)
3. Database value

**Solution:**
```bash
# Clear backend cache (restart backend)
cd backend
./gradlew bootRun

# Or clear specific cache via admin endpoint
curl -X DELETE http://localhost:8080/actuator/caches/featureFlags \
  -H "Authorization: Bearer <admin-jwt-token>"
```

## Migration Guide

### Deploying to Production

**Step 1: Database Migration**
```bash
# Migration runs automatically on backend startup
# V38__add_welcome_screen_feature_flag.sql
```

**Step 2: Backend Deployment**
- Deploy backend with updated `FeatureFlagService.java`
- Verify migration ran successfully
- Check feature flag exists in database

**Step 3: Frontend Deployment**
- Deploy frontend with updated `HomePage.jsx`
- Verify feature flag API call works
- Test both enabled and disabled states

**Step 4: Verification**
```bash
# Check feature flag exists
curl https://api.outmeets.com/api/v1/admin/feature-flags/map | jq '.WELCOME_SCREEN_ENABLED'

# Should return: true
```

## Best Practices

### When to Enable
✅ New user acquisition campaigns
✅ Brand awareness initiatives  
✅ Platform rebranding
✅ Holiday/seasonal messaging
✅ A/B testing with welcome screen

### When to Disable
✅ SEO optimization (content-first)
✅ Returning user optimization
✅ Mobile-first strategy
✅ Conversion rate optimization
✅ A/B testing without welcome screen

### Monitoring
- Track conversion rates with/without welcome screen
- Monitor bounce rates
- Analyze time to first event view
- Compare signup rates
- A/B test different states

## Related Documentation

- [Feature Flag System](./FEATURE_FLAGS.md)
- [Admin Dashboard](./ADMIN_DASHBOARD.md)
- [Welcome Screen Component](../components/WELCOME_SCREEN.md)
- [Analytics Integration](./ANALYTICS.md)

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review backend logs for errors
3. Check browser console for frontend errors
4. Contact development team

---

**Last Updated:** March 27, 2026
**Version:** 1.0.0
**Status:** ✅ Production Ready
