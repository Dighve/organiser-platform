import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      pendingEmail: null, // Store email while waiting for magic link
      
      login: (userData, token) => {
        set({
          user: userData,
          token,
          isAuthenticated: true,
          pendingEmail: null,
        })
      },
      
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          pendingEmail: null,
        })
      },
      
      setPendingEmail: (email) => {
        set({ pendingEmail: email })
      },
      
      updateUser: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData },
        }))
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)
