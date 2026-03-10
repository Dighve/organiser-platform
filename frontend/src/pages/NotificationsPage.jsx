import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, ArrowLeft, CheckCheck, Loader2 } from 'lucide-react'
import { notificationsAPI } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { formatDistanceToNow } from 'date-fns'

export default function NotificationsPage() {
  const navigate = useNavigate()
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
          onClick={() => navigate(-1)}
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
