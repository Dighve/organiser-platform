// ============================================================
// IMPORTS
// ============================================================
import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { groupsAPI } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { Users, Search, Plus, Calendar, MapPin, ChevronRight } from 'lucide-react'
import LoginModal from '../components/LoginModal'
import toast from 'react-hot-toast'

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function BrowseGroupsPage() {
  // ============================================================
  // HOOKS & ROUTING
  // ============================================================
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuthStore()  // Global auth state
  const queryClient = useQueryClient()  // React Query cache
  
  // ============================================================
  // LOCAL STATE
  // ============================================================
  const [searchQuery, setSearchQuery] = useState('')  // Search input for explore tab
  const [activeTab, setActiveTab] = useState('explore')  // Forced to explore (tabs removed)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)  // Login modal state
  const [pendingGroupId, setPendingGroupId] = useState(null)  // Group to join after login
  const [showSuccessModal, setShowSuccessModal] = useState(false)  // Success modal after joining
  const [joinedGroupName, setJoinedGroupName] = useState('')  // Name of joined group
  
  // ============================================================
  // EFFECTS
  // ============================================================
  
  // Clear search when switching away from explore tab
  useEffect(() => {
    if (activeTab !== 'explore') setSearchQuery('')
  }, [activeTab])
  
  // ============================================================
  // DATA FETCHING - Queries
  // ============================================================
  
  // Fetch all public groups for exploration
  const { data, isLoading, error } = useQuery({
    queryKey: ['publicGroups'],
    queryFn: () => groupsAPI.getAllPublicGroups(),
  })
  
  // Fetch user's subscribed groups (only if authenticated)
  const { data: myGroupsData, isLoading: myGroupsLoading } = useQuery({
    queryKey: ['myGroups'],
    queryFn: () => groupsAPI.getMyGroups(),
    enabled: isAuthenticated,
  })
  
  // Fetch user's organised groups (only if organiser)
  const { data: organisedData, isLoading: organisedLoading } = useQuery({
    queryKey: ['myOrganisedGroups'],
    queryFn: () => groupsAPI.getMyOrganisedGroups(),
    enabled: isAuthenticated && user?.isOrganiser,
  })
  
  // ============================================================
  // DATA FETCHING - Mutations
  // ============================================================
  
  // Subscribe to a group
  const subscribeMutation = useMutation({
    mutationFn: (groupId) => groupsAPI.subscribeToGroup(groupId),
    onSuccess: (_, groupId) => {
      // Find the group name
      const allGroups = data?.data || []
      const group = allGroups.find(g => g.id === groupId)
      
      // Show success modal if this was from login flow
      if (pendingGroupId) {
        setJoinedGroupName(group?.name || 'the group')
        setShowSuccessModal(true)
      } else {
        // Show toast for direct joins
        toast.success('Successfully joined the group!')
      }
      
      queryClient.invalidateQueries(['publicGroups'])
      queryClient.invalidateQueries(['myGroups'])
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to join group'
      
      // Check if already subscribed
      if (errorMessage.includes('Already subscribed')) {
        toast.success('You are already a member of this group!')
        // Refresh queries to update UI
        queryClient.invalidateQueries(['publicGroups'])
        queryClient.invalidateQueries(['myGroups'])
        // Switch to member tab if this was from login flow
        if (pendingGroupId) {
          setActiveTab('member')
        }
      } else {
        toast.error(errorMessage)
      }
      
      setPendingGroupId(null)  // Clear pending state
    },
  })
  
  // Unsubscribe from a group
  const unsubscribeMutation = useMutation({
    mutationFn: (groupId) => groupsAPI.unsubscribeFromGroup(groupId),
    onSuccess: () => {
      toast.success('Successfully left the group')
      queryClient.invalidateQueries(['publicGroups'])
      queryClient.invalidateQueries(['myGroups'])
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to leave group')
    },
  })
  
  // ============================================================
  // DERIVED STATE - Filtered Groups
  // ============================================================
  
  // Filter member groups to exclude groups already in organiser tab (avoid duplicates)
  const filteredMemberGroups = useMemo(() => {
    const memberGroups = myGroupsData?.data || []
    const organisedGroups = organisedData?.data || []
    
    if (organisedGroups.length === 0) {
      return memberGroups
    }
    
    const organisedGroupIds = new Set(organisedGroups.map(group => group.id))
    return memberGroups.filter(group => !organisedGroupIds.has(group.id))
  }, [myGroupsData?.data, organisedData?.data])
  
  // Filter explore groups to exclude groups already joined/organised (avoid duplicates)
  const filteredExploreGroups = useMemo(() => {
    const exploreGroups = data?.data || []
    const memberGroups = myGroupsData?.data || []
    const organisedGroups = organisedData?.data || []
    
    if (!isAuthenticated || (memberGroups.length === 0 && organisedGroups.length === 0)) {
      return exploreGroups
    }
    
    // Combine both organised and member group IDs
    const excludeGroupIds = new Set([
      ...organisedGroups.map(group => group.id),
      ...memberGroups.map(group => group.id)
    ])
    
    return exploreGroups.filter(group => !excludeGroupIds.has(group.id))
  }, [data?.data, myGroupsData?.data, organisedData?.data, isAuthenticated])
  
  // ============================================================
  // HELPER FUNCTIONS
  // ============================================================
  
  // Get groups for the currently active tab
  const getTabGroups = () => {
    switch (activeTab) {
      case 'explore': return filteredExploreGroups
      case 'member': return filteredMemberGroups
      case 'organiser': return organisedData?.data || []
      default: return []
    }
  }
  
  // Apply search filter to groups (always explore now)
  const getFilteredGroups = () => {
    const groups = getTabGroups()
    if (searchQuery) {
      return groups.filter(group =>
        group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.activityName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    return groups
  }
  
  // Final filtered groups after applying search and tab filters
  const filteredGroups = getFilteredGroups()
  
  // Set of subscribed group IDs for quick lookup
  const subscribedGroupIds = new Set((myGroupsData?.data || []).map(g => g.id))
  
  // ============================================================
  // EVENT HANDLERS
  // ============================================================
  
  // Handle subscribe to group (show login modal if not authenticated)
  const handleSubscribe = (groupId) => {
    if (!isAuthenticated) {
      setPendingGroupId(groupId)
      setIsLoginModalOpen(true)
      return
    }
    subscribeMutation.mutate(groupId)
  }
  
  // Auto-join group after successful login
  useEffect(() => {
    if (isAuthenticated && pendingGroupId) {
      // Small delay to ensure auth state is fully set
      const timer = setTimeout(() => {
        subscribeMutation.mutate(pendingGroupId)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, pendingGroupId])
  
  // Handle unsubscribe from group (with confirmation)
  const handleUnsubscribe = (groupId) => {
    if (confirm('Are you sure you want to leave this group?')) {
      unsubscribeMutation.mutate(groupId)
    }
  }
  
  // ============================================================
  // LOADING & ERROR STATES
  // ============================================================
  if (isLoading) return <LoadingState />
  if (error) return <ErrorState error={error.message} />
  
  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <>
      {/* Login Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => {
          setIsLoginModalOpen(false)
          setPendingGroupId(null)
        }} 
      />
      
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center transform transition-all">
            {/* Success Icon */}
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            {/* Success Message */}
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Successfully Joined!</h2>
            <p className="text-gray-600 mb-6">
              You've joined <span className="font-bold text-purple-600">{joinedGroupName}</span>. 
              Start exploring events and connecting with members!
            </p>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSuccessModal(false)
                  setPendingGroupId(null)
                  setActiveTab('member')  // Switch to member tab
                }}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all transform hover:scale-105"
              >
                View My Groups
              </button>
              <button
                onClick={() => {
                  setShowSuccessModal(false)
                  setPendingGroupId(null)
                }}
                className="flex-1 py-3 px-6 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 py-4 sm:py-6 pb-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-2xl sm:text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Discover Groups</h1>
          {user?.isOrganiser && (
            <button
              onClick={() => navigate('/groups/create')}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-xl hover:shadow-purple-500/50 transition-all transform hover:-translate-y-0.5"
            >
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">Create Group</span>
            </button>
          )}
        </div>
        
        {/* No tabs on Discover; default to explore */}

        {/* Desktop search bar */}
        <div className="hidden md:block mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
            <input
              type="text"
              placeholder="Search groups by name, activity, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white/60 backdrop-blur-sm border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium text-lg shadow-lg"
            />
          </div>
        </div>

        {/* ========== TAB CONTENT ========== */}
        
        {/* MEMBER TAB - User's subscribed groups */}
        {/* EXPLORE ONLY - Discover new groups */}
        {(() => {
          const allGroups = data?.data || []
          const hasGroupsButAllFiltered = allGroups.length > 0 && filteredGroups.length === 0
          
          return (
            <TabContent
              loading={false}
              groups={filteredGroups}
              emptyMessage={
                searchQuery 
                  ? 'Try adjusting your search terms.' 
                  : hasGroupsButAllFiltered 
                    ? "🎉 You've already joined all available groups!" 
                    : 'Be the first to create a group!'
              }
              emptyAction={
                isAuthenticated && !searchQuery && !hasGroupsButAllFiltered 
                  ? () => navigate('/groups/create') 
                  : undefined
              }
              emptyActionText="Create the First Group"
              emptyIcon={<Plus className="h-5 w-5" />}
            >
              {filteredGroups.map(group => (
                <GroupCard
                  key={group.id}
                  group={group}
                  mode="explore"
                  navigate={navigate}
                  onSubscribe={handleSubscribe}
                  isSubscribed={subscribedGroupIds.has(group.id)}
                />
              ))}
            </TabContent>
          )
        })()}
      </div>
    </div>
    {user?.isOrganiser && (
      <div className="sm:hidden fixed bottom-20 right-4 z-40">
        <button
          onClick={() => navigate('/groups/create')}
          className="h-14 w-14 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xl shadow-purple-400/50 flex items-center justify-center active:scale-95 transition-all"
          aria-label="Create group"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>
    )}
    {/* Fixed bottom search bar (mobile only) */}
    <div className="md:hidden fixed inset-x-0 bottom-0 z-30 px-4 pb-4 pt-3 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-[0_-12px_30px_-18px_rgba(0,0,0,0.35)]">
      <div className="max-w-7xl mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
          />
        </div>
      </div>
    </div>
    </>
  )
}

// ============================================================
// HELPER COMPONENTS
// ============================================================

// LOADING STATE - Full page loading spinner
function LoadingState() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading groups...</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ERROR STATE - Full page error display
function ErrorState({ error }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-10 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-red-600 font-semibold text-lg">Error: {error}</p>
        </div>
      </div>
    </div>
  )
}

// TAB CONTENT WRAPPER - Handles loading, empty states, and grid layout
function TabContent({ loading, groups, emptyMessage, emptyAction, emptyActionText, emptyIcon, children }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }
  
  if (groups.length === 0) {
    return (
      <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-16 text-center border border-gray-100 shadow-lg">
        <Users className="h-20 w-20 mx-auto text-purple-400 mb-6" />
        <h3 className="text-2xl font-bold text-gray-900 mb-3">No groups yet</h3>
        <p className="text-gray-600 mb-6">{emptyMessage}</p>
        {emptyAction && (
          <button
            onClick={emptyAction}
            className="py-3 px-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all transform hover:scale-105 flex items-center gap-2 mx-auto"
          >
            {emptyIcon}
            {emptyActionText}
          </button>
        )}
      </div>
    )
  }
  
  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-6">{children}</div>
}

