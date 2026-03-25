import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { eventsAPI } from '../lib/api'
import { Calendar, MapPin, Users, DollarSign, Clock, Mountain, ArrowUp, Backpack, Package, FileText, ArrowLeft, LogIn, Lock, TrendingUp, Edit, Trash2, Eye, Copy, Loader, MoreHorizontal, MoreVertical, X, Minus, Plus, MessageSquare } from 'lucide-react'
import { format } from 'date-fns'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import CommentSection from '../components/CommentSection'
import ProfileAvatar from '../components/ProfileAvatar'
import LoginModal from '../components/LoginModal'
import AddToCalendar from '../components/AddToCalendar'
import AddToCalendarModal from '../components/AddToCalendarModal'
import GroupGuidelinesModal from '../components/GroupGuidelinesModal'
import { useFeatureFlags } from '../contexts/FeatureFlagContext'
import {
  trackEventViewed,
  trackJoinEventClicked,
  trackJoinEventGuestSelected,
  trackJoinEventCompleted,
  trackLeaveEvent,
  trackLoginModalOpened,
} from '../lib/analytics'

// ============================================
// CONSTANTS - Default fallback images
// ============================================
const DEFAULT_EVENT_IMAGES = [
  'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1445308394109-4ec2920981b1?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=1200&h=600&fit=crop'
]

