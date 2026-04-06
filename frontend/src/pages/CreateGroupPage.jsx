// ============================================================
// IMPORTS
// ============================================================
import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { groupsAPI, membersAPI } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { ArrowLeft, Upload } from 'lucide-react'
import GooglePlacesAutocomplete from '../components/GooglePlacesAutocomplete'
import ImageUpload from '../components/ImageUpload'
import { useFeatureFlags } from '../contexts/FeatureFlagContext'

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function CreateGroupPage() {
  // ============================================================
  // HOOKS & ROUTING
  // ============================================================
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()  // Global auth state
  const { isGroupLocationEnabled, isGoogleMapsEnabled } = useFeatureFlags()
  const queryClient = useQueryClient()  // React Query cache
  
  // ============================================================
  // LOCAL STATE
  // ============================================================
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    groupGuidelines: '',
    activityId: 1, // Currently: Hiking (Running, Climbing, Swimming coming soon)
    location: '',
    imageUrl: '',
    maxMembers: '',
    isPublic: true,
  })
  
  const [errors, setErrors] = useState({})  // Form validation errors
  const [showEventPrompt, setShowEventPrompt] = useState(false)
  const [createdGroupId, setCreatedGroupId] = useState(null)

  // ============================================================
  // QUERIES
  // ============================================================
  // (None needed - organiser check handled by header button)
  
  // ============================================================
  // MUTATIONS
  // ============================================================
  
  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: (data) => groupsAPI.createGroup(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['myGroups'])
      queryClient.invalidateQueries(['publicGroups'])
      const groupId = response.data?.id
      
      // Show prompt modal instead of auto-navigating
      setCreatedGroupId(groupId)
      setShowEventPrompt(true)
    },
    onError: (error) => {
      console.error('Error creating group:', error)
      setErrors({ submit: error.response?.data?.message || 'Failed to create group' })
    },
  })
  
  // ============================================================
  // EVENT HANDLERS
  // ============================================================
  
  // Handle form field changes
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
  
  // ============================================================
  // VALIDATION
  // ============================================================
  
  // Validate form data before submission
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
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!validate()) {
      return
    }
    
    // Prepare data for API
    const groupData = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      groupGuidelines: formData.groupGuidelines.trim() || null,
      activityId: formData.activityId, // Always 1 for Hiking
      location: formData.location.trim() || null,
      imageUrl: formData.imageUrl || null,
      maxMembers: formData.maxMembers ? parseInt(formData.maxMembers) : null,
      isPublic: formData.isPublic,
    }
    
    createGroupMutation.mutate(groupData)
  }
  
  // ============================================================
  // UNAUTHENTICATED STATE
  // ============================================================
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
  
  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 py-4 sm:py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ========== MOBILE HEADER ========== */}
        <div className="sm:hidden mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-lg text-gray-600 hover:text-purple-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Create Group
            </h1>
            <div className="w-10 h-10"></div> {/* Spacer for center alignment */}
          </div>
        </div>

        {/* ========== DESKTOP HEADER ========== */}
        <div className="hidden sm:block">
          <button
            onClick={() => navigate('/')}
            className="group flex items-center text-gray-600 hover:text-purple-600 mb-6 font-semibold transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </button>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-8">Create New Group</h1>
        </div>
        
        {/* ========== CREATE GROUP FORM ========== */}
        <form onSubmit={handleSubmit} className="bg-white/80 sm:bg-white/60 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-gray-100 shadow-xl sm:shadow-2xl space-y-4 sm:space-y-6">
         
          {/* GROUP NAME FIELD (Required) */}
          <div>
            <label htmlFor="name" className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
              🎯 Group Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-3 sm:px-4 py-3 sm:py-3 text-base border-2 ${errors.name ? 'border-red-500' : 'border-gray-200'} rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium transition-all`}
              placeholder="e.g., Peak District Hikers"
            />
            {errors.name && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <span>⚠️</span> {errors.name}
              </p>
            )}
          </div>
      
          {/* DESCRIPTION FIELD (Optional) */}
          <div>
            <label htmlFor="description" className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
              📝 Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 sm:px-4 py-3 text-base border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium transition-all resize-none sm:resize-y"
              placeholder="Describe your group, its purpose, and what members can expect..."
            />
          </div>
          
          {/* GROUP GUIDELINES FIELD (Optional) */}
          <div>
            <label htmlFor="groupGuidelines" className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
              📋 Group Guidelines
              <span className="text-gray-500 font-normal text-xs sm:text-sm ml-2">(optional)</span>
            </label>
            <textarea
              id="groupGuidelines"
              name="groupGuidelines"
              value={formData.groupGuidelines}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 sm:px-4 py-3 text-base border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium transition-all resize-none"
              placeholder="e.g., All participants must bring their own equipment. No refunds within 24 hours of event. Participants must be 18+..."
            />
            <p className="mt-2 text-xs text-gray-500">
              💡 Set community guidelines that members should follow (e.g., equipment requirements, safety standards, group etiquette)
            </p>
          </div>
          
          {/* COVER PHOTO / BANNER FIELD (Optional) */}
          <div>
            <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
              Group Photo / Banner
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
          
          {/* LOCATION FIELD (Optional) - Only show if group location feature is enabled */}
          {isGroupLocationEnabled() && (
            <div>
              <label htmlFor="location" className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
                📍 Location
              </label>
              <GooglePlacesAutocomplete
                value={formData.location}
                onChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
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
          )}
          
          {/* MAX MEMBERS FIELD (Optional) */}
          <div>
            <label htmlFor="maxMembers" className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
              👥 Maximum Members
              <span className="text-gray-500 font-normal text-xs sm:text-sm ml-2">(optional)</span>
            </label>
            <input
              type="number"
              id="maxMembers"
              name="maxMembers"
              value={formData.maxMembers}
              onChange={handleChange}
              min="1"
              className={`w-full px-3 sm:px-4 py-3 text-base border-2 ${errors.maxMembers ? 'border-red-500' : 'border-gray-200'} rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium transition-all`}
              placeholder="Leave empty for unlimited"
            />
            {errors.maxMembers && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <span>⚠️</span> {errors.maxMembers}
              </p>
            )}
          </div>
          
          {/* PUBLIC VISIBILITY CHECKBOX */}
          <div className="flex items-center p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg sm:rounded-xl border border-purple-100">
            <input
              type="checkbox"
              id="isPublic"
              name="isPublic"
              checked={formData.isPublic}
              onChange={handleChange}
              className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 focus:ring-2 focus:ring-purple-500 border-gray-300 rounded"
            />
            <label htmlFor="isPublic" className="ml-3 block text-sm sm:text-base font-semibold text-gray-700">
              🌍 Make this group public
              <span className="hidden sm:inline"> (visible to all users)</span>
            </label>
          </div>
          
          {/* ERROR MESSAGE (Submit errors) */}
          {errors.submit && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg sm:rounded-xl p-3 sm:p-4">
              <p className="text-sm text-red-600 font-semibold flex items-center gap-2">
                <span>⚠️</span> {errors.submit}
              </p>
            </div>
          )}
          
          {/* ACTION BUTTONS - Mobile-optimized */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full sm:flex-1 py-4 sm:py-3 px-6 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createGroupMutation.isLoading}
              className="w-full sm:flex-1 py-4 sm:py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-2xl hover:shadow-purple-500/50 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 order-1 sm:order-2"
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

        {/* ========== EVENT CREATION PROMPT MODAL ========== */}
        {showEventPrompt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <div className="text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
                  Group Created Successfully!
                </h2>
                <p className="text-gray-600 mb-6">
                  Your group is ready! Would you like to create your first event to get members excited?
                </p>
                
                {/* Actions */}
                <div className="space-y-3">
                  <button
                    className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white font-bold rounded-xl hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-200 transform hover:scale-105"
                    onClick={() => {
                      // Invalidate group members cache so the new subscription is available
                      queryClient.invalidateQueries(['groupMembers', createdGroupId])
                      navigate(`/create-event?groupId=${createdGroupId}`)
                      setShowEventPrompt(false)
                    }}
                  >
                    Create First Event
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowEventPrompt(false)
                      navigate(`/groups/${createdGroupId}`)
                    }}
                    className="w-full py-2 px-6 text-gray-500 font-medium rounded-xl hover:bg-gray-50 transition-all text-sm"
                  >
                    View Group Instead
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
