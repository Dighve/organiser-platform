import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { eventsAPI } from '../lib/api'
import { Calendar, MapPin, Users, DollarSign, Clock, Mountain, ArrowUp, Backpack, Package, FileText, ArrowLeft, LogIn, Lock, TrendingUp, Edit, Trash2, Eye, Copy, Loader } from 'lucide-react'
import { format } from 'date-fns'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import CommentSection from '../components/CommentSection'
import ProfileAvatar from '../components/ProfileAvatar'
import LoginModal from '../components/LoginModal'
import AddToCalendar from '../components/AddToCalendar'
import AddToCalendarModal from '../components/AddToCalendarModal'

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
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false)
  const [heroImageError, setHeroImageError] = useState(false)
  const [heroImageLoaded, setHeroImageLoaded] = useState(false)
  const [isJoiningFlow, setIsJoiningFlow] = useState(false) // Track entire join flow until modal opens

  // ============================================
  // DATA FETCHING - React Query hooks
  // ============================================
  
  // 1. Fetch event details (with 403 handling for members-only events)
  const { data, isLoading, error } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsAPI.getEventById(id),
    staleTime: 0, // Always refetch to ensure membership changes are reflected immediately
    refetchOnMount: 'always', // Always refetch when component mounts (e.g., after joining group)
    refetchOnWindowFocus: true, // Refetch when window regains focus
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
  // MUTATIONS - API calls that change data
  // ============================================
  
  // Handle join button click - check authentication first
  const handleJoinClick = () => {
    if (!isAuthenticated) {
      // Store current URL with action parameter so we can auto-join after login
      setReturnUrl(`/events/${id}?action=join`)
      setIsLoginModalOpen(true)
      return
    }
    setIsJoiningFlow(true) // Start joining flow - show loader until modal opens
    joinMutation.mutate()
  }

  // Join event (register for event + auto-join group - Meetup.com pattern)
  const joinMutation = useMutation({
    mutationFn: () => eventsAPI.joinEvent(id),
    onSuccess: async () => {
      // Show calendar modal immediately for instant feedback
      // No toast needed - modal itself is the success indicator
      setIsCalendarModalOpen(true)
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
      // Show toast immediately for instant feedback
      toast.success('Successfully left the event')
      
      // Invalidate queries in background (don't await - let them happen async)
      queryClient.invalidateQueries(['event', id])
      queryClient.invalidateQueries(['eventParticipants', id])
      queryClient.invalidateQueries(['myEvents'])
      queryClient.invalidateQueries(['allEvents'])
      queryClient.invalidateQueries(['events'])
      
      // Force refetch of current event to update UI
      queryClient.refetchQueries(['event', id])
    },
    onError: (error) => {
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
        queryClient.invalidateQueries(['groupEvents', event.groupId.toString()])
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
        queryClient.invalidateQueries(['groupEvents', event.groupId.toString()])
      }
      toast.success('Event deleted successfully')
      navigate('/')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete event')
    },
  })

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
    // Encode event data as URL parameters
    const eventData = {
      title: event.title,
      description: event.description,
      location: event.location,
      latitude: event.latitude,
      longitude: event.longitude,
      difficultyLevel: event.difficultyLevel,
      distanceKm: event.distanceKm,
      elevationGainM: event.elevationGainM,
      estimatedDurationHours: event.estimatedDurationHours,
      maxParticipants: event.maxParticipants,
      costPerPerson: event.costPerPerson,
      requiredGear: event.requiredGear,
      includedItems: event.includedItems,
      cancellationPolicy: event.cancellationPolicy,
      imageUrl: event.imageUrl,
      hostName: event.hostName,
      groupId: event.groupId
    }
    
    // Navigate to create event page with groupId and copyFrom parameters
    // This ensures the event belongs to the same group
    navigate(`/create-event?groupId=${event.groupId}&copyFrom=${id}`, { state: { eventData } })
    toast.success('Event copied! Update the date and details as needed.')
  }

  // ============================================
  // AUTO-JOIN AFTER LOGIN - Meetup.com pattern
  // ============================================
  
  // Check URL for action=join parameter and auto-join if user just logged in
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const action = urlParams.get('action')
    
    if (action === 'join' && isAuthenticated && !joinMutation.isLoading) {
      // User just logged in and wants to join the event
      // Remove the action parameter from URL
      urlParams.delete('action')
      const newUrl = `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`
      window.history.replaceState({}, '', newUrl)
      
      // Auto-join the event
      setIsJoiningFlow(true) // Start joining flow for auto-join
      joinMutation.mutate()
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
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 flex items-center justify-center">
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

  // ============================================
  // COMPUTED VALUES - Derived from fetched data
  // ============================================
  const event = data?.data
  
  // Check user's relationship to this event
  const isEventOrganiser = event && isAuthenticated && Number(user?.id) === Number(event.organiserId)
  const hasJoined = event && isAuthenticated && event.participantIds?.includes(user?.id)
  
  // Check if event is in the past
  const isPastEvent = event ? new Date(event.eventDate) < new Date() : false
  
  // Check if access is denied (non-member trying to view members-only event)
  // Organisers always have access
  const isAccessDenied = !isEventOrganiser && (
    error?.response?.status === 403 || 
    (event && event.title && !event.description)
  )

  // Calculate if event is multi-day
  const startDate = event ? new Date(event.eventDate) : null
  const endDate = event?.endDate ? new Date(event.endDate) : null
  const isMultiDay = startDate && endDate && (
    startDate.getFullYear() !== endDate.getFullYear() ||
    startDate.getMonth() !== endDate.getMonth() ||
    startDate.getDate() !== endDate.getDate()
  )

  // ============================================
  // ERROR STATES
  // ============================================
  
  // Event not found
  if (!event) {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 py-8">
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
        <button
          onClick={() => navigate(-1)}
          className="group flex items-center text-gray-600 hover:text-purple-600 mb-6 font-semibold transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>

        {/* ============================================ */}
        {/* HERO IMAGE with event title and organiser */}
        {/* ============================================ */}
        <div className="relative h-[500px] rounded-3xl overflow-hidden bg-gray-200 mb-8 shadow-2xl">
          {/* Gradient overlay - always visible */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-pink-500 opacity-30" />
          
          {/* Mountain icon placeholder when no image or image failed/loading */}
          {(!event.imageUrl || heroImageError || !heroImageLoaded) && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Mountain className="w-32 h-32 text-white/40" />
            </div>
          )}
          
          {/* Event image (custom or fallback) */}
          {event.imageUrl && !heroImageError && (
            <img 
              src={event.imageUrl}
              alt={event.title} 
              className="w-full h-full object-cover mix-blend-overlay"
              loading="eager"
              decoding="async"
              onLoad={() => setHeroImageLoaded(true)}
              onError={() => {
                setHeroImageError(true)
                setHeroImageLoaded(false)
              }}
            />
          )}
          
          {/* Overlay with event info */}
          <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent">
            <div className="inline-block px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-white font-semibold text-sm mb-3">
              {event.activityTypeName}
            </div>
            <h1 className="text-5xl font-extrabold text-white mb-3 drop-shadow-2xl">{event.title}</h1>
            <div className="flex items-center text-white/90">
              <span>Hosted by <span className="font-bold">{event.organiserName}</span></span>
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* MOBILE STICKY ACTION BAR - Bottom of screen */}
        {/* ============================================ */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t-2 border-gray-200 shadow-2xl p-4">
          {isAccessDenied ? (
            <button
              onClick={handleJoinClick}
              disabled={joinMutation.isLoading}
              className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Users className="h-5 w-5" />
              {joinMutation.isLoading ? 'Joining...' : 'Join Event'}
            </button>
          ) : isAuthenticated ? (
            isEventOrganiser ? (
              !isPastEvent ? (
                <button
                  onClick={() => navigate(`/events/${id}/edit`)}
                  className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Edit className="h-5 w-5" />
                  Edit Event
                </button>
              ) : (
                <button
                  onClick={handleCopyEvent}
                  className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Copy className="h-5 w-5" />
                  Copy Event
                </button>
              )
            ) : hasJoined ? (
              <button
                onClick={() => leaveMutation.mutate()}
                disabled={leaveMutation.isLoading}
                className={`w-full py-4 px-6 font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                  leaveMutation.isLoading 
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95'
                }`}
              >
                {leaveMutation.isLoading && <Loader className="h-5 w-5 animate-spin" />}
                {leaveMutation.isLoading ? 'Leaving...' : 'Leave Event'}
              </button>
            ) : (
              <button
                onClick={handleJoinClick}
                disabled={event.status === 'FULL' || joinMutation.isLoading}
                className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Users className="h-5 w-5" />
                {joinMutation.isLoading ? 'Joining...' : event.status === 'FULL' ? 'Event Full' : 'Join Event'}
              </button>
            )
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="h-5 w-5" />
              Login to Join
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-24 lg:pb-0">
          {/* ============================================ */}
          {/* MAIN CONTENT - Event details, participants */}
          {/* ============================================ */}
          <div className="order-1 lg:order-1 lg:col-span-2 space-y-6">
            {/* Event Description (members only) */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-lg">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">Details</h2>
              {isAccessDenied ? (
                <div className="text-center py-12">
                  <button 
                    onClick={handleJoinClick}
                    className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 mb-4 hover:from-purple-200 hover:to-pink-200 transition-all cursor-pointer transform hover:scale-110"
                    title="Click to login and join"
                  >
                    <Lock className="h-8 w-8 text-purple-600" />
                  </button>
                  <p className="text-gray-600 mb-4">Join event to unlock details</p>
                  <button
                    onClick={handleJoinClick}
                    disabled={joinMutation.isLoading}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
                  >
                    <Users className="h-4 w-4" />
                    {joinMutation.isLoading ? 'Joining...' : 'Join Event'}
                  </button>
                </div>
              ) : (
                <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">{event.description}</p>
              )}
            </div>

            {/* Event Details (date/time always visible, rest members only) */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-lg">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent mb-6">Event Details</h2>
              <div className="space-y-5">
                {/* Always show date and time */}
                <div className="flex items-start p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                  <Calendar className="h-6 w-6 mr-4 mt-1 text-purple-600" />
                  <div>
                    {isMultiDay ? (
                      /* Multi-day event: Show date range */
                      <>
                        <div className="font-bold text-gray-900">
                          {format(startDate, 'MMM dd, yyyy')} - {format(endDate, 'MMM dd, yyyy')}
                        </div>
                        <div className="text-purple-600 font-semibold text-sm mt-1">
                          {formattedStartTime} to {formattedEndTime} {timezoneAbbr}
                        </div>
                      </>
                    ) : (
                      /* Single day event: Show date with time range */
                      <>
                        <div className="font-bold text-gray-900">{formattedStartDate}</div>
                        <div className="text-purple-600 font-semibold">
                          {formattedEndTime ? `${formattedStartTime} - ${formattedEndTime}` : formattedStartTime} {timezoneAbbr}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {isAccessDenied ? (
                  /* Locked state for other details */
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
                    <button 
                      onClick={handleJoinClick}
                      className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 mb-4 hover:from-purple-200 hover:to-pink-200 transition-all cursor-pointer transform hover:scale-110"
                      title="Click to login and join"
                    >
                      <Lock className="h-8 w-8 text-purple-600" />
                    </button>
                    <p className="text-gray-600 mb-4">Join event to unlock location and details</p>
                    <button
                      onClick={handleJoinClick}
                      disabled={joinMutation.isLoading}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
                    >
                      <Users className="h-4 w-4" />
                      {joinMutation.isLoading ? 'Joining...' : 'Join Event'}
                    </button>
                  </div>
                ) : (
                  /* Full details for members */
                  <>
                    {event.difficultyLevel && (
                      <div className="flex items-start p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl">
                        <TrendingUp className="h-6 w-6 mr-4 mt-1 text-orange-600" />
                        <div>
                          <div className="text-sm text-gray-600">Difficulty Level</div>
                          <div className="font-bold text-gray-900">{event.difficultyLevel}</div>
                        </div>
                      </div>
                    )}

                    {event.distanceKm && (
                      <div className="flex items-start p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                        <Clock className="h-6 w-6 mr-4 mt-1 text-green-600" />
                        <div>
                          <div className="text-sm text-gray-600">Distance</div>
                          <div className="font-bold text-gray-900">{event.distanceKm} km</div>
                          {event.estimatedDurationHours && (
                            <div className="text-sm text-gray-600 mt-1">Duration: ~{event.estimatedDurationHours} hours</div>
                          )}
                        </div>
                      </div>
                    )}

                    {event.elevationGainM && (
                      <div className="flex items-start p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
                        <ArrowUp className="h-6 w-6 mr-4 mt-1 text-blue-600" />
                        <div>
                          <div className="text-sm text-gray-600">Elevation Gain</div>
                          <div className="font-bold text-gray-900">{event.elevationGainM} m</div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Requirements Section (members only) */}
            {!isAccessDenied && event.requirements && event.requirements.length > 0 && (
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-lg">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-4">⚠️ Requirements</h2>
                <ul className="space-y-3">
                  {Array.from(event.requirements).map((req, index) => (
                    <li key={index} className="flex items-start">
                      <span className="inline-block w-2 h-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span className="text-gray-700">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Included Items Section (members only) */}
            {!isAccessDenied && event.includedItems && event.includedItems.length > 0 && (
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-lg">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">✨ What's Included</h2>
                <ul className="space-y-3">
                  {Array.from(event.includedItems).map((item, index) => (
                    <li key={index} className="flex items-start">
                      <span className="inline-block w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Attendees/Participants Section (members only) */}
            {!isAccessDenied && (
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-lg">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                  <Users className="inline h-7 w-7 mr-2 mb-1" />
                  Attendees ({event.currentParticipants || 0}{event.maxParticipants ? `/${event.maxParticipants}` : ''})
                </h2>
                {participantsData?.data && participantsData.data.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {participantsData.data.map((participant) => (
                      <div 
                        key={participant.id}
                        onClick={() => navigate(`/members/${participant.id}`)}
                        className="flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl hover:shadow-lg transition-all cursor-pointer group hover:-translate-y-1"
                      >
                        <ProfileAvatar 
                          member={participant} 
                          size="lg" 
                          className="group-hover:scale-110 transition-transform"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 group-hover:bg-clip-text transition-all">
                            {participant.displayName || participant.email.split('@')[0]}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            Joined {new Date(participant.joinedAt).toLocaleDateString()}
                          </p>
                        </div>
                        {participant.isOrganiser && (
                          <span className="text-xs bg-gradient-to-r from-orange-500 to-pink-500 text-white px-2 py-1 rounded-full font-semibold">Host</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 px-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                    <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-600">No attendees yet. Be the first to join!</p>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* ============================================ */}
          {/* SIDEBAR - Price, actions, location, group info */}
          {/* ============================================ */}
          <div className="order-3 lg:order-2 lg:col-span-1">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 sticky top-24 border border-gray-100 shadow-lg space-y-6">
              {!isAccessDenied && (
                <>
                  <div>
                    <p className="text-sm text-gray-500 font-semibold mb-2">PRICE</p>
                    {event.price > 0 ? (
                      <div className="flex items-center text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        <DollarSign className="h-10 w-10 text-purple-600" />
                        <span>{event.price}</span>
                      </div>
                    ) : (
                      <div className="text-4xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Free</div>
                    )}
                  </div>
                </>
              )}

              {/* Action Buttons Section - Varies based on user status */}
              <div className={!isAccessDenied ? "pt-6 border-t border-gray-200" : ""}>
                {isAccessDenied ? (
                  /* NON-MEMBER VIEW - Show Join Group button */
                  <div className="space-y-4">
                    <button 
                      onClick={handleJoinClick}
                      className="w-full p-4 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-xl border border-purple-100 text-center transition-all cursor-pointer transform hover:scale-105"
                      title="Click to login and join"
                    >
                      <Lock className="h-10 w-10 mx-auto mb-3 text-purple-600" />
                      <p className="text-sm font-semibold text-gray-700 mb-1">Join to Unlock</p>
                      <p className="text-xs text-gray-600">Register for this event to view full details</p>
                    </button>
                    <button
                      onClick={handleJoinClick}
                      disabled={joinMutation.isLoading}
                      className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2"
                    >
                      <Users className="h-5 w-5" />
                      {joinMutation.isLoading ? 'Joining...' : 'Join Event'}
                    </button>
                  </div>
                ) : isAuthenticated ? (
                  isEventOrganiser ? (
                    /* ORGANISER VIEW - Show Edit and Delete buttons */
                    <div className="space-y-3">
                      <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl border border-orange-100">
                        <p className="text-orange-700 font-semibold">👑 You're the organiser</p>
                        <p className="text-xs text-gray-600 mt-1">Status: <span className="font-mono font-bold">{event.status || 'UNKNOWN'}</span></p>
                      </div>
                      {!isPastEvent ? (
                        /* FUTURE EVENT - Show Publish (if DRAFT), Edit and Delete buttons */
                        <>
                          {event.status === 'DRAFT' && (
                            <div className="space-y-3">
                              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                                <p className="text-sm text-yellow-800 text-center">
                                  ⚠️ This event is in <span className="font-bold">DRAFT</span> mode. Publish it to make it visible in discover!
                                </p>
                              </div>
                              <button
                                onClick={() => publishMutation.mutate()}
                                disabled={publishMutation.isLoading}
                                className="w-full py-3 px-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-green-500/50 transition-all transform hover:scale-105 disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                <Eye className="h-5 w-5" />
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
                            onClick={handleCopyEvent}
                            className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/50 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                          >
                            <Copy className="h-5 w-5" />
                            Copy Event for Future Date
                          </button>
                        </div>
                      )}
                    </div>
                  ) : hasJoined ? (
                    /* REGISTERED USER VIEW - Show Add to Calendar and Leave button */
                    <div className="space-y-3">
                      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                        <p className="text-green-700 font-semibold text-center">✅ You're registered!</p>
                      </div>
                      
                      {/* Add to Calendar Button */}
                      {!isPastEvent && calendarData && (
                        <AddToCalendar calendarData={calendarData} />
                      )}
                      
                      <button
                        onClick={() => leaveMutation.mutate()}
                        disabled={leaveMutation.isLoading}
                        className={`w-full py-3 px-6 font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                          leaveMutation.isLoading 
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {leaveMutation.isLoading && <Loader className="h-4 w-4 animate-spin" />}
                        {leaveMutation.isLoading ? 'Leaving...' : 'Leave Event'}
                      </button>
                    </div>
                  ) : (
                    /* AUTHENTICATED NON-REGISTERED VIEW - Show Join button */
                    <button
                      onClick={handleJoinClick}
                      disabled={event.status === 'FULL' || joinMutation.isLoading}
                      className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-2xl hover:shadow-purple-500/50 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2"
                    >
                      <Users className="h-5 w-5" />
                      {joinMutation.isLoading ? 'Joining...' : event.status === 'FULL' ? 'Event Full' : 'Join Event'}
                    </button>
                  )
                ) : (
                  /* NOT AUTHENTICATED - Show login prompt */
                  <div className="space-y-3">
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                      <p className="text-sm text-gray-600">🔐 Login to join this event</p>
                    </div>
                    <button
                      onClick={() => navigate('/login')}
                      className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all transform hover:scale-105"
                    >
                      Login to Join
                    </button>
                  </div>
                )}

                {event.status === 'FULL' && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-600 text-center font-semibold">
                      ⚠️ This event is currently full
                    </p>
                  </div>
                )}
              </div>

              {/* Location Map Section (members only) */}
              {!isAccessDenied && event.location && (
                <div className="pt-6 border-t border-gray-200">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="h-5 w-5 text-pink-600" />
                      <h3 className="font-bold text-gray-900">Location</h3>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{event.location}</p>
                    
                    {/* Clickable Compact Map Preview */}
                    <button
                      onClick={() => {
                        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`
                        window.open(googleMapsUrl, '_blank')
                      }}
                      className="relative w-full h-40 rounded-xl overflow-hidden group cursor-pointer transition-all hover:shadow-xl hover:scale-[1.02]"
                    >
                      {/* Static Map from Google Maps */}
                      <img
                        src={`https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(event.location)}&zoom=13&size=400x200&maptype=roadmap&markers=color:red%7C${encodeURIComponent(event.location)}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`}
                        alt={`Map of ${event.location}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          e.target.style.opacity = '0'
                        }}
                      />
                      {/* Overlay with icon */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 shadow-lg transform scale-95 group-hover:scale-100 transition-transform duration-300">
                          <MapPin className="h-4 w-4 text-pink-600" />
                          <span className="font-semibold text-gray-900 text-sm">Open Maps</span>
                        </div>
                      </div>
                    </button>
                    <p className="text-xs text-gray-500 text-center">📍 Click to open in Google Maps</p>
                  </div>
                </div>
              )}

              {/* Group Information Section */}
              {event.groupName && (
                <div className="pt-6 border-t border-gray-200">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="h-5 w-5 text-purple-600" />
                      <h3 className="font-bold text-gray-900">Organized by</h3>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                      <p className="font-bold text-gray-900 mb-2">{event.groupName}</p>
                      <button
                        onClick={() => navigate(`/groups/${event.groupId}`)}
                        className="w-full py-2 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105 text-sm"
                      >
                        View Group
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* COMMENTS SECTION - Full width below main content (members only) */}
        {/* ============================================ */}
        {!isAccessDenied && (
          <div className="mt-8 pb-24 lg:pb-0">
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
      {/* ADD TO CALENDAR MODAL - Opens after successful join */}
      {/* ============================================ */}
      <AddToCalendarModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        calendarData={calendarData}
        eventTitle={event?.title || 'this event'}
      />
    </div>
  )
}
