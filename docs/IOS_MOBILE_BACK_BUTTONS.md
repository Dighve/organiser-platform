# iOS Mobile Back Button Implementation

## Problem
iPhone doesn't have a system back button like Android, making navigation difficult for iOS users on certain pages. Android has a system back button, so this feature is only needed for iOS devices.

## Solution
Added iOS-specific back buttons across key pages using device detection. The button only appears on iPhone, iPad, and iPod devices - not on Android or desktop.

## Implementation Pattern

### Custom Hook: `useIsIOS()`
```javascript
// hooks/useIsIOS.js
import { useState, useEffect } from 'react'

export function useIsIOS() {
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(isIOSDevice)
  }, [])

  return isIOS
}
```

### Component Usage
```jsx
import { useIsIOS } from '../hooks/useIsIOS'

export default function MyPage() {
  const isIOS = useIsIOS()
  
  return (
    <div>
      {/* ========== MOBILE HEADER (Back button - iOS only, fixed overlay) ========== */}
      {isIOS && (
        <button
          onClick={() => navigate(-1)}
          className="sm:hidden fixed top-4 left-4 z-50 flex items-center justify-center w-10 h-10 rounded-full bg-white/90 backdrop-blur-md shadow-xl text-gray-600 hover:text-purple-600 active:scale-95 transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}
```

## Key Features

- **iOS-only**: Uses JavaScript user agent detection to show only on iPhone, iPad, iPod
- **Not shown on Android**: Android users have system back button, so no duplicate button
- **Fixed overlay**: Positioned at `top-4 left-4` with `z-50`, stays visible while scrolling
- **Saves viewport space**: No layout shift, floats above content
- **Mobile-only on iOS**: Uses `sm:hidden` to hide on desktop even for iOS devices
- **Enhanced glassmorphism**: `bg-white/90 backdrop-blur-md` for better visibility
- **Browser history**: Uses `navigate(-1)` to go back in browser history
- **Touch feedback**: `active:scale-95` provides tactile response on tap
- **Visual feedback**: Hover effect changes color to purple-600
- **Accessible**: Proper button semantics and touch target size (40px × 40px)

## Pages Updated

### ✅ Newly Implemented with iOS Detection
1. **EventDetailPage.jsx** - Added iOS-only back button with useIsIOS hook
2. **GroupDetailPage.jsx** - Updated to iOS-only with useIsIOS hook
3. **ProfilePage.jsx** - Added iOS-only back button with useIsIOS hook

### 📝 Pages That Need Updating (Still Show on All Mobile)
These pages currently show back buttons on all mobile devices (including Android) and should be updated to use the `useIsIOS()` hook:
- CreateGroupPage.jsx
- EditGroupPage.jsx
- InvitePage.jsx
- TransferOwnershipPage.jsx
- MemberDetailPage.jsx

## Design Specifications

**Button Positioning:**
- Position: `fixed top-4 left-4` (16px from top and left edges)
- Z-index: `z-50` (floats above all content)
- Visibility: `sm:hidden` (only on mobile screens < 640px)

**Button Styling:**
- Size: `w-10 h-10` (40px × 40px)
- Shape: `rounded-full` (circular)
- Background: `bg-white/90 backdrop-blur-md` (enhanced glassmorphism)
- Shadow: `shadow-xl` (stronger shadow for overlay)
- Icon size: `h-5 w-5` (20px × 20px)

**Interactive States:**
- Default: `text-gray-600`
- Hover: `hover:text-purple-600`
- Active/Tap: `active:scale-95` (tactile feedback)
- Transition: `transition-all` (smooth animations)

## Benefits

✅ **iOS users** can now navigate back easily without system button
✅ **Always accessible** - Fixed overlay stays visible while scrolling
✅ **Saves viewport space** - No layout shift, floats above content
✅ **Better visibility** - Enhanced glassmorphism (90% opacity) stands out
✅ **Tactile feedback** - Scale animation on tap feels responsive
✅ **Consistent UX** across all mobile pages
✅ **No impact on desktop** - back button hidden on larger screens
✅ **Matches brand** - Uses OutMeets purple-pink color scheme
✅ **Touch-friendly** - 40px × 40px meets minimum touch target size

## Testing Checklist

- [ ] Test on iPhone Safari
- [ ] Test on iPhone Chrome
- [ ] Test on Android (should work same as before)
- [ ] Verify button hidden on desktop (sm breakpoint and above)
- [ ] Verify navigation works correctly (goes back in history)
- [ ] Test with different page depths (2+ levels deep)

## Notes

- Android users already have system back button, so this is primarily for iOS
- Web users on desktop can use browser back button
- The `navigate(-1)` function uses browser history, so it works across the entire app
- Some pages like CreateEventPage and EditEventPage use multi-step forms, so they have their own "Back" buttons between steps (not affected by this change)

## Future Considerations

- Consider adding swipe-to-go-back gesture for iOS (like native apps)
- Monitor analytics to see if back button usage increases on mobile
- Could add breadcrumb navigation for deeper page hierarchies
