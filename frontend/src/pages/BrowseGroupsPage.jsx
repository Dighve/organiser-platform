// ============================================================
// IMPORTS
// ============================================================
import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { groupsAPI } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { Users, Search, Plus, Calendar } from 'lucide-react'
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
  const [activeTab, setActiveTab] = useState('explore')  // Current tab: 'explore', 'member', or 'organiser'
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)  // Login modal state
  const [pendingGroupId, setPendingGroupId] = useState(null)  // Group to join after login
  
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
    onSuccess: () => {
      toast.success('Successfully joined the group!')
      queryClient.invalidateQueries(['publicGroups'])
      queryClient.invalidateQueries(['myGroups'])
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to join group')
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
  
  // Apply search filter to groups (only active in explore tab)
  const getFilteredGroups = () => {
    const groups = getTabGroups()
    if (activeTab === 'explore' && searchQuery) {
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
      subscribeMutation.mutate(pendingGroupId)
      setPendingGroupId(null)
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
      
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Discover Groups</h1>
          {user?.isOrganiser && (
            <button
              onClick={() => navigate('/groups/create')}
              className="py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-xl hover:shadow-purple-500/50 transition-all transform hover:scale-105 flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Create Group
            </button>
          )}
        </div>
        
        {/* ========== TAB NAVIGATION ========== */}
        <div className="mb-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-2 inline-flex gap-2 border border-gray-100 shadow-lg">
            {user?.isOrganiser && (
              <button
                onClick={() => setActiveTab('organiser')}
                className={`px-6 py-3 font-semibold rounded-xl transition-all ${
                  activeTab === 'organiser'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                💼 Organiser
              </button>
            )}
            {isAuthenticated && (
              <button
                onClick={() => setActiveTab('member')}
                className={`px-6 py-3 font-semibold rounded-xl transition-all ${
                  activeTab === 'member'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🌟 Member
              </button>
            )}
            
            <button
              onClick={() => setActiveTab('explore')}
              className={`px-6 py-3 font-semibold rounded-xl transition-all ${
                activeTab === 'explore'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🔍 Explore
            </button>
          </div>
        </div>
        
        {/* ========== SEARCH BAR (Explore Tab Only) ========== */}
        {activeTab === 'explore' && (
          <div className="mb-8">
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
        )}
      
        {/* ========== TAB CONTENT ========== */}
        
        {/* MEMBER TAB - User's subscribed groups */}
        {activeTab === 'member' && (
          <TabContent
            loading={myGroupsLoading}
            groups={filteredGroups}
            emptyMessage="You haven't joined any groups yet. Start exploring!"
            emptyAction={() => setActiveTab('explore')}
            emptyActionText="Explore Groups"
          >
            {filteredGroups.map(group => (
              <GroupCard
                key={group.id}
                group={group}
                mode="member"
                navigate={navigate}
                onUnsubscribe={handleUnsubscribe}
              />
            ))}
          </TabContent>
        )}
        
        {/* ORGANISER TAB - User's managed groups */}
        {activeTab === 'organiser' && user?.isOrganiser && (
          <TabContent
            loading={organisedLoading}
            groups={filteredGroups}
            emptyMessage="Start building your community by creating a group."
            emptyAction={() => navigate('/groups/create')}
            emptyActionText="Create Group"
            emptyIcon={<Plus className="h-5 w-5" />}
          >
            {filteredGroups.map(group => (
              <GroupCard
                key={group.id}
                group={group}
                mode="organiser"
                navigate={navigate}
              />
            ))}
          </TabContent>
        )}
        
        {/* EXPLORE TAB - Discover new groups */}
        {activeTab === 'explore' && (() => {
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
  
  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{children}</div>
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
          <div className="space-y-2" onClick={stopPropagation}>
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/groups/${group.id}?tab=events`)}
                className="flex-1 py-2 px-4 bg-gradient-to-r from-orange-500 to-pink-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-orange-500/50 transition-all transform hover:scale-105 flex items-center justify-center gap-1"
              >
                <Calendar className="h-4 w-4" />
                View Events
              </button>
              <button
                onClick={() => navigate(`/groups/${group.id}`)}
                className="flex-1 py-2 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all transform hover:scale-105 flex items-center justify-center gap-1"
              >
                <Users className="h-4 w-4" />
                View Group
              </button>
            </div>
            <button
              onClick={() => onUnsubscribe(group.id)}
              className="w-full py-2 px-4 bg-red-50 text-red-600 font-semibold rounded-lg hover:bg-red-100 border border-red-200 transition-all"
            >
              Leave
            </button>
          </div>
        )
      
      case 'organiser':
        return (
          <div className="flex gap-2" onClick={stopPropagation}>
            <button
              onClick={() => navigate(`/create-event?groupId=${group.id}`)}
              className="flex-1 py-2 px-4 bg-gradient-to-r from-orange-500 to-pink-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-orange-500/50 transition-all transform hover:scale-105 flex items-center justify-center gap-1"
            >
              <Calendar className="h-4 w-4" />
              Create Event
            </button>
            <button
              onClick={() => navigate(`/groups/${group.id}`)}
              className="py-2 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all transform hover:scale-105 flex items-center justify-center gap-1"
            >
              <Users className="h-4 w-4" />
              View Group
            </button>
          </div>
        )
      
      case 'explore':
        return (
          <div className="flex gap-2" onClick={stopPropagation}>
            {isSubscribed ? (
              <button
                onClick={() => navigate(`/groups/${group.id}`)}
                className="w-full py-3 px-6 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-all"
              >
                View Group
              </button>
            ) : (
              <button
                onClick={() => onSubscribe(group.id)}
                className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all transform hover:scale-105"
              >
                Join Group
              </button>
            )}
          </div>
        )
      
      default:
        return null
    }
  }
  
  return (
    <div
      className="group bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl border border-gray-100 overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-2"
      onClick={() => navigate(`/groups/${group.id}`)}
    >
      {/* Group Banner */}
      <div className="relative h-48 overflow-hidden">
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
      <div className="p-6">
        <div className="mb-4">
          <h3 className="font-bold text-xl text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">{group.name}</h3>
          <div className="inline-block px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full text-xs font-semibold">
            {group.activityName}
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
          {group.description || 'No description'}
        </p>
        
        <div className="space-y-2 text-sm text-gray-700 mb-5">
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
            <Users className="h-4 w-4 text-purple-600" />
            <span className="font-semibold">{group.currentMembers || 0}</span>
            <span className="text-gray-500">members</span>
            {group.maxMembers && (
              <span className="text-gray-400">/ {group.maxMembers}</span>
            )}
          </div>
          {group.location && (
            <div className="flex items-center gap-2 text-gray-600">
              <span className="text-pink-500">📍</span>
              <span className="line-clamp-1">{group.location}</span>
            </div>
          )}
          {group.primaryOrganiserName && (
            <div className="flex items-center gap-2 text-gray-600">
              <span className="text-orange-500">👤</span>
              <span className="text-xs">By {group.primaryOrganiserName}</span>
            </div>
          )}
        </div>
        
        {renderActions()}
      </div>
    </div>
  )
}
