import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'

// Refresh 60 seconds before the token actually expires
const REFRESH_BEFORE_MS = 60_000

let refreshTimer = null
let isRefreshing = false
let waitQueue = [] // callers waiting for an in-progress refresh

function processQueue(error, token) {
  waitQueue.forEach(p => (error ? p.reject(error) : p.resolve(token)))
  waitQueue = []
}

/**
 * Performs a token refresh.
 * - If a refresh is already in progress, queues the caller and returns the same token.
 * - On success, updates the auth store and returns the new access token.
 * - On failure, logs the user out and throws.
 */
export async function refreshAccessToken() {
  if (isRefreshing) {
    return new Promise((resolve, reject) => waitQueue.push({ resolve, reject }))
  }

  const { refreshToken, user: currentUser, login, logout } = useAuthStore.getState()

  if (!refreshToken) {
    logout('Your session has expired. Please log in again.')
    throw new Error('No refresh token available')
  }

  isRefreshing = true
  try {
    const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken })
    const { token: newToken, refreshToken: newRefreshToken, userId, email, role, hasOrganiserRole } = data

    // Merge into existing user to preserve profile fields the refresh endpoint doesn't return
    login(
      { ...currentUser, id: userId, email, role, hasOrganiserRole },
      newToken,
      newRefreshToken
    )

    processQueue(null, newToken)
    return newToken
  } catch (err) {
    processQueue(err, null)
    logout('Your session has expired. Please log in again.')
    throw err
  } finally {
    isRefreshing = false
  }
}

function scheduleRefresh(tokenExpiry) {
  if (refreshTimer) {
    clearTimeout(refreshTimer)
    refreshTimer = null
  }
  if (!tokenExpiry) return

  const delay = tokenExpiry - Date.now() - REFRESH_BEFORE_MS

  if (delay <= 0) {
    // Already inside the refresh window — act immediately
    refreshAccessToken().catch(() => {})
  } else {
    refreshTimer = setTimeout(() => refreshAccessToken().catch(() => {}), delay)
  }
}

// Reschedule whenever the token changes; cancel on logout
useAuthStore.subscribe((state, prev) => {
  if (!state.isAuthenticated) {
    if (refreshTimer) { clearTimeout(refreshTimer); refreshTimer = null }
    return
  }
  if (state.tokenExpiry !== prev.tokenExpiry && state.refreshToken) {
    scheduleRefresh(state.tokenExpiry)
  }
})

// When the tab becomes visible again (phone unlock, alt-tab back), recalculate.
// The timer may have fired while the JS thread was suspended, or the remaining
// time may now be less than REFRESH_BEFORE_MS.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return
    const { isAuthenticated, tokenExpiry, refreshToken } = useAuthStore.getState()
    if (!isAuthenticated || !refreshToken) return

    const msLeft = (tokenExpiry ?? 0) - Date.now()
    if (msLeft < REFRESH_BEFORE_MS) {
      refreshAccessToken().catch(() => {})
    } else {
      scheduleRefresh(tokenExpiry)
    }
  })
}

// Bootstrap: pick up any session that was rehydrated from localStorage before
// this module was imported (i.e. on every page load where the user is already
// logged in).
;(function init() {
  const { isAuthenticated, tokenExpiry, refreshToken } = useAuthStore.getState()
  if (isAuthenticated && tokenExpiry && refreshToken) {
    scheduleRefresh(tokenExpiry)
  }
}())
