import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { jwtDecode } from 'jwt-decode'
import toast from 'react-hot-toast'

// Helper function to check if token is expired
export const isTokenExpired = (token) => {
  if (!token) return true
  try {
    const { exp } = jwtDecode(token)
    return Date.now() >= exp * 1000
  } catch {
    return true
  }
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      tokenExpiry: null,
      isAuthenticated: false,
      pendingEmail: null,
      returnUrl: null, // URL to redirect to after login
      inviteToken: null, // Organiser invite token — persisted across magic-link redirects
      
      login: (userData, token, refreshToken = null) => {
        let tokenExpiry = null
        try {
          const { exp } = jwtDecode(token)
          tokenExpiry = exp * 1000 // Convert to milliseconds
        } catch (e) {
          console.error('Invalid token format:', e)
        }
        
        set({
          user: userData,
          token,
          refreshToken,
          tokenExpiry,
          isAuthenticated: true,
          pendingEmail: null,
        })
        
        // No auto-logout - token refresh interceptor will handle expiration
      },
      
      logout: async (message = null) => {
        // Revoke refresh token on server
        const { refreshToken } = get()
        if (refreshToken) {
          try {
            // Use same base URL pattern as api.js (VITE_API_URL already includes /api/v1)
            const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken }),
            })
            // Don't block logout if revocation fails
          } catch (error) {
            console.error('Failed to revoke refresh token:', error)
          }
        }
        
        // Show a message if provided (useful for session expiration)
        if (message) {
          // Use non-blocking toast instead of alert() for better UX
          try { toast.error(message, { duration: 5000, id: 'session-expired' }) } catch { /* toast may not be mounted yet */ }
        }
        
        set({
          user: null,
          token: null,
          refreshToken: null,
          tokenExpiry: null,
          isAuthenticated: false,
          pendingEmail: null,
          returnUrl: null, // Always clear returnUrl on logout so it doesn't bleed into the next user's session
        })
        
        // Explicitly wipe the persisted auth key from localStorage so Safari doesn't
        // serve a stale snapshot when the next user opens the app on the same device.
        try {
          localStorage.removeItem('auth-storage')
        } catch (e) {
          // localStorage may be unavailable in some private-browsing contexts
        }
      },
      
      setPendingEmail: (email) => {
        set({ pendingEmail: email })
      },
      
      setReturnUrl: (url) => {
        set({ returnUrl: url })
      },
      
      clearReturnUrl: () => {
        set({ returnUrl: null })
      },
      
      setInviteToken: (token) => {
        set({ inviteToken: token })
      },
      
      clearInviteToken: () => {
        set({ inviteToken: null })
      },
      
      updateUser: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData },
        }))
      },
      
      // Check if the current token is valid
      isTokenValid: () => {
        const { token, tokenExpiry } = get()
        return token && tokenExpiry && tokenExpiry > Date.now()
      },
    }),
    {
      name: 'auth-storage',
      // Only persist these fields
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        tokenExpiry: state.tokenExpiry,
        isAuthenticated: state.isAuthenticated,
        returnUrl: state.returnUrl, // Persist return URL across page reloads
        inviteToken: state.inviteToken, // Persist invite token across magic-link redirects
      }),
    }
  )
)

// Initialize the store and check token on app load
const initializeAuth = () => {
  const state = useAuthStore.getState()
  if (state.token && isTokenExpired(state.token)) {
    // If we have a refresh token, leave the session alone —
    // the API interceptor will silently refresh on the first API call
    if (!state.refreshToken) {
      state.logout('Your session has expired. Please log in again.')
    }
  }
}

// Run initialization when the store is first created
initializeAuth()

// Listen for storage changes from other tabs
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'auth-storage' && event.newValue) {
      try {
        const newState = JSON.parse(event.newValue)
        const currentState = useAuthStore.getState()
        
        // Update if authentication state changed OR if tokens changed (rotation)
        const authChanged = newState.state.isAuthenticated !== currentState.isAuthenticated
        const tokensChanged = newState.state.token !== currentState.token || 
                             newState.state.refreshToken !== currentState.refreshToken
        
        if (authChanged || tokensChanged) {
          // Manually update the store to trigger re-renders
          useAuthStore.setState({
            user: newState.state.user,
            token: newState.state.token,
            refreshToken: newState.state.refreshToken,
            tokenExpiry: newState.state.tokenExpiry,
            isAuthenticated: newState.state.isAuthenticated,
            returnUrl: newState.state.returnUrl,
          })
        }
      } catch (error) {
        console.error('Error parsing storage event:', error)
      }
    }
  })
}
