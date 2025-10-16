import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { groupsAPI, activityTypesAPI } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { ArrowLeft } from 'lucide-react'

export default function CreateGroupPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const queryClient = useQueryClient()
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    activityId: '',
    location: '',
    maxMembers: '',
    isPublic: true,
  })
  
  const [errors, setErrors] = useState({})
  
  // Fetch activities
  const { data: activitiesData, isLoading: activitiesLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: () => activityTypesAPI.getAll(),
  })
  
  const activities = activitiesData?.data || []
  
  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: (data) => groupsAPI.createGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['myGroups'])
      queryClient.invalidateQueries(['publicGroups'])
      navigate('/groups')
    },
    onError: (error) => {
      console.error('Error creating group:', error)
      setErrors({ submit: error.response?.data?.message || 'Failed to create group' })
    },
  })
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }
  
  const validate = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Group name is required'
    }
    
    if (!formData.activityId) {
      newErrors.activityId = 'Activity is required'
    }
    
    if (formData.maxMembers && (isNaN(formData.maxMembers) || parseInt(formData.maxMembers) < 1)) {
      newErrors.maxMembers = 'Max members must be a positive number'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!validate()) {
      return
    }
    
    // Prepare data for API
    const groupData = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      activityId: parseInt(formData.activityId),
      location: formData.location.trim() || null,
      maxMembers: formData.maxMembers ? parseInt(formData.maxMembers) : null,
      isPublic: formData.isPublic,
    }
    
    createGroupMutation.mutate(groupData)
  }
  
  if (!isAuthenticated) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card">
          <p className="text-gray-600">Please login to create a group.</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate('/groups')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to My Groups
      </button>
      
      <h1 className="text-3xl font-bold mb-8">Create New Group</h1>
      
      <form onSubmit={handleSubmit} className="card space-y-6">
        {/* Group Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Group Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`input ${errors.name ? 'border-red-500' : ''}`}
            placeholder="e.g., Peak District Hikers"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>
        
        {/* Activity */}
        <div>
          <label htmlFor="activityId" className="block text-sm font-medium text-gray-700 mb-2">
            Activity Type <span className="text-red-500">*</span>
          </label>
          {activitiesLoading ? (
            <p className="text-gray-500">Loading activities...</p>
          ) : (
            <select
              id="activityId"
              name="activityId"
              value={formData.activityId}
              onChange={handleChange}
              className={`input ${errors.activityId ? 'border-red-500' : ''}`}
            >
              <option value="">Select an activity</option>
              {activities.map(activity => (
                <option key={activity.id} value={activity.id}>
                  {activity.name}
                </option>
              ))}
            </select>
          )}
          {errors.activityId && (
            <p className="mt-1 text-sm text-red-600">{errors.activityId}</p>
          )}
        </div>
        
        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="input"
            placeholder="Describe your group, its purpose, and what members can expect..."
          />
        </div>
        
        {/* Location */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="input"
            placeholder="e.g., Peak District, UK"
          />
        </div>
        
        {/* Max Members */}
        <div>
          <label htmlFor="maxMembers" className="block text-sm font-medium text-gray-700 mb-2">
            Maximum Members (Optional)
          </label>
          <input
            type="number"
            id="maxMembers"
            name="maxMembers"
            value={formData.maxMembers}
            onChange={handleChange}
            min="1"
            className={`input ${errors.maxMembers ? 'border-red-500' : ''}`}
            placeholder="Leave empty for unlimited"
          />
          {errors.maxMembers && (
            <p className="mt-1 text-sm text-red-600">{errors.maxMembers}</p>
          )}
        </div>
        
        {/* Is Public */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isPublic"
            name="isPublic"
            checked={formData.isPublic}
            onChange={handleChange}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
            Make this group public (visible to all users)
          </label>
        </div>
        
        {/* Error Message */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}
        
        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/groups')}
            className="btn btn-outline flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createGroupMutation.isLoading}
            className="btn btn-primary flex-1"
          >
            {createGroupMutation.isLoading ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </form>
    </div>
  )
}
