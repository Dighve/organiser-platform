import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { groupsAPI } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { Users, Search, Plus, Calendar } from 'lucide-react'

export default function BrowseGroupsPage() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuthStore()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('organiser') // organiser, member, explore
  
  // Fetch all public groups
  const { data, isLoading, error } = useQuery({
    queryKey: ['publicGroups'],
    queryFn: () => groupsAPI.getAllPublicGroups(),
  })
  
  // Fetch user's subscribed groups
  const { data: myGroupsData, isLoading: myGroupsLoading } = useQuery({
    queryKey: ['myGroups'],
    queryFn: () => groupsAPI.getMyGroups(),
    enabled: isAuthenticated && (activeTab === 'member'),
  })
  
  // Fetch user's organised groups
  const { data: organisedData, isLoading: organisedLoading } = useQuery({
    queryKey: ['myOrganisedGroups'],
    queryFn: () => groupsAPI.getMyOrganisedGroups(),
    enabled: isAuthenticated && user?.isOrganiser && (activeTab === 'organiser'),
  })
  
  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: (groupId) => groupsAPI.subscribeToGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries(['publicGroups'])
      queryClient.invalidateQueries(['myGroups'])
    },
  })
  
  // Unsubscribe mutation
  const unsubscribeMutation = useMutation({
    mutationFn: (groupId) => groupsAPI.unsubscribeFromGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries(['publicGroups'])
      queryClient.invalidateQueries(['myGroups'])
    },
  })
  
  const allGroups = data?.data || []
  const myGroups = myGroupsData?.data || []
  const organisedGroups = organisedData?.data || []
  
  // Get subscribed group IDs for checking
  const subscribedGroupIds = new Set(myGroups.map(g => g.id))
  
  // Filter groups based on search query and tab
  const getFilteredGroups = () => {
    let groups = []
    if (activeTab === 'explore') {
      groups = allGroups
    } else if (activeTab === 'member') {
      groups = myGroups
    } else if (activeTab === 'organiser') {
      groups = organisedGroups
    }
    
    return groups.filter(group =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.activityName?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }
  
  const filteredGroups = getFilteredGroups()
  
  const handleSubscribe = (groupId) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    subscribeMutation.mutate(groupId)
  }
  
  const handleUnsubscribe = (groupId) => {
    if (confirm('Are you sure you want to leave this group?')) {
      unsubscribeMutation.mutate(groupId)
    }
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-8">Groups</h1>
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
  
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-8">Groups</h1>
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-10 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <p className="text-red-600 font-semibold text-lg">Error loading groups: {error.message}</p>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Discover Groups</h1>
          {user?.isOrganiser && activeTab === 'organiser' && (
            <button
              onClick={() => navigate('/groups/create')}
              className="py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all transform hover:scale-105 flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Create Group
            </button>
          )}
        </div>
        
        {/* Tabs */}
        <div className="mb-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-2 inline-flex gap-2 border border-gray-100 shadow-lg">
            {user?.isOrganiser && (
              <button
                onClick={() => setActiveTab('organiser')}
                className={`px-6 py-3 font-bold rounded-xl transition-all ${
                  activeTab === 'organiser'
                    ? 'bg-gradient-to-r from-orange-500 to-pink-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                👑 Organiser
              </button>
            )}
            {isAuthenticated && (
              <button
                onClick={() => setActiveTab('member')}
                className={`px-6 py-3 font-bold rounded-xl transition-all ${
                  activeTab === 'member'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                ✅ Member
              </button>
            )}
            
            <button
              onClick={() => setActiveTab('explore')}
              className={`px-6 py-3 font-bold rounded-xl transition-all ${
                activeTab === 'explore'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🔍 Explore
            </button>
          </div>
        </div>
        
        {/* Search Bar */}
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
      
        {/* Member Tab */}
        {activeTab === 'member' && (
          <>
            {myGroupsLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-16 text-center border border-gray-100 shadow-lg">
                <Users className="h-20 w-20 mx-auto text-purple-400 mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {searchQuery ? 'No groups match your search' : 'No groups yet'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery ? 'Try adjusting your search terms.' : 'You haven\'t joined any groups yet. Start exploring!'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => setActiveTab('explore')}
                    className="py-3 px-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all transform hover:scale-105"
                  >
                    Explore Groups
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGroups.map(group => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    onNavigate={navigate}
                    onUnsubscribe={handleUnsubscribe}
                    showActions={true}
                    isSubscribed={true}
                  />
                ))}
              </div>
            )}
          </>
        )}
        
        {/* Organiser Tab */}
        {activeTab === 'organiser' && user?.isOrganiser && (
          <>
            {organisedLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-16 text-center border border-gray-100 shadow-lg">
                <Users className="h-20 w-20 mx-auto text-orange-400 mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {searchQuery ? 'No groups match your search' : 'Create your first group'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery ? 'Try adjusting your search terms.' : 'Start building your community by creating a group.'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => navigate('/groups/create')}
                    className="py-3 px-8 bg-gradient-to-r from-orange-500 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-orange-500/50 transition-all transform hover:scale-105 flex items-center gap-2 mx-auto"
                  >
                    <Plus className="h-5 w-5" />
                    Create Group
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGroups.map(group => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    onNavigate={navigate}
                    showActions={true}
                    isOrganiser={true}
                  />
                ))}
              </div>
            )}
          </>
        )}
        
        {/* Explore Tab */}
        {activeTab === 'explore' && (
          <>
            {filteredGroups.length === 0 ? (
              <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-16 text-center border border-gray-100 shadow-lg">
                <Users className="h-20 w-20 mx-auto text-purple-400 mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {searchQuery ? 'No groups match your search' : 'No groups available'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery ? 'Try adjusting your search terms.' : 'Be the first to create a group!'}
                </p>
                {isAuthenticated && !searchQuery && (
                  <button
                    onClick={() => navigate('/groups/create')}
                    className="py-3 px-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all transform hover:scale-105 flex items-center gap-2 mx-auto"
                  >
                    <Plus className="h-5 w-5" />
                    Create the First Group
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGroups.map(group => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    onNavigate={navigate}
                    onSubscribe={handleSubscribe}
                    isSubscribed={subscribedGroupIds.has(group.id)}
                    showActions={false}
                    isExplore={true}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// Reusable Group Card Component
function GroupCard({ group, onNavigate, onSubscribe, onUnsubscribe, isSubscribed, isOrganiser, showActions, isExplore }) {
  return (
    <div
      className="group bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl border border-gray-100 overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-2"
      onClick={() => onNavigate(`/groups/${group.id}`)}
    >
      {/* Group Banner */}
      <div className="relative h-48 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 opacity-40" />
        <img 
          src={group.bannerImage || [
            'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&h=300&fit=crop',
            'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&h=300&fit=crop',
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=300&fit=crop',
            'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=600&h=300&fit=crop',
            'https://images.unsplash.com/photo-1445308394109-4ec2920981b1?w=600&h=300&fit=crop',
            'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=600&h=300&fit=crop'
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
        
        {/* Action Buttons */}
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          {showActions && isSubscribed && !isOrganiser && (
            <>
              <button
                onClick={() => onNavigate(`/groups/${group.id}`)}
                className="flex-1 py-2 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all text-sm"
              >
                View Group
              </button>
              <button
                onClick={() => onUnsubscribe(group.id)}
                className="py-2 px-4 bg-red-50 text-red-600 font-semibold rounded-lg hover:bg-red-100 transition-all text-sm"
              >
                Leave
              </button>
            </>
          )}
          {showActions && isOrganiser && (
            <>
              <button
                onClick={() => onNavigate(`/create-event?groupId=${group.id}`)}
                className="flex-1 py-2 px-4 bg-gradient-to-r from-orange-500 to-pink-600 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-orange-500/50 transition-all text-sm flex items-center justify-center gap-1"
              >
                <Calendar className="h-4 w-4" />
                Event
              </button>
              <button
                onClick={() => onNavigate(`/groups/${group.id}`)}
                className="py-2 px-4 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-all text-sm"
              >
                Manage
              </button>
            </>
          )}
          {isExplore && !isSubscribed && (
            <button
              onClick={() => onSubscribe(group.id)}
              className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all transform hover:scale-105"
            >
              Join Group
            </button>
          )}
          {isExplore && isSubscribed && (
            <button
              onClick={() => onNavigate(`/groups/${group.id}`)}
              className="w-full py-3 px-6 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-all"
            >
              View Group
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
