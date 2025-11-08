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
  const [activeTab, setActiveTab] = React.useState('events')

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
    staleTime: 0, // Always fetch fresh data
  })

  // Fetch user's subscribed groups to check subscription status
  const { data: subscribedGroupsData } = useQuery({
    queryKey: ['myGroups'],
    queryFn: () => groupsAPI.getMyGroups(),
    enabled: isAuthenticated,
    staleTime: 0, // Always fetch fresh data to show updated subscriptions
  })

  const organisedGroups = organisedGroupsData?.data || []
  const subscribedGroups = subscribedGroupsData?.data || []
  const isGroupOrganiser = organisedGroups.some(g => g.id === Number.parseInt(id))
  const isSubscribed = subscribedGroups.some(g => g.id === Number.parseInt(id))

  // Fetch group events using the dedicated endpoint
  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['groupEvents', id],
    queryFn: () => eventsAPI.getEventsByGroup(id),
    enabled: !!group,
  })

  // Fetch group members
  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ['groupMembers', id],
    queryFn: () => groupsAPI.getGroupMembers(id),
    enabled: !!id,
    staleTime: 0, // Always fetch fresh data to show updated member list
  })

  const groupEvents = eventsData?.data?.content || []

  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: () => groupsAPI.subscribeToGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['group', id])
      queryClient.invalidateQueries(['myGroups'])
      queryClient.invalidateQueries(['groupEvents', id])
      queryClient.invalidateQueries(['groupMembers', id])
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
      queryClient.invalidateQueries(['groupEvents', id])
      queryClient.invalidateQueries(['groupMembers', id])
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
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading group details...</p>
        </div>
      </div>
    )
  }

  if (error || !group) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 flex items-center justify-center px-4">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-10 text-center max-w-md">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Group not found</h2>
          <p className="text-gray-600 mb-6">The group you're looking for doesn't exist or has been removed.</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(-1)}
          className="group flex items-center text-gray-600 hover:text-purple-600 mb-6 font-semibold transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Banner Image */}
          <div className="relative h-80 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 opacity-60" />
            <img 
              src={group.bannerImage || [
                'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&h=400&fit=crop',
                'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&h=400&fit=crop',
                'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=400&fit=crop',
                'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1200&h=400&fit=crop'
              ][Number.parseInt(id) % 4]}
              alt={`${group.name} banner`}
              className="w-full h-full object-cover mix-blend-overlay"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
            
            {/* Header Content Overlay */}
            <div className="absolute bottom-0 left-0 right-0 px-8 pb-8">
              <div className="flex items-end justify-between">
                <div className="flex-1">
                  <div className="inline-block px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-white font-semibold text-sm mb-4">
                    {group.activityName}
                  </div>
                  <h1 className="text-5xl font-extrabold text-white mb-4 drop-shadow-2xl">{group.name}</h1>
                  <div className="flex items-center gap-6 text-white/90">
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                      <Users className="h-5 w-5" />
                      <span className="font-semibold">{group.currentMembers || 0}</span>
                      <span className="text-white/70">members</span>
                    </div>
                    {group.location && (
                      <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                        <MapPin className="h-5 w-5" />
                        <span>{group.location}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg ${
                    group.isPublic ? 'bg-green-500 text-white' : 'bg-gray-700 text-white'
                  }`}>
                    {group.isPublic ? '🌍 Public' : '🔒 Private'}
                  </span>
                  {group.maxMembers && (
                    <span className="px-4 py-2 bg-white text-purple-700 rounded-full text-sm font-bold shadow-lg">
                      Max: {group.maxMembers}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

        {/* Content */}
        <div className="px-8 py-6">
          {/* Tabs */}
          <div className="mb-8 border-b border-gray-200">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab('events')}
                className={`pb-4 px-2 font-semibold text-lg transition-all relative ${
                  activeTab === 'events'
                    ? 'text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📅 Events
                {activeTab === 'events' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-t"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('about')}
                className={`pb-4 px-2 font-semibold text-lg transition-all relative ${
                  activeTab === 'about'
                    ? 'text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📖 About
                {activeTab === 'about' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-t"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`pb-4 px-2 font-semibold text-lg transition-all relative ${
                  activeTab === 'members'
                    ? 'text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                👥 Members
                {activeTab === 'members' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-t"></div>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Events Tab */}
              {activeTab === 'events' && (
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent mb-6">Group Events</h2>
                {eventsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
                  </div>
                ) : groupEvents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {groupEvents.map(event => (
                      <div
                        key={event.id}
                        className="group bg-white/60 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-2xl border border-gray-100 overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-2"
                        onClick={() => navigate(`/events/${event.id}`)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && navigate(`/events/${event.id}`)}
                      >
                        {/* Event Image */}
                        <div className="relative h-44 overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-pink-500 opacity-20" />
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
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                          />
                          <div className="absolute top-3 right-3 px-3 py-1 bg-white/95 backdrop-blur-sm rounded-full text-xs font-bold text-orange-600 shadow-lg">
                            {event.difficultyLevel}
                          </div>
                        </div>
                        {/* Event Content */}
                        <div className="p-5">
                          <h3 className="font-bold text-lg text-gray-900 mb-3 line-clamp-1 group-hover:text-orange-600 transition-colors">{event.title}</h3>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="h-4 w-4 text-orange-500" />
                              <span className="font-medium">{new Date(event.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4 text-pink-500" />
                              <span className="truncate">{event.location}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 border-2 border-white flex items-center justify-center text-white text-xs font-bold">{event.currentParticipants}</div>
                              <span className="text-sm text-gray-600 font-medium">{event.currentParticipants}/{event.maxParticipants}</span>
                            </div>
                            <svg className="w-5 h-5 text-orange-600 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gradient-to-br from-orange-50 to-pink-50 rounded-2xl border border-orange-100">
                    <Calendar className="h-16 w-16 mx-auto text-orange-400 mb-4" />
                    <p className="text-gray-600 text-lg mb-2">No events scheduled yet</p>
                    <p className="text-gray-500 text-sm mb-6">Be the first to create an event for this group!</p>
                    {(isSubscribed || isGroupOrganiser) && (
                      <button
                        onClick={() => navigate(`/create-event?groupId=${id}`)}
                        className="py-3 px-8 bg-gradient-to-r from-orange-500 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-orange-500/50 transition-all transform hover:scale-105"
                      >
                        ✨ Create First Event
                      </button>
                    )}
                  </div>
                )}
                </div>
              )}

              {/* About Tab */}
              {activeTab === 'about' && (
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">About This Group</h2>
                  {/* Group Description Image */}
                  <div className="mb-6 rounded-2xl overflow-hidden shadow-lg">
                    <img 
                      src={group.descriptionImage || [
                        'https://images.unsplash.com/photo-1445308394109-4ec2920981b1?w=800&h=400&fit=crop',
                        'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800&h=400&fit=crop',
                        'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=800&h=400&fit=crop',
                        'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800&h=400&fit=crop'
                      ][Number.parseInt(id) % 4]}
                      alt={`${group.name} description`}
                      className="w-full h-72 object-cover"
                    />
                  </div>
                  <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap mb-8">
                    {group.description || 'No description available.'}
                  </p>
                  {group.createdAt && (
                    <div className="flex items-center gap-2 text-gray-500 text-sm pb-8 border-t border-gray-200 pt-8">
                      <Calendar className="h-4 w-4" />
                      <span>Created on {new Date(group.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Members Tab */}
              {activeTab === 'members' && (
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
                    <Users className="inline h-8 w-8 mr-2 mb-1" />
                    Group Members ({membersData?.data?.length || 0})
                  </h2>
                  {membersLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                    </div>
                  ) : membersData?.data && membersData.data.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {membersData.data.map((member) => (
                        <div 
                          key={member.id} 
                          className="flex items-center space-x-4 p-4 bg-white/60 backdrop-blur-sm rounded-2xl hover:shadow-lg transition-shadow border border-gray-100"
                        >
                          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                            {member.displayName ? member.displayName.charAt(0).toUpperCase() : member.email.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 text-lg truncate">
                              {member.displayName || member.email.split('@')[0]}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              Member since {new Date(member.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                          {member.isOrganiser && (
                            <span className="text-xs bg-gradient-to-r from-orange-500 to-pink-500 text-white px-3 py-1 rounded-full font-semibold">Organiser</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-12 text-center border border-purple-100">
                      <Users className="h-16 w-16 mx-auto text-purple-400 mb-4" />
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">No Members Yet</h3>
                      <p className="text-gray-600 mb-6">Be the first to join this group!</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 sticky top-24 border border-gray-100 shadow-lg">
                <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">Group Actions</h3>
                
                {isAuthenticated ? (
                  <div className="space-y-3">
                    {isGroupOrganiser ? (
                      // Show Create Event button for organizers
                      <>
                        <div className="mb-4 p-3 bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl border border-orange-100">
                          <p className="text-sm text-orange-700 font-semibold">👑 You're the organiser</p>
                        </div>
                        <button
                          onClick={() => navigate(`/create-event?groupId=${id}`)}
                          className="w-full py-3 px-6 bg-gradient-to-r from-orange-500 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-orange-500/50 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                        >
                          <Calendar className="h-5 w-5" />
                          Create Event
                        </button>
                      </>
                    ) : (
                      // Show Join/Leave buttons for non-organizers
                      <>
                        {isSubscribed ? (
                          <>
                            <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                              <p className="text-sm text-green-700 font-semibold">✅ You're a member</p>
                            </div>
                            <button
                              onClick={handleUnsubscribe}
                              disabled={unsubscribeMutation.isLoading}
                              className="w-full py-3 px-6 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50"
                            >
                              {unsubscribeMutation.isLoading ? 'Leaving...' : 'Leave Group'}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={handleSubscribe}
                            disabled={subscribeMutation.isLoading}
                            className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-2xl hover:shadow-purple-500/50 transition-all transform hover:scale-105 disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            <Users className="h-5 w-5" />
                            {subscribeMutation.isLoading ? 'Joining...' : 'Join Group'}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100 mb-4">
                      <p className="text-sm text-gray-600">🔐 Login to join this group and participate in events</p>
                    </div>
                    <button
                      onClick={() => navigate('/login')}
                      className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all transform hover:scale-105"
                    >
                      Login
                    </button>
                  </div>
                )}

                {group.primaryOrganiserName && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-500 mb-2">ORGANISED BY</h4>
                    <p className="text-gray-900 font-semibold text-lg">{group.primaryOrganiserName}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
