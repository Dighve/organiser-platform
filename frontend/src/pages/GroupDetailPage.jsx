import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { groupsAPI, eventsAPI } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { ArrowLeft, Users, MapPin, Calendar, Edit, Upload, X } from 'lucide-react'
import GooglePlacesAutocomplete from '../components/GooglePlacesAutocomplete'
import ImageUpload from '../components/ImageUpload'
import ProfileAvatar from '../components/ProfileAvatar'
import { toast } from 'react-hot-toast'

// ============================================
// CONSTANTS - Default fallback images
// ============================================
const DEFAULT_GROUP_IMAGES = [
  'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&h=400&fit=crop&q=80',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&h=400&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=400&fit=crop&q=80',
  'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1200&h=400&fit=crop&q=80',
  'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=1200&h=400&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=1200&h=400&fit=crop&q=80'
]

const DEFAULT_EVENT_IMAGES = [
  'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&h=300&fit=crop',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&h=300&fit=crop',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=300&fit=crop',
  'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=600&h=300&fit=crop',
  'https://images.unsplash.com/photo-1445308394109-4ec2920981b1?w=600&h=300&fit=crop',
  'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=600&h=300&fit=crop'
]

// ============================================
// REUSABLE EVENT CARD COMPONENT
// Used for displaying events in both About and Events tabs
// ============================================
const EventCard = ({ event, isPast = false, onClick }) => {
  // Use event's image or fallback to default based on event ID
  const imageUrl = event.imageUrl || DEFAULT_EVENT_IMAGES[parseInt(event.id) % DEFAULT_EVENT_IMAGES.length]
  
  return (
    <div
      className={`group bg-white/60 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-2xl border overflow-hidden cursor-pointer transition-all duration-300 ${
        isPast ? 'border-gray-200 opacity-75 hover:opacity-90' : 'border-gray-100 hover:-translate-y-2'
      }`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      {/* Event Image */}
      <div className="relative h-44 overflow-hidden">
        <div className={`absolute inset-0 opacity-30 ${
          isPast ? 'bg-gray-500' : 'bg-gradient-to-br from-orange-500 to-pink-500 opacity-20'
        }`} />
        <img 
          src={imageUrl}
          alt={event.title} 
          className={`w-full h-full object-cover transition-all duration-500 ${
            isPast ? 'grayscale group-hover:grayscale-0' : 'group-hover:scale-110'
          }`}
        />
        {/* Completion badge for past events */}
        {isPast && (
          <div className="absolute top-3 left-3 px-3 py-1 bg-gray-600/90 backdrop-blur-sm rounded-full text-xs font-bold text-white shadow-lg">
            ✓ Completed
          </div>
        )}
        {/* Difficulty badge */}
        <div className={`absolute top-3 right-3 px-3 py-1 backdrop-blur-sm rounded-full text-xs font-bold shadow-lg ${
          isPast ? 'bg-white/80 text-gray-600' : 'bg-white/95 text-orange-600'
        }`}>
          {event.difficultyLevel}
        </div>
      </div>
      
      {/* Event Details */}
      <div className="p-5">
        <h3 className={`font-bold text-lg mb-3 line-clamp-1 transition-colors ${
          isPast ? 'text-gray-700 group-hover:text-gray-900' : 'text-gray-900 group-hover:text-orange-600'
        }`}>
          {event.title}
        </h3>
        {/* Date and Location */}
        <div className="space-y-2">
          <div className={`flex items-center gap-2 text-sm ${isPast ? 'text-gray-500' : 'text-gray-600'}`}>
            <Calendar className={`h-4 w-4 ${isPast ? 'text-gray-400' : 'text-orange-500'}`} />
            <span className="font-medium">
              {new Date(event.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <div className={`flex items-center gap-2 text-sm ${isPast ? 'text-gray-500' : 'text-gray-600'}`}>
            <MapPin className={`h-4 w-4 ${isPast ? 'text-gray-400' : 'text-pink-500'}`} />
            <span className="truncate">{event.location}</span>
          </div>
        </div>
        {/* Participants count */}
        <div className={`flex items-center justify-between pt-3 mt-3 border-t ${isPast ? 'border-gray-200' : 'border-gray-100'}`}>
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold ${
              isPast ? 'bg-gradient-to-br from-gray-400 to-gray-500' : 'bg-gradient-to-br from-orange-400 to-pink-400'
            }`}>
              {event.currentParticipants}
            </div>
            <span className={`text-sm font-medium ${isPast ? 'text-gray-500' : 'text-gray-600'}`}>
              {event.currentParticipants}/{event.maxParticipants}
            </span>
          </div>
          <svg className={`w-5 h-5 group-hover:translate-x-1 transition-transform ${isPast ? 'text-gray-500' : 'text-orange-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function GroupDetailPage() {
  // ============================================
  // HOOKS & ROUTING
  // ============================================
  const { id } = useParams() // Get group ID from URL
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAuthenticated, user } = useAuthStore()
  const [searchParams] = useSearchParams()

  // ============================================
  // LOCAL STATE
  // ============================================
  const [activeTab, setActiveTab] = useState('about') // Current tab: about, events, or members
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    termsAndConditions: '',
    location: '',
    imageUrl: '',
    maxMembers: '',
    isPublic: true,
  })

  // Set initial tab from URL parameter (e.g., ?tab=events)
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam === 'events' || tabParam === 'members') {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  // ============================================
  // DATA FETCHING - React Query hooks
  // ============================================
  
  // 1. Fetch group details
  const { data: groupData, isLoading, error } = useQuery({
    queryKey: ['group', id],
    queryFn: () => groupsAPI.getGroupById(id),
  })

  // 2. Fetch user's organised groups (to check if user is the organiser)
  const { data: organisedGroupsData } = useQuery({
    queryKey: ['myOrganisedGroups'],
    queryFn: () => groupsAPI.getMyOrganisedGroups(),
    enabled: isAuthenticated && user?.isOrganiser,
    staleTime: 0,
  })

  // 3. Fetch user's subscribed groups (to check if user is a member)
  const { data: subscribedGroupsData } = useQuery({
    queryKey: ['myGroups'],
    queryFn: () => groupsAPI.getMyGroups(),
    enabled: isAuthenticated,
    staleTime: 0,
  })

  // 4. Fetch all events for this group
  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['groupEvents', id],
    queryFn: () => eventsAPI.getEventsByGroup(id),
    enabled: !!groupData, // Only fetch after group data is loaded
  })

  // 5. Fetch all members of this group
  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ['groupMembers', id],
    queryFn: () => groupsAPI.getGroupMembers(id),
    enabled: !!id,
    staleTime: 0,
  })

  // ============================================
  // COMPUTED VALUES - Derived from fetched data
  // ============================================
  const group = groupData?.data
  const groupEvents = eventsData?.data?.content || []
  const organisedGroups = organisedGroupsData?.data || []
  const subscribedGroups = subscribedGroupsData?.data || []
  
  // Check user's relationship to this group
  const isGroupOrganiser = organisedGroups.some(g => g.id === parseInt(id))
  const isSubscribed = subscribedGroups.some(g => g.id === parseInt(id))
  
  // Split events into upcoming and past for easier rendering
  const now = new Date()
  const upcomingEvents = groupEvents.filter(event => new Date(event.eventDate) >= now)
  const pastEvents = groupEvents.filter(event => new Date(event.eventDate) < now)

  // ============================================
  // MUTATIONS - API calls that change data
  // ============================================
  
  // Join group (subscribe)
  const subscribeMutation = useMutation({
    mutationFn: () => groupsAPI.subscribeToGroup(id),
    onSuccess: () => {
      // Refresh all affected data
      queryClient.invalidateQueries(['group', id])
      queryClient.invalidateQueries(['myGroups'])
      queryClient.invalidateQueries(['groupEvents', id])
      queryClient.invalidateQueries(['groupMembers', id])
      // Invalidate all event queries so cached event pages refetch with new membership
      queryClient.invalidateQueries({ queryKey: ['event'], refetchType: 'all' })
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to join group')
    },
  })

  // Leave group (unsubscribe)
  const unsubscribeMutation = useMutation({
    mutationFn: () => groupsAPI.unsubscribeFromGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['group', id])
      queryClient.invalidateQueries(['myGroups'])
      queryClient.invalidateQueries(['groupEvents', id])
      queryClient.invalidateQueries(['groupMembers', id])
      // Invalidate all event queries so cached event pages refetch with new membership
      queryClient.invalidateQueries({ queryKey: ['event'], refetchType: 'all' })
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to leave group')
    },
  })

  // Update group details (organiser only)
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
      toast.error(error.response?.data?.message || 'Failed to update group')
    },
  })

  // ============================================
  // EVENT HANDLERS
  // ============================================
  
  // Open edit modal and populate with current group data
  const handleOpenEditModal = () => {
    if (group) {
      setEditFormData({
        name: group.name || '',
        description: group.description || '',
        termsAndConditions: group.termsAndConditions || '',
        location: group.location || '',
        imageUrl: group.imageUrl || '',
        maxMembers: group.maxMembers || '',
        isPublic: group.isPublic !== undefined ? group.isPublic : true,
      })
      setIsEditModalOpen(true)
    }
  }

  // Save edited group data
  const handleEditSubmit = (e) => {
    e.preventDefault()
    
    const updateData = {
      name: editFormData.name.trim(),
      description: editFormData.description.trim() || null,
      termsAndConditions: editFormData.termsAndConditions.trim() || null,
      activityId: 1, // Always Hiking for now
      location: editFormData.location.trim() || null,
      imageUrl: editFormData.imageUrl || null,
      maxMembers: editFormData.maxMembers ? parseInt(editFormData.maxMembers) : null,
      isPublic: editFormData.isPublic,
    }
    
    updateGroupMutation.mutate(updateData)
  }

  // Join group (redirect to login if not authenticated)
  const handleSubscribe = () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    subscribeMutation.mutate()
  }

  // Leave group (with confirmation dialog)
  const handleUnsubscribe = () => {
    if (confirm('Are you sure you want to leave this group?')) {
      unsubscribeMutation.mutate()
    }
  }

  // ============================================
  // LOADING & ERROR STATES
  // ============================================

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

  // ============================================
  // RENDER - Main component JSX
  // ============================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="group flex items-center text-gray-600 hover:text-purple-600 mb-6 font-semibold transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          {/* ============================================ */}
          {/* HERO BANNER with group info */}
          {/* ============================================ */}
          <div className="relative h-80 overflow-hidden">
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 opacity-60" />
            
            {/* Banner image (custom or fallback) */}
            <img 
              src={group.imageUrl || DEFAULT_GROUP_IMAGES[parseInt(id) % DEFAULT_GROUP_IMAGES.length]}
              alt={`${group.name} banner`}
              className="w-full h-full object-cover mix-blend-overlay"
            />
            
            {/* Dark gradient from bottom */}
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
              {/* ============================================ */}
              {/* EVENTS TAB - Show upcoming and past events */}
              {/* ============================================ */}
              {activeTab === 'events' && (
                <div>
                  {eventsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
                    </div>
                  ) : groupEvents.length > 0 ? (
                    <div className="space-y-10">
                      {/* Upcoming Events Section */}
                      {upcomingEvents.length > 0 && (
                        <div>
                          <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent mb-6">
                            Upcoming Events ({upcomingEvents.length})
                          </h2>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {upcomingEvents.map(event => (
                              <EventCard
                                key={event.id}
                                event={event}
                                isPast={false}
                                onClick={() => navigate(`/events/${event.id}`)}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Past Events Section */}
                      {pastEvents.length > 0 && (
                        <div>
                          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-600 to-gray-400 bg-clip-text text-transparent mb-6">
                            Past Events ({pastEvents.length})
                          </h2>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {pastEvents.map(event => (
                              <EventCard
                                key={event.id}
                                event={event}
                                isPast={true}
                                onClick={() => navigate(`/events/${event.id}`)}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* No events empty state */
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

              {/* ============================================ */}
              {/* ABOUT TAB - Group description and upcoming events */}
              {/* ============================================ */}
              {activeTab === 'about' && (
                <div>
                  {/* Group description header with edit button (organiser only) */}
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
                  
                  {/* Group description text */}
                  <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap mb-8">
                    {group.description || 'No description available.'}
                  </p>
                  
                  {/* Group creation date */}
                  {group.createdAt && (
                    <div className="flex items-center gap-2 text-gray-500 text-sm pb-8 border-t border-gray-200 pt-8 mb-8">
                      <Calendar className="h-4 w-4" />
                      <span>Created on {new Date(group.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  )}

                  {/* Upcoming Events Preview (About tab only shows upcoming events) */}
                  <div className="mt-8">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent mb-6">Upcoming Events</h2>
                    {eventsLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
                      </div>
                    ) : upcomingEvents.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {upcomingEvents.map(event => (
                          <EventCard
                            key={event.id}
                            event={event}
                            isPast={false}
                            onClick={() => navigate(`/events/${event.id}`)}
                          />
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

              {/* ============================================ */}
              {/* MEMBERS TAB - Full list of group members */}
              {/* ============================================ */}
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
                    /* Member cards grid - Click to view member profile */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {membersData.data.map((member) => (
                        <div 
                          key={member.id} 
                          onClick={() => navigate(`/members/${member.id}`)}
                          className="flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl hover:shadow-lg transition-all cursor-pointer group hover:-translate-y-1"
                        >
                          <ProfileAvatar 
                            member={member} 
                            size="lg" 
                            className="group-hover:scale-110 transition-transform"
                            showBadge={member.isOrganiser}
                            badgeType="organiser"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 group-hover:bg-clip-text transition-all">
                              {member.displayName || member.email.split('@')[0]}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              Member since {new Date(member.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                          {member.isOrganiser && (
                            <span className="text-xs bg-gradient-to-r from-orange-500 to-pink-500 text-white px-2 py-1 rounded-full font-semibold">Organiser</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Empty state - No members */
                    <div className="text-center py-8 px-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                      <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-gray-600">No members yet. Be the first to join this group!</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ============================================ */}
            {/* SIDEBAR - Member preview and actions */}
            {/* ============================================ */}
            <div className="lg:col-span-1 space-y-6">
              {/* Members Preview (shown only on About tab) */}
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
                          <ProfileAvatar 
                            member={member} 
                            size="xl" 
                            className="group-hover:scale-110 group-hover:shadow-lg transition-all duration-200 border-2 border-white shadow-md"
                            showBadge={member.isOrganiser}
                            badgeType="organiser"
                          />
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

              {/* Group Actions Card - Sticky sidebar with action buttons */}
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 sticky top-24 border border-gray-100 shadow-lg">
                <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">Group Actions</h3>
                
                {isAuthenticated ? (
                  <div className="space-y-3">
                    {isGroupOrganiser ? (
                      /* ORGANISER VIEW - Show Create Event button */
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
                      /* MEMBER/NON-MEMBER VIEW */
                      <>
                        {isSubscribed ? (
                          /* Already a member - Show View Events and Leave buttons */
                          <>
                            <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                              <p className="text-sm text-green-700 font-semibold">✅ You're a member</p>
                            </div>
                            <button
                              onClick={() => setActiveTab('events')}
                              className="w-full py-3 px-6 bg-gradient-to-r from-orange-500 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-orange-500/50 transition-all transform hover:scale-105 flex items-center justify-center gap-2 mb-3"
                            >
                              <Calendar className="h-5 w-5" />
                              View Events
                            </button>
                            <button
                              onClick={handleUnsubscribe}
                              disabled={unsubscribeMutation.isLoading}
                              className="w-full py-3 px-6 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50"
                            >
                              {unsubscribeMutation.isLoading ? 'Leaving...' : 'Leave Group'}
                            </button>
                          </>
                        ) : (
                          /* Not a member - Show Join button */
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
                  /* NOT AUTHENTICATED - Show login prompt */
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

                {/* Organiser information */}
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

      {/* ============================================ */}
      {/* EDIT GROUP MODAL - Organiser only */}
      {/* Allows organiser to update group details */}
      {/* ============================================ */}
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

              {/* Terms and Conditions */}
              <div>
                <label htmlFor="edit-termsAndConditions" className="block text-sm font-semibold text-gray-700 mb-2">
                  📜 Group Terms & Conditions
                  <span className="text-gray-500 font-normal text-sm ml-2">(optional)</span>
                </label>
                <textarea
                  id="edit-termsAndConditions"
                  value={editFormData.termsAndConditions}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, termsAndConditions: e.target.value }))}
                  rows={6}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium transition-all resize-none"
                  placeholder="e.g., All participants must bring their own equipment. No refunds within 24 hours of event. Participants must be 18+..."
                />
                <p className="mt-2 text-xs text-gray-500">
                  💡 Set rules that members must accept when joining your events
                </p>
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
