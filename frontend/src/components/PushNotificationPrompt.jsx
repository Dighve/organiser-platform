import { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import {
  isPushSupported,
  getPermissionState,
  subscribeToPush,
  isSubscribedLocally,
} from '../lib/pushNotifications'
import toast from 'react-hot-toast'

/**
 * A small banner that appears once to prompt the user to enable push notifications.
 * Dismissed permanently via localStorage after user acts on it.
 */
const DISMISS_KEY = 'outmeets-push-prompt-dismissed'

export default function PushNotificationPrompt() {
  const { isAuthenticated } = useAuthStore()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) return
    if (!isPushSupported()) return
    if (isSubscribedLocally()) return
    if (localStorage.getItem(DISMISS_KEY) === 'true') return
    if (getPermissionState() === 'denied') return

    // Small delay so it doesn't flash on page load
    const timer = setTimeout(() => setVisible(true), 3000)
    return () => clearTimeout(timer)
  }, [isAuthenticated])

  const handleEnable = async () => {
    const result = await subscribeToPush()
    if (result.success) {
      toast.success('Push notifications enabled!')
    } else {
      toast.error(result.reason || 'Could not enable notifications')
    }
    setVisible(false)
    localStorage.setItem(DISMISS_KEY, 'true')
  }

  const handleDismiss = () => {
    setVisible(false)
    localStorage.setItem(DISMISS_KEY, 'true')
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50 animate-fade-in">
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
