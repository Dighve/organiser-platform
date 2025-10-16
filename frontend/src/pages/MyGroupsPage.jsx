import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { groupsAPI } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { Users, Plus, Calendar } from 'lucide-react'

export default function MyGroupsPage() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuthStore()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('subscribed')
  
  // Fetch user's subscribed groups
  const { data, isLoading, error } = useQuery({
    queryKey: ['myGroups'],
    queryFn: () => groupsAPI.getMyGroups(),
    enabled: isAuthenticated,
  })
  
  // Fetch user's organised groups
  const { data: organisedData, isLoading: organisedLoading, error: organisedError } = useQuery({
    queryKey: ['myOrganisedGroups'],
    queryFn: () => groupsAPI.getMyOrganisedGroups(),
    enabled: isAuthenticated && user?.isOrganiser,
  })
  
  // Unsubscribe mutation
  const unsubscribeMutation = useMutation({
    mutationFn: (groupId) => groupsAPI.unsubscribeFromGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries(['myGroups'])
    },
  })
  
  const groups = data?.data || []
  const organisedGroups = organisedData?.data || []
  
  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">My Groups</h1>
        <div className="card">
          <p className="text-gray-600">Please login to view your groups.</p>
        </div>
      </div>
    )
  }
  
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">My Groups</h1>
        <div className="card">
          <p className="text-gray-600">Loading your groups...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">My Groups</h1>
        <div className="card bg-red-50">
          <p className="text-red-600">Error loading groups: {error.message}</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Groups</h1>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/groups/browse')}
            className="btn btn-outline"
          >
            Browse Groups
          </button>
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
      </div>
      
      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('subscribed')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'subscribed'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Groups
          </button>
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
        </nav>
      </div>
      
      {/* Subscribed Groups Tab */}
      {activeTab === 'subscribed' && (
        <>
          {isLoading ? (
            <div className="card">
              <p className="text-gray-600">Loading your groups...</p>
            </div>
          ) : groups.length === 0 ? (
            <div className="card text-center py-12">
              <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">You haven't joined any groups yet.</p>
              <button
                onClick={() => navigate('/groups/browse')}
                className="btn btn-primary"
              >
                Browse Groups
              </button>
            </div>
          ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map(group => (
            <div
              key={group.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
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
                
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/create-event?groupId=${group.id}`)}
                    className="flex-1 btn btn-primary btn-sm"
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    Create Event
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to leave this group?')) {
                        unsubscribeMutation.mutate(group.id)
                      }
                    }}
                    disabled={unsubscribeMutation.isLoading}
                    className="btn btn-outline btn-sm text-red-600 border-red-600 hover:bg-red-50"
                  >
                    Leave
                  </button>
                </div>
              </div>
            </div>
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
          ) : organisedGroups.length === 0 ? (
            <div className="card text-center py-12">
              <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">You haven't created any groups yet.</p>
              <button
                onClick={() => navigate('/groups/create')}
                className="btn btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Group
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {organisedGroups.map(group => (
                <div
                  key={group.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
                >
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
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/create-event?groupId=${group.id}`)}
                        className="flex-1 btn btn-primary btn-sm"
                      >
                        <Calendar className="h-4 w-4 mr-1" />
                        Create Event
                      </button>
                      <button
                        onClick={() => navigate(`/groups/${group.id}`)}
                        className="btn btn-outline btn-sm"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
