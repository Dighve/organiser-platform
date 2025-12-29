// ============================================================
// IMPORTS
// ============================================================
import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { membersAPI } from '../lib/api'
import ImagePositionModal from '../components/ImagePositionModal'
import toast from 'react-hot-toast'
import { Camera, Edit2, Save, X, Loader2 } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function ProfilePage() {
  // ============================================================
  // HOOKS & STATE
  // ============================================================
  const { user } = useAuthStore()  // Global auth state
  const queryClient = useQueryClient()  // React Query cache
  
  // ============================================================
  // LOCAL STATE
  // ============================================================
  const [isEditing, setIsEditing] = useState(false)  // Edit mode toggle
  const [displayName, setDisplayName] = useState('')  // Editable display name
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('')  // Editable profile photo URL
  const [uploading, setUploading] = useState(false)  // Upload in progress
  const [showPositionModal, setShowPositionModal] = useState(false)  // Show image position modal
  const [tempImageUrl, setTempImageUrl] = useState('')  // Temporary image for positioning
  const [imagePosition, setImagePosition] = useState({ x: 50, y: 50 })  // Image focus position
  const fileInputRef = useRef(null)  // File input reference

  // ============================================================
  // DATA FETCHING
  // ============================================================
  
  // Fetch current user's member data
  const { data: memberData, isLoading } = useQuery({
    queryKey: ['currentMember'],
    queryFn: () => membersAPI.getCurrentMember().then(res => res.data),
  })

  // ============================================================
  // EFFECTS
  // ============================================================
  
  // Sync local state with fetched member data
  useEffect(() => {
    if (memberData) {
      setDisplayName(memberData.displayName || '')
      setProfilePhotoUrl(memberData.profilePhotoUrl || '')
      // Parse imagePosition from JSON string or default to center
      if (memberData.imagePosition) {
        try {
          setImagePosition(JSON.parse(memberData.imagePosition))
        } catch (e) {
          setImagePosition({ x: 50, y: 50 })
        }
      } else {
        setImagePosition({ x: 50, y: 50 })
      }
    }
  }, [memberData])

  // ============================================================
  // MUTATIONS
  // ============================================================
  
  // Update profile mutation (display name and photo)
  const updateProfileMutation = useMutation({
    mutationFn: (data) => membersAPI.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['currentMember'])
      queryClient.invalidateQueries(['members'])
      toast.success('Profile updated successfully!')
      setIsEditing(false)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update profile')
    },
  })

  // ============================================================
  // EVENT HANDLERS
  // ============================================================
  
  // Save profile changes
  const handleSave = () => {
    updateProfileMutation.mutate({
      displayName: displayName || null,
      profilePhotoUrl: profilePhotoUrl || null,
      imagePosition: JSON.stringify(imagePosition), // Send as JSON string
    })
  }

  // Cancel editing and reset to original values
  const handleCancel = () => {
    setDisplayName(memberData?.displayName || '')
    setProfilePhotoUrl(memberData?.profilePhotoUrl || '')
    // Parse imagePosition from JSON string or default to center
    if (memberData?.imagePosition) {
      try {
        setImagePosition(JSON.parse(memberData.imagePosition))
      } catch (e) {
        setImagePosition({ x: 50, y: 50 })
      }
    } else {
      setImagePosition({ x: 50, y: 50 })
    }
    setIsEditing(false)
  }

  // Trigger file input when camera icon is clicked
  const handleCameraClick = () => {
    fileInputRef.current?.click()
  }

  // Handle file selection
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPG, PNG, GIF, or WebP)')
      return
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('Image size must be less than 10MB')
      return
    }

    // Upload image
    await uploadImage(file)
  }

  // Upload image to backend
  const uploadImage = async (file) => {
    const formData = new FormData()
    formData.append('file', file)

    setUploading(true)
    
    try {
      const token = localStorage.getItem('token')
      const response = await axios.post(
        `${API_URL}/files/upload/profile-photo`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': token ? `Bearer ${token}` : ''
          }
        }
      )

      if (response.data.success && response.data.imageUrl) {
        setTempImageUrl(response.data.imageUrl)
        setShowPositionModal(true)
        toast.success('Image uploaded! Now adjust the position.')
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error.response?.data?.error || 'Failed to upload image. Please try again.')
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Save image position and update profile
  const handleSavePosition = (position) => {
    setImagePosition(position)
    setProfilePhotoUrl(tempImageUrl)
    setShowPositionModal(false)
    toast.success('Photo position saved! Click "Save Changes" to update your profile.')
  }

  // ============================================================
  // HELPER FUNCTIONS
  // ============================================================
  
  // Generate initials from name or email for avatar fallback
  const getInitials = (name, email) => {
    if (name && name.trim()) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    if (email) {
      return email[0].toUpperCase()
    }
    return '?'
  }

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your profile...</p>
        </div>
      </div>
    )
  }

  // ============================================================
  // ERROR STATE
  // ============================================================
  if (!memberData) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Profile</h2>
          <p className="text-gray-600 mb-6">Please try refreshing the page</p>
        </div>
      </div>
    )
  }

  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ========== PAGE HEADER ========== */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">👤 My Profile</h1>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all transform hover:scale-105"
            >
              <Edit2 className="h-5 w-5" />
              Edit Profile
            </button>
          )}
        </div>
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* ========== PROFILE CARD ========== */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          {/* ========== PROFILE CONTENT ========== */}
          <div className="px-8 py-12">
            
            {/* PROFILE PICTURE */}
            <div className="flex justify-center mb-6">
              <div className="relative group">
                {profilePhotoUrl ? (
                  <img
                    src={profilePhotoUrl}
                    alt={displayName || memberData?.email}
                    className="h-40 w-40 rounded-full border-8 border-white shadow-2xl object-cover"
                    style={{
                      objectPosition: `${imagePosition.x}% ${imagePosition.y}%`
                    }}
                  />
                ) : (
                  <div className="h-40 w-40 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-6xl border-8 border-white shadow-2xl">
                    {getInitials(displayName || memberData?.displayName, memberData?.email)}
                  </div>
                )}
                
                {/* Camera Button - Always visible in edit mode */}
                {isEditing && (
                  <button
                    onClick={handleCameraClick}
                    disabled={uploading}
                    className="absolute bottom-2 right-2 bg-gradient-to-r from-purple-600 to-pink-600 p-3 rounded-full border-4 border-white shadow-lg hover:shadow-xl transition-all transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed group-hover:scale-110"
                    title="Upload new photo"
                  >
                    {uploading ? (
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    ) : (
                      <Camera className="h-6 w-6 text-white" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* ========== MEMBER INFO ========== */}
            <div className="text-center mb-8">
              {isEditing ? (
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your display name"
                  className="text-3xl font-extrabold text-gray-900 text-center border-b-2 border-purple-300 focus:border-purple-600 outline-none bg-transparent px-4 py-2 mb-3"
                />
              ) : (
                <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
                  {memberData?.displayName || 'Set your display name'}
                </h2>
              )}
              {memberData?.hasOrganiserRole && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-100 to-pink-100 rounded-full border border-orange-200">
                  <span className="text-lg">💼</span>
                  <span className="font-semibold text-orange-700">Organiser</span>
                </div>
              )}
            </div>


            {/* ========== EDIT MODE: ACTION BUTTONS ========== */}
            {isEditing && (
              <div className="flex gap-4 justify-center mb-8">
                <button
                  onClick={handleSave}
                  disabled={updateProfileMutation.isLoading}
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-green-500/50 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-5 w-5" />
                  {updateProfileMutation.isLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={updateProfileMutation.isLoading}
                  className="flex items-center gap-2 px-8 py-3 bg-white text-gray-700 font-bold rounded-xl border-2 border-gray-300 hover:border-gray-400 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="h-5 w-5" />
                  Cancel
                </button>
              </div>
            )}

            {/* ========== PROFILE DETAILS (Read-Only) ========== */}
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span>📧</span> Email Address
                </label>
                <p className="text-lg font-medium text-gray-900">{memberData?.email || 'Not available'}</p>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-100">
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span>🔐</span> Authentication
                </label>
                <p className="text-lg font-medium text-gray-900">Magic Link</p>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-6 border border-orange-100">
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span>🆔</span> Member ID
                </label>
                <p className="text-lg font-medium text-gray-900 font-mono">{memberData?.id || 'Not available'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ========== IMAGE POSITION MODAL ========== */}
        {showPositionModal && tempImageUrl && (
          <ImagePositionModal
            imageUrl={tempImageUrl}
            onSave={handleSavePosition}
            onClose={() => setShowPositionModal(false)}
          />
        )}
      </div>
    </div>
  )
}
