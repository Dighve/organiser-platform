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
  const [activeTab, setActiveTab] = useState('explore')
  
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Groups</h1>
        <div className="card">
          <p className="text-gray-600">Loading groups...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Groups</h1>
        <div className="card bg-red-50">
          <p className="text-red-600">Error loading groups: {error.message}</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold">Groups</h1>
        {user?.isOrganiser && activeTab === 'organiser' && (
          <button
            onClick={() => navigate('/groups/create')}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Group
          </button>
        )}
      </div>
      
      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {isAuthenticated && (
            <button
              onClick={() => setActiveTab('member')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'member'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Member
            </button>
          )}
          {user?.isOrganiser && (
            <button
              onClick={() => setActiveTab('organiser')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'organiser'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Organiser
            </button>
          )}
          <button
            onClick={() => setActiveTab('explore')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'explore'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Explore
          </button>
        </nav>
      </div>
      
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search groups by name, activity, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>
      
      {/* Member Tab */}
      {activeTab === 'member' && (
        <>
          {myGroupsLoading ? (
            <div className="card">
              <p className="text-gray-600">Loading your groups...</p>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="card text-center py-12">
              <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">
                {searchQuery ? 'No groups match your search.' : 'You haven\'t joined any groups yet.'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setActiveTab('explore')}
                  className="btn btn-primary"
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
            <div className="card">
              <p className="text-gray-600">Loading your organised groups...</p>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="card text-center py-12">
              <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">
                {searchQuery ? 'No groups match your search.' : 'You haven\'t created any groups yet.'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => navigate('/groups/create')}
                  className="btn btn-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
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
            <div className="card text-center py-12">
              <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">
                {searchQuery ? 'No groups match your search.' : 'No public groups available yet.'}
              </p>
              {isAuthenticated && !searchQuery && (
                <button
                  onClick={() => navigate('/groups/create')}
                  className="btn btn-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
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
  )
}

// Reusable Group Card Component
function GroupCard({ group, onNavigate, onSubscribe, onUnsubscribe, isSubscribed, isOrganiser, showActions, isExplore }) {
  return (
    <div
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden cursor-pointer"
      onClick={() => onNavigate(`/groups/${group.id}`)}
    >
      {/* Group Banner */}
      <div className="relative h-40 bg-gradient-to-r from-primary-300 to-primary-500 overflow-hidden">
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
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-bold text-lg text-gray-900 mb-1">{group.name}</h3>
            <p className="text-sm text-gray-600 mb-2">{group.activityName}</p>
          </div>
          <span className={`px-2 py-1 text-xs rounded-full ${
            group.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {group.active ? 'Active' : 'Inactive'}
          </span>
        </div>
        
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {group.description || 'No description'}
        </p>
        
        <div className="space-y-2 text-sm text-gray-700 mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>{group.currentMembers || 0} members</span>
            {group.maxMembers && (
              <span className="text-gray-500">/ {group.maxMembers}</span>
            )}
          </div>
          {group.location && (
            <div className="flex items-center gap-2">
              <span>📍</span>
              <span className="line-clamp-1">{group.location}</span>
            </div>
          )}
          {group.primaryOrganiserName && (
            <div className="flex items-center gap-2">
              <span>👤</span>
              <span>Organiser: {group.primaryOrganiserName}</span>
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          {showActions && isSubscribed && !isOrganiser && (
            <>
              <button
                onClick={() => onNavigate(`/create-event?groupId=${group.id}`)}
                className="flex-1 btn btn-primary btn-sm"
              >
                <Calendar className="h-4 w-4 mr-1" />
                Create Event
              </button>
              <button
                onClick={() => onUnsubscribe(group.id)}
                className="btn btn-outline btn-sm text-red-600 border-red-600 hover:bg-red-50"
              >
                Leave
              </button>
            </>
          )}
          {showActions && isOrganiser && (
            <>
              <button
                onClick={() => onNavigate(`/create-event?groupId=${group.id}`)}
                className="flex-1 btn btn-primary btn-sm"
              >
                <Calendar className="h-4 w-4 mr-1" />
                Create Event
              </button>
              <button
                onClick={() => onNavigate(`/groups/${group.id}`)}
                className="btn btn-outline btn-sm"
              >
                Manage
              </button>
            </>
          )}
          {isExplore && !isSubscribed && (
            <button
              onClick={() => onSubscribe(group.id)}
              className="w-full btn btn-primary btn-sm"
            >
              Join Group
            </button>
          )}
          {isExplore && isSubscribed && (
            <button
              onClick={() => onNavigate(`/groups/${group.id}`)}
              className="w-full btn btn-outline btn-sm"
            >
              View Group
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
