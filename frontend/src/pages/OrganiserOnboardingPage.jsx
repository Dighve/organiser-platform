import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Mountain, Users, Calendar, CheckCircle, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { groupsAPI, eventsAPI } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import GooglePlacesAutocomplete from '../components/GooglePlacesAutocomplete'
import ImageUpload from '../components/ImageUpload'

const STEPS = [
  { id: 'welcome', label: 'Welcome', icon: Sparkles },
  { id: 'group', label: 'Create Group', icon: Users },
  { id: 'event', label: 'First Event', icon: Calendar },
  { id: 'done', label: 'Done', icon: CheckCircle },
]

export default function OrganiserOnboardingPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [step, setStep] = useState(0)
  const [createdGroup, setCreatedGroup] = useState(null)

  // Group form state
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    location: '',
    imageUrl: '',
    maxMembers: '',
    isPublic: true,
  })

  // Event form state
  const [eventForm, setEventForm] = useState({
    title: '',
    eventDate: '',
    startTime: '',
    location: '',
    latitude: null,
    longitude: null,
    description: '',
  })

  const createGroupMutation = useMutation({
    mutationFn: async () => {
      const response = await groupsAPI.createGroup({
        name: groupForm.name,
        description: groupForm.description,
        location: groupForm.location,
        imageUrl: groupForm.imageUrl || undefined,
        maxMembers: groupForm.maxMembers ? parseInt(groupForm.maxMembers) : undefined,
        isPublic: groupForm.isPublic,
        activityId: 1,
      })
      return response.data
    },
    onSuccess: (data) => {
      setCreatedGroup(data)
      queryClient.invalidateQueries({ queryKey: ['myGroups'] })
      setStep(2)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create group')
    },
  })

  const createEventMutation = useMutation({
    mutationFn: async () => {
      const response = await eventsAPI.createEvent({
        title: eventForm.title,
        eventDate: eventForm.eventDate,
        startTime: eventForm.startTime,
        location: eventForm.location,
        latitude: eventForm.latitude,
        longitude: eventForm.longitude,
        description: eventForm.description,
        groupId: createdGroup.id,
        hostName: user?.email,
        activityId: 1,
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupEvents'] })
      setStep(3)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create event')
    },
  })

  const handleGroupSubmit = () => {
    if (!groupForm.name.trim()) {
      toast.error('Group name is required')
      return
    }
    createGroupMutation.mutate()
  }

  const handleEventSubmit = () => {
    if (!eventForm.title.trim() || !eventForm.eventDate || !eventForm.startTime || !eventForm.location) {
      toast.error('Please fill in all required fields')
      return
    }
    createEventMutation.mutate()
  }

  const stepConfig = [
    { gradient: 'from-purple-500 to-pink-500', shadow: 'shadow-purple-500/30' },
    { gradient: 'from-pink-500 to-orange-500', shadow: 'shadow-pink-500/30' },
    { gradient: 'from-orange-500 to-amber-500', shadow: 'shadow-orange-500/30' },
    { gradient: 'from-green-500 to-emerald-500', shadow: 'shadow-green-500/30' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-8 px-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob" />
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-orange-400 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-2000" />

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
              <Mountain className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              OutMeets
            </span>
          </div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
            Organiser Setup
          </h1>
          <p className="mt-2 text-gray-600">Let's get you set up in just a few steps</p>
        </div>

        {/* Progress bar */}
        <div className="flex items-center justify-center mb-10">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            const isComplete = i < step
            const isActive = i === step
            const cfg = stepConfig[i]
            return (
              <div key={s.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isComplete
                      ? `bg-gradient-to-br ${cfg.gradient} shadow-lg ${cfg.shadow}`
                      : isActive
                      ? `bg-gradient-to-br ${cfg.gradient} shadow-lg ${cfg.shadow} ring-4 ring-white`
                      : 'bg-gray-200'
                  }`}>
                    {isComplete ? (
                      <CheckCircle className="h-6 w-6 text-white" />
                    ) : (
                      <Icon className={`h-6 w-6 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                    )}
                  </div>
                  <span className={`mt-1.5 text-xs font-semibold ${isActive ? 'text-purple-600' : isComplete ? 'text-gray-500' : 'text-gray-400'}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-16 h-1.5 mx-2 rounded-full mb-5 transition-all duration-300 ${i < step ? 'bg-gradient-to-r from-purple-400 to-pink-400' : 'bg-gray-200'}`} />
                )}
              </div>
            )
          })}
        </div>

        {/* Step content */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

          {/* STEP 0: Welcome */}
          {step === 0 && (
            <div>
              <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 px-8 py-10 text-center">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <div className="absolute inset-0 bg-white/30 rounded-full blur-xl" />
                  <div className="relative w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                    <Sparkles className="h-12 w-12 text-white" />
                  </div>
                </div>
                <h2 className="text-3xl font-extrabold text-white mb-2">
                  Welcome, Organiser! 🎉
                </h2>
                <p className="text-white/90 text-lg">
                  Your organiser role has been activated
                </p>
              </div>
              <div className="px-8 py-8">
                <p className="text-gray-700 text-lg leading-relaxed mb-6">
                  Congratulations! You now have full organiser access on OutMeets.
                  Let's set up your first group and event so you can start building
                  your outdoor community.
                </p>
                <div className="space-y-3 mb-8">
                  {[
                    { step: '1', text: 'Create your group (e.g., "Peak District Hikers")' },
                    { step: '2', text: 'Create your first event for the group' },
                    { step: '3', text: 'Share the group link and invite members!' },
                  ].map(({ step: s, text }) => (
                    <div key={s} className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {s}
                      </div>
                      <span className="text-gray-700">{text}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg rounded-xl hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  Get Started <ArrowRight className="h-5 w-5" />
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full mt-3 py-3 px-6 text-gray-500 font-medium rounded-xl hover:bg-gray-50 transition-all"
                >
                  Skip for now
                </button>
              </div>
            </div>
          )}

          {/* STEP 1: Create Group */}
          {step === 1 && (
            <div>
              <div className="bg-gradient-to-r from-pink-500 to-orange-500 px-8 py-8 text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-extrabold text-white">Create Your Group</h2>
                <p className="text-white/90 mt-1">A home for your outdoor community</p>
              </div>
              <div className="px-8 py-8 space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Group Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={groupForm.name}
                    onChange={(e) => setGroupForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all text-lg"
                    placeholder="e.g. Peak District Hikers"
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                  <textarea
                    value={groupForm.description}
                    onChange={(e) => setGroupForm(p => ({ ...p, description: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all resize-none"
                    placeholder="Tell people what your group is about..."
                    rows={3}
                    maxLength={500}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Location</label>
                  <GooglePlacesAutocomplete
                    value={groupForm.location}
                    onChange={(val) => setGroupForm(p => ({ ...p, location: val }))}
                    onPlaceSelect={(loc) => setGroupForm(p => ({ ...p, location: loc.address }))}
                    placeholder="e.g. Peak District, UK"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Cover Photo</label>
                  <ImageUpload
                    value={groupForm.imageUrl}
                    onChange={(url) => setGroupForm(p => ({ ...p, imageUrl: url }))}
                    folder="group-banner"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={groupForm.isPublic}
                    onChange={(e) => setGroupForm(p => ({ ...p, isPublic: e.target.checked }))}
                    className="w-5 h-5 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                  />
                  <label htmlFor="isPublic" className="text-sm font-medium text-gray-700">
                    Public group (anyone can find and request to join)
                  </label>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setStep(0)}
                    className="flex-1 py-3 px-6 border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                  <button
                    onClick={handleGroupSubmit}
                    disabled={createGroupMutation.isPending || !groupForm.name.trim()}
                    className="flex-2 flex-grow py-3 px-6 bg-gradient-to-r from-pink-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-xl hover:shadow-pink-500/30 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                  >
                    {createGroupMutation.isPending ? (
                      <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> Creating...</>
                    ) : (
                      <>Create Group <ArrowRight className="h-4 w-4" /></>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Create First Event */}
          {step === 2 && (
            <div>
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-8 text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-extrabold text-white">Create Your First Event</h2>
                {createdGroup && (
                  <p className="text-white/90 mt-1">for <strong>{createdGroup.name}</strong></p>
                )}
              </div>
              <div className="px-8 py-8 space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Event Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={eventForm.title}
                    onChange={(e) => setEventForm(p => ({ ...p, title: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-lg"
                    placeholder="e.g. Sunset Hike on Kinder Scout"
                    maxLength={150}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={eventForm.eventDate}
                      onChange={(e) => setEventForm(p => ({ ...p, eventDate: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Start Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={eventForm.startTime}
                      onChange={(e) => setEventForm(p => ({ ...p, startTime: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Hiking Location <span className="text-red-500">*</span>
                  </label>
                  <GooglePlacesAutocomplete
                    value={eventForm.location}
                    onChange={(val) => setEventForm(p => ({ ...p, location: val, latitude: null, longitude: null }))}
                    onPlaceSelect={(loc) => setEventForm(p => ({
                      ...p,
                      location: loc.address,
                      latitude: loc.lat,
                      longitude: loc.lng,
                    }))}
                    placeholder="Search for a trailhead or meeting point"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                  <textarea
                    value={eventForm.description}
                    onChange={(e) => setEventForm(p => ({ ...p, description: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"
                    placeholder="Tell people what to expect on this hike..."
                    rows={3}
                    maxLength={2000}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 px-6 border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                  <button
                    onClick={handleEventSubmit}
                    disabled={createEventMutation.isPending || !eventForm.title.trim() || !eventForm.eventDate || !eventForm.startTime || !eventForm.location}
                    className="flex-2 flex-grow py-3 px-6 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-xl hover:shadow-xl hover:shadow-orange-500/30 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                  >
                    {createEventMutation.isPending ? (
                      <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> Creating...</>
                    ) : (
                      <>Create Event <ArrowRight className="h-4 w-4" /></>
                    )}
                  </button>
                </div>

                <button
                  onClick={() => setStep(3)}
                  className="w-full py-2 text-gray-400 text-sm hover:text-gray-600 transition-colors"
                >
                  Skip — I'll create an event later
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Done */}
          {step === 3 && (
            <div>
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-8 py-10 text-center">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <div className="absolute inset-0 bg-white/30 rounded-full blur-xl animate-pulse" />
                  <div className="relative w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-12 w-12 text-white" />
                  </div>
                </div>
                <h2 className="text-3xl font-extrabold text-white mb-2">You're all set! 🚀</h2>
                <p className="text-white/90 text-lg">Welcome to the OutMeets organiser community</p>
              </div>
              <div className="px-8 py-8 text-center">
                <p className="text-gray-700 text-lg mb-8">
                  Your group is live and your first event has been created.
                  Share your group link to start growing your outdoor community!
                </p>
                <div className="space-y-3">
                  {createdGroup && (
                    <button
                      onClick={() => navigate(`/groups/${createdGroup.id}`)}
                      className="w-full py-4 px-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-lg rounded-xl hover:shadow-xl hover:shadow-green-500/30 transition-all duration-200 transform hover:scale-105"
                    >
                      View My Group
                    </button>
                  )}
                  <button
                    onClick={() => navigate('/create-event')}
                    className="w-full py-3 px-6 border-2 border-purple-200 text-purple-600 font-bold rounded-xl hover:bg-purple-50 transition-all"
                  >
                    Create Another Event
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="w-full py-3 px-6 text-gray-500 font-medium rounded-xl hover:bg-gray-50 transition-all"
                  >
                    Go to Homepage
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
