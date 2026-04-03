import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { Toaster, toast } from 'react-hot-toast'
import { X } from 'lucide-react'
import App from './App'
import './index.css'
import { initAnalytics, trackPWAInstallPromptShown, trackPWAInstalled } from './lib/analytics'

// Google OAuth Client ID - You'll need to get this from Google Cloud Console
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID_HERE'

if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
  console.error('⚠️ Google OAuth will not work! Add VITE_GOOGLE_CLIENT_ID to your .env file')
}

// Initialise Mixpanel as early as possible
initAnalytics()

// PWA install tracking
window.addEventListener('beforeinstallprompt', () => {
  trackPWAInstallPromptShown()
})
window.addEventListener('appinstalled', () => {
  trackPWAInstalled()
})

// Disable browser's automatic scroll restoration before any rendering
// This prevents the browser from restoring scroll position from previous visits
if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual'
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 10 * 60 * 1000, // 10 minutes - data stays fresh longer
      cacheTime: 30 * 60 * 1000, // 30 minutes - keep in cache longer
    },
  },
})

// Register service worker for PWA/offline
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .catch((err) => console.error('Service worker registration failed', err))
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#363636',
                padding: '16px',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              },
              success: {
                duration: 4000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          >
            {(t) => (
              <div 
                className={`${t.visible ? 'animate-enter' : 'animate-leave'} flex items-center gap-3 bg-white text-gray-800 px-4 py-3 rounded-lg shadow-lg`}
              >
                {/* Toast icon */}
                {t.icon && (
                  <div className="flex-shrink-0">
                    {t.icon}
                  </div>
                )}
                
                {/* Toast message */}
                <div className="flex-1">
                  {typeof t.message === 'string' ? (
                    <p className="text-sm font-medium">{t.message}</p>
                  ) : (
                    t.message
                  )}
                </div>
                
                {/* Close button */}
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  aria-label="Close notification"
                >
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
            )}
          </Toaster>
        </BrowserRouter>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>,
)
