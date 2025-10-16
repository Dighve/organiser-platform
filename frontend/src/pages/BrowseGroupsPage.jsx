import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { groupsAPI } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { Users, Search, Plus } from 'lucide-react'

export default function BrowseGroupsPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  
  // Fetch all public groups
  const { data, isLoading, error } = useQuery({
    queryKey: ['publicGroups'],
    queryFn: () => groupsAPI.getAllPublicGroups(),
  })
  
  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: (groupId) => groupsAPI.subscribeToGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries(['publicGroups'])
      queryClient.invalidateQueries(['myGroups'])
    },
  })
  
  const groups = data?.data || []
  
  // Filter groups based on search query
  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.activityName?.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const handleSubscribe = (groupId) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    subscribeMutation.mutate(groupId)
  }
  
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Browse Groups</h1>
        <div className="card">
          <p className="text-gray-600">Loading groups...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Browse Groups</h1>
        <div className="card bg-red-50">
          <p className="text-red-600">Error loading groups: {error.message}</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold">Browse Groups</h1>
        <div className="flex gap-3">
          {isAuthenticated && (
            <>
              <button
                onClick={() => navigate('/groups')}
                className="btn btn-outline"
              >
                My Groups
              </button>
              <button
                onClick={() => navigate('/groups/create')}
                className="btn btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Group
              </button>
            </>
          )}
        </div>
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
      
      {filteredGroups.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 mb-4">
            {searchQuery ? 'No groups match your search.' : 'No public groups available yet.'}
          </p>
          {isAuthenticated && (
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
            <div
              key={group.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 mb-1">{group.name}</h3>
                    <p className="text-sm text-primary-600 font-medium mb-2">{group.activityName}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    group.isPublic ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {group.isPublic ? 'Public' : 'Private'}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {group.description || 'No description provided.'}
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
                
                <button
                  onClick={() => handleSubscribe(group.id)}
                  disabled={subscribeMutation.isLoading}
                  className="w-full btn btn-primary"
                >
                  {subscribeMutation.isLoading ? 'Joining...' : 'Join Group'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
