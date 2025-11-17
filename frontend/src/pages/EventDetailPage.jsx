import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Calendar, MapPin, Users, DollarSign, Clock, TrendingUp, ArrowLeft, Trash2, Lock, Edit } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { eventsAPI } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import CommentSection from '../components/CommentSection'

export default function EventDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAuthenticated, user } = useAuthStore()

  const { data, isLoading, error } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsAPI.getEventById(id),
    retry: (failureCount, error) => {
      // Don't retry on 403 errors (access denied)
      if (error?.response?.status === 403) {
        return false
      }
      return failureCount < 2
    },
    // Don't throw error on 403 - we want to show partial view
    onError: (error) => {
      if (error?.response?.status !== 403) {
        console.error('Error loading event:', error)
      }
    },
  })

  const { data: participantsData } = useQuery({
    queryKey: ['eventParticipants', id],
    queryFn: () => eventsAPI.getEventParticipants(id),
    enabled: !!id,
  })

  const joinMutation = useMutation({
    mutationFn: () => eventsAPI.joinEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['event', id])
      queryClient.invalidateQueries(['eventParticipants', id])
      queryClient.invalidateQueries(['myEvents']) // Update home page "Your Events" section
      toast.success('Successfully joined the event!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to join event')
    },
  })

  const leaveMutation = useMutation({
    mutationFn: () => eventsAPI.leaveEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['event', id])
      queryClient.invalidateQueries(['eventParticipants', id])
      queryClient.invalidateQueries(['myEvents']) // Update home page "Your Events" section
      toast.success('Successfully left the event')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to leave event')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => eventsAPI.deleteEvent(id),
    onSuccess: () => {
      // Invalidate queries to refresh event lists
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

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      deleteMutation.mutate()
    }
  }

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

  const event = data?.data
  
  // Check if current user is the event organiser
  const isEventOrganiser = event && isAuthenticated && Number(user?.id) === Number(event.organiserId)
  
  // Check if access is denied: either 403 error OR partial data (description is null but title exists)
  // BUT organisers should never see access denied state
  const isAccessDenied = !isEventOrganiser && (error?.response?.status === 403 || (event && event.title && !event.description))

  // If no event data at all (not even partial), show not found
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

  // Backend now returns partial data for non-members, so event always exists
  // Check if current user has joined the event
  const hasJoined = event && isAuthenticated && event.participantIds?.includes(user?.id)

  // Check if event spans multiple days
  const startDate = new Date(event.eventDate)
  const endDate = event.endDate ? new Date(event.endDate) : null
  const isMultiDay = endDate && (
    startDate.getFullYear() !== endDate.getFullYear() ||
    startDate.getMonth() !== endDate.getMonth() ||
    startDate.getDate() !== endDate.getDate()
  )

  const formattedStartDate = format(startDate, 'EEEE, MMMM dd, yyyy')
  const formattedEndDate = endDate ? format(endDate, 'EEEE, MMMM dd, yyyy') : null
  const formattedStartTime = format(startDate, 'h:mm a')
  const formattedEndTime = endDate ? format(endDate, 'h:mm a') : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(-1)}
          className="group flex items-center text-gray-600 hover:text-purple-600 mb-6 font-semibold transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>

        {/* Event Image */}
        <div className="relative h-[500px] rounded-3xl overflow-hidden bg-gray-200 mb-8 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-pink-500 opacity-30" />
          <img 
            src={event.imageUrl || [
              'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&h=600&fit=crop',
              'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&h=600&fit=crop',
              'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=600&fit=crop',
              'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1200&h=600&fit=crop',
              'https://images.unsplash.com/photo-1445308394109-4ec2920981b1?w=1200&h=600&fit=crop',
              'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=1200&h=600&fit=crop'
            ][Number.parseInt(id) % 6]}
            alt={event.title} 
            className="w-full h-full object-cover mix-blend-overlay" 
          />
          {/* Overlay info on image */}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-lg">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">Details</h2>
              {isAccessDenied ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 mb-4">
                    <Lock className="h-8 w-8 text-purple-600" />
                  </div>
                  <p className="text-gray-600 mb-4">Only shown to members</p>
                  <button
                    onClick={() => navigate(`/groups/${event.groupId}`)}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    Join Group
                  </button>
                </div>
              ) : (
                <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">{event.description}</p>
              )}
            </div>

            {/* Event Details */}
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
                          {formattedStartTime} to {formattedEndTime}
                        </div>
                      </>
                    ) : (
                      /* Single day event: Show date with time range */
                      <>
                        <div className="font-bold text-gray-900">{formattedStartDate}</div>
                        <div className="text-purple-600 font-semibold">
                          {formattedEndTime ? `${formattedStartTime} - ${formattedEndTime}` : formattedStartTime}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {isAccessDenied ? (
                  /* Locked state for other details */
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 mb-4">
                      <Lock className="h-8 w-8 text-purple-600" />
                    </div>
                    <p className="text-gray-600 mb-4">Location and other details only shown to members</p>
                    <button
                      onClick={() => navigate(`/groups/${event.groupId}`)}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      Join Group
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
                          <div className="font-bold text-gray-900">{event.distanceKm} km</div>
                          {event.estimatedDurationHours && (
                            <div className="text-gray-600">Duration: ~{event.estimatedDurationHours} hours</div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Requirements */}
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

            {/* Included Items */}
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

            {/* Participants */}
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
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 group-hover:scale-110 transition-transform">
                          {participant.displayName ? participant.displayName.charAt(0).toUpperCase() : participant.email.charAt(0).toUpperCase()}
                        </div>
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

            {/* Comment Section */}
            <CommentSection eventId={id} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
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

              <div className={!isAccessDenied ? "pt-6 border-t border-gray-200" : ""}>
                {isAccessDenied ? (
                  // Access denied - show Join Group button
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100 text-center">
                      <Lock className="h-10 w-10 mx-auto mb-3 text-purple-600" />
                      <p className="text-sm font-semibold text-gray-700 mb-1">Members Only Event</p>
                      <p className="text-xs text-gray-600">Join the group to view full details and register</p>
                    </div>
                    <button
                      onClick={() => navigate(`/groups/${event.groupId}`)}
                      className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                    >
                      Join Group to Participate
                    </button>
                  </div>
                ) : isAuthenticated ? (
                  isEventOrganiser ? (
                    // Organiser view - show edit and delete buttons
                    <div className="space-y-3">
                      <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl border border-orange-100">
                        <p className="text-orange-700 font-semibold">👑 You're the organiser</p>
                      </div>
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
                    </div>
                  ) : hasJoined ? (
                    // User has joined - show leave button and status
                    <div className="space-y-3">
                      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                        <p className="text-green-700 font-semibold text-center">✅ You're registered!</p>
                      </div>
                      <button
                        onClick={() => leaveMutation.mutate()}
                        disabled={leaveMutation.isLoading}
                        className="w-full py-3 px-6 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50"
                      >
                        {leaveMutation.isLoading ? 'Leaving...' : 'Leave Event'}
                      </button>
                    </div>
                  ) : (
                    // User hasn't joined - show join button
                    <button
                      onClick={() => joinMutation.mutate()}
                      disabled={event.status === 'FULL' || joinMutation.isLoading}
                      className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-2xl hover:shadow-purple-500/50 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2"
                    >
                      <Users className="h-5 w-5" />
                      {joinMutation.isLoading ? 'Joining...' : event.status === 'FULL' ? 'Event Full' : 'Join Event'}
                    </button>
                  )
                ) : (
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

              {/* Location Map Preview - Compact version in sidebar */}
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
                        onError={(e) => {
                          // Fallback if map fails to load
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5DbGljayB0byBvcGVuIE1hcHM8L3RleHQ+PC9zdmc+'
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

              {/* Group Information */}
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
      </div>
    </div>
  )
}
