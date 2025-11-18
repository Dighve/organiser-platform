// ============================================================
// IMPORTS
// ============================================================
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { MapPin, Clock, Users, ArrowRight, ArrowLeft, Check, Edit2, Mountain, Compass, Activity, TrendingUp, DollarSign, Info, Upload, UserPlus, Calendar, Type, FileText, Image, Timer } from 'lucide-react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { activityTypesAPI, eventsAPI } from '../lib/api'
import toast from 'react-hot-toast'
import GooglePlacesAutocomplete from '../components/GooglePlacesAutocomplete'
import TagInput from '../components/TagInput'
import MemberAutocomplete from '../components/MemberAutocomplete'
import ImageUpload from '../components/ImageUpload'

// ============================================================
// CONSTANTS
// ============================================================

// Step navigation configuration for multi-step form
const STEPS = {
  BASICS: 0,      // Event title, date, time, description
  LOCATION: 1,    // Google Places location with coordinates
  DETAILS: 2,     // Difficulty, stats, requirements, pricing
  REVIEW: 3       // Final review before publishing
}

// Step titles displayed in progress bar
const STEP_TITLES = {
  [STEPS.BASICS]: 'Start with the basics',
  [STEPS.LOCATION]: 'Where will you hike?',
  [STEPS.DETAILS]: 'Add hike details',
  [STEPS.REVIEW]: 'Review your event'
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
export default function CreateEventPage() {
  // ============================================================
  // HOOKS & ROUTING
  // ============================================================
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const groupId = searchParams.get('groupId')
  const { register, handleSubmit, watch, formState: { errors }, setValue } = useForm()
  
  // ============================================================
  // LOCAL STATE
  // ============================================================
  const [currentStep, setCurrentStep] = useState(STEPS.BASICS)        // Current step in multi-step form
  const [formData, setFormData] = useState({})                        // Accumulated form data across steps
  const [selectedRequirements, setSelectedRequirements] = useState([])  // Custom gear requirements tags
  const [isSubmitting, setIsSubmitting] = useState(false)             // Prevent double form submissions
  
  const watchedValues = watch()  // Watch all form field values for real-time validation
  
  // ============================================================
  // EFFECTS
  // ============================================================
  
  // Redirect if no groupId is provided (events must belong to a group)
  useEffect(() => {
    if (!groupId) {
      toast.error('Events must be created for a specific group')
      navigate('/')
    }
  }, [groupId, navigate])
  
  // Load saved form data into form fields when navigating between steps
  useEffect(() => {
    Object.keys(formData).forEach(key => {
      setValue(key, formData[key])
    })
  }, [currentStep, formData, setValue])
  
  // ============================================================
  // DATA FETCHING
  // ============================================================
  
  // Fetch activity types (currently only Hiking is active)
  const { data: activitiesData, isLoading: activitiesLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: () => activityTypesAPI.getAll(),
  })
  
  const activities = activitiesData?.data || []

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

  // Handle final form submission (create and publish event)
  const onFinalSubmit = async (data) => {
    if (!groupId) {
      toast.error('Group ID is required to create an event')
      return
    }
    
    // Validate location has coordinates
    if (!data.latitude || !data.longitude) {
      toast.error('⚠️ Please select a valid location from Google Maps with coordinates')
      setCurrentStep(STEPS.LOCATION)
      return
    }
    
    // Prevent double submission
    if (isSubmitting) {
      return
    }
    
    setIsSubmitting(true)
    
    const payload = {
      groupId: Number(groupId),
      title: data.title,
      description: data.description,
      activityTypeId: 1, // Default to first activity type (Hiking)
      eventDate: data.eventDate ? new Date(data.eventDate + 'T' + (data.startTime || '00:00')).toISOString() : null,
      endDate: data.eventDate && data.endTime ? new Date(data.eventDate + 'T' + data.endTime).toISOString() : null,
      location: data.location,
      latitude: data.latitude ? Number(data.latitude) : null,
      longitude: data.longitude ? Number(data.longitude) : null,
      maxParticipants: data.maxParticipants ? Number(data.maxParticipants) : null,
      minParticipants: data.minParticipants ? Number(data.minParticipants) : 1,
      cost: data.price ? Number(data.price) : 0,
      difficultyLevel: data.difficultyLevel || null,
      distanceKm: data.distanceKm ? Number(data.distanceKm) : null,
      elevationGainM: data.elevationGainM ? Number(data.elevationGainM) : null,
      estimatedDurationHours: data.estimatedDurationHours ? Number(data.estimatedDurationHours) : null,
      imageUrl: data.imageUrl || null,
      additionalImages: [],
      requirements: selectedRequirements,
      includedItems: data.includedItems ? data.includedItems.split(',').map(s => s.trim()).filter(Boolean) : [],
      cancellationPolicy: data.cancellationPolicy || null
    }

    try {
      // Create the event
      const response = await eventsAPI.createEvent(payload)
      const eventId = response.data.id
      
      // Automatically publish the event
      await eventsAPI.publishEvent(eventId)
      
      queryClient.invalidateQueries(['groupEvents', groupId])
      queryClient.invalidateQueries(['events'])
      toast.success('🎉 Hike event created and published successfully!')
      navigate(`/groups/${groupId}`)
    } catch (error) {
      console.error('Error creating event:', error)
      toast.error('Failed to create event. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ============================================================
  // RENDER FUNCTIONS - Multi-Step Form UI
  // ============================================================
  
  // PROGRESS BAR - Visual indicator of current step
  const renderProgressBar = () => {
    const progress = ((currentStep + 1) / Object.keys(STEPS).length) * 100
    
    return (
      <div className="mb-10 px-8">
        <div className="flex items-center justify-center mb-4">
          <div className="flex items-center ml-16" style={{ maxWidth: '600px', width: '100%' }}>
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
        </div>
        <p className="text-center text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
          Step {currentStep + 1} of {Object.keys(STEPS).length}: {STEP_TITLES[currentStep]}
        </p>
      </div>
    )
  }

  // STEP 1: BASICS - Event title, date, time, description, and featured photo
  const renderBasicsStep = () => (
    <form onSubmit={handleSubmit(onStepSubmit)} className="space-y-8">
      <div className="text-center mb-10 animate-fade-in">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-3xl mb-6 shadow-2xl shadow-purple-500/30 hover:scale-105 transition-transform duration-300">
          <Mountain className="h-12 w-12 text-white" />
        </div>
        <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 mb-3">
          What's your hike about?
        </h2>
        <p className="text-gray-600 text-lg">Give your hiking event a clear, descriptive name and date</p>
      </div>

      <div>
        <label htmlFor="title" className="flex items-center gap-2 text-base font-bold text-gray-900 mb-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
            <Type className="h-4 w-4 text-white" />
          </div>
          Event Title <span className="text-red-500">*</span>
        </label>
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
          <input
            {...register('title', { required: 'Event title is required' })}
            type="text"
            className="relative w-full pl-14 pr-4 py-5 text-lg border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 font-medium transition-all shadow-sm hover:shadow-md hover:border-purple-300 bg-white"
            placeholder="e.g., Sunday Morning Hike in Peak District"
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-500">
            <Mountain className="h-6 w-6" />
          </div>
        </div>
        {errors.title && <p className="text-red-500 text-sm mt-2 flex items-center gap-1"><span>⚠️</span>{errors.title.message}</p>}
        <p className="text-sm text-gray-500 mt-2 ml-1">💡 Choose a name that clearly describes your hike</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label htmlFor="eventDate" className="flex items-center gap-2 text-base font-bold text-gray-900 mb-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-orange-500 shadow-lg">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            Event Date <span className="text-red-500">*</span>
          </label>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-orange-500 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            <input 
              {...register('eventDate', { required: 'Event date is required' })} 
              type="date" 
              className="relative w-full pl-14 pr-4 py-5 text-lg border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 font-medium transition-all shadow-sm hover:shadow-md hover:border-pink-300 bg-white" 
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-500">
              <Calendar className="h-6 w-6" />
            </div>
          </div>
          {errors.eventDate && <p className="text-red-500 text-sm mt-2 flex items-center gap-1"><span>⚠️</span>{errors.eventDate.message}</p>}
        </div>
        <div>
          <label htmlFor="startTime" className="flex items-center gap-2 text-base font-bold text-gray-900 mb-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg">
              <Clock className="h-4 w-4 text-white" />
            </div>
            Start Time <span className="text-red-500">*</span>
          </label>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            <input 
              {...register('startTime', { required: 'Start time is required' })} 
              type="time" 
              className="relative w-full pl-14 pr-4 py-5 text-lg border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 font-medium transition-all shadow-sm hover:shadow-md hover:border-orange-300 bg-white" 
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500">
              <Clock className="h-6 w-6" />
            </div>
          </div>
          {errors.startTime && <p className="text-red-500 text-sm mt-2 flex items-center gap-1"><span>⚠️</span>{errors.startTime.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label htmlFor="endDate" className="flex items-center gap-2 text-base font-bold text-gray-900 mb-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            End Date
          </label>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            <input 
              {...register('endDate')} 
              type="date" 
              className="relative w-full pl-14 pr-4 py-5 text-lg border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium transition-all shadow-sm hover:shadow-md hover:border-indigo-300 bg-white" 
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500">
              <Calendar className="h-6 w-6" />
            </div>
          </div>
          {errors.endDate && <p className="text-red-500 text-sm mt-2 flex items-center gap-1"><span>⚠️</span>{errors.endDate.message}</p>}
          <p className="text-sm text-gray-500 mt-2 ml-1">For multi-day hikes (optional)</p>
        </div>
        <div>
          <label htmlFor="endTime" className="flex items-center gap-2 text-base font-bold text-gray-900 mb-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg">
              <Timer className="h-4 w-4 text-white" />
            </div>
            End Time
          </label>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            <input 
              {...register('endTime')} 
              type="time" 
              className="relative w-full pl-14 pr-4 py-5 text-lg border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 font-medium transition-all shadow-sm hover:shadow-md hover:border-blue-300 bg-white" 
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500">
              <Timer className="h-6 w-6" />
            </div>
          </div>
          {errors.endTime && <p className="text-red-500 text-sm mt-2 flex items-center gap-1"><span>⚠️</span>{errors.endTime.message}</p>}
          <p className="text-sm text-gray-500 mt-2 ml-1">Approximate finish time (optional)</p>
        </div>
      </div>

      <div>
        <label htmlFor="imageUrl" className="flex items-center gap-2 text-base font-bold text-gray-900 mb-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg">
            <Image className="h-4 w-4 text-white" />
          </div>
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

      <div>
        <label htmlFor="description" className="flex items-center gap-2 text-base font-bold text-gray-900 mb-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg">
            <FileText className="h-4 w-4 text-white" />
          </div>
          Event Description
        </label>
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
          <textarea 
            {...register('description')} 
            className="relative w-full px-6 py-5 text-base border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-500 font-medium transition-all shadow-sm hover:shadow-md hover:border-cyan-300 bg-white min-h-[140px] resize-none" 
            placeholder="Describe your hike, meeting point, what to expect..."
          />
        </div>
        <p className="text-sm text-gray-500 mt-2 ml-1">💡 Help hikers know what to expect on this adventure</p>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          className="py-4 px-10 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg rounded-xl hover:shadow-xl hover:shadow-purple-500/50 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none flex items-center gap-2"
          disabled={!watchedValues.title || !watchedValues.eventDate || !watchedValues.startTime}
        >
          Continue <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </form>
  )

  // STEP 2: LOCATION - Google Places Autocomplete with coordinates validation
  const renderLocationStep = () => (
    <form onSubmit={handleSubmit(onStepSubmit)} className="space-y-8">
      <div className="text-center mb-10 animate-fade-in">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-pink-500 via-orange-500 to-amber-400 rounded-3xl mb-6 shadow-2xl shadow-pink-500/30 hover:scale-105 transition-transform duration-300">
          <MapPin className="h-12 w-12 text-white" />
        </div>
        <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-orange-500 to-amber-500 mb-3">
          Where will you hike?
        </h2>
        <p className="text-gray-600 text-lg">Search for your hiking location using Google Maps</p>
      </div>

      <div>
        <label htmlFor="location" className="block text-base font-bold text-gray-900 mb-3">
          Hiking location <span className="text-red-500">*</span>
        </label>
        <GooglePlacesAutocomplete
          value={watchedValues.location}
          onChange={(value) => setValue('location', value)}
          onPlaceSelect={(locationData) => {
            setValue('location', locationData.address)
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
      </div>

      {watchedValues.latitude && watchedValues.longitude && (
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <div className="bg-green-500 rounded-full p-2">
              <Check className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-green-800 font-bold text-lg">Location selected</p>
              <p className="text-green-700 mt-1">{watchedValues.location}</p>
              <p className="text-sm text-green-600 mt-2">
                📍 {watchedValues.latitude?.toFixed(6)}, {watchedValues.longitude?.toFixed(6)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Warning if location not properly selected */}
      {watchedValues.location && (!watchedValues.latitude || !watchedValues.longitude) && (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="bg-yellow-500 rounded-full p-2">
              <span className="text-white text-lg">⚠️</span>
            </div>
            <div>
              <p className="text-yellow-800 font-bold">Please select a location from the dropdown</p>
              <p className="text-yellow-700 text-sm mt-1">
                Type and select a suggestion from Google Maps to set the exact coordinates
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <button 
          type="button" 
          onClick={prevStep} 
          className="py-4 px-8 bg-gray-100 text-gray-700 font-bold text-lg rounded-xl hover:bg-gray-200 transition-all flex items-center gap-2"
        >
          <ArrowLeft className="h-5 w-5" /> Back
        </button>
        <button
          type="submit"
          className="py-4 px-10 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg rounded-xl hover:shadow-xl hover:shadow-purple-500/50 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none flex items-center gap-2"
          disabled={!watchedValues.location || !watchedValues.latitude || !watchedValues.longitude}
        >
          Continue <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </form>
  )

  // STEP 3: DETAILS - Difficulty, trail stats, participants, gear, and pricing
  const renderDetailsStep = () => (
    <form onSubmit={handleSubmit(onStepSubmit)} className="space-y-8">
      <div className="text-center mb-10 animate-fade-in">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-400 rounded-3xl mb-6 shadow-2xl shadow-green-500/30 hover:scale-105 transition-transform duration-300">
          <Compass className="h-12 w-12 text-white" />
        </div>
        <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 mb-3">
          Add hike details
        </h2>
        <p className="text-gray-600 text-lg">Help hikers prepare for your adventure</p>
      </div>

      {/* ========== DIFFICULTY LEVEL ========== */}
      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-6 border-2 border-orange-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-orange-600" />
            Difficulty level
          </h3>
          <Link
            to="/hiking-grade-faq"
            target="_blank"
            className="flex items-center gap-1 text-sm font-semibold text-purple-600 hover:text-purple-800 transition-colors"
          >
            <Info className="h-4 w-4" />
            What do these mean?
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {DIFFICULTY_OPTIONS.map(opt => (
            <label key={opt.value} className="relative cursor-pointer">
              <input
                type="radio"
                {...register('difficultyLevel')}
                value={opt.value}
                className="peer sr-only"
              />
              <div className="bg-white border-2 border-gray-300 rounded-xl p-4 hover:border-orange-500 peer-checked:border-orange-500 peer-checked:bg-orange-50 transition-all">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{opt.icon}</span>
                  <span className="font-bold text-gray-900">{opt.label}</span>
                </div>
                <p className="text-sm text-gray-600">{opt.description}</p>
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
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md">
                <Compass className="h-3.5 w-3.5 text-white" />
              </div>
              Distance (km)
            </label>
            <div className="relative group">
              <input 
                {...register('distanceKm')} 
                type="number" 
                step="0.1" 
                min="0" 
                className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 font-medium transition-all bg-white shadow-sm hover:shadow-md hover:border-blue-300" 
                placeholder="12.5" 
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 font-bold text-sm">
                KM
              </div>
            </div>
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 shadow-md">
                <TrendingUp className="h-3.5 w-3.5 text-white" />
              </div>
              Elevation Gain (m)
            </label>
            <div className="relative group">
              <input 
                {...register('elevationGainM')} 
                type="number" 
                min="0" 
                className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium transition-all bg-white shadow-sm hover:shadow-md hover:border-emerald-300" 
                placeholder="500" 
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-sm">
                M
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== MAX PARTICIPANTS ========== */}
      <div>
        <label className="flex items-center gap-2 text-base font-bold text-gray-900 mb-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
            <Users className="h-4 w-4 text-white" />
          </div>
          Max Participants
        </label>
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
          <input 
            {...register('maxParticipants')} 
            type="number" 
            min="1" 
            className="relative w-full pl-14 pr-4 py-5 text-lg border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 font-medium transition-all shadow-sm hover:shadow-md hover:border-purple-300 bg-white" 
            placeholder="20" 
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-500">
            <Users className="h-6 w-6" />
          </div>
        </div>
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

      {/* ========== ADDITIONAL INFO: Cost & Host ========== */}
      <div className="space-y-4">
        <div>
          <label className="flex items-center gap-2 text-base font-bold text-gray-900 mb-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
            Cost per Person (£)
          </label>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            <input 
              {...register('price')} 
              type="number" 
              step="0.01" 
              min="0" 
              className="relative w-full pl-14 pr-4 py-5 text-lg border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 font-medium transition-all shadow-sm hover:shadow-md hover:border-green-300 bg-white" 
              placeholder="0.00" 
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500 font-bold text-xl">
              £
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2 ml-1">💡 Leave as 0 if the hike is free</p>
        </div>

        <div>
          <label htmlFor="hostName" className="block text-base font-bold text-gray-900 mb-3">
            Hosted by <span className="text-red-500">*</span>
          </label>
          <MemberAutocomplete
            groupId={groupId}
            value={watchedValues.hostName}
            onChange={(value) => setValue('hostName', value)}
            error={errors.hostName?.message}
          />
          <input type="hidden" {...register('hostName', { required: 'Host name is required' })} />
          {errors.hostName && <p className="text-red-500 text-sm mt-2 flex items-center gap-1"><span>⚠️</span>{errors.hostName.message}</p>}
          <p className="text-sm text-gray-500 mt-2">Select from group members or type any name</p>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button 
          type="button" 
          onClick={prevStep} 
          className="py-4 px-8 bg-gray-100 text-gray-700 font-bold text-lg rounded-xl hover:bg-gray-200 transition-all flex items-center gap-2"
        >
          <ArrowLeft className="h-5 w-5" /> Back
        </button>
        <button
          type="submit"
          className="py-4 px-10 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg rounded-xl hover:shadow-xl hover:shadow-purple-500/50 transition-all transform hover:scale-105 flex items-center gap-2"
        >
          Continue <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </form>
  )

  // STEP 4: REVIEW - Final review of all entered data before publishing
  const renderReviewStep = () => {
    const difficultyOption = DIFFICULTY_OPTIONS.find(opt => opt.value === formData.difficultyLevel)
    
    return (
      <div className="space-y-6">
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-3xl mb-6 shadow-2xl shadow-emerald-500/30 hover:scale-105 transition-transform duration-300">
            <Check className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 mb-3">
            Review your hike
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">Everything look good? You can edit any section before publishing your adventure!</p>
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
                <span className="font-semibold">Date:</span> {formData.eventDate}
              </p>
              <p className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="font-semibold">Time:</span> {formData.startTime} - {formData.endTime}
              </p>
              {formData.description && (
                <p className="text-gray-600 mt-3 bg-gray-50 p-3 rounded-lg">{formData.description}</p>
              )}
            </div>
          </div>

          {/* ========== REVIEW: LOCATION SECTION ========== */}
          <div className="bg-white rounded-2xl p-6 border-2 border-pink-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <MapPin className="h-6 w-6 text-pink-600" />
                Hiking Location
              </h3>
              <button
                type="button"
                onClick={() => goToStep(STEPS.LOCATION)}
                className="py-2 px-4 bg-pink-100 text-pink-600 hover:bg-pink-200 rounded-lg font-semibold flex items-center gap-1 text-sm transition-all"
              >
                <Edit2 className="h-4 w-4" /> Edit
              </button>
            </div>
            
            {formData.location && formData.latitude && formData.longitude ? (
              <div className="bg-gradient-to-br from-pink-50 to-orange-50 rounded-xl p-4 border-2 border-pink-200">
                <div className="flex items-start gap-3">
                  <div className="bg-pink-500 rounded-full p-2 mt-1">
                    <MapPin className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 font-bold text-lg">{formData.location}</p>
                    <div className="mt-3 bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-pink-200">
                      <p className="text-xs text-gray-600 font-semibold mb-1">GPS Coordinates:</p>
                      <p className="text-sm text-gray-800 font-mono">
                        📍 Lat: {formData.latitude?.toFixed(6)}, Long: {formData.longitude?.toFixed(6)}
                      </p>
                    </div>
                    <p className="text-xs text-green-600 font-semibold mt-2 flex items-center gap-1">
                      <Check className="h-3 w-3" /> Location verified via Google Maps
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <p className="text-red-700 font-semibold flex items-center gap-2">
                  <span>⚠️</span> Location not properly set - Please go back and select from Google Maps
                </p>
              </div>
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
              {difficultyOption && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="font-semibold">Difficulty:</span> {difficultyOption.icon} {difficultyOption.label}
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
            {formData.imageUrl && (
              <div className="mt-4 bg-blue-50 p-3 rounded-lg">
                <p className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Upload className="h-4 w-4 text-blue-600" />
                  Featured Photo:
                </p>
                <img src={formData.imageUrl} alt="Event preview" className="w-full h-40 object-cover rounded-lg" />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between mt-8 pt-4">
          <button 
            type="button" 
            onClick={prevStep} 
            className="py-4 px-8 bg-gray-100 text-gray-700 font-bold text-lg rounded-xl hover:bg-gray-200 transition-all flex items-center gap-2"
          >
            <ArrowLeft className="h-5 w-5" /> Back
          </button>
          <button 
            type="button" 
            className="py-4 px-10 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-lg rounded-xl hover:shadow-2xl hover:shadow-green-500/50 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2" 
            onClick={() => handleSubmit(onFinalSubmit)()}
            disabled={isSubmitting || !formData.latitude || !formData.longitude}
            title={!formData.latitude || !formData.longitude ? 'Please select a valid location from Google Maps' : ''}
          >
            <Check className="h-6 w-6" /> {isSubmitting ? 'Publishing...' : 'Publish Hike Event'}
          </button>
        </div>
      </div>
    )
  }

  // ============================================================
  // STEP ROUTER - Determines which step to render based on currentStep state
  // ============================================================
  const renderCurrentStep = () => {
    switch (currentStep) {
      case STEPS.BASICS:
        return renderBasicsStep()
      case STEPS.LOCATION:
        return renderLocationStep()
      case STEPS.DETAILS:
        return renderDetailsStep()
      case STEPS.REVIEW:
        return renderReviewStep()
      default:
        return renderBasicsStep()
    }
  }

  // ============================================================
  // MAIN COMPONENT RETURN
  // ============================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent mb-4 animate-fade-in">
            🏔️ Create a Hike Event
          </h1>
          <p className="text-gray-600 text-xl font-medium mb-6">Plan an amazing hiking adventure for your group</p>
          
          {/* Coming Soon Activities Banner */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 border-2 border-purple-200 rounded-2xl p-4">
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <span className="text-gray-700 font-semibold text-sm">Currently:</span>
                <span className="px-4 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full text-sm font-bold shadow-lg">🥾 Hiking</span>
                <span className="text-gray-400 text-sm">|</span>
                <span className="text-gray-700 font-semibold text-sm">Coming Soon:</span>
                <span className="px-3 py-1.5 bg-gray-100 text-gray-500 rounded-full text-sm font-semibold">🏃 Running</span>
                <span className="px-3 py-1.5 bg-gray-100 text-gray-500 rounded-full text-sm font-semibold">🧗 Climbing</span>
                <span className="px-3 py-1.5 bg-gray-100 text-gray-500 rounded-full text-sm font-semibold">🏊 Swimming</span>
              </div>
            </div>
          </div>
        </div>
        
        {renderProgressBar()}
        
        <div className="bg-white/90 backdrop-blur-lg rounded-3xl p-10 border-2 border-white/50 shadow-2xl shadow-purple-500/10 hover:shadow-purple-500/20 transition-shadow duration-300">
          {renderCurrentStep()}
        </div>
      </div>
    </div>
  )
}
