// ============================================================
// IMPORTS
// ============================================================
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { MapPin, Clock, Users, ArrowRight, ArrowLeft, Check, Edit2, Mountain, Compass, Activity, TrendingUp, DollarSign, Info, Upload, UserPlus } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { activityTypesAPI, eventsAPI } from '../lib/api'
import toast from 'react-hot-toast'
import GooglePlacesAutocomplete from '../components/GooglePlacesAutocomplete'
import TagInput from '../components/TagInput'
import MemberAutocomplete from '../components/MemberAutocomplete'
import ImageUpload from '../components/ImageUpload'

// ============================================================
// CONSTANTS
// ============================================================

// Step navigation configuration for multi-step edit form
const STEPS = {
  BASICS: 0,      // Event title, date, time, description
  LOCATION: 1,    // Google Places location with coordinates
  DETAILS: 2,     // Difficulty, stats, requirements, pricing
  REVIEW: 3       // Final review before updating
}

// Step titles displayed in progress bar
const STEP_TITLES = {
  [STEPS.BASICS]: 'Update the basics',
  [STEPS.LOCATION]: 'Update location',
  [STEPS.DETAILS]: 'Update hike details',
  [STEPS.REVIEW]: 'Review your changes'
}

// Difficulty level options with visual indicators
const DIFFICULTY_OPTIONS = [
  { value: 'BEGINNER', label: 'Beginner', description: 'Easy trails, minimal elevation', icon: '🟢' },
  { value: 'INTERMEDIATE', label: 'Intermediate', description: 'Moderate trails, some elevation', icon: '🟡' },
  { value: 'ADVANCED', label: 'Advanced', description: 'Challenging trails, steep sections', icon: '🟠' },
  { value: 'EXPERT', label: 'Expert', description: 'Very challenging, technical terrain', icon: '🔴' }
]

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function EditEventPage() {
  // ============================================================
  // HOOKS & ROUTING
  // ============================================================
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { id } = useParams()  // Event ID from URL
  const { register, handleSubmit, watch, formState: { errors }, setValue } = useForm()
  
  // ============================================================
  // LOCAL STATE
  // ============================================================
  const [currentStep, setCurrentStep] = useState(STEPS.BASICS)        // Current step in multi-step form
  const [formData, setFormData] = useState({})                        // Accumulated form data across steps
  const [selectedRequirements, setSelectedRequirements] = useState([])  // Custom gear requirements tags
  
  const watchedValues = watch()  // Watch all form field values for real-time updates
  
  // ============================================================
  // DATA FETCHING
  // ============================================================
  
  // Fetch the existing event data to populate form
  const { data: eventData, isLoading: eventLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsAPI.getEventById(id),
  })
  
  const event = eventData?.data
  
  // Fetch activity types (currently only Hiking is active)
  const { data: activitiesData, isLoading: activitiesLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: () => activityTypesAPI.getAll(),
  })
  
  const activities = activitiesData?.data || []
  
  // ============================================================
  // EFFECTS
  // ============================================================
  
  // Pre-fill form with existing event data when loaded
  useEffect(() => {
    if (event) {
      // Extract date and time from eventDate
      const startDate = new Date(event.eventDate)
      const startDateStr = startDate.toISOString().split('T')[0]
      const startTimeStr = startDate.toTimeString().slice(0, 5)
      
      // Extract end date and time if exists
      let endDateStr = ''
      let endTimeStr = ''
      if (event.endDate) {
        const endDate = new Date(event.endDate)
        endDateStr = endDate.toISOString().split('T')[0]
        endTimeStr = endDate.toTimeString().slice(0, 5)
      }
      
      const initialData = {
        title: event.title,
        description: event.description,
        eventDate: startDateStr,
        startTime: startTimeStr,
        endDate: endDateStr,
        endTime: endTimeStr,
        location: event.location,
        latitude: event.latitude,
        longitude: event.longitude,
        maxParticipants: event.maxParticipants,
        price: event.price,
        difficultyLevel: event.difficultyLevel,
        distanceKm: event.distanceKm,
        elevationGainM: event.elevationGainM,
        imageUrl: event.imageUrl
      }
      
      setFormData(initialData)
      setSelectedRequirements(event.requirements || [])
      
      // Set form values
      Object.keys(initialData).forEach(key => {
        setValue(key, initialData[key])
      })
    }
  }, [event, setValue])
  
  // Load saved form data into form fields when navigating between steps
  useEffect(() => {
    Object.keys(formData).forEach(key => {
      setValue(key, formData[key])
    })
  }, [currentStep, formData, setValue])

  // ============================================================
  // HELPER FUNCTIONS
  // ============================================================
  
  // Update accumulated form data with new step data
  const updateFormData = (stepData) => {
    setFormData(prev => ({ ...prev, ...stepData }))
  }

  // Navigate to next step in form
  const nextStep = () => {
    if (currentStep < STEPS.REVIEW) {
      setCurrentStep(prev => prev + 1)
    }
  }

  // Navigate to previous step in form
  const prevStep = () => {
    if (currentStep > STEPS.BASICS) {
      setCurrentStep(prev => prev - 1)
    }
  }
  
  // Jump directly to a specific step (used in review mode)
  const goToStep = (step) => {
    setCurrentStep(step)
  }

  // Toggle gear requirement selection
  const toggleRequirement = (req) => {
    setSelectedRequirements(prev => 
      prev.includes(req) 
        ? prev.filter(r => r !== req)
        : [...prev, req]
    )
  }

  // ============================================================
  // EVENT HANDLERS
  // ============================================================
  
  // Handle submission of individual step (save data and proceed to next)
  const onStepSubmit = (data) => {
    updateFormData(data)
    nextStep()
  }

  // Handle final form submission (update event)
  const onFinalSubmit = async (data) => {
    if (!event?.groupId) {
      toast.error('Event group information is missing')
      return
    }
    
    const payload = {
      groupId: Number(event.groupId),
      title: data.title,
      description: data.description,
      activityTypeId: 1, // Default to first activity type (Hiking)
      eventDate: data.eventDate ? new Date(data.eventDate + 'T' + (data.startTime || '00:00')).toISOString() : null,
      endDate: data.endDate && data.endTime 
        ? new Date(data.endDate + 'T' + data.endTime).toISOString() 
        : (data.eventDate && data.endTime ? new Date(data.eventDate + 'T' + data.endTime).toISOString() : null),
      location: data.location,
      latitude: data.latitude ? Number(data.latitude) : null,
      longitude: data.longitude ? Number(data.longitude) : null,
      maxParticipants: data.maxParticipants ? Number(data.maxParticipants) : null,
      minParticipants: 1,
      price: data.price ? Number(data.price) : 0,
      difficultyLevel: data.difficultyLevel || null,
      distanceKm: data.distanceKm ? Number(data.distanceKm) : null,
      elevationGainM: data.elevationGainM ? Number(data.elevationGainM) : null,
      estimatedDurationHours: null,
      imageUrl: data.imageUrl || null,
      additionalImages: [],
      requirements: selectedRequirements,
      includedItems: [],
      cancellationPolicy: null
    }

    try {
      await eventsAPI.updateEvent(id, payload)
      queryClient.invalidateQueries(['event', id])
      queryClient.invalidateQueries(['groupEvents', event.groupId.toString()])
      queryClient.invalidateQueries(['events'])
      toast.success('✅ Event updated successfully!')
      navigate(`/events/${id}`)
    } catch (error) {
      console.error('Error updating event:', error)
      toast.error('Failed to update event. Please try again.')
    }
  }

  // ============================================================
  // RENDER FUNCTIONS
  // ============================================================
  
  // PROGRESS BAR - Visual indicator of current step
  const renderProgressBar = () => {
    const progress = ((currentStep + 1) / Object.keys(STEPS).length) * 100
    
    return (
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          {Object.keys(STEPS).map((_, index) => (
            <div key={index} className="flex items-center flex-1">
              <div className={`
                flex items-center justify-center w-12 h-12 rounded-full font-bold text-sm
                ${index <= currentStep 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-110' 
                  : 'bg-gray-200 text-gray-500'}
                transition-all duration-500 transform
              `}>
                {index < currentStep ? <Check className="h-6 w-6" /> : index + 1}
              </div>
              {index < Object.keys(STEPS).length - 1 && (
                <div className={`
                  flex-1 h-2 mx-3 rounded-full
                  ${index < currentStep ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gray-200'}
                  transition-all duration-500
                `} />
              )}
            </div>
          ))}
        </div>
        <p className="text-center text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
          Step {currentStep + 1} of {Object.keys(STEPS).length}: {STEP_TITLES[currentStep]}
        </p>
      </div>
    )
  }

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (eventLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl mb-4 shadow-2xl animate-pulse">
            <Edit2 className="h-10 w-10 text-white" />
          </div>
          <div className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Loading event...</div>
        </div>
      </div>
    )
  }

  // ============================================================
  // ERROR STATE - Event not found
  // ============================================================
  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-4">Event not found</h2>
          <button onClick={() => navigate('/')} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg transition-all">Go back home</button>
        </div>
      </div>
    )
  }

  // ============================================================
  // MAIN COMPONENT RETURN
  // ============================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <button
            onClick={() => navigate(`/events/${id}`)}
            className="flex items-center text-gray-600 hover:text-purple-600 mb-6 font-semibold transition-colors group"
          >
            <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Event
          </button>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 mb-4 shadow-2xl shadow-purple-500/30 hover:scale-105 transition-transform duration-300">
              <Edit2 className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-5xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent mb-3 animate-fade-in">
              Edit Event
            </h1>
            <p className="text-gray-600 text-xl font-medium">Update your hiking adventure details</p>
          </div>
        </div>

        {/* Progress Bar */}
        {renderProgressBar()}

        {/* Form */}
        <div className="bg-white/90 backdrop-blur-lg rounded-3xl p-10 shadow-2xl shadow-purple-500/10 hover:shadow-purple-500/20 transition-shadow duration-300 border-2 border-white/50">
          <form onSubmit={handleSubmit(currentStep === STEPS.REVIEW ? onFinalSubmit : onStepSubmit)}>
            
            {/* ========== STEP 1: BASICS ========== */}
            {currentStep === STEPS.BASICS && (
              <div className="space-y-8">
                <div className="text-center mb-10 animate-fade-in">
                  <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-3xl mb-6 shadow-2xl shadow-purple-500/30 hover:scale-105 transition-transform duration-300">
                    <Mountain className="h-12 w-12 text-white" />
                  </div>
                  <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 mb-3">
                    Update the basics
                  </h2>
                  <p className="text-gray-600 text-lg">Edit your event title, description, and dates</p>
                </div>
                
                <div>
                  <label className="block text-base font-bold text-gray-900 mb-3">Event Title <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    {...register('title', { required: 'Title is required' })}
                    className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium transition-all"
                    placeholder="e.g., Morning Hike at Box Hill"
                  />
                  {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
                </div>

                <div>
                  <label className="block text-base font-bold text-gray-900 mb-3">Description <span className="text-red-500">*</span></label>
                  <textarea
                    {...register('description', { required: 'Description is required' })}
                    rows={6}
                    className="w-full px-4 py-4 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium transition-all resize-none"
                    placeholder="Describe your hike, meeting point, what to expect..."
                  />
                  {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Start Date <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      {...register('eventDate', { required: 'Start date is required' })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all"
                    />
                    {errors.eventDate && <p className="text-red-500 text-sm mt-1">{errors.eventDate.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">End Date</label>
                    <input
                      type="date"
                      {...register('endDate')}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all"
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave empty for single-day events</p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Start Time <span className="text-red-500">*</span></label>
                    <input
                      type="time"
                      {...register('startTime', { required: 'Start time is required' })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all"
                    />
                    {errors.startTime && <p className="text-red-500 text-sm mt-1">{errors.startTime.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">End Time</label>
                    <input
                      type="time"
                      {...register('endTime')}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all"
                    />
                    <p className="text-xs text-gray-500 mt-1">Approximate finish time (optional)</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Upload className="h-5 w-5 text-purple-600" />
                    Featured Photo
                  </label>
                  <ImageUpload
                    value={watchedValues.imageUrl}
                    onChange={(url) => {
                      setValue('imageUrl', url)
                      updateFormData({ imageUrl: url })
                    }}
                    folder="event-photo"
                  />
                </div>
              </div>
            )}

            {/* ========== STEP 2: LOCATION ========== */}
            {currentStep === STEPS.LOCATION && (
              <div className="space-y-8">
                <div className="text-center mb-10 animate-fade-in">
                  <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-pink-500 via-orange-500 to-amber-400 rounded-3xl mb-6 shadow-2xl shadow-pink-500/30 hover:scale-105 transition-transform duration-300">
                    <MapPin className="h-12 w-12 text-white" />
                  </div>
                  <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-orange-500 to-amber-500 mb-3">
                    Update location
                  </h2>
                  <p className="text-gray-600 text-lg">Where will this hike take place?</p>
                </div>
                
                <div>
                  <label className="block text-base font-bold text-gray-900 mb-3">Hiking location <span className="text-red-500">*</span></label>
                  <GooglePlacesAutocomplete
                    onPlaceSelect={(locationData) => {
                      setValue('location', locationData.address, { shouldValidate: true })
                      setValue('latitude', locationData.latitude)
                      setValue('longitude', locationData.longitude)
                      updateFormData({
                        location: locationData.address,
                        latitude: locationData.latitude,
                        longitude: locationData.longitude
                      })
                    }}
                    error={errors.location?.message}
                  />
                  <input type="hidden" {...register('location', { required: 'Location is required' })} />
                  <input type="hidden" {...register('latitude')} />
                  <input type="hidden" {...register('longitude')} />
                </div>
              </div>
            )}

            {/* ========== STEP 3: DETAILS ========== */}
            {currentStep === STEPS.DETAILS && (
              <div className="space-y-8">
                <div className="text-center mb-10 animate-fade-in">
                  <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-400 rounded-3xl mb-6 shadow-2xl shadow-green-500/30 hover:scale-105 transition-transform duration-300">
                    <Compass className="h-12 w-12 text-white" />
                  </div>
                  <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 mb-3">
                    Update hike details
                  </h2>
                  <p className="text-gray-600 text-lg">Edit difficulty, trail stats, and requirements</p>
              </div>
              
              {/* ========== DIFFICULTY LEVEL ========== */}
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-6 border-2 border-orange-200">
                  <label className="block text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-orange-600" />
                    Difficulty Level
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {DIFFICULTY_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className={`
                          relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all
                          ${watchedValues.difficultyLevel === option.value
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'}
                        `}
                      >
                        <input
                          type="radio"
                          {...register('difficultyLevel')}
                          value={option.value}
                          className="sr-only"
                        />
                        <span className="text-2xl mr-3">{option.icon}</span>
                        <div>
                          <div className="font-bold text-gray-900">{option.label}</div>
                          <div className="text-xs text-gray-600">{option.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
              </div>

              {/* ========== TRAIL STATISTICS (Optional) ========== */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200">
                <h3 className="font-bold text-gray-900 text-lg mb-5 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Trail Statistics (Optional)
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Distance (km)</label>
                    <input
                      type="number"
                      step="0.1"
                      {...register('distanceKm')}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all"
                      placeholder="15.5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Elevation Gain (m)</label>
                    <input
                      type="number"
                      {...register('elevationGainM')}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all"
                      placeholder="600"
                    />
                  </div>
                </div>
              </div>

              {/* ========== MAX PARTICIPANTS ========== */}
              <div>
                <label className="block text-base font-bold text-gray-900 mb-3">Max Participants</label>
                <input
                  type="number"
                  {...register('maxParticipants')}
                  className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all text-lg"
                  placeholder="20"
                />
                <p className="text-sm text-gray-500 mt-2 ml-1">💡 Leave blank for unlimited participants</p>
              </div>

              {/* ========== REQUIRED GEAR (Custom Tags) ========== */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
                <h3 className="font-bold text-gray-900 text-lg mb-3 flex items-center gap-2">
                  <Mountain className="h-5 w-5 text-purple-600" />
                  Required gear
                </h3>
                <p className="text-sm text-gray-600 mb-4">Add custom gear requirements for your hike</p>
                <TagInput
                  tags={selectedRequirements}
                  onChange={setSelectedRequirements}
                  placeholder="Type gear item and press Enter (e.g., Hiking boots, Water bottle...)"
                />
              </div>

              {/* ========== COST PER PERSON ========== */}
              <div>
                <label className="block text-base font-bold text-gray-900 mb-3">Cost per Person (£)</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('price')}
                  className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all text-lg"
                  placeholder="0.00"
                />
                <p className="text-sm text-gray-500 mt-2 ml-1">💡 Leave as 0 if the hike is free</p>
              </div>

              {/* ========== HOSTED BY ========== */}
              <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Hosted by <span className="text-red-500">*</span></label>
                  <MemberAutocomplete
                    groupId={event?.groupId}
                    value={watchedValues.hostName}
                    onChange={(value) => setValue('hostName', value)}
                    error={errors.hostName?.message}
                  />
                  <input type="hidden" {...register('hostName', { required: 'Host name is required' })} />
                  {errors.hostName && <p className="text-red-500 text-sm mt-2 flex items-center gap-1"><span>⚠️</span>{errors.hostName.message}</p>}
                  <p className="text-sm text-gray-500 mt-2">Select from group members or type any name</p>
              </div>
            </div>
            )}

            {/* ========== STEP 4: REVIEW ========== */}
            {currentStep === STEPS.REVIEW && (
              <div className="space-y-6">
                <div className="text-center mb-10 animate-fade-in">
                  <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-3xl mb-6 shadow-2xl shadow-emerald-500/30 hover:scale-105 transition-transform duration-300">
                    <Check className="h-12 w-12 text-white" />
                  </div>
                  <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 mb-3">
                    Review your changes
                  </h2>
                  <p className="text-gray-600 text-lg max-w-2xl mx-auto">Everything look good? You can edit any section before updating</p>
                </div>

                <div className="space-y-4">
                {/* ========== REVIEW: BASICS SECTION ========== */}
                <div className="bg-white rounded-2xl p-6 border-2 border-purple-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-bold text-gray-900 text-xl flex items-center gap-2">
                        <Mountain className="h-6 w-6 text-purple-600" />
                        {formData.title || 'Untitled Event'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => goToStep(STEPS.BASICS)}
                        className="py-2 px-4 bg-purple-100 text-purple-600 hover:bg-purple-200 rounded-lg font-semibold flex items-center gap-1 text-sm transition-all"
                      >
                        <Edit2 className="h-4 w-4" /> Edit
                      </button>
                    </div>
                    <div className="space-y-2 text-gray-700">
                      <p className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="font-semibold">Start:</span> {formData.eventDate} at {formData.startTime}
                      </p>
                      {formData.endDate ? (
                        <p className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="font-semibold">End:</span> {formData.endDate} {formData.endTime ? `at ${formData.endTime}` : ''}
                        </p>
                      ) : formData.endTime ? (
                        <p className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="font-semibold">End Time:</span> {formData.endTime}
                        </p>
                      ) : null}
                      {formData.description && (
                        <p className="text-gray-600 mt-3 bg-gray-50 p-3 rounded-lg">{formData.description}</p>
                      )}
                      {formData.imageUrl && (
                        <div className="mt-3 bg-blue-50 p-3 rounded-lg">
                          <p className="font-semibold text-sm mb-2 flex items-center gap-2">
                            <Upload className="h-4 w-4 text-blue-600" />
                            Featured Photo:
                          </p>
                          <img src={formData.imageUrl} alt="Event preview" className="w-full h-40 object-cover rounded-lg" />
                        </div>
                      )}
                    </div>
                  </div>

                {/* ========== REVIEW: LOCATION SECTION ========== */}
                <div className="bg-white rounded-2xl p-6 border-2 border-pink-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                        <MapPin className="h-6 w-6 text-pink-600" />
                        Location
                      </h3>
                      <button
                        type="button"
                        onClick={() => goToStep(STEPS.LOCATION)}
                        className="py-2 px-4 bg-pink-100 text-pink-600 hover:bg-pink-200 rounded-lg font-semibold flex items-center gap-1 text-sm transition-all"
                      >
                        <Edit2 className="h-4 w-4" /> Edit
                      </button>
                    </div>
                    <p className="text-gray-700 font-medium">{formData.location || 'Not set'}</p>
                    {formData.latitude && formData.longitude && (
                      <p className="text-sm text-gray-500 mt-2">
                        📍 {formData.latitude?.toFixed(6)}, {formData.longitude?.toFixed(6)}
                      </p>
                    )}
                  </div>

                {/* ========== REVIEW: HIKE DETAILS SECTION ========== */}
                <div className="bg-white rounded-2xl p-6 border-2 border-green-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                        <Compass className="h-6 w-6 text-green-600" />
                        Hike details
                      </h3>
                      <button
                        type="button"
                        onClick={() => goToStep(STEPS.DETAILS)}
                        className="py-2 px-4 bg-green-100 text-green-600 hover:bg-green-200 rounded-lg font-semibold flex items-center gap-1 text-sm transition-all"
                      >
                        <Edit2 className="h-4 w-4" /> Edit
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {formData.difficultyLevel && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <span className="font-semibold">Difficulty:</span> {formData.difficultyLevel}
                        </div>
                      )}
                      {formData.distanceKm && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <span className="font-semibold">Distance:</span> {formData.distanceKm} km
                        </div>
                      )}
                      {formData.elevationGainM && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <span className="font-semibold">Elevation:</span> {formData.elevationGainM} m
                        </div>
                      )}
                      {formData.maxParticipants && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <span className="font-semibold">Max hikers:</span> {formData.maxParticipants}
                        </div>
                      )}
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <span className="font-semibold">Cost:</span> £{formData.price || 0}
                      </div>
                    </div>
                    {selectedRequirements.length > 0 && (
                      <div className="mt-4 bg-purple-50 p-3 rounded-lg">
                        <p className="font-semibold text-sm mb-2">Required gear:</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedRequirements.map(req => (
                            <span key={req} className="px-2 py-1 bg-white rounded-md text-xs font-medium text-gray-700 border border-purple-200">
                              {req}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {formData.hostName && (
                      <div className="mt-4 bg-indigo-50 p-3 rounded-lg">
                        <p className="font-semibold text-sm mb-1 flex items-center gap-2">
                          <UserPlus className="h-4 w-4 text-indigo-600" />
                          Host/Guide:
                        </p>
                        <p className="text-gray-700 ml-6">{formData.hostName}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t-2 border-gray-100">
              {currentStep > STEPS.BASICS && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex items-center gap-2 px-8 py-4 rounded-xl bg-gray-100 text-gray-700 font-bold text-lg hover:bg-gray-200 transition-all"
                >
                  <ArrowLeft className="h-5 w-5" />
                  Back
                </button>
              )}
              
              <button
                type="submit"
                className={`ml-auto flex items-center gap-2 px-10 py-4 rounded-xl text-white font-bold text-lg hover:shadow-xl transition-all transform hover:scale-105 ${
                  currentStep === STEPS.REVIEW 
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-green-500/50' 
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-purple-500/50'
                }`}
              >
                {currentStep === STEPS.REVIEW ? (
                  <>
                    <Check className="h-6 w-6" />
                    Update Event
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
