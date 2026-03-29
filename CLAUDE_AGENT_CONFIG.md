# Claude Agent Configuration - OutMeets Platform

**CRITICAL: Read this file before making ANY changes to the codebase**

## Platform Overview

**Project Name:** OutMeets (formerly HikeHub)  
**Purpose:** Outdoor activity platform for organizing and joining hiking events  
**Tech Stack:** Java Spring Boot + React + PostgreSQL  
**Deployment:** Render (Backend) + Netlify (Frontend)

---

## 🚨 DEPLOYMENT ARCHITECTURE (DO NOT CONFUSE)

### Frontend - Netlify
- **URL:** https://www.outmeets.com
- **Platform:** Netlify
- **Build:** Vite (React)
- **Deploy:** Automatic from Git push to main branch
- **Edge Functions:** Yes (for dynamic OG tags)

### Backend - Render
- **URL:** https://hikehub-backend-nd4r.onrender.com
- **API Base:** https://hikehub-backend-nd4r.onrender.com/api/v1
- **Platform:** Render.com (NOT Railway!)
- **Framework:** Java Spring Boot 3.x
- **Deploy:** Automatic from Git push to main branch
- **Cold Start:** Yes (~30 seconds after 15 min inactivity)

### Database - Render PostgreSQL
- **Platform:** Render.com (managed PostgreSQL)
- **Version:** PostgreSQL 14+
- **Connection:** Auto-provided via DATABASE_URL env var
- **Migrations:** Flyway (see naming convention below)

### Analytics - Mixpanel
- **Platform:** Mixpanel
- **Token:** Stored in VITE_MIXPANEL_TOKEN env var
- **Integration:** Frontend only (src/lib/analytics.js)
- **Events:** Page views, auth, join events, PWA install

### Image Storage - Cloudinary
- **Platform:** Cloudinary
- **Cloud Name:** drdttgry4
- **Folders:** hikehub/events/, hikehub/groups/, hikehub/profiles/
- **Free Tier:** 25GB storage, 25GB bandwidth/month

### Admin Dashboard
- **Location:** Frontend route /admin (protected)
- **Access:** ADMIN role only
- **Features:** Update legal agreements, view stats

---

## 🔴 CRITICAL RULES - NEVER VIOLATE

### 1. NO RAILWAY REFERENCES
- ❌ NEVER mention Railway
- ❌ NEVER use railway.app URLs
- ✅ ALWAYS use Render: https://hikehub-backend-nd4r.onrender.com

### 2. FLYWAY MIGRATION NAMING
**Format:** `V{VERSION}__{DESCRIPTION}.sql`

**VERSION FORMAT:** Sequential integer (check latest version first!)
- ✅ Correct: `V19__add_notification_preferences.sql`
- ❌ Wrong: `V1__add_notification_preferences.sql` (version too low)
- ❌ Wrong: `V19_add_notification_preferences.sql` (single underscore)

**BEFORE CREATING MIGRATION:**
1. Check `backend/src/main/resources/db/migration/` folder
2. Find highest version number (e.g., V18)
3. Use next number (V19)
4. Use double underscore `__` between version and description

### 3. MOBILE & DESKTOP DESIGN PATTERNS

**ALWAYS implement features for BOTH mobile and desktop with different UX:**

#### Mobile Design Patterns:
- **Three-dot menu (⋮):** Use for actions (edit, delete, share)
- **Bottom sheets:** For modals and forms
- **Full-width cards:** No side margins
- **Stacked layout:** Vertical arrangement
- **Touch targets:** Minimum 44px height
- **Hamburger menu:** For navigation

#### Desktop Design Patterns:
- **Hover states:** Show actions on hover
- **Sidebar navigation:** Persistent left sidebar
- **Multi-column grids:** 2-3 columns for cards
- **Dropdown menus:** For actions
- **Modal dialogs:** Centered overlays
- **Breadcrumbs:** For navigation

#### Responsive Breakpoints:
```css
/* Mobile: < 768px */
/* Tablet: 768px - 1024px */
/* Desktop: > 1024px */
```

### 4. REUSABLE COMPONENTS - USE EXISTING