// GROUP CARD - Reusable card component with mode-specific actions
// Modes: 'explore' (join), 'member' (view/leave), 'organiser' (create event/view)
function GroupCard({ group, mode, navigate, onSubscribe, onUnsubscribe, isSubscribed }) {
  // Render action buttons based on card mode
  const renderActions = () => {
    const stopPropagation = (e) => e.stopPropagation()  // Prevent card click when clicking buttons
    
    switch (mode) {
      case 'member':
        return (
          <div className="space-y-1.5" onClick={stopPropagation}>
            <div className="flex items-center justify-end gap-1.5">
              <button
                onClick={() => navigate(`/groups/${group.id}?tab=events`)}
                className="h-10 w-10 rounded-lg bg-gradient-to-r from-orange-500 to-pink-600 text-white flex items-center justify-center shadow-md shadow-orange-400/40 hover:shadow-lg hover:shadow-orange-400/60 transition-all active:scale-95 sm:flex-1 sm:h-auto sm:py-2 sm:px-4 sm:gap-1"
              >
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Events</span>
              </button>
              <button
                onClick={() => navigate(`/groups/${group.id}`)}
                className="h-10 w-10 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center justify-center shadow-md shadow-purple-400/40 hover:shadow-lg hover:shadow-purple-400/60 transition-all active:scale-95 sm:flex-1 sm:h-auto sm:py-2 sm:px-4 sm:gap-1"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Open</span>
              </button>
              <button
                onClick={() => onUnsubscribe(group.id)}
                className="h-10 w-10 rounded-lg bg-red-50 text-red-600 border border-red-200 flex items-center justify-center shadow hover:bg-red-100 transition-all active:scale-95 sm:w-auto sm:px-4 sm:py-2 sm:flex-0 sm:min-w-[48px]"
              >
                <span className="text-sm font-bold">×</span>
                <span className="hidden sm:inline font-semibold ml-1">Leave</span>
              </button>
            </div>
          </div>
        )
      
      case 'organiser':
        return (
          <div className="flex gap-1.5 justify-end" onClick={stopPropagation}>
            <button
              onClick={() => navigate(`/create-event?groupId=${group.id}`)}
              className="h-10 w-10 rounded-lg bg-gradient-to-r from-orange-500 to-pink-600 text-white flex items-center justify-center shadow-md shadow-orange-400/40 hover:shadow-lg hover:shadow-orange-400/60 transition-all active:scale-95 sm:flex-1 sm:h-auto sm:py-2 sm:px-4 sm:gap-1"
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Create</span>
            </button>
            <button
              onClick={() => navigate(`/groups/${group.id}`)}
              className="h-10 w-10 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center justify-center shadow-md shadow-purple-400/40 hover:shadow-lg hover:shadow-purple-400/60 transition-all active:scale-95 sm:flex-1 sm:h-auto sm:py-2 sm:px-4 sm:gap-1"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Open</span>
            </button>
          </div>
        )
      
      case 'explore':
        return (
          <div className="flex gap-1.5 justify-end" onClick={stopPropagation}>
            {isSubscribed ? (
              <button
                onClick={() => navigate(`/groups/${group.id}`)}
                className="h-10 w-10 sm:flex-1 sm:h-auto sm:py-2 sm:px-4 sm:gap-1 rounded-lg bg-gray-100 text-gray-700 font-semibold flex items-center justify-center hover:bg-gray-200 transition-all"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Open</span>
              </button>
            ) : (
              <button
                onClick={() => onSubscribe(group.id)}
                className="h-10 w-10 sm:flex-1 sm:h-auto sm:py-2 sm:px-4 sm:gap-1 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold flex items-center justify-center shadow-lg shadow-purple-400/40 hover:shadow-xl hover:shadow-purple-500/50 transition-all active:scale-95"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Join</span>
              </button>
            )}
          </div>
        )
      
      default:
        return null
    }
  }
  
  const renderMobileAction = () => {
    const stopPropagation = (e) => e.stopPropagation()
    switch (mode) {
      case 'member':
        return (
          <div className="flex items-center gap-1" onClick={stopPropagation}>
            <button
              onClick={() => navigate(`/groups/${group.id}?tab=events`)}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 text-white flex items-center justify-center shadow-sm active:scale-95 transition-all"
            >
              <Calendar className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate(`/groups/${group.id}`)}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 text-white flex items-center justify-center shadow-sm active:scale-95 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )
      case 'organiser':
        return (
          <div className="flex items-center gap-1" onClick={stopPropagation}>
            <button
              onClick={() => navigate(`/create-event?groupId=${group.id}`)}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 text-white flex items-center justify-center shadow-sm active:scale-95 transition-all"
            >
              <Calendar className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate(`/groups/${group.id}`)}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 text-white flex items-center justify-center shadow-sm active:scale-95 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )
      case 'explore':
        return (
          <div onClick={stopPropagation}>
            {isSubscribed ? (
              <button
                onClick={() => navigate(`/groups/${group.id}`)}
                className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 text-purple-600 flex items-center justify-center active:scale-95 transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => onSubscribe(group.id)}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 text-white flex items-center justify-center shadow-lg shadow-purple-400/40 active:scale-95 transition-all"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>
        )
      default:
        return null
    }
  }

  return (
    <>
      {/* ===== MOBILE: Compact horizontal card ===== */}
      <div
        className="sm:hidden flex items-center gap-3 bg-white/90 backdrop-blur-sm rounded-2xl p-3 border border-gray-100 shadow-md active:scale-[0.98] transition-all duration-200 overflow-hidden relative cursor-pointer"
        onClick={() => navigate(`/groups/${group.id}`)}
      >
        {/* Left gradient accent strip */}
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-purple-500 via-pink-500 to-orange-400 rounded-l-2xl" />
        
        {/* Square thumbnail with gradient fallback */}
        <div className="w-[60px] h-[60px] rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 ml-1.5 shadow-md shadow-purple-300/30">
          {group.imageUrl ? (
            <img
              src={group.imageUrl}
              alt={group.name}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
              onError={(e) => { e.target.style.display = 'none' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white font-bold text-2xl select-none">
              {group.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
        </div>
        
        {/* Group info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-sm leading-tight truncate">
            {group.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center text-[10px] font-semibold text-purple-700 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-full px-2 py-0.5 leading-none">
              {group.activityName}
            </span>
            <span className="inline-flex items-center gap-0.5">
              <Users className="w-3 h-3 text-purple-400" />
              <span className="font-semibold text-gray-700 text-[11px]">{group.currentMembers || 0}</span>
            </span>
          </div>
          {group.location && (
            <div className="flex items-center gap-0.5 mt-0.5">
              <MapPin className="w-3 h-3 text-pink-400 flex-shrink-0" />
              <span className="text-[11px] text-gray-500 truncate">{group.location}</span>
            </div>
          )}
        </div>
        
        {/* Mobile action button */}
        <div className="flex-shrink-0 pl-1">
          {renderMobileAction()}
        </div>
      </div>

      {/* ===== DESKTOP: Original full card (untouched) ===== */}
      <div
        className="hidden sm:block group bg-white/60 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-2xl border border-gray-100 overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1.5"
        onClick={() => navigate(`/groups/${group.id}`)}
      >
        {/* Group Banner */}
        <div className="relative h-32 sm:h-48 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 opacity-40" />
          <img 
            src={group.imageUrl || [
              'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&h=300&fit=crop&q=80',
              'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&h=300&fit=crop&q=80',
              'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=300&fit=crop&q=80',
              'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=600&h=300&fit=crop&q=80',
              'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=600&h=300&fit=crop&q=80',
              'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=600&h=300&fit=crop&q=80'
            ][Number.parseInt(group.id) % 6]}
            alt={`${group.name} banner`}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 mix-blend-overlay"
          />
          <div className="absolute top-3 right-3 px-3 py-1 bg-white/95 backdrop-blur-sm rounded-full text-xs font-bold shadow-lg">
            <span className={group.active ? 'text-green-600' : 'text-gray-600'}>
              {group.active ? '✓ Active' : 'Inactive'}
            </span>
          </div>
        </div>
        <div className="p-4 sm:p-6">
          <div className="mb-3 sm:mb-4 flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg sm:text-xl text-gray-900 mb-1 group-hover:text-purple-600 transition-colors line-clamp-2">{group.name}</h3>
              <div className="inline-flex px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full text-xs font-semibold">
                {group.activityName}
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-2 sm:mb-3 line-clamp-2 leading-relaxed">
            {group.description || 'No description'}
          </p>
          
          <div className="space-y-1 text-sm text-gray-700 mb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              <span className="font-semibold">{group.currentMembers || 0}</span>
              <span className="text-gray-500">members</span>
              {group.maxMembers && (
                <span className="text-gray-400">/ {group.maxMembers}</span>
              )}
            </div>
            {group.location && (
              <div className="flex items-center gap-1.5 text-gray-600">
                <span className="text-pink-500">📍</span>
                <span className="line-clamp-1">{group.location}</span>
              </div>
            )}
            {group.primaryOrganiserName && (
              <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                <span className="text-orange-500">👤</span>
                <span className="line-clamp-1">By {group.primaryOrganiserName}</span>
              </div>
            )}
          </div>
          
          {renderActions()}
        </div>
      </div>
    </>
  )
}