// ============================================
// MAIN COMPONENT
// ============================================
export default function EventDetailPage() {
  // ============================================
  // HOOKS & ROUTING
  // ============================================
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAuthenticated, user, setReturnUrl } = useAuthStore()
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const { isEventLocationEnabled, isGoogleMapsEnabled, isStaticMapsEnabled } = useFeatureFlags()
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const trackedEventRef = useRef(null)
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false)
  const [isGuidelinesModalOpen, setIsGuidelinesModalOpen] = useState(false)
  const [isCalendarPickerOpen, setIsCalendarPickerOpen] = useState(false)
  const [isManageOpen, setIsManageOpen] = useState(false)
  const [heroImageError, setHeroImageError] = useState(false)
  const [heroImageLoaded, setHeroImageLoaded] = useState(false)
  const [isJoiningFlow, setIsJoiningFlow] = useState(false) // Track entire join flow until modal opens
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false)
  const [guestCount, setGuestCount] = useState(0)
  const [wantsGuests, setWantsGuests] = useState(false)
  const [isGuestActionsOpen, setIsGuestActionsOpen] = useState(false)
  const [isUpdatingGuests, setIsUpdatingGuests] = useState(false) // Track if this is an update vs new join
  const [isJoinQuestionModalOpen, setIsJoinQuestionModalOpen] = useState(false)
  const [joinQuestionAnswer, setJoinQuestionAnswer] = useState('')
  const [pendingGuestCount, setPendingGuestCount] = useState(0)
  const [isCopying, setIsCopying] = useState(false) // Prevent multiple copy operations
  const [showPublishConfirm, setShowPublishConfirm] = useState(false)

  // ============================================
  // DATA FETCHING - React Query hooks
  // ============================================
  
  // 1. Fetch event details (with 403 handling for members-only events)
  const { data, isLoading, error } = useQuery({
    queryKey: ['event', id, isAuthenticated ? user?.id : 'guest'], // Include auth state in cache key
    queryFn: () => eventsAPI.getEventById(id),
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes - reduces unnecessary refetches
    refetchOnMount: false, // Don't refetch on every mount - use cache
    refetchOnWindowFocus: false, // Don't refetch on window focus - reduces API calls
    retry: (failureCount, error) => {
      // Don't retry on 403 errors (non-member trying to access)
      if (error?.response?.status === 403) {
        return false
      }
      return failureCount < 2
    },
    onError: (error) => {
      if (error?.response?.status !== 403) {
        console.error('Error loading event:', error)
      }
    },
  })

  // 2. Fetch event participants/attendees
  const { data: participantsData } = useQuery({
    queryKey: ['eventParticipants', id],
    queryFn: () => eventsAPI.getEventParticipants(id),
    enabled: !!id,
  })

  // 3. Fetch calendar data for "Add to Calendar" feature
  // Note: We fetch for all authenticated users, but only show button if they've joined
  // The enabled flag will prevent the query from running for unauthenticated users
  const { data: calendarData } = useQuery({
    queryKey: ['eventCalendar', id],
    queryFn: () => eventsAPI.getCalendarData(id),
    enabled: !!id && isAuthenticated,
    retry: false, // Don't retry if user hasn't joined (will get 403)
    select: (response) => response.data,
  })

  // ============================================
  // COMPUTED VALUES - Derived from fetched data
  // ============================================
  const event = data?.data
  
  // Check user's relationship to this event
  const participantIds = [
    ...(event?.participantIds || []),
    ...((participantsData?.data || []).map(p => p.id) || []),
  ].map(id => Number(id))
  const isEventOrganiser = event && isAuthenticated && Number(user?.id) === Number(event?.organiserId)
  const isHost = event && isAuthenticated && event.hostMemberId && Number(user?.id) === Number(event.hostMemberId)
  // Host is automatically registered as participant by backend
  const hasJoined = isAuthenticated && (participantIds.includes(Number(user?.id)) || isHost)
  const currentHeadcount = event?.currentParticipants || 0

  // guest info for current user
  const userParticipant = (participantsData?.data || []).find(
    (p) => p?.id && user?.id && Number(p.id) === Number(user.id)
  )
  const userGuestCount = userParticipant?.guestCount ? Number(userParticipant.guestCount) : 0
  const displayGuestCount = userGuestCount || guestCount || 0

  // capacity calculations (respect user's existing guests)
  const remainingSpots = event?.maxParticipants ? Math.max(0, event.maxParticipants - currentHeadcount) : Number.POSITIVE_INFINITY
  const availableWithUser =
    event?.maxParticipants != null
      ? Math.max(0, event.maxParticipants - (currentHeadcount - (1 + userGuestCount)) - 1)
      : Number.POSITIVE_INFINITY
  const maxGuestSelectable =
    availableWithUser === Number.POSITIVE_INFINITY
      ? Math.max(3, userGuestCount)
      : Math.max(userGuestCount, Math.min(3, availableWithUser))

  // ============================================
  // MUTATIONS - API calls that change data
  // ============================================
  
  // Handle join button click - check authentication first
  const handleJoinClick = () => {
    trackJoinEventClicked(id, event?.title, isAuthenticated)
    if (!isAuthenticated) {
      // Store current URL with action parameter so we can auto-join after login
      setReturnUrl(`/events/${id}?action=join`)
      trackLoginModalOpened('join_event')
      setIsLoginModalOpen(true)
      return
    }
    
    // Check if group has terms and conditions
    const groupGuidelines = event?.group?.groupGuidelines
    if (groupGuidelines && groupGuidelines.trim()) {
      // Show guidelines modal first
      setIsGuidelinesModalOpen(true)
    } else {
      // No terms, open guest selector
      openGuestModal()
    }
  }
  
  const openGuestModal = (prefillCount = 0) => {
    const count = Math.min(maxGuestSelectable, prefillCount)
    setGuestCount(count)
    setWantsGuests(count > 0)
    setIsUpdatingGuests(hasJoined) // If user has already joined, this is an update (not a new join)
    setIsGuestModalOpen(true)
  }
  
  // Handle accepting terms and joining
  const handleAcceptTerms = () => {
    setIsGuidelinesModalOpen(false)
    openGuestModal()
  }

  const handleConfirmGuests = () => {
    const safeGuestCount = wantsGuests ? guestCount : 0
    setIsGuestModalOpen(false)
    trackJoinEventGuestSelected(id, safeGuestCount)
    
    // If event has a join question and this is a new join (not guest update), show question modal
    if (event?.joinQuestion && !isUpdatingGuests) {
      setPendingGuestCount(safeGuestCount)
      setJoinQuestionAnswer('')
      setIsJoinQuestionModalOpen(true)
      return
    }
    
    // Only show joining flow loader for new joins, not updates
    if (!isUpdatingGuests) {
      setIsJoiningFlow(true)
    }
    
    joinMutation.mutate({ guestCount: safeGuestCount })
  }

  const handleSubmitJoinQuestion = () => {
    setIsJoinQuestionModalOpen(false)
    setIsJoiningFlow(true)
    joinMutation.mutate({ guestCount: pendingGuestCount, joinQuestionAnswer: joinQuestionAnswer.trim() || undefined })
  }

  // Join event (register for event + auto-join group - Meetup.com pattern)
  const joinMutation = useMutation({
    mutationFn: (payload = {}) => eventsAPI.joinEvent(id, payload),
    onSuccess: async (data, variables) => {
      // Only show calendar modal for new joins, not guest count updates
      if (!isUpdatingGuests) {
        trackJoinEventCompleted(id, event?.title, variables?.guestCount || 0)
        setIsCalendarModalOpen(true)
      } else {
        // For updates, just show a success toast
        toast.success('Guest count updated successfully')
        setIsUpdatingGuests(false) // Reset the flag
      }
      // Note: isJoiningFlow will be set to false when modal opens (see useEffect below)
      
      // Invalidate queries in background (don't await - let them happen async)
      queryClient.invalidateQueries(['event', id])
      queryClient.invalidateQueries(['eventParticipants', id])
      queryClient.invalidateQueries(['eventCalendar', id])
      queryClient.invalidateQueries(['myEvents'])
      queryClient.invalidateQueries(['allEvents'])
      queryClient.invalidateQueries(['events'])
      queryClient.invalidateQueries(['myGroups']) // Refresh group membership
      
      // Force refetch to update button state and unlock content
      queryClient.refetchQueries(['event', id])
    },
    onError: (error) => {
      setIsJoiningFlow(false) // Stop joining flow on error
      // Check if error is due to authentication
      if (error.response?.status === 401 || error.response?.status === 403) {
        setIsLoginModalOpen(true)
        toast.error('Please sign in to join this event')
      } else {
        toast.error(error.response?.data?.message || 'Failed to join event')
      }
    },
  })

  // Leave event (unregister from event)
  const leaveMutation = useMutation({
    mutationFn: () => eventsAPI.leaveEvent(id),
    onSuccess: async () => {
      setShowLeaveConfirm(false)
      trackLeaveEvent(id, event?.title)
      // Show toast immediately for instant feedback
      toast.success('Successfully left the event')
      
      // Force immediate refetch for instant UI update
      await Promise.all([
        queryClient.refetchQueries(['event', id]),
        queryClient.refetchQueries(['eventParticipants', id]),
        queryClient.refetchQueries(['myEvents']),
      ])
      
      // Invalidate other queries in background
      queryClient.invalidateQueries(['allEvents'])
      queryClient.invalidateQueries(['events'])
    },
    onError: (error) => {
      setShowLeaveConfirm(false)
      toast.error(error.response?.data?.message || 'Failed to leave event')
    },
  })

  // Publish event (organiser only) - Change status from DRAFT to PUBLISHED
  const publishMutation = useMutation({
    mutationFn: () => eventsAPI.publishEvent(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries(['event', id])
      await queryClient.invalidateQueries(['events'])
      await queryClient.invalidateQueries(['allEvents'])
      if (event?.groupId) {
        queryClient.invalidateQueries(['groupEvents', event?.groupId?.toString()])
      }
      await queryClient.refetchQueries(['event', id])
      toast.success('🎉 Event published successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to publish event')
    },
  })

  // Delete event (organiser only)
  const deleteMutation = useMutation({
    mutationFn: () => eventsAPI.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['events'])
      if (event?.groupId) {
        queryClient.invalidateQueries(['groupEvents', event?.groupId?.toString()])
      }
      toast.success('Event deleted successfully')
      navigate('/')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete event')
    },
  })

  // Track event viewed once per unique event load
  useEffect(() => {
    if (event?.id && trackedEventRef.current !== event.id) {
      trackedEventRef.current = event.id
      trackEventViewed(id, event.title, event.group?.name, isAuthenticated)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.id])

  // Force refetch when navigating back to this page
  useEffect(() => {
    if (isAuthenticated && id) {
      // Invalidate and refetch event data to get updated membership status
      queryClient.invalidateQueries(['event', id])
    }
  }, [id, isAuthenticated, queryClient])

  // ============================================
  // EVENT HANDLERS
  // ============================================
  
  // Delete event with confirmation
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      deleteMutation.mutate()
    }
  }

  // Copy event - Navigate to create page with pre-filled data
  const handleCopyEvent = () => {
    // Prevent multiple simultaneous copy operations
    if (isCopying) return
    
    setIsCopying(true)
    
    // Encode event data as URL parameters
    const eventData = {
      title: event?.title,
      description: event?.description,
      location: event?.location,
      latitude: event?.latitude,
      longitude: event?.longitude,
      difficultyLevel: event?.difficultyLevel,
      distanceKm: event?.distanceKm,
      elevationGainM: event?.elevationGainM,
      estimatedDurationHours: event?.estimatedDurationHours,
      maxParticipants: event?.maxParticipants,
      costPerPerson: event?.costPerPerson,
      requiredGear: event?.requiredGear,
      includedItems: event?.includedItems,
      cancellationPolicy: event?.cancellationPolicy,
      imageUrl: event?.imageUrl,
      hostName: event?.hostName,
      joinQuestion: event?.joinQuestion,
      groupId: event?.groupId
    }
    
    // Navigate to create event page with groupId and copyFrom parameters
    // This ensures the event belongs to the same group
    // Note: CreateEventPage will show the toast after pre-filling the form
    navigate(`/create-event?groupId=${event?.groupId}&copyFrom=${id}`, { state: { eventData } })
  }

  // ============================================
  // AUTO-JOIN AFTER LOGIN - Meetup.com pattern
  // ============================================
  
  // Check URL for action=join parameter and auto-join if user just logged in
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const action = urlParams.get('action')
    
    if (action === 'join' && isAuthenticated && !hasJoined && !joinMutation.isLoading) {
      // User just logged in and wants to join the event
      // Remove the action parameter from URL
      urlParams.delete('action')
      const newUrl = `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`
      window.history.replaceState({}, '', newUrl)
      
      // Auto-join the event
      setIsJoiningFlow(true) // Start joining flow for auto-join
      joinMutation.mutate({ guestCount: 0 })
    }
  }, [isAuthenticated, id])

  // Hide loader when calendar modal opens
  useEffect(() => {
    if (isCalendarModalOpen) {
      setIsJoiningFlow(false)
    }
  }, [isCalendarModalOpen])

  // ============================================
  // LOADING STATE
  // ============================================

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 flex items-center justify-center overflow-x-hidden">
        <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse bg-white/60 backdrop-blur-sm rounded-3xl p-8 space-y-6">
            <div className="h-96 bg-gradient-to-br from-purple-200 to-pink-200 rounded-2xl"></div>
            <div className="h-12 bg-gradient-to-r from-purple-200 to-pink-200 rounded-xl w-3/4"></div>
            <div className="h-6 bg-gray-200 rounded-lg w-1/2"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded-lg"></div>
              <div className="h-4 bg-gray-200 rounded-lg"></div>
              <div className="h-4 bg-gray-200 rounded-lg w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Check if event is in the past
  const eventStart = event ? new Date(event?.eventDate) : null
  const eventEnd = event ? (event?.endDate ? new Date(event.endDate) : eventStart) : null
  const now = new Date()
  const isPastEvent = eventStart ? eventEnd < now : false
  const isOngoingEvent = eventStart ? eventStart <= now && now <= (eventEnd || eventStart) : false
  
  // Check if access is denied (non-member trying to view a private group event)
  // Public groups: backend returns full data to everyone → never denied
  // Private groups: backend returns partial data (null fields) for non-members
  const is403Error = error && (
    error?.response?.status === 403 || 
    error?.status === 403 ||
    (error?.message && error.message.includes('403'))
  )
  // Detect partial data: backend sets sensitive fields to null for private group non-members
  const isPartialData = event && (
    event.description === null || 
    event.location === null || 
    event.maxParticipants === null
  )
  // 403 errors always mean access denied (takes precedence)
  // Otherwise, check if it's a private group with partial data
  const groupIsPublic = is403Error ? false : (event?.groupIsPublic !== false)
  // Access is denied for: 403 errors OR private group non-members with partial data
  const isAccessDenied = !isEventOrganiser && (
    is403Error || 
    (!groupIsPublic && !hasJoined && (isPartialData || !event || !event?.title))
  )
  
  // Create display event for access-denied cases (partial data from private group)
  const displayEvent = event || {
    title: 'Private Event',
    activityTypeName: null,
    organiserName: 'Event Organiser',
    imageUrl: null,
    eventDate: new Date().toISOString(),
    startTime: '09:00',
    groupName: 'Private Group',
    groupId: null,
    description: '',
    participantIds: [],
    currentParticipants: 0,
  }
  const hostName = event?.hostMemberName || event?.hostName || displayEvent?.hostMemberName
  const hasHost = Boolean((event?.hostMemberId !== null && event?.hostMemberId !== undefined) || (hostName && hostName.trim()))
  
  // Debug logging for host data
  if (event && !isLoading) {
    console.log('Event host data:', {
      hostMemberId: event.hostMemberId,
      hostMemberName: event.hostMemberName,
      hostName: event.hostName,
      computed_hostName: hostName,
      hasHost: hasHost
    })
  }
  const hasEventDetails = Boolean(
    event?.difficultyLevel ||
    event?.distanceKm ||
    event?.elevationGainM ||
    event?.estimatedDurationHours
  )
  const canOpenCalendar = Boolean(calendarData)
  const cleanedDescription = (event?.description || '')
    .replace(/^\s*\|\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  // Calculate if event is multi-day
  const startDate = event ? new Date(event?.eventDate) : null
  const endDate = event?.endDate ? new Date(event.endDate) : null
  const isMultiDay = startDate && endDate && (
    startDate.getFullYear() !== endDate.getFullYear() ||
    startDate.getMonth() !== endDate.getMonth() ||
    startDate.getDate() !== endDate.getDate()
  )

  // ============================================
  // ERROR STATES
  // ============================================
  
  // Event not found - Show if not loading and no event data
  // BUT: Allow 403 errors to pass through (they render partial view with "Join" buttons)
  if (!isLoading && !event && error) {
    // Check if it's a 403 error (access denied - non-member viewing members-only event)
    const is403 = error?.response?.status === 403 || 
                  error?.status === 403 ||
                  (error?.message && error.message.includes('403'))
    
    // For 403 errors, continue to render (partial view with join buttons)
    // For other errors, show error page
    if (!is403) {
      return (
        <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 flex items-center justify-center px-4">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-10 text-center max-w-md">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Event not found</h2>
            <p className="text-gray-600 mb-6">The event you're looking for doesn't exist or has been removed.</p>
            <button 
              onClick={() => navigate('/')} 
              className="py-3 px-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all transform hover:scale-105"
            >
              Back to Home
            </button>
          </div>
        </div>
      )
    }
  }

  // Format dates for display (with timezone support)
  const formattedStartDate = startDate ? format(startDate, 'EEEE, MMMM dd, yyyy') : ''
  const formattedEndDate = endDate ? format(endDate, 'EEEE, MMMM dd, yyyy') : null
  const formattedStartTime = startDate ? format(startDate, 'h:mm a') : ''
  const formattedEndTime = endDate ? format(endDate, 'h:mm a') : null
  
  // Get user's timezone for display
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const timezoneAbbr = startDate ? new Date(startDate).toLocaleTimeString('en-US', { timeZoneName: 'short' }).split(' ').pop() : ''

  // ============================================
  // RENDER - Main component JSX
  // ============================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 py-8 overflow-x-hidden">
      {/* Loading overlay while joining event - stays visible until calendar modal opens */}
      {isJoiningFlow && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm mx-4 text-center">
            <div className="w-16 h-16 mx-auto mb-4 relative">
              <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Joining Event...</h3>
            <p className="text-gray-600">Please wait while we prepare your calendar</p>
          </div>
        </div>
      )}
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ============================================ */}
        {/* HERO IMAGE - Hidden for non-members */}
        {/* ============================================ */}
        {/* Event Hero Image */}
        <div className="relative mb-4 lg:mb-8 rounded-xl lg:rounded-2xl overflow-hidden shadow-xl lg:shadow-2xl bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="relative h-40 sm:h-48 lg:h-64 xl:h-80">
            {!heroImageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-r from-purple-100 to-pink-100 animate-pulse rounded-xl lg:rounded-2xl" />
            )}
            {/* Mountain icon placeholder when no image or image failed/loading */}
            {(!displayEvent.imageUrl || heroImageError || !heroImageLoaded) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Mountain className="w-32 h-32 text-white/40" />
              </div>
            )}
            {/* Event image (custom or fallback) */}
            {displayEvent.imageUrl && !heroImageError && (
              <img 
                src={displayEvent.imageUrl}
                alt={displayEvent.title} 
                className="w-full h-full object-cover"
                loading="eager"
                decoding="async"
                onLoad={() => setHeroImageLoaded(true)}
                onError={() => {
                  setHeroImageError(true)
                  setHeroImageLoaded(false)
                }}
              />
            )}
          </div>
        </div>

        {/* ============================================ */}
        {/* EVENT TITLE - Below image */}
        {/* ============================================ */}
        <div className="mb-4 lg:mb-8">
          <h1 className="text-lg sm:text-2xl lg:text-3xl xl:text-4xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent mb-2 lg:mb-3 leading-tight">
            {displayEvent.title || 'Event'}
          </h1>
        </div>

        {/* Members-only notice on mobile (separate from sticky bar) */}
        {isAccessDenied && (
          <div className="lg:hidden mb-4">
          <div className="w-full p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 text-center">
            <Lock className="h-6 w-6 mx-auto mb-1.5 text-gray-400" />
            <p className="text-xs font-semibold text-gray-600 mb-0.5">Members Only</p>
            <p className="text-xs text-gray-500">Join the group to view full details</p>
          </div>
        </div>
        )}

        {/* ============================================ */}
        {/* MOBILE STICKY ACTION BAR - Bottom of screen */}
        {/* ============================================ */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-2xl p-3">
          {isPastEvent ? (
            <div className="w-full py-3 px-4 bg-gray-100 text-gray-600 font-semibold rounded-lg text-center text-sm">
              Event has ended
            </div>
          ) : isAccessDenied ? (
            <button
              onClick={handleJoinClick}
              disabled={joinMutation.isLoading || isJoiningFlow}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg font-bold text-base hover:shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {joinMutation.isLoading || isJoiningFlow ? (
                <Loader className="h-5 w-5 animate-spin" />
              ) : (
                <Users className="h-5 w-5" />
              )}
              {joinMutation.isLoading || isJoiningFlow ? 'Joining...' : 'Join Event'}
            </button>
            ) : isAuthenticated ? (
            isEventOrganiser && hasJoined ? (
              // Organiser who has joined: Show guest count + Manage button (or Leave if not host)
              <div className="space-y-2">
                <div className="w-full py-2.5 px-3 rounded-lg shadow-md bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100">
                  <p className="text-xs font-semibold text-purple-600">
                    {isHost ? '🏕️ You\'re hosting (Organiser)' : 'You\'re registered (Organiser)'}
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    {displayGuestCount > 0
                      ? `You + ${displayGuestCount} guest${displayGuestCount === 1 ? '' : 's'}`
                      : 'You (no guests)'}
                  </p>
                </div>
                {isHost ? (
                  // Host cannot leave - they're essential to the event
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        openGuestModal(displayGuestCount)
                      }}
                      className="flex-1 py-2.5 px-3 bg-white border-2 border-purple-200 text-purple-600 font-bold rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <Users className="h-4 w-4" />
                      Guests
                    </button>
                    <button
                      onClick={() => setIsManageOpen(true)}
                      className="flex-1 py-2.5 px-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <Edit className="h-4 w-4" />
                      Manage
                    </button>
                  </div>
                ) : (
                  // Organiser but not host - can manage guests and leave
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        openGuestModal(displayGuestCount)
                      }}
                      className="w-full py-2.5 px-3 bg-white border-2 border-purple-200 text-purple-600 font-bold rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <Users className="h-4 w-4" />
                      Guests ({displayGuestCount})
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowLeaveConfirm(true)}
                        disabled={leaveMutation.isLoading}
                        className="flex-1 py-2.5 px-3 bg-white border-2 border-gray-300 text-gray-700 font-bold rounded-lg hover:border-red-400 hover:bg-red-50 hover:text-red-700 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                      >
                        {leaveMutation.isLoading ? <Loader className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                        {leaveMutation.isLoading ? 'Leaving...' : 'Leave'}
                      </button>
                      <button
                        onClick={() => setIsManageOpen(true)}
                        className="flex-1 py-2.5 px-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
                      >
                        <Edit className="h-4 w-4" />
                        Manage
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : isEventOrganiser ? (
              // Organiser who hasn't joined: Show Join + Manage buttons
              <div className="flex items-center gap-2">
                <button
                  onClick={handleJoinClick}
                  disabled={event?.status === 'FULL' || joinMutation.isLoading || isJoiningFlow}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                >
                  {joinMutation.isLoading || isJoiningFlow ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <Users className="h-4 w-4" />
                  )}
                  Join
                </button>
                <button
                  onClick={() => setIsManageOpen(true)}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <Edit className="h-4 w-4" />
                  Manage
                </button>
              </div>
            ) : hasJoined ? (
              // Regular participant who has joined: Show guest count + actions menu
              <div className="flex items-center gap-2">
                <div className="flex-1 py-2.5 px-3 rounded-lg shadow bg-gray-100 text-gray-700">
                  <p className="text-xs font-semibold">You're registered</p>
                  <p className="text-sm font-bold text-gray-900">
                    {displayGuestCount > 0
                      ? `You + ${displayGuestCount} guest${displayGuestCount === 1 ? '' : 's'}`
                      : 'You (no guests)'}
                  </p>
                </div>
                <button
                  onClick={() => setIsGuestActionsOpen(true)}
                  className="h-12 w-12 rounded-lg flex items-center justify-center bg-white border border-purple-200 text-purple-600 shadow hover:bg-purple-50"
                  aria-label="Guest actions"
                >
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>
            ) : (
              // Not joined: Show Join button
              <button
                onClick={handleJoinClick}
                disabled={event?.status === 'FULL' || joinMutation.isLoading || isJoiningFlow}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg shadow-lg active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-base"
              >
                {joinMutation.isLoading || isJoiningFlow ? (
                  <Loader className="h-5 w-5 animate-spin" />
                ) : (
                  <Users className="h-5 w-5" />
                )}
                {joinMutation.isLoading || isJoiningFlow ? 'Joining...' : event?.status === 'FULL' ? 'Event Full' : 'Join Event'}
              </button>
            )
          ) : (
            <button
              onClick={() => {
                setReturnUrl(`/events/${id}?action=join`)
                setIsLoginModalOpen(true)
              }}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 text-base"
            >
              <LogIn className="h-5 w-5" />
              Login to Join
            </button>
          )}
        </div>

        {/* ============================================ */}
        {/* MOBILE MANAGE SHEET - Organiser only */}
        {/* ============================================ */}
        {isManageOpen && isEventOrganiser && (
          <div className="lg:hidden fixed inset-0 z-[60] flex items-end justify-center">
            <button
              type="button"
              aria-label="Close manage menu"
              onClick={() => setIsManageOpen(false)}
              className="absolute inset-0 bg-black/40"
            />
            <div
              role="dialog"
              aria-modal="true"
              className="relative w-full mx-4 mb-4 bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-center pt-3">
                <div className="h-1.5 w-12 bg-gray-300 rounded-full" />
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setIsManageOpen(false)}
                className="absolute right-4 top-3 text-gray-500 hover:text-gray-800"
              >
                <span className="text-2xl leading-none">×</span>
              </button>
              <div className="px-4 pb-4 pt-6">
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setIsManageOpen(false)
                      navigate(`/events/${id}/edit`)
                    }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
                  >
                    <Edit className="h-5 w-5 text-purple-600" />
                    Edit event
                  </button>
                  <div className="h-px bg-gray-200 mx-3" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsManageOpen(false)
                      handleCopyEvent()
                    }}
                    disabled={isCopying}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left font-semibold text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Copy className="h-5 w-5 text-blue-600" />
                    {isCopying ? 'Copying...' : 'Copy event'}
                  </button>
                  <div className="h-px bg-gray-200 mx-3" />
                  <button
                    onClick={() => {
                      setIsManageOpen(false)
                      handleDelete()
                    }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left font-semibold text-red-700 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-5 w-5 text-red-600" />
                    Delete event
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* CALENDAR PICKER - Simple list (no success modal) */}
        {/* ============================================ */}
        {isCalendarPickerOpen && calendarData && (
          <div className="fixed inset-0 z-[55] flex items-end sm:items-center justify-center">
            <button
              type="button"
              aria-label="Close calendar picker"
              onClick={() => setIsCalendarPickerOpen(false)}
              className="absolute inset-0 bg-black/40"
            />
            <div className="relative w-full mx-4 mb-4 sm:mb-0 sm:max-w-md bg-white rounded-3xl shadow-2xl">
              <div className="flex items-center justify-between px-5 pt-4">
                <h3 className="text-base font-bold text-gray-900">Add to calendar</h3>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setIsCalendarPickerOpen(false)}
                  className="text-gray-500 hover:text-gray-800"
                >
                  <span className="text-2xl leading-none">×</span>
                </button>
              </div>
              <div className="px-4 pb-4 pt-3">
                <AddToCalendar calendarData={calendarData} variant="list" />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8 pb-4 lg:pb-0">
          {/* ============================================ */}
          {/* MAIN CONTENT - Event details, participants */}
          {/* ============================================ */}
          <div className="order-1 lg:order-1 lg:col-span-2 space-y-4 lg:space-y-6">
            
            {/* ============================================ */}
            {/* GROUP DETAILS SECTION - Meetup-style layout */}
            {/* ============================================ */}
            {displayEvent.groupName && (
              <div 
                className="bg-white rounded-2xl lg:rounded-3xl shadow-md lg:shadow-lg border border-gray-200 cursor-pointer hover:shadow-lg lg:hover:shadow-xl hover:border-purple-200 hover:bg-purple-50/40 transition-all duration-200 p-3 lg:p-4"
                onClick={() => navigate(`/groups/${displayEvent.groupId}`)}
              >
                <div className="flex items-center gap-4">
                  {/* Group Image */}
                  <div className="w-20 h-16 lg:w-24 lg:h-18 flex-shrink-0">
                    <div className="relative w-full h-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-xl lg:rounded-2xl overflow-hidden p-1.5">
                      {event?.group?.bannerUrl ? (
                        <img 
                          src={event.group.bannerUrl} 
                          alt={displayEvent.groupName}
                          className="w-full h-full object-cover rounded-lg lg:rounded-xl"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Mountain className="w-4 h-4 lg:w-6 lg:h-6 text-white/60" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Group Details */}
                  <div className="flex-1 min-w-0 flex items-start justify-between gap-3">
                    <h2 className="text-base lg:text-lg font-bold text-gray-900 truncate">{displayEvent.groupName}</h2>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full border border-gray-300 text-gray-600 text-[11px] font-semibold flex-shrink-0">
                      {event?.groupIsPublic === false ? 'Private Group' : 'Public Group'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================ */}
            {/* DATE + LOCATION CARD - Always at top after group */}
            {/* ============================================ */}
            <div className="bg-white/60 backdrop-blur-sm rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-100 shadow-md lg:shadow-lg">
              <div className="space-y-3 lg:space-y-5">
                {/* Date & Time */}
                <button
                  type="button"
                  onClick={() => {
                    if (canOpenCalendar) {
                      setIsCalendarPickerOpen(true)
                    }
                  }}
                  disabled={!canOpenCalendar}
                  className={`w-full flex items-start p-3 lg:p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg lg:rounded-xl text-left transition-all ${
                    canOpenCalendar ? 'hover:shadow-md' : 'opacity-80 cursor-default'
                  }`}
                >
                  <Calendar className="h-5 w-5 lg:h-6 lg:w-6 mr-3 lg:mr-4 mt-1 text-purple-600" />
                  <div>
                    {isMultiDay ? (
                      <>
                        <div className="font-bold text-gray-900">
                          {format(startDate, 'MMM dd, yyyy')} - {format(endDate, 'MMM dd, yyyy')}
                        </div>
                        <div className="text-purple-600 font-semibold text-sm mt-1">
                          {formattedStartTime} to {formattedEndTime} {timezoneAbbr}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="font-bold text-gray-900">{formattedStartDate}</div>
                        <div className="text-purple-600 font-semibold">
                          {formattedEndTime ? `${formattedStartTime} - ${formattedEndTime}` : formattedStartTime} {timezoneAbbr}
                        </div>
                      </>
                    )}
                  </div>
                </button>

                {/* Location (members only) */}
                {!isAccessDenied && event?.location && isEventLocationEnabled() && (
                  <div className="space-y-3">
                    <div className="h-px bg-gradient-to-r from-purple-100 via-pink-100 to-orange-100" />
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <MapPin className="h-5 w-5 text-purple-600" />
                      <span className="truncate">{event?.location}</span>
                    </div>
                    <div className="px-2">
                    <button
                      onClick={() => {
                        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event?.location || '')}`
                        window.open(googleMapsUrl, '_blank')
                      }}
                      className="relative w-full h-24 md:h-32 rounded-xl overflow-hidden group cursor-pointer transition-all hover:shadow-lg hover:scale-[1.01]"
                    >
                      {isStaticMapsEnabled() && (
                        <img
                          src={`https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(event?.location || '')}&zoom=13&size=400x200&maptype=roadmap&markers=color:red%7C${encodeURIComponent(event?.location || '')}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`}
                          alt={`Map of ${event?.location || 'Event location'}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            e.target.style.opacity = '0'
                          }}
                        />
                      )}
                      {!isStaticMapsEnabled() && (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <div className="text-center">
                            <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600 font-medium">{event?.location}</p>
                          </div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 shadow-lg transform scale-95 group-hover:scale-100 transition-transform duration-300">
                          <MapPin className="h-4 w-4 text-pink-600" />
                          <span className="font-semibold text-gray-900 text-sm">Open Maps</span>
                        </div>
                      </div>
                    </button>
                    </div>
                  </div>
                )}

                {/* Event Details (members only) */}
                {!isAccessDenied && hasEventDetails && (
                  <div className="space-y-3 lg:space-y-5">
                    <div className="h-px bg-gradient-to-r from-purple-100 via-pink-100 to-orange-100" />
                    {/* Difficulty Level */}
                    {event?.difficultyLevel && (
                      <div className="flex items-start p-3 lg:p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg lg:rounded-xl">
                        <TrendingUp className="h-5 w-5 lg:h-6 lg:w-6 mr-3 lg:mr-4 mt-1 text-orange-600" />
                        <div>
                          <div className="font-bold text-gray-900 text-sm lg:text-base">Difficulty</div>
                          <div className="text-orange-600 font-semibold text-sm lg:text-base">{event.difficultyLevel}</div>
                        </div>
                      </div>
                    )}

                    {/* Distance & Elevation */}
                    {(event?.distanceKm || event?.elevationGainM) && (
                      <div className="flex items-start p-3 lg:p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg lg:rounded-xl">
                        <ArrowUp className="h-5 w-5 lg:h-6 lg:w-6 mr-3 lg:mr-4 mt-1 text-blue-600" />
                        <div>
                          <div className="font-bold text-gray-900 text-sm lg:text-base">📊 Stats</div>
                          <div className="text-blue-600 text-xs lg:text-sm">
                            {event.distanceKm && `${event.distanceKm}km`}
                            {event.distanceKm && event.elevationGainM && ' • '}
                            {event.elevationGainM && `${event.elevationGainM}m ↗️`}
                            {event.estimatedDurationHours && ` • ${event.estimatedDurationHours}h ⏱️`}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ============================================ */}
            {/* EVENT DESCRIPTION - Members only */}
            {/* ============================================ */}
            {!isAccessDenied && cleanedDescription && (
              <div className="bg-white/60 backdrop-blur-sm rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-100 shadow-md lg:shadow-lg">
                <h2 className="text-lg lg:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3 lg:mb-4">📝 Details</h2>
                <div className="prose prose-sm lg:prose-lg max-w-none text-gray-700 whitespace-pre-wrap">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({node, ...props}) => <p className="mb-3 lg:mb-4 text-sm lg:text-base" {...props} />,
                      a: ({node, ...props}) => (
                        <a
                          className="text-purple-600 underline decoration-2 hover:text-pink-600"
                          target="_blank"
                          rel="noopener noreferrer"
                          {...props}
                        />
                      ),
                      ul: ({node, ...props}) => <ul className="list-disc ml-5 mb-3 text-sm lg:text-base" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal ml-5 mb-3 text-sm lg:text-base" {...props} />,
                      li: ({node, ...props}) => <li className="mb-1" {...props} />,
                    }}
                  >
                    {cleanedDescription}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {/* ============================================ */}
            {/* REQUIREMENTS SECTION - Members only */}
            {/* ============================================ */}
            {!isAccessDenied && event?.requirements && event?.requirements.length > 0 && (
              <div className="bg-white/60 backdrop-blur-sm rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-100 shadow-md lg:shadow-lg">
                <h2 className="text-lg lg:text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-3 lg:mb-4">⚠️ Requirements</h2>
                <ul className="space-y-2 lg:space-y-3">
                  {Array.from(event?.requirements || []).map((req, index) => (
                    <li key={index} className="flex items-start">
                      <span className="inline-block w-1.5 h-1.5 lg:w-2 lg:h-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-full mt-1.5 lg:mt-2 mr-2 lg:mr-3 flex-shrink-0"></span>
                      <span className="text-gray-700 text-sm lg:text-base">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ============================================ */}
            {/* INCLUDED ITEMS SECTION - Members only */}
            {/* ============================================ */}
            {!isAccessDenied && event?.includedItems && event?.includedItems.length > 0 && (
              <div className="bg-white/60 backdrop-blur-sm rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-100 shadow-md lg:shadow-lg">
                <h2 className="text-lg lg:text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3 lg:mb-4">✨ Included</h2>
                <ul className="space-y-2 lg:space-y-3">
                  {Array.from(event?.includedItems || []).map((item, index) => (
                    <li key={index} className="flex items-start">
                      <span className="inline-block w-1.5 h-1.5 lg:w-2 lg:h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mt-1.5 lg:mt-2 mr-2 lg:mr-3 flex-shrink-0"></span>
                      <span className="text-gray-700 text-sm lg:text-base">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ============================================ */}
            {/* HOST + ATTENDEES COMBINED CARD - Members only */}
            {/* ============================================ */}
            {!isAccessDenied && (
              <div className="bg-white/60 backdrop-blur-sm rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-100 shadow-md lg:shadow-lg">
                <div className={`grid gap-6 ${hasHost ? 'lg:grid-cols-[1fr_2fr]' : ''}`}>
                  {/* Host */}
                  {hasHost && (
                    <div>
                      {(() => {
                        const hostNameFallback = hostName
                        // Get host's guest count from participants list (works for any viewer)
                        const hostParticipant = participantsData?.data?.find(p => p.id === event?.hostMemberId)
                        const hostGuestCount = hostParticipant?.guestCount || 0
                        // Total count = everyone (host + all guests + all attendees)
                        const totalCount = event?.currentParticipants || 0
                        
                        return (
                          <>
                            <h2 className="flex items-center justify-between gap-2 text-base lg:text-xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent mb-3 lg:mb-4">
                              <div className="flex items-center gap-2">
                                <span className="text-lg lg:text-xl">🏕️</span>
                                <span>Host</span>
                              </div>
                              {totalCount > 0 && (
                                <span className="text-sm font-semibold text-purple-600">👥 {totalCount}</span>
                              )}
                            </h2>
                            <div 
                              onClick={() => event?.hostMemberId && navigate(`/members/${event.hostMemberId}`)}
                              className={`flex items-center space-x-3 p-4 bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl transition-all ${
                                event?.hostMemberId 
                                  ? 'cursor-pointer hover:-translate-y-1 hover:shadow-lg group' 
                                  : ''
                              }`}
                            >
                              <ProfileAvatar 
                                member={hostParticipant || { displayName: hostNameFallback, email: hostNameFallback }}
                                size="lg"
                                showBadge={true}
                                badgeType="host"
                                className={`transition-transform ${event?.hostMemberId ? 'group-hover:scale-110' : ''}`}
                              />
                              <div className="flex-1 min-w-0">
                                <p className={`font-bold text-gray-900 truncate transition-all ${
                                  event?.hostMemberId ? 'group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 group-hover:bg-clip-text group-hover:text-transparent' : ''
                                }`}>
                                  {hostNameFallback}
                                </p>
                                {hostGuestCount > 0 && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    +{hostGuestCount} guest{hostGuestCount === 1 ? '' : 's'}
                                  </p>
                                )}
                              </div>
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  )}

                  {/* Attendees */}
                  <div className={hasHost ? '' : 'lg:col-span-2'}>
                    {(() => {
                      // Calculate actual other attendees (excluding host)
                      const otherAttendees = participantsData?.data?.filter(p => p.id !== event?.hostMemberId) || []
                      const attendeeCount = otherAttendees.length
                      
                      return (
                        <>
                          <h2 className="flex items-center gap-2 text-base lg:text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3 lg:mb-4">
                            <span className="text-lg lg:text-xl">👥</span>
                            <span>Other Attendees</span>
                          </h2>
                          {attendeeCount > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
                              {otherAttendees.map((participant) => (
                          <div 
                            key={participant.id}
                            onClick={() => navigate(`/members/${participant.id}`)}
                            className="flex items-start space-x-3 lg:space-x-4 p-3 lg:p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg lg:rounded-xl hover:shadow-md lg:hover:shadow-lg transition-all cursor-pointer group hover:-translate-y-0.5 lg:hover:-translate-y-1"
                          >
                            <ProfileAvatar 
                              member={participant} 
                              size="md" 
                              className="group-hover:scale-105 lg:group-hover:scale-110 transition-transform flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0 space-y-1">
                              <p className="font-semibold text-gray-900 truncate group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 group-hover:bg-clip-text transition-all text-sm lg:text-base">
                                {participant.displayName || participant.email.split('@')[0]}
                              </p>
                              <div className="flex items-center flex-wrap gap-2 text-xs text-gray-500">
                                <span>{new Date(participant.joinedAt).toLocaleDateString()}</span>
                                {participant.guestCount > 0 && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/70 border border-purple-100 text-purple-700 font-semibold">
                                    +{participant.guestCount} guest{participant.guestCount === 1 ? '' : 's'}
                                  </span>
                                )}
                              </div>
                              {isEventOrganiser && event?.joinQuestion && participant.joinQuestionAnswer && (
                                <div className="flex items-start gap-1.5 mt-1.5 pt-1.5 border-t border-purple-100/50">
                                  <MessageSquare className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-indigo-500" />
                                  <p className="text-xs text-indigo-600 italic leading-relaxed">
                                    {participant.joinQuestionAnswer}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 lg:py-8 px-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg lg:rounded-xl">
                        <Users className="h-8 w-8 lg:h-12 lg:w-12 mx-auto mb-2 lg:mb-3 text-gray-400" />
                        <p className="text-gray-600 text-sm lg:text-base">No other attendees yet</p>
                      </div>
                    )}
                        </>
                      )
                    })()}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* ============================================ */}
          {/* SIDEBAR - Price, actions, location, group info */}
          {/* ============================================ */}
          <div className="order-3 lg:order-2 lg:col-span-1">
            <div className="hidden lg:block bg-white/60 backdrop-blur-sm rounded-xl lg:rounded-2xl p-4 lg:p-6 sticky top-20 lg:top-24 border border-gray-100 shadow-md lg:shadow-lg space-y-4 lg:space-y-6">

              {/* Price section removed */}

              {/* Action Buttons Section - Varies based on user status */}
              {/* Hide sidebar buttons on mobile - mobile has sticky action bar */}
              <div className={`hidden lg:block ${!isAccessDenied ? "pt-6 border-t border-gray-200" : ""}`}>
                {isPastEvent ? (
                  <div className="space-y-4">
                    <div className="w-full p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 text-center">
                      <Clock className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                      <p className="text-sm font-semibold text-gray-600 mb-1">Event has ended</p>
                      <p className="text-xs text-gray-500">Joining is disabled for past events.</p>
                    </div>
                  </div>
                ) : isAccessDenied ? (
                  /* NON-MEMBER VIEW - Show Join Group button */
                  <div className="space-y-4">
                    <div className="w-full p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 text-center">
                      <Lock className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                      <p className="text-sm font-semibold text-gray-600 mb-1">Members Only</p>
                      <p className="text-xs text-gray-500">Join the group to view full details.</p>
                    </div>
                    <button
                      onClick={handleJoinClick}
                      disabled={joinMutation.isLoading || isJoiningFlow}
                      className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2"
                    >
                      {joinMutation.isLoading || isJoiningFlow ? (
                        <Loader className="h-5 w-5 animate-spin" />
                      ) : (
                        <Users className="h-5 w-5" />
                      )}
                      {joinMutation.isLoading || isJoiningFlow ? 'Joining...' : 'Join Event'}
                    </button>
                  </div>
                ) : isAuthenticated ? (
                  isEventOrganiser ? (
                    /* ORGANISER VIEW - Show Edit and Delete buttons, plus Join if not joined */
                    <div className="space-y-3">
                      <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl border border-orange-100">
                        <p className="text-orange-700 font-semibold">👑 You're the organiser</p>
                        <p className="text-xs text-gray-600 mt-1">Status: <span className="font-mono font-bold">{event?.status || 'UNKNOWN'}</span></p>
                      </div>
                      
                      {/* Show Join button if organiser hasn't joined */}
                      {!hasJoined && !isPastEvent && (
                        <button
                          onClick={handleJoinClick}
                          disabled={event?.status === 'FULL' || joinMutation.isLoading || isJoiningFlow}
                          className="w-full py-3 px-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-green-500/50 transition-all transform hover:scale-105 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {joinMutation.isLoading || isJoiningFlow ? (
                            <Loader className="h-5 w-5 animate-spin" />
                          ) : (
                            <Users className="h-5 w-5" />
                          )}
                          {joinMutation.isLoading || isJoiningFlow ? 'Joining...' : event?.status === 'FULL' ? 'Event Full' : 'Join as Participant'}
                        </button>
                      )}
                      
                      {/* Show Leave button if organiser has joined */}
                      {hasJoined && !isPastEvent && (
                        <div className="space-y-3">
                          <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                            <p className="text-green-700 font-semibold text-center text-sm">✅ You're also attending</p>
                          </div>
                          <button
                            onClick={() => setShowLeaveConfirm(true)}
                            disabled={leaveMutation.isLoading}
                            className={`w-full py-2 px-4 font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm ${
                              leaveMutation.isLoading 
                                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {leaveMutation.isLoading && <Loader className="h-4 w-4 animate-spin" />}
                            {leaveMutation.isLoading ? 'Leaving...' : 'Leave Event'}
                          </button>
                        </div>
                      )}
                      
                      {!isPastEvent || isOngoingEvent ? (
                        /* FUTURE EVENT - Show Publish (if DRAFT), Edit and Delete buttons */
                        <>
                          {event?.status === 'DRAFT' && (
                            <div className="space-y-3">
                              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                                <p className="text-sm text-yellow-800 text-center">
                                  ⚠️ This event is in <span className="font-bold">DRAFT</span> mode. Publish it to make it visible in discover!
                                </p>
                              </div>
                              <button
                                onClick={() => setShowPublishConfirm(true)}
                                disabled={publishMutation.isLoading}
                                className="w-full py-3 px-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-green-500/50 transition-all transform hover:scale-105 disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                {publishMutation.isLoading ? <Loader className="h-5 w-5 animate-spin" /> : <Eye className="h-5 w-5" />}
                                {publishMutation.isLoading ? 'Publishing...' : 'Publish Event'}
                              </button>
                            </div>
                          )}
                          
                          {/* Add to Calendar Button for Organiser */}
                          {calendarData && (
                            <AddToCalendar calendarData={calendarData} />
                          )}
                          
                          <button
                            onClick={() => navigate(`/events/${id}/edit`)}
                            className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                          >
                            <Edit className="h-5 w-5" />
                            Edit Event
                          </button>
                          <button
                            onClick={handleDelete}
                            disabled={deleteMutation.isLoading}
                            className="w-full py-3 px-6 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-red-500/50 transition-all transform hover:scale-105 disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            <Trash2 className="h-5 w-5" />
                            {deleteMutation.isLoading ? 'Deleting...' : 'Delete Event'}
                          </button>
                        </>
                      ) : (
                        /* PAST EVENT - Show Copy Event button */
                        <div className="space-y-3">
                          <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200">
                            <div className="flex items-center justify-center gap-2 text-gray-600 mb-2">
                              <Clock className="h-5 w-5" />
                              <p className="font-semibold">Event Has Ended</p>
                            </div>
                            <p className="text-sm text-gray-500 text-center">
                              Past events cannot be edited to preserve event history.
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCopyEvent()
                            }}
                            disabled={isCopying}
                            className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/50 transition-all transform hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                          >
                            <Copy className="h-5 w-5" />
                            {isCopying ? 'Copying...' : 'Copy Event for Future Date'}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : hasJoined ? (
                    /* REGISTERED USER VIEW - Show Add to Calendar (future only) */
                    !isPastEvent ? (
                      <div className="space-y-3">
                        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                          <p className="text-green-700 font-semibold text-center">✅ You're registered!</p>
                          <div className="mt-3 flex items-center justify-between rounded-xl bg-white/60 px-3 py-2 border border-green-100">
                            <p className="text-sm text-gray-800">
                              {displayGuestCount > 0
                                ? `You + ${displayGuestCount} guest${displayGuestCount === 1 ? '' : 's'}`
                                : 'You (no guests)'}
                            </p>
                            {!isPastEvent && (
                              <>
                                <button
                                  onClick={() => openGuestModal(displayGuestCount)}
                                  className="hidden sm:inline text-sm font-semibold text-purple-600 hover:text-purple-700"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => setIsGuestActionsOpen(true)}
                                  className="sm:hidden h-10 w-10 ml-2 flex items-center justify-center rounded-full bg-white border border-purple-200 text-purple-600 shadow hover:bg-purple-50"
                                  aria-label="More actions"
                                >
                                  <MoreVertical className="h-5 w-5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {/* Add to Calendar Button */}
                        {calendarData && (
                          <AddToCalendar calendarData={calendarData} />
                        )}

                        <button
                          onClick={() => setShowLeaveConfirm(true)}
                          disabled={leaveMutation.isLoading}
                          className={`w-full py-3 px-6 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-sm ${
                            leaveMutation.isLoading
                              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                              : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                          }`}
                        >
                          {leaveMutation.isLoading && <Loader className="h-4 w-4 animate-spin" />}
                          {leaveMutation.isLoading ? 'Leaving...' : 'Leave Event'}
                        </button>
                      </div>
                    ) : null
                  ) : !isPastEvent ? (
                    /* AUTHENTICATED NON-REGISTERED VIEW - Show Join button */
                    <button
                      onClick={handleJoinClick}
                      disabled={event?.status === 'FULL' || joinMutation.isLoading || isJoiningFlow}
                      className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-2xl hover:shadow-purple-500/50 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2"
                    >
                      {joinMutation.isLoading || isJoiningFlow ? (
                        <Loader className="h-5 w-5 animate-spin" />
                      ) : (
                        <Users className="h-5 w-5" />
                      )}
                      {joinMutation.isLoading || isJoiningFlow ? 'Joining...' : event?.status === 'FULL' ? 'Event Full' : 'Join Event'}
                    </button>
                  ) : null
                ) : !isPastEvent ? (
                  /* NOT AUTHENTICATED - Show login prompt */
                  <div className="space-y-3">
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                      <p className="text-sm text-gray-600">🔐 Login to join this event</p>
                    </div>
                    <button
                      onClick={() => {
                        setReturnUrl(`/events/${id}?action=join`)
                        setIsLoginModalOpen(true)
                      }}
                      className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all transform hover:scale-105"
                    >
                      Login to Join
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 text-center text-sm text-gray-600">
                    Event has ended
                  </div>
                )}

                {event?.status === 'FULL' && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-600 text-center font-semibold">
                      ⚠️ This event is currently full
                    </p>
                  </div>
                )}
              </div>

              {/* Location Map Section moved to Date + Location card */}

            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* COMMENTS SECTION - Full width below main content (members only) */}
        {/* ============================================ */}
        {!isAccessDenied && (
          <div className="mt-4 lg:mt-6 pb-24 lg:pb-0">
            <CommentSection eventId={id} />
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* LOGIN MODAL - Opens when unauthenticated user tries to join */}
      {/* ============================================ */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={() => {
          toast.success('Check your email for the magic link!')
        }}
      />

      {/* ============================================ */}
      {/* GUEST PICKER - Shown before confirming join */}
      {/* ============================================ */}
      {isGuestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsGuestModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-100 p-5 sm:p-6">
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-gray-300" />
            <h3 className="text-lg font-bold text-gray-900 text-center">Bringing anyone with you?</h3>
            <p className="text-sm text-gray-600 text-center mt-1">
              {maxGuestSelectable > 0
                ? `You can bring up to ${maxGuestSelectable} guest${maxGuestSelectable === 1 ? '' : 's'}.`
                : 'All remaining spots are for you only.'}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setWantsGuests(false)
                  setGuestCount(0)
                }}
                className={`w-full py-3 rounded-xl border text-sm font-semibold transition ${
                  !wantsGuests
                    ? 'bg-purple-600 text-white border-purple-600 shadow'
                    : 'border-gray-200 text-gray-800 hover:border-purple-300'
                }`}
              >
                No guests
              </button>
              <button
                disabled={maxGuestSelectable === 0}
                onClick={() => {
                  setWantsGuests(true)
                  setGuestCount((prev) => {
                    const next = prev > 0 ? prev : 1
                    return Math.min(next, maxGuestSelectable)
                  })
                }}
                className={`w-full py-3 rounded-xl border text-sm font-semibold transition ${
                  wantsGuests
                    ? 'bg-purple-600 text-white border-purple-600 shadow'
                    : 'border-gray-200 text-gray-800 hover:border-purple-300'
                } ${maxGuestSelectable === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Add guests
              </button>
            </div>

            {wantsGuests && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Guests</p>
                    <p className="text-xs text-gray-500">Max {maxGuestSelectable}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setGuestCount((prev) => Math.max(0, prev - 1))}
                      disabled={guestCount === 0}
                      className="h-10 w-10 rounded-full border border-gray-200 text-gray-700 hover:border-purple-300 disabled:opacity-50"
                      aria-label="Decrease guests"
                    >
                      <Minus className="mx-auto h-4 w-4" />
                    </button>
                    <span className="w-8 text-center font-semibold text-gray-800">{guestCount}</span>
                    <button
                      onClick={() => setGuestCount((prev) => Math.min(maxGuestSelectable, prev + 1))}
                      disabled={guestCount >= maxGuestSelectable}
                      className="h-10 w-10 rounded-full border border-gray-200 text-gray-700 hover:border-purple-300 disabled:opacity-50"
                      aria-label="Increase guests"
                    >
                      <Plus className="mx-auto h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 text-right">
                  {remainingSpots === Number.POSITIVE_INFINITY
                    ? 'Plenty of space available.'
                    : `${Math.max(0, remainingSpots - 1)} guest spot${Math.max(0, remainingSpots - 1) === 1 ? '' : 's'} left`}
                </p>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setIsGuestModalOpen(false)}
                className="w-1/2 py-3 rounded-xl border border-gray-200 text-gray-800 font-semibold hover:border-purple-300"
              >
                Back
              </button>
              <button
                onClick={handleConfirmGuests}
                disabled={wantsGuests && guestCount === 0}
                className="w-1/2 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow hover:shadow-lg disabled:opacity-60"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* JOIN QUESTION MODAL - Shown after guest picker if event has a question */}
      {/* ============================================ */}
      {isJoinQuestionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => { setIsJoinQuestionModalOpen(false); setIsJoiningFlow(false) }}
          />
          <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-100 p-5 sm:p-6">
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-gray-300" />
            <div className="flex items-center gap-3 mb-1">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex-shrink-0">
                <MessageSquare className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">One quick question</h3>
            </div>
            <p className="text-sm text-gray-700 font-medium mt-3 mb-4">{event?.joinQuestion}</p>
            <textarea
              rows={3}
              value={joinQuestionAnswer}
              onChange={(e) => setJoinQuestionAnswer(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm resize-none"
              placeholder="Your answer..."
              autoFocus
            />
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleSubmitJoinQuestion}
                disabled={!joinQuestionAnswer.trim()}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Join Event
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500 text-center">
              Please answer the question to continue
            </p>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* GUEST ACTIONS SHEET (mobile) */}
      {/* ============================================ */}
      {isGuestActionsOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center px-4 sm:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsGuestActionsOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-t-2xl shadow-2xl p-4">
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-gray-300" />
            <button
              onClick={() => {
                setIsGuestActionsOpen(false)
                openGuestModal(displayGuestCount)
              }}
              className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 text-gray-800 font-semibold hover:border-purple-300 mb-3"
            >
              Edit guest count
            </button>
            <button
              onClick={() => {
                setIsGuestActionsOpen(false)
                setShowLeaveConfirm(true)
              }}
              className="w-full text-left px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 font-semibold hover:bg-red-100"
            >
              Leave event
            </button>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* ADD TO CALENDAR MODAL - Opens after successful join */}
      {/* ============================================ */}
      {/* Desktop/Tablet only success modal; hidden on mobile */}
      <div className="hidden sm:block">
        <AddToCalendarModal
          isOpen={isCalendarModalOpen}
          onClose={() => setIsCalendarModalOpen(false)}
          calendarData={calendarData}
          eventTitle={event?.title || 'this event'}
        />
      </div>

      {/* ============================================ */}
      {/* GROUP GUIDELINES MODAL - Opens before joining if group has guidelines */}
      {/* ============================================ */}
      <GroupGuidelinesModal
        isOpen={isGuidelinesModalOpen}
        onClose={() => setIsGuidelinesModalOpen(false)}
        onAccept={handleAcceptTerms}
        groupName={event?.group?.name || 'this group'}
        guidelines={event?.group?.groupGuidelines || ''}
        isLoading={joinMutation.isLoading}
      />

      {/* ============================================ */}
      {/* LEAVE CONFIRMATION MODAL */}
      {/* ============================================ */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowLeaveConfirm(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white grid place-items-center shadow">
                <X className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">Leave this event?</h3>
                <p className="text-sm text-gray-600">You'll lose your spot and any updates for this event.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50"
              >
                Stay
              </button>
              <button
                onClick={() => leaveMutation.mutate()}
                disabled={leaveMutation.isLoading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold shadow hover:shadow-lg transition-all disabled:opacity-60"
              >
                {leaveMutation.isLoading ? 'Leaving...' : 'Leave event'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* PUBLISH CONFIRMATION MODAL */}
      {/* ============================================ */}
      {showPublishConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPublishConfirm(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white grid place-items-center shadow">
                <Eye className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">Publish this event?</h3>
                <p className="text-sm text-gray-600">It will become visible to everyone in Discover Events.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowPublishConfirm(false)}
                className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50"
              >
                Not yet
              </button>
              <button
                onClick={() => { setShowPublishConfirm(false); publishMutation.mutate() }}
                disabled={publishMutation.isLoading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold shadow hover:shadow-lg transition-all disabled:opacity-60"
              >
                {publishMutation.isLoading ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