**Before creating new components, check if these exist:**

#### Navigation Components:
- `Layout.jsx` - Main layout with header/footer
- `MobileNav.jsx` - Mobile bottom navigation (if exists)

#### UI Components:
- `ProfileAvatar.jsx` - User avatars with gradient fallbacks
- `ImageUpload.jsx` - Cloudinary image upload
- `GooglePlacesAutocomplete.jsx` - Location autocomplete
- `TagInput.jsx` - Tag input with suggestions
- `MemberAutocomplete.jsx` - Member search/select
- `NotificationBell.jsx` - Notification dropdown
- `LoginModal.jsx` - Authentication modal

#### Card Components:
- `EventCard.jsx` - Event display cards
- `GroupCard.jsx` - Group display cards (if exists)

#### Action Patterns:
- **Three-dot menu:** Check existing implementations in EventDetailPage or GroupDetailPage
- **Edit/Delete buttons:** Reuse hover patterns from existing pages
- **Share buttons:** Reuse from EventDetailPage

**RULE:** If a component exists, REUSE it. If it doesn't exist, create it as reusable.

### 5. DESIGN SYSTEM - CONSISTENCY

#### Color Palette (OutMeets Brand):
```css
/* Primary Gradients */
--gradient-purple-pink: from-purple-600 via-pink-600 to-orange-500
--gradient-orange-pink: from-orange-500 to-pink-500
--gradient-purple-orange: from-purple-500 to-orange-500

/* Semantic Colors */
--primary: purple-600
--secondary: pink-600
--accent: orange-500
--success: green-500
--error: red-500
--warning: yellow-500

/* Backgrounds */
--bg-light: purple-50 to pink-50 to orange-50
--bg-card: white with backdrop-blur
```

#### Typography:
- **Headings:** font-bold with gradient text
- **Body:** text-gray-700
- **Labels:** text-sm font-medium text-gray-700
- **Required fields:** Red asterisk `<span className="text-red-500">*</span>`

#### Spacing:
- **Section gaps:** space-y-8
- **Card padding:** p-6 (desktop), p-4 (mobile)
- **Button padding:** px-6 py-3 (desktop), px-4 py-2 (mobile)

#### Animations:
- **Transitions:** transition-all duration-300
- **Hover lift:** hover:-translate-y-1
- **Scale:** hover:scale-105
- **Shadows:** hover:shadow-xl

---

## 📁 PROJECT STRUCTURE

### Backend Structure:
```
backend/
├── src/main/java/com/organiser/platform/
│   ├── controller/     # REST endpoints
│   ├── service/        # Business logic
│   ├── repository/     # JPA repositories
│   ├── model/          # JPA entities
│   ├── dto/            # Data transfer objects
│   ├── config/         # Spring configuration
│   └── security/       # Security filters
├── src/main/resources/
│   ├── db/migration/   # Flyway migrations (V{N}__{description}.sql)
│   ├── application.properties
│   └── application-prod.properties
└── build.gradle        # Dependencies
```

### Frontend Structure:
```
frontend/
├── src/
│   ├── pages/          # Route components
│   ├── components/     # Reusable components
│   ├── lib/            # Utilities (api.js, analytics.js)
│   ├── stores/         # Zustand stores
│   └── main.jsx        # App entry point
├── public/             # Static assets
├── netlify/
│   └── edge-functions/ # Netlify edge functions
├── netlify.toml        # Netlify config
└── vite.config.js      # Vite config
```

---

## 🔧 ENVIRONMENT VARIABLES

### Backend (.env or Render env vars):
```bash
# Database (auto-provided by Render)
DATABASE_URL=postgresql://...

# JWT Authentication
JWT_SECRET=<64-character-random-string>

# Cloudinary
CLOUDINARY_CLOUD_NAME=drdttgry4
CLOUDINARY_API_KEY=478746114596374
CLOUDINARY_API_SECRET=<secret>

# Google OAuth
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>

# Email (if using)
SENDGRID_API_KEY=<your-key>

# Spring Profile
SPRING_PROFILES_ACTIVE=prod

# CORS
FRONTEND_URL=https://www.outmeets.com
```

