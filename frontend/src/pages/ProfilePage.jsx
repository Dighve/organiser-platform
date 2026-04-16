// ============================================================
// IMPORTS
// ============================================================
import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { membersAPI } from '../lib/api'
import ImagePositionModal from '../components/ImagePositionModal'
import ContactInfoEditor from '../components/ContactInfoEditor'
import ContactInfoDisplay from '../components/ContactInfoDisplay'
import toast from 'react-hot-toast'
import { Camera, Edit2, Save, X, Loader2, Mail, KeyRound, BadgeCheck, Shield, Calendar, Star, ArrowLeft, MessageCircle } from 'lucide-react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { useIsIOS } from '../hooks/useIsIOS'
import { useSmartBack } from '../hooks/useSmartBack'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function ProfilePage() {
  // ============================================================
  // HOOKS & STATE
  // ============================================================
  const navigate = useNavigate()
  const { user, isAuthenticated, logout, token } = useAuthStore()  // Global auth state
  const queryClient = useQueryClient()  // React Query cache
  const isIOS = useIsIOS()  // Detect iOS devices
  const goBack = useSmartBack('/')  // Smart back navigation
  
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
  const [contactEdits, setContactEdits] = useState([])  // Contact info being edited

  // ============================================================
  // DATA FETCHING
  // ============================================================

  // Fetch current user's contact info
  const { data: contactsData } = useQuery({
    queryKey: ['myContacts'],
    queryFn: () => membersAPI.getMyContacts().then(res => res.data),
    enabled: isAuthenticated,
  })

  // Fetch current user's member data
  const { data: memberData, isLoading, error, refetch } = useQuery({
    queryKey: ['currentMember'],
    queryFn: () => membersAPI.getCurrentMember().then(res => res.data),
    enabled: isAuthenticated, // Only fetch when authenticated
    retry: (failureCount, err) => {
      // Don't retry on auth errors — avoids caching a stale 401/403 from a previous session
      const status = err?.response?.status
      if (status === 401 || status === 403) return false
      return failureCount < 2
    },
    retryDelay: 1000,
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

  // Sync contact edits with fetched contacts
  useEffect(() => {
    if (contactsData) {
      setContactEdits(contactsData.map(c => ({
        platform: c.platform,
        contactValue: c.contactValue,
        displayLabel: c.displayLabel || '',
        visibility: c.visibility || 'GROUP_MEMBERS',
        displayOrder: c.displayOrder || 0,
      })))
    }
  }, [contactsData])

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

  // Update contacts mutation
  const updateContactsMutation = useMutation({
    mutationFn: (data) => membersAPI.updateMyContacts(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['myContacts'])
      toast.success('Contacts updated!')
    },
    onError: (error) => {
      console.error('Contact update error:', error.response?.status, error.response?.data)
      toast.error(error.response?.data?.message || 'Failed to update contacts')
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
      imagePosition: JSON.stringify(imagePosition),
    })
    // Save contacts (only valid ones with a value)
    const validContacts = contactEdits.filter(c => c.contactValue && c.contactValue.trim())
    updateContactsMutation.mutate({ contacts: validContacts })
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
      const response = await axios.post(
        `${API_URL}/files/upload/profile-photo`,
        formData,
        {
          headers: {
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
  if (error) {
    console.error('Profile load error:', error)
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Profile</h2>
          <p className="text-gray-600 mb-4">
            {error.response?.status === 401 
              ? 'Your session has expired. Please sign in again.' 
              : error.response?.data?.message || 'There was an error loading your profile.'}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => refetch()}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              Try Again
            </button>
            {error.response?.status === 401 && (
              <button
                onClick={() => {
                  logout()
                  navigate('/')
                }}
                className="px-6 py-2.5 bg-white text-gray-700 font-semibold rounded-xl border border-gray-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!memberData) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Profile Data</h2>
          <p className="text-gray-600 mb-6">Please try refreshing the page</p>
          <button
            onClick={() => refetch()}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            Refresh
          </button>
        </div>
      </div>
    )
  }

  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-purple-50 via-white to-blue-50">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-purple-300/35 blur-3xl" />
      <div className="pointer-events-none absolute right-[-40px] top-6 h-64 w-64 rounded-full bg-pink-300/30 blur-3xl" />
      <div className="pointer-events-none absolute right-10 bottom-[-60px] h-72 w-72 rounded-full bg-blue-200/30 blur-[90px]" />

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 pt-8 pb-28">
        
        {/* ========== MOBILE HEADER (Back button - iOS only, fixed overlay) ========== */}
        {isIOS && (
          <button
            onClick={goBack}
            className="sm:hidden fixed top-20 left-4 z-[1000] flex items-center justify-center w-10 h-10 rounded-full bg-white/90 backdrop-blur-md shadow-xl text-gray-600 hover:text-purple-600 active:scale-95 transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />

        <section className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-2xl backdrop-blur-xl">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -left-10 top-12 h-28 w-28 bg-purple-200/40 blur-2xl" />
            <div className="absolute right-0 bottom-0 h-36 w-36 bg-pink-200/40 blur-3xl" />
          </div>

          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="absolute top-4 left-4 z-10 flex items-center justify-center h-11 w-11 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-300/50 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:brightness-90 transition-all"
              aria-label="Edit profile"
            >
              <Edit2 className="h-5 w-5" />
            </button>
          )}

          {isEditing && (
            <button
              type="button"
              onClick={handleCancel}
              className="absolute top-4 right-4 z-10 flex items-center justify-center h-11 w-11 rounded-2xl bg-white text-slate-700 border border-slate-200 shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:bg-slate-100 transition-all"
              aria-label="Cancel editing"
            >
              <X className="h-5 w-5" />
            </button>
          )}

            <div className="relative px-5 sm:px-8 pt-9 pb-6 flex flex-col items-center text-center gap-6">
            <div className="relative">
              <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-full p-1.5 bg-gradient-to-br from-purple-500 to-pink-500 shadow-xl border border-white/70">
                <div className="relative h-full w-full rounded-full overflow-hidden bg-white">
                  {profilePhotoUrl ? (
                    <img
                      src={profilePhotoUrl}
                      alt={displayName || memberData?.email}
                      className="h-full w-full object-cover"
                      style={{ objectPosition: `${imagePosition.x}% ${imagePosition.y}%` }}
                    />
                  ) : (
                    <div className="h-full w-full rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-black text-4xl">
                      {getInitials(displayName || memberData?.displayName, memberData?.email)}
                    </div>
                  )}
                </div>
              </div>
              {isEditing && (
                <button
                  onClick={handleCameraClick}
                  disabled={uploading}
                  className="absolute -right-2 -bottom-2 bg-gradient-to-r from-purple-600 to-pink-600 p-3 rounded-2xl border-4 border-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Upload new photo"
                >
                  {uploading ? (
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  ) : (
                    <Camera className="h-5 w-5 text-white" />
                  )}
                </button>
              )}
            </div>

            <div className="space-y-3 w-full">
              {isEditing ? (
                <div className="text-left space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Display name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your display name"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-lg font-semibold text-slate-900 shadow-inner focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                  />
                  <p className="text-xs text-slate-400">Shown on event lists and RSVP cards.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {memberData?.displayName || 'Set your display name'}
                  </h2>
                  <p className="text-sm text-slate-500">{memberData?.email || 'Email not available'}</p>
                </div>
              )}

              <div className="flex flex-wrap justify-center gap-2">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-xs font-semibold text-slate-700 border border-slate-200">
                  <KeyRound className="h-4 w-4" />
                  Magic link
                </span>
                {memberData?.hasOrganiserRole && (
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-orange-100 to-pink-100 text-xs font-semibold text-orange-700 border border-orange-200">
                    <Shield className="h-4 w-4" />
                    Organiser
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="relative border-t border-slate-100 px-5 sm:px-8 py-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Account details</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: 'Email address', value: memberData?.email || 'Not available', Icon: Mail, accent: 'from-purple-500/15 to-purple-500/5' },
                { label: 'Authentication', value: 'Magic link', Icon: KeyRound, accent: 'from-blue-500/15 to-cyan-500/10' },
                { label: 'Member ID', value: memberData?.id || 'Not available', Icon: BadgeCheck, accent: 'from-orange-500/15 to-amber-500/10' },
              ].map(({ label, value, Icon, accent }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm"
                >
                  <div className={`h-11 w-11 grid place-items-center rounded-xl bg-gradient-to-br ${accent} text-slate-800`}> 
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold uppercase text-slate-500 tracking-wide">{label}</p>
                    <p className="text-sm sm:text-base font-semibold text-slate-900 break-all">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 mb-2">Activity</h3>
              <button
                onClick={() => navigate('/events?search=:me :past')}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-indigo-100 text-sm font-semibold text-indigo-700 hover:border-indigo-200 hover:text-indigo-800 bg-indigo-50 shadow-sm"
              >
                <Calendar className="h-4 w-4" />
                Event History
              </button>
              <button
                onClick={() => navigate('/profile/my-reviews')}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-yellow-100 text-sm font-semibold text-yellow-700 hover:border-yellow-200 hover:text-yellow-800 bg-yellow-50 shadow-sm"
              >
                <Star className="h-4 w-4" />
                My Reviews
              </button>
            </div>

            {/* ========== CONTACT INFO SECTION ========== */}
            <div className="pt-2 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="h-4 w-4 text-slate-400" />
                <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Contact Info</h3>
              </div>

              {isEditing ? (
                <ContactInfoEditor contacts={contactEdits} onChange={setContactEdits} />
              ) : (
                contactsData && contactsData.length > 0 ? (
                  <ContactInfoDisplay contacts={contactsData} showPrivacy />
                ) : (
                  <div className="text-center py-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
                    <MessageCircle className="h-6 w-6 text-slate-300 mx-auto mb-1" />
                    <p className="text-xs text-slate-400">No contact methods added yet. Click <strong>Edit Profile</strong> to add.</p>
                  </div>
                )
              )}
            </div>

            {isEditing && (
              <div className="hidden sm:block pt-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={updateProfileMutation.isLoading}
                  className="w-full flex flex-col items-center justify-center gap-1 px-4 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg shadow-purple-300/50 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {updateProfileMutation.isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Save className="h-5 w-5" />
                  )}
                  <span className="text-xs uppercase tracking-wide">{updateProfileMutation.isLoading ? 'Saving' : 'Save'}</span>
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      {isEditing && (
        <div className="fixed inset-x-0 bottom-0 z-30 px-4 sm:hidden pb-4">
          <div className="max-w-2xl mx-auto rounded-2xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur-xl px-4 py-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={updateProfileMutation.isLoading}
              className="w-full flex flex-col items-center justify-center gap-1 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg shadow-purple-300/50 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {updateProfileMutation.isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}
              <span className="text-xs uppercase tracking-wide">{updateProfileMutation.isLoading ? 'Saving' : 'Save'}</span>
            </button>
          </div>
        </div>
      )}

      {showPositionModal && tempImageUrl && (
        <ImagePositionModal
          imageUrl={tempImageUrl}
          onSave={handleSavePosition}
          onClose={() => setShowPositionModal(false)}
        />
      )}
    </div>
  )
}
