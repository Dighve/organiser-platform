import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { groupsAPI } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { ArrowLeft, Users, MapPin, Calendar } from 'lucide-react'

export default function GroupDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuthStore()

  // Fetch group details
  const { data: groupData, isLoading, error } = useQuery({
    queryKey: ['group', id],
    queryFn: () => groupsAPI.getGroupById(id),
  })

  const group = groupData?.data

  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: () => groupsAPI.subscribeToGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['group', id])
      queryClient.invalidateQueries(['myGroups'])
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-gray-600">Loading group details...</div>
      </div>
    )
  }

  if (error || !group) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-red-600 mb-4">Group not found</p>
          <button onClick={() => navigate('/groups/browse')} className="btn btn-primary">
            Browse Groups
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </button>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-700 px-8 py-12 text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-3">{group.name}</h1>
              <div className="flex items-center gap-4 text-primary-100">
                <div className="flex items-center gap-1">
                  <Users className="h-5 w-5" />
                  <span>{group.currentMembers || 0} members</span>
                </div>
                {group.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-5 w-5" />
                    <span>{group.location}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                group.isPublic ? 'bg-green-500' : 'bg-gray-500'
              }`}>
                {group.isPublic ? 'Public' : 'Private'}
              </span>
              {group.maxMembers && (
                <span className="px-3 py-1 bg-white text-primary-700 rounded-full text-sm font-medium">
                  Max: {group.maxMembers}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">About</h2>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {group.description || 'No description available.'}
                </p>
              </div>

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Activity Type</h2>
                <div className="inline-flex items-center px-4 py-2 bg-primary-100 text-primary-800 rounded-lg font-medium">
                  {group.activityName}
                </div>
              </div>

              {group.createdAt && (
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>Created on {new Date(group.createdAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-lg p-6 sticky top-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Group Actions</h3>
                
                {isAuthenticated ? (
                  <div className="space-y-3">
                    {group.isSubscribed ? (
                      <>
                        <button
                          onClick={() => navigate('/create-event')}
                          className="w-full btn btn-primary"
                        >
                          Create Event
                        </button>
                        <button
                          onClick={handleUnsubscribe}
                          disabled={unsubscribeMutation.isLoading}
                          className="w-full btn btn-outline"
                        >
                          {unsubscribeMutation.isLoading ? 'Leaving...' : 'Leave Group'}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleSubscribe}
                        disabled={subscribeMutation.isLoading}
                        className="w-full btn btn-primary"
                      >
                        {subscribeMutation.isLoading ? 'Joining...' : 'Join Group'}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 mb-3">Login to join this group</p>
                    <button
                      onClick={() => navigate('/login')}
                      className="w-full btn btn-primary"
                    >
                      Login
                    </button>
                  </div>
                )}

                {group.primaryOrganiserName && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Organizer</h4>
                    <p className="text-gray-900">{group.primaryOrganiserName}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