### Frontend (.env.local or Netlify env vars):
```bash
# API
VITE_API_URL=https://hikehub-backend-nd4r.onrender.com/api/v1

# Google
VITE_GOOGLE_CLIENT_ID=<your-client-id>
VITE_GOOGLE_MAPS_API_KEY=<your-maps-key>

# Analytics
VITE_MIXPANEL_TOKEN=<your-token>

# Environment
NODE_ENV=production
```

---

## 🎨 UI/UX PATTERNS

### Mobile-First Development:
1. **Always design mobile first**
2. **Test on mobile viewport (375px)**
3. **Add desktop enhancements via media queries**
4. **Use Tailwind responsive prefixes:** `md:`, `lg:`, `xl:`

### Three-Dot Menu Pattern (Mobile):
```jsx
// Example from EventDetailPage.jsx
<button className="p-2 hover:bg-gray-100 rounded-full lg:hidden">
  <MoreVertical className="w-5 h-5" />
</button>

// Dropdown menu
<div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg">
  <button className="w-full px-4 py-2 text-left hover:bg-gray-50">
    <Edit className="w-4 h-4 inline mr-2" />
    Edit
  </button>
  <button className="w-full px-4 py-2 text-left hover:bg-gray-50">
    <Trash className="w-4 h-4 inline mr-2" />
    Delete
  </button>
</div>
```

### Desktop Hover Pattern:
```jsx
// Example: Show actions on hover
<div className="group relative">
  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
    <button>Edit</button>
    <button>Delete</button>
  </div>
</div>
```

### Gradient Button Pattern:
```jsx
// Primary action
<button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:shadow-xl transition-all">
  Continue
</button>

// Secondary action
<button className="bg-white border-2 border-gray-300 px-6 py-3 rounded-lg hover:border-purple-600 transition-all">
  Cancel
</button>
```

---

## 🔐 SECURITY & AUTHENTICATION

### Authentication Flow:
1. **Primary:** Google OAuth (instant, 2-3 seconds)
2. **Fallback:** Magic link email (30-60 seconds)

### JWT Token:
- **Storage:** localStorage (key: 'token')
- **Expiration:** 24 hours
- **Refresh:** 7 days
- **Header:** `Authorization: Bearer <token>`

### Protected Routes:
- Check `authStore.isAuthenticated` before rendering
- Redirect to login if not authenticated
- Use `<Navigate to="/login" />` for redirects

### API Authorization:
- **Public endpoints:** `/api/v1/events/public`, `/api/v1/groups/public`
- **Protected endpoints:** All POST/PUT/DELETE require JWT
- **Admin endpoints:** `/api/v1/admin/*` require ADMIN role

---

## 📊 ANALYTICS TRACKING

### Mixpanel Events (src/lib/analytics.js):
```javascript
// Page views (automatic via RouteTracker)
trackPageView(pageName, url)

// Authentication
trackAuthMethodSelected(method) // 'google' | 'magic_link'
trackLoginCompleted(method, isNewUser)

// Events
trackEventViewed(eventId, eventTitle)
trackJoinEventClicked(eventId, requiresLogin)
trackJoinEventCompleted(eventId)

// PWA
trackPWAInstalled()
trackPushNotificationEnabled()
```

### User Identity:
```javascript
// Set on login
identifyUser(userId, email, role)

// Clear on logout
resetUser()
```

---

## 🐛 COMMON MISTAKES TO AVOID

### 1. ❌ Using Railway URLs
```javascript
// WRONG
const apiUrl = 'https://outmeets-production.up.railway.app/api/v1';

// CORRECT
const apiUrl = 'https://hikehub-backend-nd4r.onrender.com/api/v1';
```

### 2. ❌ Wrong Flyway Version
```sql
-- WRONG (version too low or already exists)
V1__add_new_feature.sql

-- CORRECT (check latest version first!)
V19__add_new_feature.sql
```

