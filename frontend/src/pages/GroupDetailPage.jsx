import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { groupsAPI, eventsAPI } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { ArrowLeft, Users, MapPin, Calendar, Edit, Upload, X, LogIn, Plus, Search, MoreVertical, Ban, UserCheck, Trash2, AlertTriangle } from 'lucide-react'
import GooglePlacesAutocomplete from '../components/GooglePlacesAutocomplete'
import ImageUpload from '../components/ImageUpload'
import ProfileAvatar from '../components/ProfileAvatar'
import { toast } from 'react-hot-toast'
import { useFeatureFlags } from '../contexts/FeatureFlagContext'

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
const EventCard = ({ event, isPast = false, onClick, showLocation = true }) => {
  const imageUrl = event.imageUrl || DEFAULT_EVENT_IMAGES[parseInt(event.id) % DEFAULT_EVENT_IMAGES.length]

  return (
    <div
      className={`flex items-center gap-3 bg-white/90 backdrop-blur-sm rounded-2xl p-3 border shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200 overflow-hidden relative cursor-pointer ${
        isPast ? 'border-gray-100 opacity-80' : 'border-gray-100 hover:-translate-y-0.5'
      }`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      {/* Left gradient accent strip */}
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl ${
        isPast ? 'bg-gradient-to-b from-gray-300 to-gray-200' : 'bg-gradient-to-b from-orange-500 via-pink-500 to-purple-400'
      }`} />

      {/* Square thumbnail */}
      <div className={`w-[48px] h-[48px] rounded-xl overflow-hidden flex-shrink-0 ml-1.5 shadow-sm bg-gradient-to-br from-orange-400 via-pink-500 to-purple-500 ${
        isPast ? 'grayscale' : ''
      }`}>
        <img
          src={imageUrl}
          alt={event.title}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
          onError={(e) => { e.target.style.display = 'none' }}
        />
      </div>

      {/* Event info */}
      <div className="flex-1 min-w-0">
        <h3 className={`font-bold text-sm leading-tight truncate mb-1 ${
          isPast ? 'text-gray-500' : 'text-gray-900'
        }`}>
          {event.title}
        </h3>
        <div className="flex items-center gap-1.5 flex-wrap mb-1">
          {event.difficultyLevel && (
            <span className={`inline-flex items-center text-[10px] font-semibold rounded-full px-1.5 py-0.5 ${
              isPast ? 'bg-gray-100 text-gray-400' : 'bg-orange-50 text-orange-600 border border-orange-100'
            }`}>
              {event.difficultyLevel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className={`flex items-center gap-0.5 text-[11px] ${
            isPast ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <Calendar className="w-3 h-3 flex-shrink-0" />
            {new Date(event.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
          <span className={`flex items-center gap-0.5 text-[11px] ${
            isPast ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <Users className="w-3 h-3 flex-shrink-0" />
            {event.currentParticipants}/{event.maxParticipants}
          </span>
          {showLocation && event.location && (
            <span className={`flex items-center gap-0.5 text-[11px] min-w-0 ${
              isPast ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{event.location}</span>
            </span>
          )}
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
  const location = useLocation()
  const queryClient = useQueryClient()
  const { isAuthenticated, user } = useAuthStore()
  const { isGroupLocationEnabled, isGoogleMapsEnabled } = useFeatureFlags()
  const [searchParams] = useSearchParams()

  // ============================================
  // LOCAL STATE
  // ============================================
  const [activeTab, setActiveTab] = useState('about') // Current tab: about, events, or members
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    groupGuidelines: '',
    location: '',
    imageUrl: '',
    maxMembers: '',
    isPublic: true,
  })
  const [openMenuMemberId, setOpenMenuMemberId] = useState(null)
  const [removeModalOpen, setRemoveModalOpen] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState(null)
  const [removeOption, setRemoveOption] = useState('remove') // 'remove' or 'ban'
  const [banReason, setBanReason] = useState('')

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
    enabled: isAuthenticated && Boolean(user?.hasOrganiserRole),
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
  
  // Create display group for error cases (when group is null)
  const displayGroup = group || {
    name: 'Group',
    activityName: 'Hiking',
    imageUrl: null,
    currentMembers: 0,
    location: '',
    isPublic: true,
    maxMembers: null,
    description: 'No description available.',
    createdAt: null,
    primaryOrganiserName: 'Organiser',
  }
  
  const groupEvents = eventsData?.data?.content || []
  const organisedGroups = organisedGroupsData?.data || []
  const subscribedGroups = subscribedGroupsData?.data || []
  
  // Check user's relationship to this group
  const isGroupOrganiser = organisedGroups.some(g => g.id === parseInt(id))
  const isSubscribed = subscribedGroups.some(g => g.id === parseInt(id))

  // 6. Fetch banned members (organiser only) - MUST be after isGroupOrganiser is defined
  const { data: bannedMembersData, isLoading: bannedMembersLoading } = useQuery({
    queryKey: ['bannedMembers', id],
    queryFn: () => groupsAPI.getBannedMembers(id),
    enabled: !!id && isGroupOrganiser,
    staleTime: 0,
  })
  
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

  // Remove member from group (organiser only)
  const removeMemberMutation = useMutation({
    mutationFn: ({ memberId }) => groupsAPI.removeMember(id, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries(['groupMembers', id])
      queryClient.invalidateQueries(['group', id])
      toast.success('Member removed from group')
      setRemoveModalOpen(false)
      setMemberToRemove(null)
      setRemoveOption('remove')
      setBanReason('')
      setOpenMenuMemberId(null)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to remove member')
    },
  })

  // Ban member from group (organiser only)
  const banMemberMutation = useMutation({
    mutationFn: ({ memberId, reason }) => groupsAPI.banMember(id, memberId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['groupMembers', id])
      queryClient.invalidateQueries(['bannedMembers', id])
      queryClient.invalidateQueries(['group', id])
      toast.success('Member banned from group')
      setRemoveModalOpen(false)
      setMemberToRemove(null)
      setRemoveOption('remove')
      setBanReason('')
      setOpenMenuMemberId(null)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to ban member')
    },
  })

  // Unban member from group (organiser only)
  const unbanMemberMutation = useMutation({
    mutationFn: ({ groupId, memberId }) => groupsAPI.unbanMember(groupId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries(['groupMembers', id])
      queryClient.invalidateQueries(['bannedMembers', id])
      queryClient.invalidateQueries(['group', id])
      toast.success('Member unbanned successfully')
      setOpenMenuMemberId(null)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to unban member')
    },
  })

  // Update group details (organiser only)
  const updateGroupMutation = useMutation({
    mutationFn: (data) => groupsAPI.updateGroup(id, data),
    onSuccess: (updatedGroup) => {
      queryClient.invalidateQueries(['group', id])
      queryClient.invalidateQueries(['myGroups'])
      queryClient.invalidateQueries(['myOrganisedGroups'])
      toast.success('Group updated successfully!')
      setIsEditModalOpen(false)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update group')
    },
  })

  // Permanently delete group (organiser only)
  const permanentDeleteMutation = useMutation({
    mutationFn: () => groupsAPI.permanentlyDeleteGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['myGroups'])
      queryClient.invalidateQueries(['myOrganisedGroups'])
      queryClient.invalidateQueries(['publicGroups'])
      toast.success('Group permanently deleted')
      navigate('/')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete group')
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
        groupGuidelines: group.groupGuidelines || '',
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
      groupGuidelines: editFormData.groupGuidelines.trim() || null,
      activityId: 1, // Always Hiking for now
      location: editFormData.location.trim() || null,
      imageUrl: editFormData.imageUrl || null,
      maxMembers: editFormData.maxMembers ? parseInt(editFormData.maxMembers) : null,
      isPublic: editFormData.isPublic,
    }
    
    updateGroupMutation.mutate(updateData)
  }

  // Join group (open login modal if not authenticated)
  const handleSubscribe = () => {
    if (!isAuthenticated) {
      useAuthStore.getState().setReturnUrl(location.pathname + location.search)
      window.dispatchEvent(new CustomEvent('open-login-modal'))
      return
    }
    subscribeMutation.mutate()
  }

  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Leave group (with in-app confirmation)
  const handleUnsubscribe = () => {
    setShowLeaveModal(true)
  }

  const handleConfirmLeave = () => {
    unsubscribeMutation.mutate()
    setShowLeaveModal(false)
  }

  // Permanent group deletion (organiser only)
  const handlePermanentDelete = () => {
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = () => {
    permanentDeleteMutation.mutate()
    setShowDeleteModal(false)
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 py-8 pb-28 lg:pb-8">
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
          <div className="relative h-40 sm:h-56 lg:h-80 overflow-hidden">
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 opacity-60" />
            
            {/* Banner image (custom or fallback) */}
            <img 
              src={displayGroup.imageUrl || DEFAULT_GROUP_IMAGES[parseInt(id) % DEFAULT_GROUP_IMAGES.length]}
              alt={`${displayGroup.name} banner`}
              className="w-full h-full object-cover mix-blend-overlay"
            />
            
            {/* Dark gradient from bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
            
            {/* Header Content Overlay */}
            <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 lg:px-8 lg:pb-8">
              <div className="flex items-end justify-between">
                <div className="flex-1 min-w-0">
                  <div className="hidden sm:inline-block px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-white font-semibold text-sm mb-2 lg:mb-4">
                    {displayGroup.activityName}
                  </div>
                  <h1 className="text-xl sm:text-3xl lg:text-5xl font-extrabold text-white mb-1.5 lg:mb-4 drop-shadow-2xl leading-tight line-clamp-2 lg:line-clamp-none">{displayGroup.name}</h1>
                  <div className="flex items-center gap-2 lg:gap-6 text-white/90">
                    <div className="flex items-center gap-1.5 lg:gap-2 bg-white/10 backdrop-blur-sm px-2 py-1 lg:px-4 lg:py-2 rounded-full text-xs lg:text-base">
                      <Users className="h-3.5 w-3.5 lg:h-5 lg:w-5" />
                      <span className="font-semibold">{displayGroup.currentMembers || 0}</span>
                      <span className="text-white/70">members</span>
                    </div>
                    {displayGroup.location && isGroupLocationEnabled() && isGoogleMapsEnabled() && (
                      <div className="hidden sm:flex items-center gap-2 bg-white/10 backdrop-blur-sm px-2 py-1 lg:px-4 lg:py-2 rounded-full text-xs lg:text-base">
                        <MapPin className="h-3.5 w-3.5 lg:h-5 lg:w-5" />
                        <span className="truncate max-w-[120px] lg:max-w-none">{displayGroup.location}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="hidden lg:flex flex-col gap-2 ml-4">
                  <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg ${
                    displayGroup.isPublic ? 'bg-green-500 text-white' : 'bg-gray-700 text-white'
                  }`}>
                    {displayGroup.isPublic ? '🌍 Public' : '🔒 Private'}
                  </span>
                  {displayGroup.maxMembers && (
                    <span className="px-4 py-2 bg-white text-purple-700 rounded-full text-sm font-bold shadow-lg">
                      Max: {displayGroup.maxMembers}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

        {/* Content */}
        <div className="px-4 py-4 lg:px-8 lg:py-6">
          {/* Tabs */}
          <div className="mb-4 lg:mb-8 border-b border-gray-200">
            <div className="flex gap-4 lg:gap-8">
              <button
                onClick={() => setActiveTab('about')}
                className={`pb-3 lg:pb-4 px-1 lg:px-2 font-semibold text-sm lg:text-lg transition-all relative ${
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
                className={`pb-3 lg:pb-4 px-1 lg:px-2 font-semibold text-sm lg:text-lg transition-all relative ${
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
                className={`pb-3 lg:pb-4 px-1 lg:px-2 font-semibold text-sm lg:text-lg transition-all relative ${
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
                          <h2 className="text-base font-semibold text-gray-700 mb-3">
                            Upcoming Events ({upcomingEvents.length})
                          </h2>
                          <div className="space-y-2">
                            {upcomingEvents.map(event => (
                              <EventCard
                                key={event.id}
                                event={event}
                                isPast={false}
                                onClick={() => navigate(`/events/${event.id}`)}
                                showLocation={isGroupLocationEnabled && isGoogleMapsEnabled}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Past Events Section */}
                      {pastEvents.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h2 className="text-base font-semibold text-gray-500">
                              Past Events ({pastEvents.length})
                            </h2>
                            <button
                              onClick={() => navigate(`/events?groupId=${id}&past=true&search=:past :group:${id}`)}
                              className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-purple-600 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-purple-300 bg-white"
                            >
                              <Search className="h-4 w-4" />
                              Browse past
                            </button>
                          </div>
                          <div className="space-y-2">
                            {pastEvents.map(event => (
                              <EventCard
                                key={event.id}
                                event={event}
                                isPast={true}
                                onClick={() => navigate(`/events/${event.id}`)}
                                showLocation={isGroupLocationEnabled && isGoogleMapsEnabled}
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
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-gray-900">About This Group</h2>
                    {isGroupOrganiser && (
                      <button
                        onClick={handleOpenEditModal}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:shadow-md transition-all"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        Edit
                      </button>
                    )}
                  </div>
                  
                  {/* Group description text */}
                  <p className="text-gray-600 text-base leading-relaxed whitespace-pre-wrap mb-5">
                    {displayGroup.description || 'No description available.'}
                  </p>
                  
                  {/* Group Guidelines Section */}
                  {displayGroup.groupGuidelines && displayGroup.groupGuidelines.trim() && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="text-purple-600">📋</span>
                        Group Guidelines
                      </h3>
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100 p-4">
                        <div className="text-gray-700 text-base leading-relaxed whitespace-pre-wrap">
                          {displayGroup.groupGuidelines}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Group creation date */}
                  {displayGroup.createdAt && (
                    <div className="flex items-center gap-2 text-gray-400 text-xs pb-4 border-t border-gray-100 pt-4 mb-4">
                      <Calendar className="h-4 w-4" />
                      <span>Created on {new Date(displayGroup.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  )}

                  {/* Upcoming Events Preview (About tab only shows upcoming events) */}
                  <div className="mt-4">
                    <h2 className="text-base font-semibold text-gray-700 mb-3">Upcoming Events</h2>
                    {eventsLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
                      </div>
                    ) : upcomingEvents.length > 0 ? (
                      <div className="space-y-2">
                        {upcomingEvents.map(event => (
                          <EventCard
                            key={event.id}
                            event={event}
                            isPast={false}
                            onClick={() => navigate(`/events/${event.id}`)}
                            showLocation={isGroupLocationEnabled && isGoogleMapsEnabled}
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
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
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
                          className="flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl hover:shadow-lg transition-all group relative"
                        >
                          <div 
                            onClick={() => navigate(`/members/${member.id}`)}
                            className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer"
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
                          
                          {/* Triple dots menu - Only for organiser, not for themselves or other organisers */}
                          {isGroupOrganiser && !member.isOrganiser && member.id !== user?.id && (
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setOpenMenuMemberId(openMenuMemberId === member.id ? null : member.id)
                                }}
                                className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                              >
                                <MoreVertical className="h-5 w-5 text-gray-600" />
                              </button>
                              
                              {/* Dropdown menu */}
                              {openMenuMemberId === member.id && (
                                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-10 min-w-[180px]">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setMemberToRemove(member)
                                      setRemoveModalOpen(true)
                                      setOpenMenuMemberId(null)
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                                  >
                                    <UserCheck className="h-4 w-4" />
                                    Remove Member
                                  </button>
                                </div>
                              )}
                            </div>
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

                  {/* ============================================ */}
                  {/* BANNED MEMBERS SECTION (Organiser only) */}
                  {/* ============================================ */}
                  {isGroupOrganiser && bannedMembersData?.data && bannedMembersData.data.length > 0 && (
                    <div className="mt-12">
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-6 flex items-center gap-2">
                        <Ban className="h-6 w-6 text-red-600" />
                        Banned Members ({bannedMembersData.data.length})
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {bannedMembersData.data.map((member) => (
                          <div
                            key={member.id}
                            className="bg-red-50/50 backdrop-blur-sm rounded-xl p-4 border border-red-200 hover:shadow-md transition-all duration-200"
                          >
                            <div className="flex items-start gap-4">
                              <ProfileAvatar 
                                member={member} 
                                size="lg"
                                className="opacity-60"
                              />
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 truncate">
                                  {member.displayName || member.email?.split('@')[0] || 'Unknown'}
                                </h3>
                                <p className="text-sm text-gray-600 truncate">{member.email}</p>
                                
                                {/* Ban details */}
                                <div className="mt-2 space-y-1">
                                  <p className="text-xs text-gray-500">
                                    Banned by <span className="font-medium text-gray-700">{member.bannedBy}</span>
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(member.bannedAt).toLocaleDateString('en-US', { 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                  {member.banReason && (
                                    <p className="text-xs text-red-700 mt-2 italic">
                                      "{member.banReason}"
                                    </p>
                                  )}
                                </div>

                                {/* Unban button */}
                                <button
                                  onClick={() => {
                                    unbanMemberMutation.mutate({ groupId: id, memberId: member.id })
                                  }}
                                  className="mt-3 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 text-sm font-medium"
                                >
                                  <UserCheck className="h-4 w-4" />
                                  Unban Member
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
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
              <div className="hidden lg:block bg-white/60 backdrop-blur-sm rounded-2xl p-6 sticky top-24 border border-gray-100 shadow-lg">
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
                        <div className="flex gap-2">
                          <button
                            onClick={handleOpenEditModal}
                            className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            Edit Group
                          </button>
                          <button
                            onClick={handlePermanentDelete}
                            className="flex-1 py-3 px-4 bg-red-100 text-red-600 font-semibold rounded-xl hover:bg-red-200 transition-all flex items-center justify-center gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
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
                      onClick={() => {
                        useAuthStore.getState().setReturnUrl(location.pathname + location.search)
                        window.dispatchEvent(new CustomEvent('open-login-modal'))
                      }}
                      className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all transform hover:scale-105"
                    >
                      Login
                    </button>
                  </div>
                )}

                {/* Organiser information */}
                {displayGroup.primaryOrganiserName && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-500 mb-2">ORGANISED BY</h4>
                    <p className="text-gray-900 font-semibold text-lg">{displayGroup.primaryOrganiserName}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowLeaveModal(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 text-white grid place-items-center shadow">
                <X className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">Leave this group?</h3>
                <p className="text-sm text-gray-600">You’ll stop receiving updates and event invites from this group.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowLeaveModal(false)}
                className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50"
              >
                Stay
              </button>
              <button
                onClick={handleConfirmLeave}
                disabled={unsubscribeMutation.isLoading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold shadow hover:shadow-lg transition-all disabled:opacity-60"
              >
                {unsubscribeMutation.isLoading ? 'Leaving...' : 'Leave group'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* MOBILE STICKY ACTION BAR - Bottom of screen */}
      {/* ============================================ */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-2xl p-3">
        {isAuthenticated ? (
          isGroupOrganiser ? (
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/create-event?groupId=${id}`)}
                className="flex-1 bg-gradient-to-r from-orange-500 to-pink-600 text-white py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Plus className="h-5 w-5" />
                Create Event
              </button>
              <button
                onClick={handleOpenEditModal}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold flex items-center justify-center active:scale-95 transition-all"
                aria-label="Edit group"
              >
                <Edit className="h-5 w-5" />
              </button>
              <button
                onClick={handlePermanentDelete}
                className="px-4 py-3 bg-red-100 text-red-600 rounded-xl font-semibold flex items-center justify-center active:scale-95 transition-all"
                aria-label="Delete group permanently"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          ) : isSubscribed ? (
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('events')}
                className="flex-1 bg-gradient-to-r from-orange-500 to-pink-600 text-white py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Calendar className="h-5 w-5" />
                View Events
              </button>
              <button
                onClick={handleUnsubscribe}
                disabled={unsubscribeMutation.isLoading}
                className="px-4 py-3 bg-gray-100 text-gray-500 rounded-xl font-semibold flex items-center justify-center active:scale-95 transition-all disabled:opacity-50"
                aria-label="Leave group"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleSubscribe}
              disabled={subscribeMutation.isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
            >
              <Users className="h-5 w-5" />
              {subscribeMutation.isLoading ? 'Joining...' : 'Join Group'}
            </button>
          )
        ) : (
          <button
            onClick={() => {
              useAuthStore.getState().setReturnUrl(location.pathname + location.search)
              window.dispatchEvent(new CustomEvent('open-login-modal'))
            }}
            className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-base active:scale-95 transition-all"
          >
            <LogIn className="h-5 w-5" />
            Login to Join
          </button>
        )}
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

              {/* Group Guidelines */}
              <div>
                <label htmlFor="edit-groupGuidelines" className="block text-sm font-semibold text-gray-700 mb-2">
                  � Group Guidelines
                  <span className="text-gray-500 font-normal text-sm ml-2">(optional)</span>
                </label>
                <textarea
                  id="edit-groupGuidelines"
                  value={editFormData.groupGuidelines}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, groupGuidelines: e.target.value }))}
                  rows={6}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium transition-all resize-none"
                  placeholder="e.g., Be respectful to all members. Bring appropriate hiking equipment. Follow Leave No Trace principles..."
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

              {/* Location - Only show if location features are enabled */}
              {isGroupLocationEnabled() && isGoogleMapsEnabled() && (
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
              )}

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

      {/* ============================================ */}
      {/* Remove Member Modal (Meetup-style) */}
      {removeModalOpen && memberToRemove && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-orange-100 rounded-full">
                <UserCheck className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Remove Member from Group?</h3>
                <p className="text-sm text-gray-600">Choose how you'd like to proceed</p>
              </div>
            </div>

            {/* Member info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3">
                <ProfileAvatar member={memberToRemove} size="md" />
                <div>
                  <p className="font-semibold text-gray-900">
                    {memberToRemove.displayName || memberToRemove.email?.split('@')[0]}
                  </p>
                  <p className="text-xs text-gray-500">
                    Member since {new Date(memberToRemove.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>

            {/* Remove Options */}
            <div className="space-y-3 mb-4">
              {/* Option 1: Remove Only */}
              <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                removeOption === 'remove' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
              }">
                <input
                  type="radio"
                  name="removeOption"
                  value="remove"
                  checked={removeOption === 'remove'}
                  onChange={(e) => setRemoveOption(e.target.value)}
                  className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500"
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Remove from Group</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Member can rejoin the group later if they wish
                  </p>
                  <ul className="text-xs text-gray-500 mt-2 space-y-1 ml-4">
                    <li>• Removed from group immediately</li>
                    <li>• Future event participations cancelled</li>
                    <li>• Can rejoin anytime</li>
                  </ul>
                </div>
              </label>

              {/* Option 2: Remove & Ban */}
              <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                removeOption === 'ban' ? 'border-red-500 bg-red-50' : 'border-gray-200'
              }">
                <input
                  type="radio"
                  name="removeOption"
                  value="ban"
                  checked={removeOption === 'ban'}
                  onChange={(e) => setRemoveOption(e.target.value)}
                  className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500"
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 flex items-center gap-2">
                    <Ban className="h-4 w-4 text-red-600" />
                    Remove & Ban from Group
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Permanently prevent this member from rejoining
                  </p>
                  <ul className="text-xs text-gray-500 mt-2 space-y-1 ml-4">
                    <li>• Removed from group immediately</li>
                    <li>• Future event participations cancelled</li>
                    <li>• Cannot rejoin unless unbanned</li>
                    <li>• Past events show "Former Member"</li>
                  </ul>
                </div>
              </label>
            </div>

            {/* Ban reason (only shown if ban option selected) */}
            {removeOption === 'ban' && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reason for ban (optional)
                </label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Enter a reason for banning this member..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows="3"
                  maxLength="500"
                />
                <p className="text-xs text-gray-500 mt-1">{banReason.length}/500 characters</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setRemoveModalOpen(false)
                  setMemberToRemove(null)
                  setRemoveOption('remove')
                  setBanReason('')
                }}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                disabled={removeMemberMutation.isPending || banMemberMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (removeOption === 'remove') {
                    removeMemberMutation.mutate({ memberId: memberToRemove.id })
                  } else {
                    banMemberMutation.mutate({
                      memberId: memberToRemove.id,
                      reason: banReason.trim() || undefined
                    })
                  }
                }}
                className={`flex-1 px-6 py-3 text-white font-semibold rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  removeOption === 'ban' 
                    ? 'bg-gradient-to-r from-red-600 to-red-700' 
                    : 'bg-gradient-to-r from-purple-600 to-pink-600'
                }`}
                disabled={removeMemberMutation.isPending || banMemberMutation.isPending}
              >
                {(removeMemberMutation.isPending || banMemberMutation.isPending) ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {removeOption === 'ban' ? 'Banning...' : 'Removing...'}
                  </span>
                ) : (
                  removeOption === 'ban' ? 'Remove & Ban' : 'Remove Member'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* PERMANENT DELETE CONFIRMATION MODAL */}
      {/* ============================================ */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-t-3xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6" />
                <h2 className="text-xl font-bold">Delete Group Permanently</h2>
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-all"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-800 mb-1">This action cannot be undone</p>
                      <p className="text-sm text-red-700">
                        This will permanently delete the group and all associated data.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-gray-600">
                  <p><strong>Requirements for deletion:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>No events have been created</li>
                    <li>Only you (the organizer) are a member</li>
                    <li>No members have been banned</li>
                  </ul>
                  
                  <p className="text-xs text-red-600 mt-4">
                    <strong>Warning:</strong> If these requirements aren't met, deletion will fail.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                  disabled={permanentDeleteMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={permanentDeleteMutation.isPending}
                >
                  {permanentDeleteMutation.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Deleting...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      Delete Permanently
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
