import { useState, useEffect } from 'react'
import { Bell, X, Smartphone } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import {
  isPushSupported,
  getPermissionState,
  subscribeToPush,
  isIOS,
  isStandalone,
} from '../lib/pushNotifications'
import toast from 'react-hot-toast'
import {
  trackNotificationPromptShown,
  trackNotificationEnabled,
  trackNotificationDismissed,
} from '../lib/analytics'

const DISMISSED_KEY = 'outmeets-push-prompt-dismissed'

function isDismissed() {
  return localStorage.getItem(DISMISSED_KEY) === 'true'
}

export default function PushNotificationPrompt() {
  const { isAuthenticated } = useAuthStore()
  const [visible, setVisible] = useState(false)
  const [showIOSHint, setShowIOSHint] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) return

    // ── iOS in browser (not yet installed as PWA) ─────────────────────────────
    if (isIOS() && !isStandalone()) {
      if (!isDismissed()) {
        const timer = setTimeout(() => {
          setShowIOSHint(true)
          trackNotificationPromptShown()
        }, 3000)
        return () => clearTimeout(timer)
      }
      return
    }

    if (!isPushSupported()) return
    if (getPermissionState() === 'denied') return

    if (getPermissionState() === 'granted') {
      // Silent resubscribe if subscription is missing
      navigator.serviceWorker.ready
        .then(reg => reg.pushManager.getSubscription())
        .then(sub => { if (!sub) subscribeToPush().catch(err => console.warn('Silent resubscribe failed:', err)) })
        .catch(() => {})
      return
    }

    // Permission is 'default' — show prompt unless user has dismissed it
    if (isDismissed()) return

    const timer = setTimeout(() => {
      setVisible(true)
      trackNotificationPromptShown()
    }, 3000)
    return () => clearTimeout(timer)
  }, [isAuthenticated])

  const handleEnable = async () => {
    setVisible(false)
    const result = await subscribeToPush()
    if (result.success) {
      trackNotificationEnabled()
      toast.success('Notifications enabled!')
    } else {
      toast.error(result.reason || 'Could not enable notifications')
    }
  }

  const handleDismiss = () => {
    trackNotificationDismissed()
    setVisible(false)
    setShowIOSHint(false)
    localStorage.setItem(DISMISSED_KEY, 'true')
  }

  // ── iOS "add to home screen" hint ────────────────────────────────────────────
  if (showIOSHint) {
    return (
      <div className="fixed bottom-24 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-[60] animate-fade-in">
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm">
                Get OutMeets notifications on iOS
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Tap the <strong>Share</strong> button in Safari, then <strong>Add to Home Screen</strong>. Once installed, open the app from your home screen to enable notifications.
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleDismiss}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:shadow-lg transition-all"
                >
                  Got it
                </button>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-24 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-[60] animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm">
              Enable notifications
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Get notified about new events and comments even when the app is closed.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleEnable}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:shadow-lg transition-all"
              >
                Enable
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
