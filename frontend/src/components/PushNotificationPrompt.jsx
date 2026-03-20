import { useState, useEffect, useRef } from 'react'
import { Bell, X, Smartphone } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import {
  isPushSupported,
  getPermissionState,
  subscribeToPush,
  isSubscribedLocally,
  isIOS,
  isStandalone,
  PUSH_SUBSCRIPTION_KEY,
} from '../lib/pushNotifications'
import toast from 'react-hot-toast'
import {
  trackNotificationPromptShown,
  trackNotificationEnabled,
  trackNotificationDismissed,
} from '../lib/analytics'

/**
 * Snooze key stores a timestamp (ms). Prompt is suppressed until that time.
 * On fresh login the snooze is bypassed so users are always asked after sign-in.
 * "Not now" snoozes for 7 days; enabling/denying snoozes for 30 days.
 */
const SNOOZE_KEY = 'outmeets-push-prompt-snooze-until'
const SNOOZE_NOT_NOW_MS = 7 * 24 * 60 * 60 * 1000   // 7 days
const SNOOZE_ACTED_MS  = 30 * 24 * 60 * 60 * 1000   // 30 days

function isSnoozed() {
  const until = localStorage.getItem(SNOOZE_KEY)
  return until && Date.now() < parseInt(until, 10)
}

function snooze(durationMs) {
  localStorage.setItem(SNOOZE_KEY, String(Date.now() + durationMs))
}

export default function PushNotificationPrompt() {
  const { isAuthenticated } = useAuthStore()
  const [visible, setVisible] = useState(false)
  const [showIOSHint, setShowIOSHint] = useState(false)
  // Track the previous auth value to detect fresh login (false → true)
  const prevAuthenticated = useRef(false)

  useEffect(() => {
    const wasAuthenticated = prevAuthenticated.current
    prevAuthenticated.current = isAuthenticated

    if (!isAuthenticated) return

    const justLoggedIn = !wasAuthenticated && isAuthenticated

    // ── iOS in browser (not yet installed as PWA) ─────────────────────────────
    // PushManager is only available on iOS when running as a standalone PWA.
    // Show a one-time hint on fresh login so the user knows to install first.
    if (isIOS() && !isStandalone()) {
      if (justLoggedIn && !isSnoozed()) {
        const timer = setTimeout(() => {
          setShowIOSHint(true)
          trackNotificationPromptShown()
        }, 3000)
        return () => clearTimeout(timer)
      }
      return
    }

    if (!isPushSupported()) return
    
    // Don't show prompt if permission is already granted (regardless of localStorage)
    // This fixes the issue where users granted permission but subscription failed
    if (getPermissionState() === 'granted') {
      // Double-check: if permission granted but not subscribed locally, 
      // check if there's actually a real subscription
      const checkRealSubscription = async () => {
        try {
          const registration = await navigator.serviceWorker.ready
          const subscription = await registration.pushManager.getSubscription()
          if (subscription) {
            // Fix localStorage to match reality
            localStorage.setItem(PUSH_SUBSCRIPTION_KEY, 'true')
          }
        } catch (error) {
          console.warn('Could not check push subscription:', error)
        }
      }
      checkRealSubscription()
      return
    }
    
    if (getPermissionState() === 'denied') return

    // On fresh login: always prompt (bypass snooze) so the user is asked after every sign-in.
    // On page reload while already authenticated: respect the snooze.
    if (!justLoggedIn && isSnoozed()) return

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
      snooze(SNOOZE_ACTED_MS)
    } else {
      toast.error(result.reason || 'Could not enable notifications')
      snooze(SNOOZE_NOT_NOW_MS)
    }
  }

  const handleDismiss = () => {
    trackNotificationDismissed()
    setVisible(false)
    setShowIOSHint(false)
    snooze(SNOOZE_NOT_NOW_MS)
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
