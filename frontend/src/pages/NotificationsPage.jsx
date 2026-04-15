import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSmartBack } from '../hooks/useSmartBack'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, ArrowLeft, CheckCheck, Loader2, BellOff, BellRing, Smartphone, Settings } from 'lucide-react'
import { notificationsAPI } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { formatDistanceToNow } from 'date-fns'
import {
  isPushSupported,
  getPermissionState,
  subscribeToPush,
  isSubscribedLocally,
  isIOS,
  isStandalone,
} from '../lib/pushNotifications'
import toast from 'react-hot-toast'

function PushNotificationStatus() {
  const [permState, setPermState] = useState('default')
  const [subscribed, setSubscribed] = useState(false)
  const [enabling, setEnabling] = useState(false)

  useEffect(() => {
    setPermState(getPermissionState())
    setSubscribed(isSubscribedLocally())
  }, [])

  const handleEnable = async () => {
    setEnabling(true)
    const result = await subscribeToPush()
    if (result.success) {
      toast.success('Notifications enabled!')
      setPermState('granted')
      setSubscribed(true)
    } else {
      toast.error(result.reason || 'Could not enable notifications')
      setPermState(getPermissionState())
    }
    setEnabling(false)
  }

  // iOS browser (not standalone) — needs Add to Home Screen first
  if (isIOS() && !isStandalone()) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 mb-3">
        <Smartphone className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="min-w-0">
          <p className="font-semibold text-blue-900 text-sm">Enable notifications on iOS</p>
          <p className="text-xs text-blue-700 mt-0.5">
            Tap the <strong>Share ⬆</strong> button in Safari, choose <strong>Add to Home Screen</strong>, then open the app from your home screen to enable notifications.
          </p>
        </div>
      </div>
    )
  }

  // Push not supported on this browser
  if (!isPushSupported()) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 mb-3">
        <BellOff className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-gray-500">Push notifications are not supported in this browser.</p>
      </div>
    )
  }

  // Permission denied — direct user to system settings
  if (permState === 'denied') {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 mb-3">
        <Settings className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="min-w-0">
          <p className="font-semibold text-amber-900 text-sm">Notifications are blocked</p>
          <p className="text-xs text-amber-700 mt-0.5">
            To receive alerts, go to your device <strong>Settings → Apps → OutMeets (or your browser) → Notifications</strong> and allow notifications, then come back here.
          </p>
        </div>
      </div>
    )
  }

  // Already enabled
  if (permState === 'granted' && subscribed) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 mb-3">
        <BellRing className="h-5 w-5 text-green-600 flex-shrink-0" />
        <p className="text-sm font-semibold text-green-800">Push notifications are enabled</p>
      </div>
    )
  }

  // Not yet asked / permission granted but not subscribed
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3 mb-3">
      <Bell className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-purple-900 text-sm">Stay in the loop</p>
        <p className="text-xs text-purple-700 mt-0.5">Enable push notifications to get alerts for new events and comments even when the app is closed.</p>
      </div>
      <button
        onClick={handleEnable}
        disabled={enabling}
        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg disabled:opacity-60 hover:shadow-md transition-all"
      >
        {enabling ? <Loader2 className="h-3 w-3 animate-spin" /> : <Bell className="h-3 w-3" />}
        {enabling ? 'Enabling…' : 'Enable'}
      </button>
    </div>
  )
}

export default function NotificationsPage() {
  const navigate = useNavigate()
  const goBack = useSmartBack('/')
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuthStore()

  const {
    data: notificationsData,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['notifications', 'mobile'],
    queryFn: () => notificationsAPI.getNotifications(0, 50).then((res) => res.data),
    enabled: isAuthenticated,
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsAPI.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications'])
      queryClient.invalidateQueries(['notifications', 'unread-count'])
      queryClient.invalidateQueries(['notifications', 'mobile'])
    },
  })

  const markAsReadMutation = useMutation({
    mutationFn: (id) => notificationsAPI.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications'])
      queryClient.invalidateQueries(['notifications', 'unread-count'])
      queryClient.invalidateQueries(['notifications', 'mobile'])
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => notificationsAPI.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications'])
      queryClient.invalidateQueries(['notifications', 'unread-count'])
      queryClient.invalidateQueries(['notifications', 'mobile'])
    },
  })

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.isRead) {
        await markAsReadMutation.mutateAsync(notification.id)
      }
      // Don't auto-delete - let users keep their notification history
    } catch (_) { /* ignore */ }

    if (notification.relatedEventId) {
      navigate(`/events/${notification.relatedEventId}`)
    }
  }

  const notifications = notificationsData?.content || []

  return (
    <div className="sm:hidden min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/60 bg-white/70 backdrop-blur-md">
        <button
          onClick={goBack}
          className="p-2 rounded-full bg-white shadow text-gray-700"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-purple-600" />
          <h1 className="text-lg font-bold text-gray-900">Notifications</h1>
        </div>
        <button
          onClick={() => markAllAsReadMutation.mutate()}
          disabled={markAllAsReadMutation.isLoading}
          className="flex items-center gap-1 text-sm font-semibold text-purple-600 disabled:opacity-50"
        >
          {markAllAsReadMutation.isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCheck className="h-4 w-4" />
          )}
          <span>Mark all</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        <PushNotificationStatus />
        {isLoading || isFetching ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 text-purple-600 animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
            <Bell className="h-10 w-10 text-gray-300 mb-2" />
            <p className="font-semibold">No notifications yet</p>
            <p className="text-sm text-gray-400">We'll notify you when there's something new.</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`rounded-xl p-3 shadow-sm border ${
                notification.isRead ? 'bg-white border-white/70' : 'bg-blue-50 border-blue-100'
              }`}
              role="button"
              tabIndex={0}
              onClick={() => handleNotificationClick(notification)}
              onKeyDown={(e) => e.key === 'Enter' && handleNotificationClick(notification)}
            >
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5">
                  <Bell className="h-4 w-4 text-purple-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm mb-0.5">{notification.title}</p>
                  <p className="text-xs text-gray-600 mb-1">{notification.message}</p>
                  <p className="text-[11px] text-gray-400">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
