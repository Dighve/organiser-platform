import { useState, useEffect, useRef } from 'react'
import { Bell, X, CheckCheck } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsAPI } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'

export default function NotificationBell({
  buttonClassName = 'text-gray-600 hover:text-purple-600',
  iconClassName = '',
  showBadge = true,
  className = '',
  size = 'md', // 'md', 'sm', or 'compact'
  open: controlledOpen,
  onOpenChange,
  disableDropdown = false,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const isControlled = controlledOpen !== undefined
  const isOpenState = isControlled ? controlledOpen : isOpen

  const setOpen = (val) => {
    if (!isControlled) setIsOpen(val)
    if (onOpenChange) onOpenChange(val)
  }

  // Fetch unread count
  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsAPI.getUnreadCount(),
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refetch every 30 seconds
    select: (response) => response.data,
  })

  // Fetch notifications when dropdown is open
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsAPI.getNotifications(0, 10),
    enabled: isAuthenticated && !disableDropdown && isOpenState,
    select: (response) => response.data,
  })

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) => notificationsAPI.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications'])
      queryClient.invalidateQueries(['notifications', 'unread-count'])
    },
  })

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsAPI.markAllAsRead(),
    onSuccess: () => {
      // Optimistically update the UI
      queryClient.setQueryData(['notifications'], (old) => {
        if (!old?.data?.content) return old
        return {
          ...old,
          data: {
            ...old.data,
            content: old.data.content.map(n => ({ ...n, isRead: true }))
          }
        }
      })
      // Then refetch to ensure consistency
      queryClient.invalidateQueries(['notifications'])
      queryClient.invalidateQueries(['notifications', 'unread-count'])
    },
  })

  // Delete notification mutation
  const deleteMutation = useMutation({
    mutationFn: (notificationId) => notificationsAPI.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications'])
      queryClient.invalidateQueries(['notifications', 'unread-count'])
    },
  })

  const iconSize = size === 'sm' || size === 'compact' ? 'w-5 h-5' : 'w-6 h-6'
  const buttonPadding = size === 'compact' ? 'p-0' : size === 'sm' ? 'p-1.5' : 'p-2'

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    if (!disableDropdown && isOpenState) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpenState, disableDropdown])

  if (!isAuthenticated) return null

  const unreadCount = unreadData?.count || 0
  const notifications = notificationsData?.content || []

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.isRead) {
        await markAsReadMutation.mutateAsync(notification.id)
      }
      // Don't auto-delete - let users keep their notification history
    } catch (err) {
      // ignore failures
    }

    if (notification.relatedEventId) {
      navigate(`/events/${notification.relatedEventId}`)
      setOpen(false)
    }
  }

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate()
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bell Icon Button */}
      <div
        role="button"
        tabIndex={0}
        onClick={disableDropdown ? () => navigate('/notifications') : () => setOpen(!isOpenState)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            if (disableDropdown) {
              navigate('/notifications')
            } else {
              setOpen(!isOpenState)
            }
          }
        }}
        className={`relative inline-flex items-center justify-center ${buttonPadding} transition-colors rounded-full hover:bg-purple-50 cursor-pointer ${buttonClassName}`}
      >
        <Bell className={`${iconSize} ${iconClassName}`} />
        {showBadge && unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-pink-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </div>

      {/* Dropdown Panel */}
      {!disableDropdown && isOpenState && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[520px] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
            <h3 className="text-base font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Notifications
            </h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={markAllAsReadMutation.isPending}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-100 rounded-lg transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <Bell className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">No notifications yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  We'll notify you when there's something new
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left p-3 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all ${
                      !notification.isRead ? 'bg-blue-50' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Notification Icon */}
                      <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                        notification.notificationType === 'NEW_EVENT'
                          ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                          : 'bg-gradient-to-br from-orange-500 to-pink-500'
                      }`}>
                        <Bell className="w-4 h-4 text-white" />
                      </div>

                      {/* Notification Content */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm mb-0.5">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                      </div>

                      {/* Unread Indicator */}
                      {!notification.isRead && (
                        <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {/* {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  navigate('/notifications')
                  setIsOpen(false)
                }}
                className="w-full text-center text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                View all notifications
              </button>
            </div>
          )} */}
        </div>
      )}
    </div>
  )
}