### 3. ❌ Missing Mobile Implementation
```jsx
// WRONG (desktop only)
<button className="hover:bg-gray-100">Edit</button>

// CORRECT (mobile + desktop)
<button className="p-2 hover:bg-gray-100 lg:hidden">
  <MoreVertical />
</button>
<button className="hidden lg:block hover:bg-gray-100">
  Edit
</button>
```

### 4. ❌ Not Reusing Components
```jsx
// WRONG (creating new avatar component)
<div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
  {initials}
</div>

// CORRECT (using ProfileAvatar)
<ProfileAvatar member={member} size="md" />
```

### 5. ❌ Inconsistent Colors
```jsx
// WRONG (random colors)
<div className="bg-blue-500 text-yellow-300">

// CORRECT (brand colors)
<div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
```

---

## 📝 DEVELOPMENT WORKFLOW

### Before Making Changes:
1. ✅ Read this file completely
2. ✅ Check latest Flyway version
3. ✅ Verify component doesn't already exist
4. ✅ Plan mobile AND desktop implementation
5. ✅ Use correct backend URL (Render, not Railway)

### Creating New Features:
1. **Backend first:** Create entities, repositories, services, controllers
2. **Database migration:** Use correct Flyway naming (V{N}__)
3. **Frontend API:** Add to `src/lib/api.js`
4. **Mobile UI:** Design for 375px viewport first
5. **Desktop UI:** Add responsive enhancements
6. **Reusable components:** Extract common patterns
7. **Analytics:** Add Mixpanel tracking if user-facing
8. **Testing:** Test on mobile AND desktop

### Deployment:
1. **Frontend:** Push to main → Netlify auto-deploys
2. **Backend:** Push to main → Render auto-deploys (30s cold start)
3. **Database:** Flyway runs migrations automatically
4. **Verify:** Check https://www.outmeets.com

---

## 🎯 FEATURE IMPLEMENTATION CHECKLIST

When implementing ANY feature, verify:

- [ ] Mobile design implemented (< 768px)
- [ ] Desktop design implemented (> 1024px)
- [ ] Reused existing components where possible
- [ ] Used OutMeets brand colors (purple-pink-orange)
- [ ] Added proper loading states
- [ ] Added error handling with user-friendly messages
- [ ] Used correct backend URL (Render)
- [ ] Flyway migration uses correct version number
- [ ] Added Mixpanel tracking (if user-facing)
- [ ] Tested on mobile viewport
- [ ] Tested on desktop viewport
- [ ] Added to this config if new pattern created

---

## 📚 KEY DOCUMENTATION FILES

- **Security:** `docs/COMPREHENSIVE_SECURITY_REVIEW.md`
- **Deployment:** `docs/DEPLOYMENT_GUIDE.md`
- **Instagram Sharing:** `docs/INSTAGRAM_SHARING_FIX.md`
- **Performance:** `docs/PERFORMANCE_OPTIMIZATION_NETLIFY.md`
- **Legal Compliance:** `docs/LEGAL_AGREEMENT_AUDIT_TRAIL.md`
- **Google OAuth:** `docs/GOOGLE_OAUTH_SETUP.md`

---

## 🚀 QUICK REFERENCE

### Backend URL:
```
https://hikehub-backend-nd4r.onrender.com/api/v1
```

### Frontend URL:
```
https://www.outmeets.com
```

### Latest Flyway Version:
```
Check: backend/src/main/resources/db/migration/
Current: V18 (as of last update)
Next: V19
```

### Brand Colors:
```
Purple: #9333EA (purple-600)
Pink: #DB2777 (pink-600)
Orange: #F97316 (orange-500)
```

### Responsive Breakpoints:
```
Mobile: < 768px
Tablet: 768px - 1024px
Desktop: > 1024px
```

---

## ⚠️ FINAL REMINDER

**BEFORE EVERY CHANGE:**
1. Is this mobile AND desktop?
2. Does a component already exist?
3. Am I using Render (not Railway)?
4. Is my Flyway version correct?
5. Am I following the design system?

**If you answer NO to any question, STOP and fix it first!**

---

*Last Updated: March 29, 2026*  
*Platform: OutMeets (HikeHub)*  
*Maintainer: Vivek Kumar*
