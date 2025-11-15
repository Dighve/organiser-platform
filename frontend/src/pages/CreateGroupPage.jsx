import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { groupsAPI } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { ArrowLeft, Upload } from 'lucide-react'
import GooglePlacesAutocomplete from '../components/GooglePlacesAutocomplete'
import ImageUpload from '../components/ImageUpload'

export default function CreateGroupPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const queryClient = useQueryClient()
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    activityId: 1, // Hiking - the only activity type for HikeHub
    location: '',
    imageUrl: '',
    maxMembers: '',
    isPublic: true,
  })
  
  const [errors, setErrors] = useState({})
  
  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: (data) => groupsAPI.createGroup(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['myGroups'])
      queryClient.invalidateQueries(['publicGroups'])
      const groupId = response.data?.id
      navigate(groupId ? `/groups/${groupId}` : '/')
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
      activityId: formData.activityId, // Always 1 for Hiking
      location: formData.location.trim() || null,
      imageUrl: formData.imageUrl || null,
      maxMembers: formData.maxMembers ? parseInt(formData.maxMembers) : null,
      isPublic: formData.isPublic,
    }
    
    createGroupMutation.mutate(groupData)
  }
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 flex items-center justify-center px-4">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-10 text-center max-w-md">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
          <p className="text-gray-600 mb-6">Please login to create a group.</p>
          <button
            onClick={() => navigate('/login')}
            className="py-3 px-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all transform hover:scale-105"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/')}
          className="group flex items-center text-gray-600 hover:text-purple-600 mb-6 font-semibold transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </button>
        
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-8">Create New Hiking Group</h1>
        
        <form onSubmit={handleSubmit} className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 border border-gray-100 shadow-2xl space-y-6">
         
          {/* Group Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
              🎯 Group Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-2 ${errors.name ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium transition-all`}
              placeholder="e.g., Peak District Hikers"
            />
            {errors.name && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <span>⚠️</span> {errors.name}
              </p>
            )}
          </div>
      
          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
              📝 Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium transition-all"
              placeholder="Describe your group, its purpose, and what members can expect..."
            />
          </div>
          
          {/* Cover Photo */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Upload className="h-4 w-4 text-purple-600" />
              Cover Photo / Banner
            </label>
            <ImageUpload
              value={formData.imageUrl}
              onChange={(url) => {
                setFormData(prev => ({ ...prev, imageUrl: url }))
              }}
              folder="group-banner"
            />
            <p className="mt-2 text-xs text-gray-500">
              💡 Add a beautiful cover photo to make your group stand out! Recommended size: 1200x400px
            </p>
          </div>
          
          {/* Location */}
          <div>
            <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-2">
              📍 Location
            </label>
            <GooglePlacesAutocomplete
              value={formData.location}
              onChange={(value) => {
                setFormData(prev => ({ ...prev, location: value }))
              }}
              onPlaceSelect={(locationData) => {
                setFormData(prev => ({
                  ...prev,
                  location: locationData.address
                }))
              }}
              error={errors.location}
              placeholder="e.g., Peak District, UK"
            />
          </div>
          
          {/* Max Members */}
          <div>
            <label htmlFor="maxMembers" className="block text-sm font-semibold text-gray-700 mb-2">
              👥 Maximum Members (Optional)
            </label>
            <input
              type="number"
              id="maxMembers"
              name="maxMembers"
              value={formData.maxMembers}
              onChange={handleChange}
              min="1"
              className={`w-full px-4 py-3 border-2 ${errors.maxMembers ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium transition-all`}
              placeholder="Leave empty for unlimited"
            />
            {errors.maxMembers && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <span>⚠️</span> {errors.maxMembers}
              </p>
            )}
          </div>
          
          {/* Is Public */}
          <div className="flex items-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
            <input
              type="checkbox"
              id="isPublic"
              name="isPublic"
              checked={formData.isPublic}
              onChange={handleChange}
              className="h-5 w-5 text-purple-600 focus:ring-2 focus:ring-purple-500 border-gray-300 rounded"
            />
            <label htmlFor="isPublic" className="ml-3 block text-sm font-semibold text-gray-700">
              🌍 Make this group public (visible to all users)
            </label>
          </div>
          
          {/* Error Message */}
          {errors.submit && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-600 font-semibold flex items-center gap-2">
                <span>⚠️</span> {errors.submit}
              </p>
            </div>
          )}
          
          {/* Submit Buttons */}
          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 py-3 px-6 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createGroupMutation.isLoading}
              className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-2xl hover:shadow-purple-500/50 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2"
            >
              {createGroupMutation.isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <span>✨</span>
                  <span>Create Group</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
