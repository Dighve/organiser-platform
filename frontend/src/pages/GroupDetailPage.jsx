import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { groupsAPI, eventsAPI } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { ArrowLeft, Users, MapPin, Calendar } from 'lucide-react'

export default function GroupDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAuthenticated, user } = useAuthStore()

  // Fetch group details
  const { data: groupData, isLoading, error } = useQuery({
    queryKey: ['group', id],
    queryFn: () => groupsAPI.getGroupById(id),
  })

  const group = groupData?.data

  // Fetch user's organised groups to check if they're the organiser
  const { data: organisedGroupsData } = useQuery({
    queryKey: ['myOrganisedGroups'],
    queryFn: () => groupsAPI.getMyOrganisedGroups(),
    enabled: isAuthenticated && user?.isOrganiser,
  })

  // Fetch user's subscribed groups to check subscription status
  const { data: subscribedGroupsData } = useQuery({
    queryKey: ['myGroups'],
    queryFn: () => groupsAPI.getMyGroups(),
    enabled: isAuthenticated,
  })

  const organisedGroups = organisedGroupsData?.data || []
  const subscribedGroups = subscribedGroupsData?.data || []
  const isGroupOrganiser = organisedGroups.some(g => g.id === Number.parseInt(id))
  const isSubscribed = subscribedGroups.some(g => g.id === Number.parseInt(id))

  // Fetch group events (using getUpcomingEvents and filtering by group)
  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['groupEvents', id],
    queryFn: () => eventsAPI.getUpcomingEvents(0, 50),
    enabled: !!group,
  })

  // Filter events for this group
  const groupEvents = (eventsData?.data?.content || []).filter(
    event => event.groupId === Number.parseInt(id)
  )

  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: () => groupsAPI.subscribeToGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['group', id])
      queryClient.invalidateQueries(['myGroups'])
    },
    onError: (error) => {
      console.error('Subscribe error:', error)
      alert(error.response?.data?.message || 'Failed to join group')
    },
  })

  // Unsubscribe mutation
  const unsubscribeMutation = useMutation({
    mutationFn: () => groupsAPI.unsubscribeFromGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['group', id])
      queryClient.invalidateQueries(['myGroups'])
    },
    onError: (error) => {
      console.error('Unsubscribe error:', error)
      alert(error.response?.data?.message || 'Failed to leave group')
    },
  })

  const handleSubscribe = () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    subscribeMutation.mutate()
  }

  const handleUnsubscribe = () => {
    if (confirm('Are you sure you want to leave this group?')) {
      unsubscribeMutation.mutate()
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-gray-600">Loading group details...</div>
      </div>
    )
  }

  if (error || !group) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-red-600 mb-4">Group not found</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </button>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Banner Image */}
        <div className="relative h-64 bg-gradient-to-r from-primary-400 to-primary-600 overflow-hidden">
          <img 
            src={group.bannerImage || [
              'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&h=400&fit=crop',
              'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&h=400&fit=crop',
              'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=400&fit=crop',
              'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1200&h=400&fit=crop'
            ][Number.parseInt(id) % 4]}
            alt={`${group.name} banner`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        </div>

        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-700 px-8 py-12 text-white -mt-32 relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-3">{group.name}</h1>
              <div className="flex items-center gap-4 text-primary-100">
                <div className="flex items-center gap-1">
                  <Users className="h-5 w-5" />
                  <span>{group.currentMembers || 0} members</span>
                </div>
                {group.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-5 w-5" />
                    <span>{group.location}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                group.isPublic ? 'bg-green-500' : 'bg-gray-500'
              }`}>
                {group.isPublic ? 'Public' : 'Private'}
              </span>
              {group.maxMembers && (
                <span className="px-3 py-1 bg-white text-primary-700 rounded-full text-sm font-medium">
                  Max: {group.maxMembers}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">About</h2>
                {/* Group Description Image */}
                <div className="mb-4 rounded-lg overflow-hidden">
                  <img 
                    src={group.descriptionImage || [
                      'https://images.unsplash.com/photo-1445308394109-4ec2920981b1?w=800&h=400&fit=crop',
                      'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800&h=400&fit=crop',
                      'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=800&h=400&fit=crop',
                      'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800&h=400&fit=crop'
                    ][Number.parseInt(id) % 4]}
                    alt={`${group.name} description`}
                    className="w-full h-64 object-cover"
                  />
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {group.description || 'No description available.'}
                </p>
              </div>

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Activity Type</h2>
                <div className="inline-flex items-center px-4 py-2 bg-primary-100 text-primary-800 rounded-lg font-medium">
                  {group.activityName}
                </div>
              </div>

              {group.createdAt && (
                <div className="flex items-center gap-2 text-gray-600 text-sm mb-6">
                  <Calendar className="h-4 w-4" />
                  <span>Created on {new Date(group.createdAt).toLocaleDateString()}</span>
                </div>
              )}

              {/* Group Events Section */}
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Group Events</h2>
                {eventsLoading ? (
                  <div className="text-gray-600">Loading events...</div>
                ) : groupEvents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groupEvents.map(event => (
                      <div
                        key={event.id}
                        className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                        onClick={() => navigate(`/events/${event.id}`)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && navigate(`/events/${event.id}`)}
                      >
                        {/* Event Image */}
                        <div className="h-40 bg-gradient-to-br from-green-400 to-green-600 overflow-hidden">
                          <img 
                            src={event.imageUrl || [
                              'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&h=300&fit=crop',
                              'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&h=300&fit=crop',
                              'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=300&fit=crop',
                              'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=600&h=300&fit=crop',
                              'https://images.unsplash.com/photo-1445308394109-4ec2920981b1?w=600&h=300&fit=crop',
                              'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=600&h=300&fit=crop'
                            ][Number.parseInt(event.id) % 6]}
                            alt={event.title} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        {/* Event Content */}
                        <div className="p-4">
                          <div className="font-bold text-lg text-gray-900 mb-2 line-clamp-1">{event.title}</div>
                          <div className="text-sm text-gray-600 mb-2">
                            <div className="flex items-center gap-2 mb-1">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(event.eventDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span className="truncate">{event.location}</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-xs mt-3">
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
                              {event.difficultyLevel}
                            </span>
                            <span className="text-gray-600">
                              👥 {event.currentParticipants}/{event.maxParticipants}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600">No events scheduled for this group yet.</p>
                    {(isSubscribed || isGroupOrganiser) && (
                      <button
                        onClick={() => navigate(`/create-event?groupId=${id}`)}
                        className="mt-4 btn btn-primary"
                      >
                        Create First Event
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-lg p-6 sticky top-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Group Actions</h3>
                
                {isAuthenticated ? (
                  <div className="space-y-3">
                    {isGroupOrganiser ? (
                      // Show Create Event button for organizers
                      <button
                        onClick={() => navigate(`/create-event?groupId=${id}`)}
                        className="w-full btn btn-primary"
                      >
                        Create Event
                      </button>
                    ) : (
                      // Show Join/Leave buttons for non-organizers
                      <>
                        {isSubscribed ? (
                          <>
                            <button
                              onClick={() => navigate(`/create-event?groupId=${id}`)}
                              className="w-full btn btn-primary"
                            >
                              Create Event
                            </button>
                            <button
                              onClick={handleUnsubscribe}
                              disabled={unsubscribeMutation.isLoading}
                              className="w-full btn btn-outline"
                            >
                              {unsubscribeMutation.isLoading ? 'Leaving...' : 'Leave Group'}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={handleSubscribe}
                            disabled={subscribeMutation.isLoading}
                            className="w-full btn btn-primary"
                          >
                            {subscribeMutation.isLoading ? 'Joining...' : 'Join Group'}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 mb-3">Login to join this group</p>
                    <button
                      onClick={() => navigate('/login')}
                      className="w-full btn btn-primary"
                    >
                      Login
                    </button>
                  </div>
                )}

                {group.primaryOrganiserName && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Organizer</h4>
                    <p className="text-gray-900">{group.primaryOrganiserName}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
