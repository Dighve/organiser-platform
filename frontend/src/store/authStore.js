import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { jwtDecode } from 'jwt-decode'

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
      tokenExpiry: null,
      isAuthenticated: false,
      pendingEmail: null,
      returnUrl: null, // URL to redirect to after login
      
      login: (userData, token) => {
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
          tokenExpiry,
          isAuthenticated: true,
          pendingEmail: null,
        })
        
        // Set up auto-logout when token expires
        if (tokenExpiry) {
          const timeUntilExpiry = tokenExpiry - Date.now()
          if (timeUntilExpiry > 0) {
            setTimeout(() => {
              // Only log out if the token hasn't been refreshed
              if (get().tokenExpiry === tokenExpiry) {
                get().logout('Your session has expired. Please log in again.')
              }
            }, timeUntilExpiry)
          }
        }
      },
      
      logout: (message = null) => {
        // Show a message if provided (useful for session expiration)
        if (message) {
          // You can replace this with your preferred notification system
          alert(message)
        }
        
        set({
          user: null,
          token: null,
          tokenExpiry: null,
          isAuthenticated: false,
          pendingEmail: null,
        })
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
        tokenExpiry: state.tokenExpiry,
        isAuthenticated: state.isAuthenticated,
        returnUrl: state.returnUrl, // Persist return URL across page reloads
      }),
    }
  )
)

// Initialize the store and check token on app load
const initializeAuth = () => {
  const state = useAuthStore.getState()
  if (state.token && isTokenExpired(state.token)) {
    state.logout('Your session has expired. Please log in again.')
  }
}

// Run initialization when the store is first created
initializeAuth()
