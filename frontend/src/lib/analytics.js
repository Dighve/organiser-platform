import mixpanel from 'mixpanel-browser'

const TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN
let initialized = false

// ─── Platform / Device Detection ─────────────────────────────────────────────

function detectPlatform() {
  const ua = navigator.userAgent
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  if (isStandalone) return 'pwa'
  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) return 'ios'
  if (/android/i.test(ua)) return 'android'
  return 'desktop'
}

function detectOS() {
  const ua = navigator.userAgent
  if (/Windows/.test(ua)) return 'Windows'
  if (/iPhone|iPad/.test(ua)) return 'iOS'
  if (/Android/.test(ua)) return 'Android'
  if (/Mac OS X/.test(ua)) return 'macOS'
  if (/Linux/.test(ua)) return 'Linux'
  return 'Unknown'
}

function detectBrowser() {
  const ua = navigator.userAgent
  if (/Edg\//.test(ua)) return 'Edge'
  if (/Chrome/.test(ua) && !/Chromium/.test(ua)) return 'Chrome'
  if (/Firefox/.test(ua)) return 'Firefox'
  if (/Safari/.test(ua) && !/Chrome/.test(ua)) return 'Safari'
  return 'Other'
}

// ─── Init ─────────────────────────────────────────────────────────────────────

export function initAnalytics() {
  if (!TOKEN) {
    if (import.meta.env.DEV) {
      console.warn('[Analytics] VITE_MIXPANEL_TOKEN not set — tracking disabled')
    }
    return
  }


  mixpanel.init(TOKEN, {
    debug: import.meta.env.DEV,
    track_pageview: false,
    persistence: 'localStorage',
    ignore_dnt: false,
    api_host: 'https://api-eu.mixpanel.com', // EU data residency
  })

  initialized = true

  const platform = detectPlatform()
  mixpanel.register({
    platform,
    is_pwa: platform === 'pwa',
    os: detectOS(),
    browser: detectBrowser(),
    app_name: 'OutMeets',
  })

  console.log('[Analytics] ✅ Mixpanel initialized successfully')
}

function track(event, props = {}) {
  if (!initialized) return
  try {
    mixpanel.track(event, props)
  } catch {
    // silent fail
  }
}

// ─── User Identity ────────────────────────────────────────────────────────────

export function identifyUser(userId, email, role) {
  if (!initialized) return
  try {
    mixpanel.identify(String(userId))
    mixpanel.people.set({
      $email: email,
      role: role || 'MEMBER',
      platform: detectPlatform(),
      last_seen: new Date().toISOString(),
    })
  } catch {
    // silent fail
  }
}

export function resetUser() {
  if (!initialized) return
  try {
    mixpanel.reset()
  } catch {
    // silent fail
  }
}

// ─── Welcome Screen ───────────────────────────────────────────────────────────

export const trackWelcomeScreenViewed = () =>
  track('Welcome Screen Viewed', { platform: detectPlatform() })

export const trackDiscoverEventsClicked = () =>
  track('Discover Events Clicked', { source: 'welcome_screen', platform: detectPlatform() })

export const trackLoginModalOpened = (trigger) =>
  track('Login Modal Opened', { trigger })

// ─── Auth Funnel ──────────────────────────────────────────────────────────────

export const trackAuthMethodSelected = (method) =>
  track('Auth Method Selected', { method }) // 'google' | 'magic_link'

export const trackMagicLinkRequested = (emailDomain) =>
  track('Magic Link Requested', { email_domain: emailDomain })

export const trackMagicLinkVerified = () =>
  track('Magic Link Verified')

export const trackGoogleAuthCompleted = () =>
  track('Google Auth Completed')

export const trackLoginCompleted = (method, isNewUser = false) =>
  track('Login Completed', { method, is_new_user: isNewUser })

export const trackLogout = () =>
  track('Logout')

// ─── Event (Join) Funnel ──────────────────────────────────────────────────────

export const trackEventViewed = (eventId, eventTitle, groupName, isAuthenticated) =>
  track('Event Viewed', {
    event_id: String(eventId),
    event_title: eventTitle,
    group_name: groupName,
    is_authenticated: isAuthenticated,
  })

export const trackJoinEventClicked = (eventId, eventTitle, isAuthenticated) =>
  track('Join Event Clicked', {
    event_id: String(eventId),
    event_title: eventTitle,
    is_authenticated: isAuthenticated,
    requires_login: !isAuthenticated,
  })

export const trackJoinEventGuestSelected = (eventId, guestCount) =>
  track('Join Event Guest Selected', {
    event_id: String(eventId),
    guest_count: guestCount,
  })

export const trackJoinEventCompleted = (eventId, eventTitle, guestCount) => {
  track('Join Event Completed', {
    event_id: String(eventId),
    event_title: eventTitle,
    guest_count: guestCount,
  })
  if (initialized) {
    try {
      mixpanel.people.increment('events_joined')
    } catch {
      // silent fail
    }
  }
}

export const trackLeaveEvent = (eventId, eventTitle) =>
  track('Leave Event', { event_id: String(eventId), event_title: eventTitle })

// ─── Page Views ───────────────────────────────────────────────────────────────

export const trackPageView = (pageName, properties = {}) =>
  track('Page Viewed', { page: pageName, url: window.location.pathname, ...properties })

// ─── Search ───────────────────────────────────────────────────────────────────

export const trackSearch = (query, resultCount) =>
  track('Search Performed', { query, result_count: resultCount })

// ─── PWA ──────────────────────────────────────────────────────────────────────

export const trackPWAInstallPromptShown = () =>
  track('PWA Install Prompt Shown')

export const trackPWAInstalled = () => {
  track('PWA Installed')
  if (initialized) {
    try {
      mixpanel.people.set({ pwa_installed: true })
      mixpanel.register({ is_pwa: true, platform: 'pwa' })
    } catch {
      // silent fail
    }
  }
}

export const trackPWAInstallDismissed = () =>
  track('PWA Install Dismissed')

// ─── Push Notifications ───────────────────────────────────────────────────────

export const trackNotificationPromptShown = () =>
  track('Push Notification Prompt Shown')

export const trackNotificationEnabled = () => {
  track('Push Notification Enabled')
  if (initialized) {
    try {
      mixpanel.people.set({ push_notifications_enabled: true })
    } catch {
      // silent fail
    }
  }
}

export const trackNotificationDismissed = () =>
  track('Push Notification Dismissed')

// ─── Share ────────────────────────────────────────────────────────────────────

export const trackShareOpened = (contentType, url) =>
  track('Share Opened', { 
    content_type: contentType, // 'event' | 'group'
    url: url 
  })

export const trackShareMethodSelected = (contentType, method, url) =>
  track('Share Method Selected', { 
    content_type: contentType, // 'event' | 'group'
    method: method, // 'native' | 'copy_link' | 'whatsapp' | 'email' | 'facebook' | 'twitter'
    url: url 
  })

export const trackShareCompleted = (contentType, method, url) =>
  track('Share Completed', { 
    content_type: contentType,
    method: method,
    url: url 
  })

// ─── Error Tracking ───────────────────────────────────────────────────────────

export const trackError = (error, context = {}) => {
  const errorData = {
    error_message: error?.message || String(error),
    error_name: error?.name || 'Error',
    error_stack: error?.stack?.substring(0, 500), // Limit stack trace
    page: window.location.pathname,
    url: window.location.href,
    ...context
  }
  
  track('Error Occurred', errorData)
  
  // Also log to console in development
  if (import.meta.env.DEV) {
    console.error('[Analytics] Error tracked:', errorData)
  }
}

export const trackAPIError = (endpoint, statusCode, errorMessage) =>
  track('API Error', {
    endpoint,
    status_code: statusCode,
    error_message: errorMessage,
    page: window.location.pathname
  })
