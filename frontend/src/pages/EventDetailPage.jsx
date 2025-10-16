import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Calendar, MapPin, Users, DollarSign, Clock, TrendingUp, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { eventsAPI } from '../lib/api'
import { useAuthStore } from '../store/authStore'

export default function EventDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAuthenticated, user } = useAuthStore()

  const { data, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsAPI.getEventById(id),
  })

  const joinMutation = useMutation({
    mutationFn: () => eventsAPI.joinEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['event', id])
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
      toast.success('Successfully left the event')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to leave event')
    },
  })

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-96 bg-gray-200 rounded-lg mb-8"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  const event = data?.data

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-center text-gray-600">Event not found</p>
      </div>
    )
  }

  // Check if current user is the event organiser
  const isEventOrganiser = isAuthenticated && user?.email === event.organiserEmail

  const formattedDate = format(new Date(event.eventDate), 'EEEE, MMMM dd, yyyy')
  const formattedTime = format(new Date(event.eventDate), 'h:mm a')

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back
      </button>

      {/* Event Image */}
      <div className="relative h-96 rounded-lg overflow-hidden bg-gray-200 mb-8">
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
          className="w-full h-full object-cover" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="mb-4">
            <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
              {event.activityTypeName}
            </span>
          </div>

          <h1 className="text-4xl font-bold mb-4">{event.title}</h1>

          <div className="flex items-center text-gray-600 mb-6">
            <span>Organized by <span className="font-medium text-gray-900">{event.organiserName}</span></span>
          </div>

          <div className="prose max-w-none mb-8">
            <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
          </div>

          {/* Event Details */}
          <div className="card mb-8">
            <h2 className="text-2xl font-bold mb-4">Event Details</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <Calendar className="h-5 w-5 mr-3 mt-1 text-gray-400" />
                <div>
                  <div className="font-medium">{formattedDate}</div>
                  <div className="text-gray-600">{formattedTime}</div>
                </div>
              </div>

              <div className="flex items-start">
                <MapPin className="h-5 w-5 mr-3 mt-1 text-gray-400" />
                <div>
                  <div className="font-medium">{event.location}</div>
                </div>
              </div>

              {event.difficultyLevel && (
                <div className="flex items-start">
                  <TrendingUp className="h-5 w-5 mr-3 mt-1 text-gray-400" />
                  <div>
                    <div className="font-medium">Difficulty: {event.difficultyLevel}</div>
                  </div>
                </div>
              )}

              {event.distanceKm && (
                <div className="flex items-start">
                  <Clock className="h-5 w-5 mr-3 mt-1 text-gray-400" />
                  <div>
                    <div className="font-medium">Distance: {event.distanceKm} km</div>
                    {event.estimatedDurationHours && (
                      <div className="text-gray-600">Duration: ~{event.estimatedDurationHours} hours</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Requirements */}
          {event.requirements && event.requirements.length > 0 && (
            <div className="card mb-8">
              <h2 className="text-2xl font-bold mb-4">Requirements</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                {Array.from(event.requirements).map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Included Items */}
          {event.includedItems && event.includedItems.length > 0 && (
            <div className="card">
              <h2 className="text-2xl font-bold mb-4">What's Included</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                {Array.from(event.includedItems).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="card sticky top-20">
            <div className="mb-6">
              {event.price > 0 ? (
                <div className="flex items-center text-3xl font-bold text-primary-600">
                  <DollarSign className="h-8 w-8" />
                  <span>{event.price}</span>
                </div>
              ) : (
                <div className="text-3xl font-bold text-primary-600">Free</div>
              )}
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Participants</span>
                <span className="font-medium">
                  {event.currentParticipants}
                  {event.maxParticipants && `/${event.maxParticipants}`}
                </span>
              </div>
              {event.maxParticipants && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{
                      width: `${(event.currentParticipants / event.maxParticipants) * 100}%`,
                    }}
                  ></div>
                </div>
              )}
            </div>

            {isAuthenticated ? (
              isEventOrganiser ? (
                // Organiser view - show message instead of join/leave buttons
                <div className="text-center p-4 bg-primary-50 rounded-lg">
                  <p className="text-primary-700 font-medium">You are the organiser of this event</p>
                </div>
              ) : (
                // Regular user view - show join/leave buttons
                <div className="space-y-3">
                  <button
                    onClick={() => joinMutation.mutate()}
                    disabled={event.status === 'FULL' || joinMutation.isLoading}
                    className="w-full btn btn-primary"
                  >
                    {joinMutation.isLoading ? 'Joining...' : 'Join Event'}
                  </button>
                  <button
                    onClick={() => leaveMutation.mutate()}
                    disabled={leaveMutation.isLoading}
                    className="w-full btn btn-outline"
                  >
                    {leaveMutation.isLoading ? 'Leaving...' : 'Leave Event'}
                  </button>
                </div>
              )
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="w-full btn btn-primary"
              >
                Login to Join
              </button>
            )}

            {event.status === 'FULL' && (
              <p className="mt-4 text-sm text-red-600 text-center">
                This event is currently full
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
