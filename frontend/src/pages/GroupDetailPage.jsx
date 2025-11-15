import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { groupsAPI, eventsAPI } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { ArrowLeft, Users, MapPin, Calendar, Edit, Upload, X } from 'lucide-react'
import GooglePlacesAutocomplete from '../components/GooglePlacesAutocomplete'
import ImageUpload from '../components/ImageUpload'
import { toast } from 'react-hot-toast'

export default function GroupDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAuthenticated, user } = useAuthStore()
  const [activeTab, setActiveTab] = React.useState('about')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    location: '',
    imageUrl: '',
    maxMembers: '',
    isPublic: true,
  })

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

  // Update group mutation
  const updateGroupMutation = useMutation({
    mutationFn: (data) => groupsAPI.updateGroup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['group', id])
      queryClient.invalidateQueries(['myGroups'])
      queryClient.invalidateQueries(['myOrganisedGroups'])
      setIsEditModalOpen(false)
      toast.success('Group updated successfully!')
    },
    onError: (error) => {
      console.error('Update group error:', error)
      toast.error(error.response?.data?.message || 'Failed to update group')
    },
  })

  // Open edit modal with current group data
  const handleOpenEditModal = () => {
    if (group) {
      setEditFormData({
        name: group.name || '',
        description: group.description || '',
        location: group.location || '',
        imageUrl: group.imageUrl || '',
        maxMembers: group.maxMembers || '',
        isPublic: group.isPublic !== undefined ? group.isPublic : true,
      })
      setIsEditModalOpen(true)
    }
  }

  // Handle edit form submission
  const handleEditSubmit = (e) => {
    e.preventDefault()
    
    const updateData = {
      name: editFormData.name.trim(),
      description: editFormData.description.trim() || null,
      activityId: 1, // Hiking - always
      location: editFormData.location.trim() || null,
      imageUrl: editFormData.imageUrl || null,
      maxMembers: editFormData.maxMembers ? parseInt(editFormData.maxMembers) : null,
      isPublic: editFormData.isPublic,
    }
    
    updateGroupMutation.mutate(updateData)
  }

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
                  {eventsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
                    </div>
                  ) : groupEvents.length > 0 ? (
                    <div className="space-y-10">
                      {/* Upcoming Events */}
                      {(() => {
                        const now = new Date()
                        const upcomingEvents = groupEvents.filter(event => new Date(event.eventDate) >= now)
                        return upcomingEvents.length > 0 && (
                          <div>
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent mb-6">
                              Upcoming Events ({upcomingEvents.length})
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {upcomingEvents.map(event => (
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
                          </div>
                        )
                      })()}

                      {/* Past Events */}
                      {(() => {
                        const now = new Date()
                        const pastEvents = groupEvents.filter(event => new Date(event.eventDate) < now)
                        return pastEvents.length > 0 && (
                          <div>
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-600 to-gray-400 bg-clip-text text-transparent mb-6">
                              Past Events ({pastEvents.length})
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {pastEvents.map(event => (
                                <div
                                  key={event.id}
                                  className="group bg-white/40 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-lg border border-gray-200 overflow-hidden cursor-pointer transition-all duration-300 opacity-75 hover:opacity-90"
                                  onClick={() => navigate(`/events/${event.id}`)}
                                  role="button"
                                  tabIndex={0}
                                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/events/${event.id}`)}
                                >
                                  {/* Event Image */}
                                  <div className="relative h-44 overflow-hidden">
                                    <div className="absolute inset-0 bg-gray-500 opacity-30" />
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
                                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" 
                                    />
                                    <div className="absolute top-3 left-3 px-3 py-1 bg-gray-600/90 backdrop-blur-sm rounded-full text-xs font-bold text-white shadow-lg">
                                      ✓ Completed
                                    </div>
                                    <div className="absolute top-3 right-3 px-3 py-1 bg-white/80 backdrop-blur-sm rounded-full text-xs font-bold text-gray-600 shadow-lg">
                                      {event.difficultyLevel}
                                    </div>
                                  </div>
                                  {/* Event Content */}
                                  <div className="p-5">
                                    <h3 className="font-bold text-lg text-gray-700 mb-3 line-clamp-1 group-hover:text-gray-900 transition-colors">{event.title}</h3>
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        <span className="font-medium">{new Date(event.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <MapPin className="h-4 w-4 text-gray-400" />
                                        <span className="truncate">{event.location}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-200">
                                      <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold">{event.currentParticipants}</div>
                                        <span className="text-sm text-gray-500 font-medium">{event.currentParticipants}/{event.maxParticipants}</span>
                                      </div>
                                      <svg className="w-5 h-5 text-gray-500 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })()}
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
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">About This Group</h2>
                    {isGroupOrganiser && (
                      <button
                        onClick={handleOpenEditModal}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all transform hover:scale-105"
                      >
                        <Edit className="h-4 w-4" />
                        Edit Group
                      </button>
                    )}
                  </div>
                  <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap mb-8">
                    {group.description || 'No description available.'}
                  </p>
                  {group.createdAt && (
                    <div className="flex items-center gap-2 text-gray-500 text-sm pb-8 border-t border-gray-200 pt-8 mb-8">
                      <Calendar className="h-4 w-4" />
                      <span>Created on {new Date(group.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  )}

                  {/* Events Section */}
                  <div className="mt-8">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent mb-6">Upcoming Events</h2>
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
                          onClick={() => navigate(`/members/${member.id}`)}
                          className="flex items-center space-x-4 p-4 bg-white/60 backdrop-blur-sm rounded-2xl hover:shadow-lg transition-all border border-gray-100 cursor-pointer group hover:-translate-y-1"
                        >
                          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl flex-shrink-0 group-hover:scale-110 transition-transform">
                            {member.displayName ? member.displayName.charAt(0).toUpperCase() : member.email.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 text-lg truncate group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 group-hover:bg-clip-text transition-all">
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
            <div className="lg:col-span-1 space-y-6">
              {/* Members Section - Only shown on About tab */}
              {activeTab === 'about' && (
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-lg">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">Members ({membersData?.data?.length || 0})</h3>
                  {membersLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    </div>
                  ) : membersData?.data && membersData.data.length > 0 ? (
                    <div className="grid grid-cols-4 gap-3">
                      {membersData.data.slice(0, 8).map((member) => (
                        <div
                          key={member.id}
                          onClick={() => setActiveTab('members')}
                          className="cursor-pointer group relative"
                          title={member.displayName || member.email.split('@')[0]}
                        >
                          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl group-hover:scale-110 group-hover:shadow-lg transition-all duration-200 border-2 border-white shadow-md">
                            {member.displayName ? member.displayName.charAt(0).toUpperCase() : member.email.charAt(0).toUpperCase()}
                          </div>
                          {member.isOrganiser && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs border-2 border-white">
                              👑
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto text-purple-300 mb-2" />
                      <p className="text-gray-500 text-sm">No members yet</p>
                    </div>
                  )}
                  {membersData?.data && membersData.data.length > 8 && (
                    <button
                      onClick={() => setActiveTab('members')}
                      className="w-full mt-4 py-2 px-4 text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all transform hover:scale-105"
                    >
                      See All ({membersData.data.length})
                    </button>
                  )}
                </div>
              )}

              {/* Group Actions */}
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

      {/* Edit Group Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-3xl flex items-center justify-between">
              <h2 className="text-2xl font-bold">Edit Group</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-all"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
              {/* Group Name */}
              <div>
                <label htmlFor="edit-name" className="block text-sm font-semibold text-gray-700 mb-2">
                  🎯 Group Name *
                </label>
                <input
                  type="text"
                  id="edit-name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium transition-all"
                  placeholder="e.g., Peak District Hikers"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="edit-description" className="block text-sm font-semibold text-gray-700 mb-2">
                  📝 Description
                </label>
                <textarea
                  id="edit-description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium transition-all"
                  placeholder="Describe your group, its purpose, and what members can expect..."
                />
              </div>

              {/* Cover Photo */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Upload className="h-4 w-4 text-purple-600" />
                  Cover Photo / Banner
                </label>
                <ImageUpload
                  value={editFormData.imageUrl}
                  onChange={(url) => {
                    setEditFormData(prev => ({ ...prev, imageUrl: url }))
                  }}
                  folder="group-banner"
                />
                <p className="mt-2 text-xs text-gray-500">
                  💡 Recommended size: 1200x400px
                </p>
              </div>

              {/* Location */}
              <div>
                <label htmlFor="edit-location" className="block text-sm font-semibold text-gray-700 mb-2">
                  📍 Location
                </label>
                <GooglePlacesAutocomplete
                  value={editFormData.location}
                  onChange={(value) => {
                    setEditFormData(prev => ({ ...prev, location: value }))
                  }}
                  onPlaceSelect={(locationData) => {
                    setEditFormData(prev => ({
                      ...prev,
                      location: locationData.address
                    }))
                  }}
                  placeholder="e.g., Peak District, UK"
                />
              </div>

              {/* Max Members */}
              <div>
                <label htmlFor="edit-maxMembers" className="block text-sm font-semibold text-gray-700 mb-2">
                  👥 Maximum Members (Optional)
                </label>
                <input
                  type="number"
                  id="edit-maxMembers"
                  value={editFormData.maxMembers}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, maxMembers: e.target.value }))}
                  min="1"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium transition-all"
                  placeholder="Leave empty for unlimited"
                />
              </div>

              {/* Is Public */}
              <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl">
                <input
                  type="checkbox"
                  id="edit-isPublic"
                  checked={editFormData.isPublic}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                  className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                />
                <label htmlFor="edit-isPublic" className="text-sm font-semibold text-gray-700 cursor-pointer">
                  🌍 Make this group public (visible to everyone)
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
                  disabled={updateGroupMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={updateGroupMutation.isPending}
                >
                  {updateGroupMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
