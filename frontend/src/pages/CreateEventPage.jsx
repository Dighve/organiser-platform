// ============================================================
// IMPORTS
// ============================================================
import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { MapPin, Clock, Users, ArrowRight, ArrowLeft, Check, Edit2, Mountain, Compass, Activity, TrendingUp, DollarSign, Info, Upload, UserPlus, Calendar, Type, FileText, Image, Timer, Camera, X, ChevronDown, MessageSquare } from 'lucide-react'
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { activityTypesAPI, eventsAPI, membersAPI } from '../lib/api'
import toast from 'react-hot-toast'
import GooglePlacesAutocomplete from '../components/GooglePlacesAutocomplete'
import TagInput from '../components/TagInput'
import MemberAutocomplete from '../components/MemberAutocomplete'
import ImageUpload from '../components/ImageUpload'
import MarkdownEditor from '../components/MarkdownEditor'
import { useAuthStore } from '../store/authStore'
import { useFeatureFlags } from '../contexts/FeatureFlagContext'
import ReactMarkdown from 'react-markdown'

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

// ============================================================
// HELPER FUNCTIONS - Date/Time Defaults
// ============================================================

/**
 * Get smart default date and time for new events
 * Similar to Meetup.com behavior:
 * - Default date: Today (or tomorrow if late at night)
 * - Default time: 2-3 hours from now, rounded to next hour
 * - Example: Current time 16:52 → Default 19:00
 * - Example: Current time 23:30 → Default tomorrow at 10:00
 */
const getDefaultDateTime = () => {
  const now = new Date()
  
  // Default time: 2-3 hours from now, rounded up to next hour
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  
  // Add 2 hours and round up to next hour if there are any minutes
  let defaultHour = currentHour + 2
  if (currentMinute > 0) {
    defaultHour += 1  // Round up to next full hour
  }
  
  // Handle overflow past midnight - set to tomorrow at 10:00 AM
  let targetDate = new Date(now)
  if (defaultHour >= 24) {
    targetDate.setDate(targetDate.getDate() + 1)  // Tomorrow
    defaultHour = 10  // 10:00 AM
  }
  
  // Format date: YYYY-MM-DD
  const year = targetDate.getFullYear()
  const month = String(targetDate.getMonth() + 1).padStart(2, '0')
  const day = String(targetDate.getDate()).padStart(2, '0')
  const defaultDate = `${year}-${month}-${day}`
  
  const defaultTime = `${String(defaultHour).padStart(2, '0')}:00`
  
  return { defaultDate, defaultTime }
}

/**
 * Get minimum allowed time for today's events
 * Should be at least 1 hour from now
 */
const getMinimumTime = () => {
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  
  // Minimum time: Next hour from now
  let minHour = currentHour + 1
  if (currentMinute === 0) {
    minHour = currentHour  // If exactly on the hour, current hour is fine
  }
  
  if (minHour >= 24) {
    minHour = 23
  }
  
  return `${String(minHour).padStart(2, '0')}:00`
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

// Pace level options with visual indicators
const PACE_OPTIONS = [
  { value: 'LEISURELY', label: 'Leisurely', description: 'Relaxed, frequent stops, social', icon: '🐢' },
  { value: 'STEADY', label: 'Steady', description: 'Comfortable pace, regular breaks', icon: '🚶' },
  { value: 'BRISK', label: 'Brisk', description: 'Purposeful, stops at key points only', icon: '🏃' },
  { value: 'FAST', label: 'Fast', description: 'Demanding, very few stops', icon: '⚡' }
]

// Duration options for mobile step 1 dropdown
const DURATION_OPTIONS = [
  { value: '', label: 'Duration: Select' },
  { value: '1', label: '1 hour' },
  { value: '1.5', label: '1:30 hours' },
  { value: '2', label: '2 hours' },
  { value: '3', label: '3 hours' },
  { value: 'custom', label: 'Set end date' },
]

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function CreateEventPage() {
  // ============================================================
  // HOOKS & ROUTING
  // ============================================================
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const queryClient = useQueryClient()
  const groupId = searchParams.get('groupId')
  const copyFromId = searchParams.get('copyFrom')
  const copiedEventData = location.state?.eventData
  const { register, handleSubmit, watch, formState: { errors }, setValue } = useForm()
  const { isAuthenticated, user } = useAuthStore()
  const { isEventLocationEnabled, isGoogleMapsEnabled } = useFeatureFlags()
  
  // ============================================================
  // QUERIES
  // ============================================================
  
  // (Organiser check handled by header button)
  
  // ============================================================
  // LOCAL STATE
  // ============================================================
  const [currentStep, setCurrentStep] = useState(STEPS.BASICS)        // Current step in multi-step form
  const { defaultDate, defaultTime } = getDefaultDateTime()
  const hasShownCopyToast = useRef(false) // Prevent duplicate toast in React Strict Mode
  const [formData, setFormData] = useState({
    eventDate: defaultDate,
    startTime: defaultTime
  })                        // Accumulated form data across steps with smart defaults
  const [selectedRequirements, setSelectedRequirements] = useState([])  // Custom gear requirements tags
  const [isSubmitting, setIsSubmitting] = useState(false)             // Prevent double form submissions
  const [showPhotoDescription, setShowPhotoDescription] = useState(false) // Mobile: toggle photo/description section
  const [showEndDate, setShowEndDate] = useState(false)                    // Mobile: toggle end date/time fields
  const [showDescriptionModal, setShowDescriptionModal] = useState(false)   // Mobile: full-screen description editor modal
  const [joinQuestionEnabled, setJoinQuestionEnabled] = useState(false)     // Whether organisers wants to ask attendees a question
  
  // Calculate minimum time allowed based on selected date
  const getMinimumTime = (selectedDate) => {
    if (!selectedDate) return null
    
    const today = new Date().toISOString().split('T')[0]
    if (selectedDate !== today) return null // No restriction for future dates
    
    // For today, minimum time is current time + 2 minutes (buffer)
    const now = new Date()
    now.setMinutes(now.getMinutes() + 2) // Add 2-minute buffer
    
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  }
  
  // Watch individual fields for validation and conditional rendering
  const watchedTitle = watch('title')
  const watchedEventDate = watch('eventDate')
  const watchedStartTime = watch('startTime')
  const watchedImageUrl = watch('imageUrl')
  const watchedLocation = watch('location')
  const watchedLatitude = watch('latitude')
  const watchedLongitude = watch('longitude')
  const watchedHostMemberId = watch('hostMemberId')
  const watchedHostName = watch('hostName')
  const selectedDate = watch('eventDate')
  const selectedEndDate = watch('endDate')
  const minimumTime = getMinimumTime(selectedDate)
  const minimumEndTime = getMinimumTime(selectedEndDate)
  const isToday = selectedDate === new Date().toISOString().split('T')[0]
  const isEndDateToday = selectedEndDate === new Date().toISOString().split('T')[0]

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
  
  // Set default date and time on component mount
  useEffect(() => {
    setValue('eventDate', defaultDate)
    setValue('startTime', defaultTime)
  }, [defaultDate, defaultTime, setValue])

  // Pre-populate hostName AND hostMemberId with current user for new events (not when copying)
  useEffect(() => {
    if (user && user.id && user.email && !copyFromId && !copiedEventData) {
      // Use display name if available, otherwise extract from email
      const displayName = user.displayName || user.email.split('@')[0]
      setValue('hostName', displayName)
      setValue('hostMemberId', user.id)
      setFormData(prev => ({ ...prev, hostName: displayName, hostMemberId: user.id }))
    }
  }, [user, copyFromId, copiedEventData, setValue])
  
  // Pre-fill form when copying an event
  useEffect(() => {
    if (copiedEventData && copyFromId) {
      // Show info toast only once (prevent duplicate in React Strict Mode)
      if (!hasShownCopyToast.current) {
        toast.success('📋 Event copied! Update the date and make any changes needed.', { duration: 5000 })
        hasShownCopyToast.current = true
      }
      
      // Pre-fill all fields except dates (user needs to set new dates)
      const updatedFormData = {
        ...formData,
        title: copiedEventData.title ? `${copiedEventData.title} (Copy)` : '',
        description: copiedEventData.description || '',
        location: copiedEventData.location || '',
        latitude: copiedEventData.latitude || '',
        longitude: copiedEventData.longitude || '',
        difficultyLevel: copiedEventData.difficultyLevel || '',
        paceLevel: copiedEventData.paceLevel || '',
        distanceKm: copiedEventData.distanceKm || '',
        elevationGainM: copiedEventData.elevationGainM || '',
        estimatedDurationHours: copiedEventData.estimatedDurationHours || '',
        maxParticipants: copiedEventData.maxParticipants || '',
        costPerPerson: copiedEventData.costPerPerson || 0,
        cancellationPolicy: copiedEventData.cancellationPolicy || '',
        imageUrl: copiedEventData.imageUrl || '',
        hostName: copiedEventData.hostName || '',
        joinQuestion: copiedEventData.joinQuestion || '',
        eventDate: defaultDate, // Use default date for new event
        startTime: defaultTime  // Use default time for new event
      }
      
      setFormData(updatedFormData)
      
      // Set required gear tags if available
      if (copiedEventData.requiredGear) {
        try {
          const gearArray = typeof copiedEventData.requiredGear === 'string' 
            ? JSON.parse(copiedEventData.requiredGear) 
            : copiedEventData.requiredGear
          setSelectedRequirements(Array.isArray(gearArray) ? gearArray : [])
        } catch (e) {
          console.error('Error parsing required gear:', e)
        }
      }
      
      // Enable join question toggle if question exists
      if (copiedEventData.joinQuestion) {
        setJoinQuestionEnabled(true)
      }
      
      // Set form values
      Object.keys(updatedFormData).forEach(key => {
        setValue(key, updatedFormData[key])
      })
    }
  }, [copiedEventData, copyFromId, setValue, defaultDate, defaultTime])
  
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
      let nextStepValue = currentStep + 1
      
      // Skip LOCATION step only if EVENT_LOCATION is disabled
      if (nextStepValue === STEPS.LOCATION && !isEventLocationEnabled()) {
        nextStepValue = STEPS.DETAILS
      }
      
      setCurrentStep(nextStepValue)
    }
  }

  // Navigate to previous step in form
  const prevStep = () => {
    if (currentStep > STEPS.BASICS) {
      let prevStepValue = currentStep - 1
      
      // Skip LOCATION step only if EVENT_LOCATION is disabled
      if (prevStepValue === STEPS.LOCATION && !isEventLocationEnabled()) {
        prevStepValue = STEPS.BASICS
      }
      
      setCurrentStep(prevStepValue)
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
    // Validate location step has location name at minimum
    if (currentStep === STEPS.LOCATION && isEventLocationEnabled()) {
      if (!data.location || data.location.trim() === '') {
        toast.error('⚠️ Please enter a hiking location', {
          duration: 4000,
          icon: '📍'
        })
        return  // Don't proceed to next step
      }
    }
    
    updateFormData(data)
    nextStep()
  }

  // Handle final form submission (create and publish event)
  const onFinalSubmit = async (data) => {
    if (!groupId) {
      toast.error('Group ID is required to create an event')
      return
    }
    
    // Validate location requirements based on feature flags
    if (isEventLocationEnabled()) {
      // Always require location name
      if (!data.location || data.location.trim() === '') {
        toast.error('⚠️ Please enter a hiking location')
        setCurrentStep(STEPS.LOCATION)
        return
      }
      
      // Coordinates are optional - they're nice to have but not required
      // (Manual fallback mode allows events without coordinates)
    }
    
    // Validate event date is in the future (with 1 minute buffer for server processing)
    const eventDateTime = new Date(data.eventDate + 'T' + (data.startTime || '00:00'))
    const now = new Date()
    const oneMinuteFromNow = new Date(now.getTime() + 60000) // Add 1 minute buffer
    
    if (eventDateTime <= oneMinuteFromNow) {
      const minutesFromNow = Math.ceil((eventDateTime - now) / 60000)
      const message = minutesFromNow <= 0 
        ? '⚠️ Event date and time must be in the future. Please select a later time.'
        : `⚠️ Event time is too soon. Please select a time at least 1 minute from now.`
      
      toast.error(message, {
        duration: 5000,
        icon: '📅'
      })
      setCurrentStep(STEPS.BASICS)
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
      // Send as UTC ISO string for proper timezone handling
      eventDate: data.eventDate && data.startTime 
        ? new Date(data.eventDate + 'T' + data.startTime).toISOString() 
        : null,
      endDate: data.endDate && data.endTime 
        ? new Date(data.endDate + 'T' + data.endTime).toISOString() 
        : null,
      location: data.location,
      latitude: data.latitude ? Number(data.latitude) : null,
      longitude: data.longitude ? Number(data.longitude) : null,
      maxParticipants: data.maxParticipants ? Number(data.maxParticipants) : null,
      minParticipants: data.minParticipants ? Number(data.minParticipants) : 1,
      price: data.price ? Number(data.price) : 0,  // Fixed: 'cost' -> 'price' to match backend
      difficultyLevel: data.difficultyLevel || null,
      paceLevel: data.paceLevel || null,
      distanceKm: data.distanceKm ? Number(data.distanceKm) : null,
      elevationGainM: data.elevationGainM ? Number(data.elevationGainM) : null,
      estimatedDurationHours: data.estimatedDurationHours ? Number(data.estimatedDurationHours) : null,
      imageUrl: data.imageUrl || null,
      additionalImages: [],
      requirements: selectedRequirements,
      includedItems: data.includedItems ? data.includedItems.split(',').map(s => s.trim()).filter(Boolean) : [],
      cancellationPolicy: data.cancellationPolicy || null,
      joinQuestion: joinQuestionEnabled ? (data.joinQuestion?.trim() || null) : null,
      hostMemberId: data.hostMemberId ? Number(data.hostMemberId) : null
    }

    try {
      // Create the event
      const response = await eventsAPI.createEvent(payload)
      const eventId = response.data.id
      
      // Automatically publish the event
      await eventsAPI.publishEvent(eventId)
      
      queryClient.invalidateQueries(['groupEvents', groupId])
      queryClient.invalidateQueries(['events'])
      toast.success('🎉 Event created successfully!')
      
      if (groupId) {
        // If created from group page, go back to group
        navigate(`/groups/${groupId}`)
      } else {
        // Navigate to the event detail page
        navigate(`/events/${eventId}`)
      }
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
      <div className="mb-5 sm:mb-10 px-1 sm:px-8">
        <div className="flex items-center justify-center mb-2 sm:mb-4">
          <div className="flex items-center sm:ml-16 w-full" style={{ maxWidth: '600px' }}>
            {Object.keys(STEPS).map((_, index) => (
              <div key={index} className={`flex items-center ${index < Object.keys(STEPS).length - 1 ? 'flex-1' : 'flex-none'}`}>
                <div className={`
                  flex items-center justify-center w-7 h-7 sm:w-12 sm:h-12 rounded-full font-bold text-xs sm:text-sm
                  ${index <= currentStep 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-110' 
                    : 'bg-gray-200 text-gray-500'}
                  transition-all duration-500 transform
                `}>
                  {index < currentStep ? <Check className="h-3 w-3 sm:h-6 sm:w-6" /> : index + 1}
                </div>
                {index < Object.keys(STEPS).length - 1 && (
                  <div className={`
                    flex-1 h-1 sm:h-2 mx-1 sm:mx-3 rounded-full
                    ${index < currentStep ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gray-200'}
                    transition-all duration-500
                  `} />
                )}
              </div>
            ))}
          </div>
        </div>
        <p className="hidden sm:block text-center text-xs sm:text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
          Step {currentStep + 1} of {Object.keys(STEPS).length}: {STEP_TITLES[currentStep]}
        </p>
      </div>
    )
  }

  // ============================================================
  // MOBILE-ONLY RENDER FUNCTIONS (sm:hidden — full-screen app layout)
  // ============================================================

  const renderMobileProgressBar = () => (
    <div className="flex-none flex items-center gap-3 px-4 py-3.5 bg-white border-b border-gray-100">
      <button
        type="button"
        onClick={currentStep === 0 ? () => navigate(-1) : prevStep}
        className="flex items-center gap-1 text-sm text-gray-500 font-semibold -ml-1 py-1 pr-2 active:opacity-60"
      >
        <ArrowLeft className="h-4 w-4" />
        {currentStep === 0 ? 'Cancel' : 'Back'}
      </button>
      <div className="flex-1 flex gap-1.5">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
              i < currentStep
                ? 'bg-purple-600'
                : i === currentStep
                ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-gray-400 font-semibold w-8 text-right">{currentStep + 1}/4</span>
    </div>
  )

  const renderMobileBasicsContent = () => (
    <div className="px-4 pt-6 pb-36 space-y-5">
      <div className="pb-1">
        <h1 className="text-2xl font-extrabold text-gray-900 leading-tight flex items-center gap-2.5">
          <span className="text-3xl">✏️</span>
          What's your hike about?
        </h1>
        <p className="text-sm text-gray-400 mt-1">Start with the basics — you can always edit later</p>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Hike name *</label>
        <input
          value={watchedTitle || ''}
          onChange={(e) => { setValue('title', e.target.value, { shouldValidate: true }); updateFormData({ title: e.target.value }) }}
          placeholder="e.g. Dawn hike to Snowdon summit"
          className={`w-full px-4 py-4 text-[15px] font-medium border rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-300 bg-white transition-all ${errors.title ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
        />
        {errors.title && <p className="text-red-500 text-xs mt-1.5">⚠ {errors.title.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Date *</label>
          <input
            type="date"
            min={new Date().toISOString().split('T')[0]}
            value={watchedEventDate || ''}
            onChange={(e) => { 
              const newStartDate = e.target.value
              setValue('eventDate', newStartDate, { shouldValidate: true })
              updateFormData({ eventDate: newStartDate })
              
              // If end date/time exist, validate them against new start date
              const endDate = watch('endDate')
              const startTime = watchedStartTime
              const endTime = watch('endTime')
              
              if (newStartDate && startTime && endDate && endTime) {
                const startDateTime = new Date(`${newStartDate}T${startTime}`)
                const endDateTime = new Date(`${endDate}T${endTime}`)
                
                if (endDateTime <= startDateTime) {
                  // Clear invalid end date/time
                  setValue('endDate', '')
                  setValue('endTime', '')
                  updateFormData({ endDate: '', endTime: '' })
                }
              }
            }}
            className={`w-full px-3 py-4 text-sm border rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white ${errors.eventDate ? 'border-red-300' : 'border-gray-200'}`}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Start time *</label>
          <input
            type="time"
            value={watchedStartTime || ''}
            onChange={(e) => { 
              const newStartTime = e.target.value
              setValue('startTime', newStartTime, { shouldValidate: true })
              updateFormData({ startTime: newStartTime })
              
              // If end date/time exist, validate them against new start time
              const startDate = watchedEventDate
              const endDate = watch('endDate')
              const endTime = watch('endTime')
              
              if (startDate && newStartTime && endDate && endTime) {
                const startDateTime = new Date(`${startDate}T${newStartTime}`)
                const endDateTime = new Date(`${endDate}T${endTime}`)
                
                if (endDateTime <= startDateTime) {
                  // Clear invalid end date/time
                  setValue('endDate', '')
                  setValue('endTime', '')
                  updateFormData({ endDate: '', endTime: '' })
                }
              }
            }}
            className={`w-full px-3 py-4 text-sm border rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white ${errors.startTime ? 'border-red-300' : 'border-gray-200'}`}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Duration</label>
        <div className="relative">
          <select
            value={watch('estimatedDurationHours') || ''}
            onChange={(e) => { setValue('estimatedDurationHours', e.target.value); updateFormData({ estimatedDurationHours: e.target.value }) }}
            className="w-full px-4 py-4 text-[15px] border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white appearance-none font-medium text-gray-700"
          >
            {DURATION_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
        {watch('estimatedDurationHours') === 'custom' && (
          <>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">End date</label>
                <input
                  type="date"
                  min={watchedEventDate || new Date().toISOString().split('T')[0]}
                  value={watch('endDate') || ''}
                  onChange={(e) => {
                    const newEndDate = e.target.value
                    const startDate = watchedEventDate
                    const startTime = watchedStartTime
                    const endTime = watch('endTime')
                    
                    // Create datetime strings for comparison
                    if (startDate && startTime && newEndDate && endTime) {
                      const startDateTime = new Date(`${startDate}T${startTime}`)
                      const endDateTime = new Date(`${newEndDate}T${endTime}`)
                      
                      if (endDateTime <= startDateTime) {
                        // Don't allow end datetime to be before or equal to start datetime
                        return
                      }
                    }
                    setValue('endDate', newEndDate)
                  }}
                  className="w-full px-3 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">End time</label>
                <input
                  type="time"
                  value={watch('endTime') || ''}
                  onChange={(e) => {
                    const newEndTime = e.target.value
                    const startDate = watchedEventDate
                    const endDate = watch('endDate')
                    const startTime = watchedStartTime
                    
                    // Create datetime strings for comparison
                    if (startDate && startTime && endDate && newEndTime) {
                      const startDateTime = new Date(`${startDate}T${startTime}`)
                      const endDateTime = new Date(`${endDate}T${newEndTime}`)
                      
                      if (endDateTime <= startDateTime) {
                        // Don't allow end datetime to be before or equal to start datetime
                        return
                      }
                    }
                    setValue('endTime', newEndTime)
                  }}
                  className="w-full px-3 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                />
              </div>
            </div>
            {(() => {
              const startDate = watchedEventDate
              const startTime = watchedStartTime
              const endDate = watch('endDate')
              const endTime = watch('endTime')
              
              if (startDate && startTime && endDate && endTime) {
                const startDateTime = new Date(`${startDate}T${startTime}`)
                const endDateTime = new Date(`${endDate}T${endTime}`)
                
                if (endDateTime <= startDateTime) {
                  return (
                    <p className="text-red-500 text-xs mt-2">⚠ End date & time must be after start date & time</p>
                  )
                }
              }
              return null
            })()}
          </>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
        <button
          type="button"
          onClick={() => setShowPhotoDescription(p => !p)}
          className="w-full flex items-center gap-3 px-4 py-4 active:bg-gray-50 transition-colors"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Image className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-semibold text-gray-900 text-sm">Photo & Description</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {(watchedImageUrl || watchedDescription) ? '✓ Added' : 'Optional — tap to add'}
            </p>
          </div>
          <ChevronDown className={`h-5 w-5 text-gray-300 flex-shrink-0 transition-transform duration-300 ${showPhotoDescription ? 'rotate-180' : ''}`} />
        </button>
        {showPhotoDescription && (
          <div className="border-t border-gray-100 bg-gray-50 px-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Cover photo</p>
                <div className="relative h-28 rounded-xl border-2 border-dashed border-gray-200 bg-white overflow-hidden">
                  {watchedImageUrl && (
                    <img src={watchedImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover z-10" />
                  )}
                  {!watchedImageUrl && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 z-0 pointer-events-none">
                      <Camera className="h-6 w-6 text-gray-300" />
                      <span className="text-xs text-gray-400">Tap to upload</span>
                    </div>
                  )}
                  <div className="absolute inset-0 z-20 opacity-0">
                    <ImageUpload
                      value={watchedImageUrl}
                      onChange={(url) => { setValue('imageUrl', url); updateFormData({ imageUrl: url }) }}
                      folder="event-photo"
                    />
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Description</p>
                <button
                  type="button"
                  onClick={() => setShowDescriptionModal(true)}
                  className="w-full h-28 border-2 border-dashed border-gray-200 rounded-xl bg-white flex flex-col items-start justify-start p-2.5 overflow-hidden text-left active:bg-gray-50"
                >
                  {watchedDescription ? (
                    <p className="text-xs text-gray-600 line-clamp-5 leading-relaxed">
                      {watchedDescription.replace(/[#*_[\]()]/g, '')}
                    </p>
                  ) : (
                    <div className="flex flex-col items-center justify-center w-full h-full gap-1.5">
                      <FileText className="h-6 w-6 text-gray-300" />
                      <span className="text-xs text-gray-400">Tap to write</span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showDescriptionModal && (
        <div className="fixed inset-0 z-[200] flex flex-col bg-white">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Event Description</h3>
            <button type="button" onClick={() => setShowDescriptionModal(false)} className="p-2 rounded-xl bg-gray-100 active:bg-gray-200">
              <X className="h-4 w-4 text-gray-600" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <MarkdownEditor
              value={watchedDescription}
              onChange={(val) => { setValue('description', val); updateFormData({ description: val }) }}
              placeholder="Describe your hike, meeting point, what to expect..."
            />
          </div>
          <div className="px-4 py-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowDescriptionModal(false)}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-2xl text-base"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )

  const renderMobileLocationContent = () => (
    <div className="px-4 pt-6 pb-36 space-y-5">
      <div className="pb-1">
        <h1 className="text-2xl font-extrabold text-gray-900 leading-tight flex items-center gap-2.5">
          <span className="text-3xl">📍</span>
          Where's the hike?
        </h1>
        <p className="text-sm text-gray-400 mt-1">Search for your trailhead or meeting point</p>
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Hiking location *</label>
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
        {errors.location && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
            <span>⚠️</span> {errors.location.message}
          </p>
        )}
      </div>
      {watchedLatitude && watchedLongitude && (
        <div className="flex items-center gap-3 px-4 py-3.5 bg-green-50 border border-green-200 rounded-2xl">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Check className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-green-800 truncate">{watchedLocation}</p>
            <p className="text-xs text-green-600 mt-0.5">Location verified ✓</p>
          </div>
        </div>
      )}
    </div>
  )

  const renderMobileDetailsContent = () => (
    <div className="px-4 pt-6 pb-36 space-y-6">
      <div className="pb-1">
        <h1 className="text-2xl font-extrabold text-gray-900 leading-tight flex items-center gap-2.5">
          <span className="text-3xl">⛰️</span>
          Hike details
        </h1>
        <p className="text-sm text-gray-400 mt-1">Help hikers know what to expect</p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Difficulty level</label>
          <Link
            to="/hiking-grade-faq"
            className="flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-800 transition-colors"
          >
            <Info className="h-3.5 w-3.5" />
            What do these mean?
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {DIFFICULTY_OPTIONS.map(opt => {
            const selected = watch('difficultyLevel') === opt.value
            const colorMap = {
              BEGINNER: selected ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-200' : 'bg-white border-gray-200 text-gray-700',
              INTERMEDIATE: selected ? 'bg-amber-400 border-amber-400 text-gray-900 shadow-lg shadow-amber-200' : 'bg-white border-gray-200 text-gray-700',
              ADVANCED: selected ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-white border-gray-200 text-gray-700',
              EXPERT: selected ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-200' : 'bg-white border-gray-200 text-gray-700',
            }
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { setValue('difficultyLevel', opt.value); updateFormData({ difficultyLevel: opt.value }) }}
                className={`py-3.5 px-4 rounded-2xl border-2 font-semibold text-sm flex items-center gap-2.5 transition-all active:scale-95 ${colorMap[opt.value]}`}
              >
                <span className="text-base">{opt.icon}</span>
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Pace</label>
          <Link
            to="/pace-faq"
            className="flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-800 transition-colors"
          >
            <Info className="h-3.5 w-3.5" />
            What do these mean?
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {PACE_OPTIONS.map(opt => {
            const selected = watch('paceLevel') === opt.value
            const colorMap = {
              LEISURELY: selected ? 'bg-purple-500 border-purple-500 text-white shadow-lg shadow-purple-200' : 'bg-white border-gray-200 text-gray-700',
              STEADY: selected ? 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-200' : 'bg-white border-gray-200 text-gray-700',
              BRISK: selected ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-200' : 'bg-white border-gray-200 text-gray-700',
              FAST: selected ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-white border-gray-200 text-gray-700',
            }
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { setValue('paceLevel', opt.value); updateFormData({ paceLevel: opt.value }) }}
                className={`py-3.5 px-4 rounded-2xl border-2 font-semibold text-sm flex items-center gap-2.5 transition-all active:scale-95 ${colorMap[opt.value]}`}
              >
                <span className="text-base">{opt.icon}</span>
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Trail stats</label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-500 mb-1.5">Distance (km)</p>
            <input
              type="number" step="0.1" min="0"
              value={watch('distanceKm') || ''}
              onChange={(e) => { 
                const val = e.target.value
                if (val === '' || (/^\d*\.?\d*$/.test(val) && parseFloat(val) >= 0)) {
                  setValue('distanceKm', val, { shouldValidate: true })
                  updateFormData({ distanceKm: val })
                }
              }}
              placeholder="12.5"
              className="w-full px-4 py-4 text-[15px] border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
            />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1.5">Elevation (m)</p>
            <input
              type="number" min="0"
              value={watch('elevationGainM') || ''}
              onChange={(e) => { 
                const val = e.target.value
                if (val === '' || (/^\d+$/.test(val) && parseInt(val) >= 0)) {
                  setValue('elevationGainM', val, { shouldValidate: true })
                  updateFormData({ elevationGainM: val })
                }
              }}
              placeholder="500"
              className="w-full px-4 py-4 text-[15px] border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Max participants</label>
        <div className="relative">
          <input
            type="number" min="1"
            value={watch('maxParticipants') || ''}
            onChange={(e) => { 
              const val = e.target.value
              if (val === '' || (/^\d+$/.test(val) && parseInt(val) >= 1)) {
                setValue('maxParticipants', val, { shouldValidate: true })
                updateFormData({ maxParticipants: val })
              }
            }}
            placeholder="Unlimited"
            className="w-full pl-11 pr-4 py-4 text-[15px] border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
          />
          <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Required gear</label>
        <TagInput
          tags={selectedRequirements}
          onChange={setSelectedRequirements}
          placeholder="Add gear item..."
          hideHint
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Cost per person (£)</label>
        <div className="relative">
          <input
            type="number" step="0.01" min="0"
            value={watch('price') || ''}
            onChange={(e) => { 
              const val = e.target.value
              if (val === '' || (/^\d*\.?\d{0,2}$/.test(val) && parseFloat(val) >= 0)) {
                setValue('price', val, { shouldValidate: true })
                updateFormData({ price: val })
              }
            }}
            placeholder="0.00 — free"
            className="w-full pl-9 pr-4 py-4 text-[15px] border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">£</span>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Hosted by *</label>
        <MemberAutocomplete
          groupId={groupId}
          value={watchedHostName || ''}
          onChange={(value) => {
            if (typeof value === 'object' && value.id) {
              setValue('hostMemberId', value.id)
              setValue('hostName', value.name)
              updateFormData({ hostMemberId: value.id, hostName: value.name })
            } else {
              setValue('hostName', value)
              updateFormData({ hostName: value })
            }
          }}
          placeholder="Search group members..."
          error={errors.hostName?.message}
        />
      </div>

      {/* Join question toggle */}
      <div className="border border-indigo-100 rounded-2xl p-4 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex-shrink-0">
              <MessageSquare className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Ask members a question</p>
              <p className="text-xs text-gray-400">Members answer when they join</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setJoinQuestionEnabled(prev => !prev)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${joinQuestionEnabled ? 'bg-indigo-600' : 'bg-gray-200'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${joinQuestionEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
        {joinQuestionEnabled && (
          <textarea
            value={watch('joinQuestion') || ''}
            onChange={(e) => setValue('joinQuestion', e.target.value)}
            rows={2}
            className="mt-3 w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm bg-white resize-none"
            placeholder="e.g., What's your experience level with long-distance hikes?"
          />
        )}
      </div>
    </div>
  )

  const renderMobileReviewContent = () => {
    const durOpt = DURATION_OPTIONS.find(o => o.value === (formData.estimatedDurationHours || ''))
    const reviewDurationLabel = formData.estimatedDurationHours === 'custom'
      ? (formData.endDate ? `Until ${new Date(formData.endDate + 'T00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}${formData.endTime ? ` ${formData.endTime}` : ''}` : 'Custom end date')
      : durOpt?.label || ''
    const diffOpt = DIFFICULTY_OPTIONS.find(o => o.value === formData.difficultyLevel)
    const paceOpt = PACE_OPTIONS.find(o => o.value === formData.paceLevel)
    const diffBadge = { BEGINNER: 'bg-green-100 text-green-700', INTERMEDIATE: 'bg-amber-100 text-amber-800', ADVANCED: 'bg-orange-100 text-orange-700', EXPERT: 'bg-red-100 text-red-700' }
    return (
      <div className="px-4 pt-6 pb-36 space-y-5">
        <div className="text-center pb-2">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-purple-200">
            <Check className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Looks great!</h1>
          <p className="text-sm text-gray-400 mt-1">Review your hike before publishing</p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
          <div className="px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Hike name</p>
                <p className="font-bold text-gray-900 text-base">{formData.title || '—'}</p>
              </div>
              <button type="button" onClick={() => goToStep(STEPS.BASICS)} className="text-purple-600 text-xs font-bold flex-shrink-0 pt-0.5">Edit</button>
            </div>
          </div>

          <div className="px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Date & time</p>
                <p className="text-sm font-semibold text-gray-800">
                  {formData.eventDate && new Date(formData.eventDate + 'T00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                  {formData.startTime && ` at ${formData.startTime}`}
                </p>
                {reviewDurationLabel && <p className="text-xs text-gray-400 mt-0.5">{reviewDurationLabel}</p>}
              </div>
              <button type="button" onClick={() => goToStep(STEPS.BASICS)} className="text-purple-600 text-xs font-bold flex-shrink-0 pt-0.5">Edit</button>
            </div>
          </div>

          {isEventLocationEnabled() && (
          <div className="px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Location</p>
                <p className="text-sm font-semibold text-gray-800 truncate">{formData.location || '—'}</p>
                {formData.latitude && <p className="text-xs text-green-600 mt-0.5 flex items-center gap-1"><Check className="h-3 w-3" /> Verified</p>}
              </div>
              <button type="button" onClick={() => goToStep(isGoogleMapsEnabled() ? STEPS.LOCATION : STEPS.DETAILS)} className="text-purple-600 text-xs font-bold flex-shrink-0 pt-0.5">Edit</button>
            </div>
          </div>
          )}

          {(formData.difficultyLevel || formData.paceLevel || formData.distanceKm || formData.elevationGainM || formData.maxParticipants) && (
            <div className="px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Details</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {diffOpt && (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${diffBadge[formData.difficultyLevel] || 'bg-gray-100 text-gray-600'}`}>
                        {diffOpt.icon} {diffOpt.label}
                      </span>
                    )}
                    {paceOpt && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                        {paceOpt.icon} {paceOpt.label}
                      </span>
                    )}
                    {formData.distanceKm && <span className="text-xs text-gray-600 font-medium">📏 {formData.distanceKm}km</span>}
                    {formData.elevationGainM && <span className="text-xs text-gray-600 font-medium">↑ {formData.elevationGainM}m</span>}
                    {formData.maxParticipants && <span className="text-xs text-gray-600 font-medium">👥 Max {formData.maxParticipants}</span>}
                  </div>
                </div>
                <button type="button" onClick={() => goToStep(STEPS.DETAILS)} className="text-purple-600 text-xs font-bold flex-shrink-0 pt-0.5">Edit</button>
              </div>
            </div>
          )}

          <div className="px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Host & cost</p>
                <p className="text-sm font-semibold text-gray-800">
                  {formData.hostName || '—'}
                  <span className="text-gray-400 font-normal"> · £{formData.price || 0}</span>
                </p>
              </div>
              <button type="button" onClick={() => goToStep(STEPS.DETAILS)} className="text-purple-600 text-xs font-bold flex-shrink-0 pt-0.5">Edit</button>
            </div>
          </div>

          {selectedRequirements.length > 0 && (
            <div className="px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Required gear</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRequirements.map((item, i) => (
                      <span key={i} className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs rounded-full font-medium border border-purple-100">{item}</span>
                    ))}
                  </div>
                </div>
                <button type="button" onClick={() => goToStep(STEPS.DETAILS)} className="text-purple-600 text-xs font-bold flex-shrink-0 pt-0.5">Edit</button>
              </div>
            </div>
          )}

          {(formData.description || formData.imageUrl) && (
            <div className="px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Photo & description</p>
                  {formData.imageUrl && (
                    <div className="w-full h-24 rounded-xl overflow-hidden mb-2">
                      <img src={formData.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  {formData.description && (
                    <p className="text-xs text-gray-600 line-clamp-2">{formData.description.replace(/[#*_[\]()]/g, '')}</p>
                  )}
                </div>
                <button type="button" onClick={() => goToStep(STEPS.BASICS)} className="text-purple-600 text-xs font-bold flex-shrink-0 pt-0.5">Edit</button>
              </div>
            </div>
          )}

          {joinQuestionEnabled && (formData.joinQuestion || watch('joinQuestion')) && (
            <div className="px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <MessageSquare className="h-3 w-3" />
                    Join question
                  </p>
                  <p className="text-xs text-gray-600 italic">"{formData.joinQuestion || watch('joinQuestion')}"</p>
                </div>
                <button type="button" onClick={() => goToStep(STEPS.DETAILS)} className="text-purple-600 text-xs font-bold flex-shrink-0 pt-0.5">Edit</button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderMobileStepContent = () => {
    switch (currentStep) {
      case STEPS.BASICS: return renderMobileBasicsContent()
      case STEPS.LOCATION:
        return isEventLocationEnabled()
          ? renderMobileLocationContent()
          : renderMobileDetailsContent()
      case STEPS.DETAILS: return renderMobileDetailsContent()
      case STEPS.REVIEW: return renderMobileReviewContent()
      default: return renderMobileBasicsContent()
    }
  }

  const renderMobileLayout = () => (
    <div className="fixed top-16 left-0 right-0 bottom-0 flex flex-col bg-white" style={{ zIndex: 40 }}>
      {renderMobileProgressBar()}
      <div className="flex-1 overflow-y-auto overscroll-none">
        {renderMobileStepContent()}
      </div>
      <div className="flex-none px-4 py-4 bg-white border-t border-gray-100" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
        {currentStep === STEPS.REVIEW ? (
          <button
            type="button"
            onClick={() => handleSubmit(onFinalSubmit)()}
            disabled={isSubmitting}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-base rounded-2xl shadow-lg shadow-purple-200 active:opacity-90 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <Check className="h-5 w-5" />
            {isSubmitting ? 'Publishing...' : 'Publish Hike Event'}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handleSubmit(onStepSubmit)()}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-base rounded-2xl shadow-lg shadow-purple-200 active:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            Continue
            <ArrowRight className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  )

  // STEP 1: BASICS - Event title, date, time, description, and featured photo
  const watchedDescription = watch('description', '')

  const renderBasicsStep = () => (
    <form onSubmit={handleSubmit(onStepSubmit)} className="space-y-5 sm:space-y-8">

      {/* MOBILE ONLY: Simple step title */}
      <div className="sm:hidden mb-1">
        <h2 className="text-2xl font-extrabold text-gray-900">1. The Logistics</h2>
      </div>

      {/* DESKTOP ONLY: Large gradient icon header */}
      <div className="hidden sm:block text-center mb-5 sm:mb-10 animate-fade-in">
        <div className="inline-flex items-center justify-center w-14 h-14 sm:w-24 sm:h-24 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-2xl sm:rounded-3xl mb-3 sm:mb-6 shadow-lg sm:shadow-2xl shadow-purple-500/30 hover:scale-105 transition-transform duration-300">
          <Mountain className="h-7 w-7 sm:h-12 sm:w-12 text-white" />
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 mb-2 sm:mb-3">
          What's your hike about?
        </h2>
        <p className="text-gray-600 text-sm sm:text-lg">Give your hiking event a clear, descriptive name and date</p>
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
            className="relative w-full pl-11 sm:pl-14 pr-3 sm:pr-4 py-3 sm:py-5 text-base sm:text-lg border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 font-medium transition-all shadow-sm hover:shadow-md hover:border-purple-300 bg-white"
            placeholder="e.g., Sunday Morning Hike in Peak District"
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-500">
            <Mountain className="h-6 w-6" />
          </div>
        </div>
        {errors.title && <p className="text-red-500 text-sm mt-2 flex items-center gap-1"><span>⚠️</span>{errors.title.message}</p>}
        <p className="text-sm text-gray-500 mt-2 ml-1">💡 Choose a name that clearly describes your hike</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-6">
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
              type="date" 
              min={new Date().toISOString().split('T')[0]}
              value={watchedEventDate || ''}
              onChange={(e) => { 
                const newStartDate = e.target.value
                setValue('eventDate', newStartDate, { shouldValidate: true })
                updateFormData({ eventDate: newStartDate })
                
                // If end date/time exist, validate them against new start date
                const endDate = watch('endDate')
                const startTime = watchedStartTime
                const endTime = watch('endTime')
                
                if (newStartDate && startTime && endDate && endTime) {
                  const startDateTime = new Date(`${newStartDate}T${startTime}`)
                  const endDateTime = new Date(`${endDate}T${endTime}`)
                  
                  if (endDateTime <= startDateTime) {
                    // Clear invalid end date/time
                    setValue('endDate', '')
                    setValue('endTime', '')
                    updateFormData({ endDate: '', endTime: '' })
                  }
                }
              }}
              className="relative w-full pl-11 sm:pl-14 pr-3 sm:pr-4 py-3 sm:py-5 text-base sm:text-lg border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 font-medium transition-all shadow-sm hover:shadow-md hover:border-pink-300 bg-white" 
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
              type="time" 
              min={minimumTime || undefined}
              value={watchedStartTime || ''}
              onChange={(e) => { 
                const newStartTime = e.target.value
                setValue('startTime', newStartTime, { shouldValidate: true })
                updateFormData({ startTime: newStartTime })
                
                // If end date/time exist, validate them against new start time
                const startDate = watchedEventDate
                const endDate = watch('endDate')
                const endTime = watch('endTime')
                
                if (startDate && newStartTime && endDate && endTime) {
                  const startDateTime = new Date(`${startDate}T${newStartTime}`)
                  const endDateTime = new Date(`${endDate}T${endTime}`)
                  
                  if (endDateTime <= startDateTime) {
                    // Clear invalid end date/time
                    setValue('endDate', '')
                    setValue('endTime', '')
                    updateFormData({ endDate: '', endTime: '' })
                  }
                }
              }}
              className="relative w-full pl-11 sm:pl-14 pr-3 sm:pr-4 py-3 sm:py-5 text-base sm:text-lg border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 font-medium transition-all shadow-sm hover:shadow-md hover:border-orange-300 bg-white" 
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500">
              <Clock className="h-6 w-6" />
            </div>
          </div>
          {errors.startTime && <p className="text-red-500 text-sm mt-2 flex items-center gap-1"><span>⚠️</span>{errors.startTime.message}</p>}
        </div>
      </div>

      {/* MOBILE ONLY: Duration (with 'Set end date' as last option) */}
      <div className="sm:hidden space-y-3">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Duration <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              {...register('estimatedDurationHours')}
              className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white appearance-none pr-10"
            >
              {DURATION_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">▼</div>
          </div>
        </div>
        {watch('estimatedDurationHours') === 'custom' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">End Date</label>
              <input
                type="date"
                value={watch('endDate') || ''}
                onChange={(e) => setValue('endDate', e.target.value)}
                className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">End Time</label>
              <input
                type="time"
                value={watch('endTime') || ''}
                onChange={(e) => setValue('endTime', e.target.value)}
                className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* DESKTOP ONLY: End date + end time */}
      <div className="hidden sm:block">
        <div className="grid grid-cols-2 gap-3 sm:gap-6">
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
                type="date"
                min={watchedEventDate || new Date().toISOString().split('T')[0]}
                value={watch('endDate') || ''}
                onChange={(e) => {
                  const newEndDate = e.target.value
                  const startDate = watchedEventDate
                  const startTime = watchedStartTime
                  const endTime = watch('endTime')
                  
                  // Create datetime strings for comparison
                  if (startDate && startTime && newEndDate && endTime) {
                    const startDateTime = new Date(`${startDate}T${startTime}`)
                    const endDateTime = new Date(`${newEndDate}T${endTime}`)
                    
                    if (endDateTime <= startDateTime) {
                      // Don't allow end datetime to be before or equal to start datetime
                      return
                    }
                  }
                  setValue('endDate', newEndDate)
                  updateFormData({ endDate: newEndDate })
                }}
                className="relative w-full pl-11 sm:pl-14 pr-3 sm:pr-4 py-3 sm:py-5 text-base sm:text-lg border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium transition-all shadow-sm hover:shadow-md hover:border-indigo-300 bg-white" 
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
                type="time"
                value={watch('endTime') || ''}
                onChange={(e) => {
                  const newEndTime = e.target.value
                  const startDate = watchedEventDate
                  const endDate = watch('endDate')
                  const startTime = watchedStartTime
                  
                  // Create datetime strings for comparison
                  if (startDate && startTime && endDate && newEndTime) {
                    const startDateTime = new Date(`${startDate}T${startTime}`)
                    const endDateTime = new Date(`${endDate}T${newEndTime}`)
                    
                    if (endDateTime <= startDateTime) {
                      // Don't allow end datetime to be before or equal to start datetime
                      return
                    }
                  }
                  setValue('endTime', newEndTime)
                  updateFormData({ endTime: newEndTime })
                }}
                className="relative w-full pl-11 sm:pl-14 pr-3 sm:pr-4 py-3 sm:py-5 text-base sm:text-lg border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 font-medium transition-all shadow-sm hover:shadow-md hover:border-blue-300 bg-white" 
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500">
                <Timer className="h-6 w-6" />
              </div>
            </div>
            {errors.endTime && <p className="text-red-500 text-sm mt-2 flex items-center gap-1"><span>⚠️</span>{errors.endTime.message}</p>}
            <p className="text-sm text-gray-500 mt-2 ml-1">Approximate finish time (optional)</p>
          </div>
        </div>
        {(() => {
          const startDate = watchedEventDate
          const startTime = watchedStartTime
          const endDate = watch('endDate')
          const endTime = watch('endTime')
          
          if (startDate && startTime && endDate && endTime) {
            const startDateTime = new Date(`${startDate}T${startTime}`)
            const endDateTime = new Date(`${endDate}T${endTime}`)
            
            if (endDateTime <= startDateTime) {
              return (
                <p className="text-red-500 text-sm mt-2">⚠ End date & time must be after start date & time</p>
              )
            }
          }
          return null
        })()}
      </div>

      {/* DESKTOP ONLY: Featured photo */}
      <div className="hidden sm:block">
        <label htmlFor="imageUrl" className="flex items-center gap-2 text-base font-bold text-gray-900 mb-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg">
            <Image className="h-4 w-4 text-white" />
          </div>
          Featured Photo
        </label>
        <ImageUpload
          value={watchedImageUrl}
          onChange={(url) => {
            setValue('imageUrl', url)
            updateFormData({ imageUrl: url })
          }}
          folder="event-photo"
        />
      </div>

      {/* MOBILE ONLY: + Add photo & description toggle */}
      <div className="sm:hidden space-y-3">
        <button
          type="button"
          onClick={() => setShowPhotoDescription(p => !p)}
          className="w-full flex items-center justify-between py-3 px-4 border-2 border-dashed border-purple-300 rounded-xl bg-purple-50 active:bg-purple-100 transition-colors"
        >
          <span className="text-sm font-semibold text-purple-700">+ Add photo &amp; description</span>
          <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${showPhotoDescription ? 'bg-purple-600' : 'bg-gray-300'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${showPhotoDescription ? 'translate-x-6' : 'translate-x-1'}`} />
          </div>
        </button>
        {showPhotoDescription && (
          <div className="grid grid-cols-2 gap-3 animate-fade-in">
            {/* Photo - camera icon box */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1.5">Photo</p>
              <div className="relative h-[120px] rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 overflow-hidden">
                {watchedImageUrl && (
                  <img src={watchedImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover z-10" />
                )}
                {!watchedImageUrl && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 pointer-events-none z-10">
                    <Camera className="h-7 w-7 text-gray-400" />
                    <span className="text-xs text-gray-400">Add photo</span>
                  </div>
                )}
                <div className="absolute inset-0 z-20 opacity-0">
                  <ImageUpload
                    value={watchedImageUrl}
                    onChange={(url) => { setValue('imageUrl', url); updateFormData({ imageUrl: url }) }}
                    folder="event-photo"
                  />
                </div>
              </div>
            </div>
            {/* Description - tap to open modal */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1.5">Event Description</p>
              <button
                type="button"
                onClick={() => setShowDescriptionModal(true)}
                className="w-full h-[120px] border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 flex flex-col items-start justify-start p-2.5 overflow-hidden text-left"
              >
                {watchedDescription ? (
                  <p className="text-xs text-gray-600 w-full line-clamp-5 leading-relaxed">{watchedDescription.replace(/[#*_[\]()]/g, '')}</p>
                ) : (
                  <div className="flex flex-col items-center justify-center w-full h-full gap-1">
                    <FileText className="h-7 w-7 text-gray-400" />
                    <span className="text-xs text-gray-400">Tap to write</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MOBILE: Full-screen description modal */}
      {showDescriptionModal && (
        <div className="sm:hidden fixed inset-0 z-[100] flex flex-col bg-white">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
            <h3 className="font-bold text-gray-900 text-base">Event Description</h3>
            <button
              type="button"
              onClick={() => setShowDescriptionModal(false)}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 active:bg-gray-300"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <MarkdownEditor
              value={watchedDescription}
              onChange={(val) => { setValue('description', val); updateFormData({ description: val }) }}
              placeholder="Describe your hike, meeting point, what to expect..."
            />
          </div>
          <div className="px-4 py-4 border-t border-gray-100 bg-white">
            <button
              type="button"
              onClick={() => setShowDescriptionModal(false)}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl text-base"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* DESKTOP ONLY: Event description */}
      <div className="hidden sm:block">
        <label htmlFor="description" className="flex items-center gap-2 text-base font-bold text-gray-900 mb-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg">
            <FileText className="h-4 w-4 text-white" />
          </div>
          Event Description
        </label>
        <MarkdownEditor
          value={watchedDescription}
          onChange={(val) => {
            setValue('description', val)
            updateFormData({ description: val })
          }}
          placeholder="Describe your hike, meeting point, what to expect..."
          error={errors.description?.message}
        />
        <input type="hidden" {...register('description')} />
      </div>

      <div className="flex justify-end pt-3 sm:pt-4">
        <button
          type="submit"
          className="w-full sm:w-auto py-3 sm:py-4 px-6 sm:px-10 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-base sm:text-lg rounded-xl hover:shadow-xl hover:shadow-purple-500/50 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2"
          disabled={!watchedTitle || !watchedEventDate || !watchedStartTime}
        >
          Continue <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </div>
    </form>
  )

  // STEP 2: LOCATION - Google Places Autocomplete with coordinates validation
  const renderLocationStep = () => (
    <form onSubmit={handleSubmit(onStepSubmit)} className="space-y-5 sm:space-y-8">

      {/* MOBILE ONLY: Simple step title */}
      <div className="sm:hidden mb-1">
        <h2 className="text-2xl font-extrabold text-gray-900">2. Hike Location</h2>
      </div>

      {/* DESKTOP ONLY: Large gradient icon header */}
      <div className="hidden sm:block text-center mb-5 sm:mb-10 animate-fade-in">
        <div className="inline-flex items-center justify-center w-14 h-14 sm:w-24 sm:h-24 bg-gradient-to-br from-pink-500 via-orange-500 to-amber-400 rounded-2xl sm:rounded-3xl mb-3 sm:mb-6 shadow-lg sm:shadow-2xl shadow-pink-500/30 hover:scale-105 transition-transform duration-300">
          <MapPin className="h-7 w-7 sm:h-12 sm:w-12 text-white" />
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-orange-500 to-amber-500 mb-2 sm:mb-3">
          Where will you hike?
        </h2>
        <p className="text-gray-600 text-sm sm:text-lg">Search for your hiking location</p>
      </div>

      <div>
        <label htmlFor="location" className="block text-base font-bold text-gray-900 mb-3">
          Hiking location <span className="text-red-500">*</span>
        </label>
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
        {errors.location && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
            <span>⚠️</span> {errors.location.message}
          </p>
        )}
      </div>

      {watchedLatitude && watchedLongitude && (
        <>
          {/* Mobile compact confirmation */}
          <div className="sm:hidden flex items-center gap-2 px-3 py-2.5 bg-green-50 border border-green-200 rounded-xl">
            <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-800 font-medium truncate">{watchedLocation}</p>
          </div>
          {/* Desktop full confirmation */}
          <div className="hidden sm:block bg-green-50 border-2 border-green-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <div className="bg-green-500 rounded-full p-2">
                <Check className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-green-800 font-bold text-lg">Location selected</p>
                <p className="text-green-700 mt-1">{watchedLocation}</p>
                <p className="text-sm text-green-600 mt-2">
                  📍 {watchedLatitude?.toFixed(6)}, {watchedLongitude?.toFixed(6)}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="flex gap-3 sm:justify-between pt-3 sm:pt-4">
        <button 
          type="button" 
          onClick={prevStep} 
          className="flex-1 sm:flex-none py-3 sm:py-4 px-4 sm:px-8 bg-gray-100 text-gray-700 font-bold text-base sm:text-lg rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" /> Back
        </button>
        <button
          type="submit"
          className="flex-1 sm:flex-none py-3 sm:py-4 px-4 sm:px-10 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-base sm:text-lg rounded-xl hover:shadow-xl hover:shadow-purple-500/50 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
        >
          Continue <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </div>
    </form>
  )

  // STEP 3: DETAILS - Difficulty, trail stats, participants, gear, and pricing
  const renderDetailsStep = () => (
    <form onSubmit={handleSubmit(onStepSubmit)} className="space-y-5 sm:space-y-8">

      {/* MOBILE ONLY: Simple step title */}
      <div className="sm:hidden mb-1">
        <h2 className="text-2xl font-extrabold text-gray-900">3. Hike Details</h2>
      </div>

      {/* DESKTOP ONLY: Large gradient icon header */}
      <div className="hidden sm:block text-center mb-5 sm:mb-10 animate-fade-in">
        <div className="inline-flex items-center justify-center w-14 h-14 sm:w-24 sm:h-24 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-400 rounded-2xl sm:rounded-3xl mb-3 sm:mb-6 shadow-lg sm:shadow-2xl shadow-emerald-500/30 hover:scale-105 transition-transform duration-300">
          <Activity className="h-7 w-7 sm:h-12 sm:w-12 text-white" />
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-600 via-emerald-600 to-teal-500 mb-2 sm:mb-3">
          Tell us about your hike
        </h2>
        <p className="text-gray-600 text-sm sm:text-lg">Add details to help hikers prepare for the adventure</p>
      </div>

      {/* MOBILE ONLY: Difficulty select dropdown */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-gray-700">Difficulty</label>
          <Link
            to="/hiking-grade-faq"
            className="flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-800 transition-colors"
          >
            <Info className="h-3.5 w-3.5" />
            What do these mean?
          </Link>
        </div>
        <div className="relative">
          <select
            value={watch('difficultyLevel') || ''}
            onChange={(e) => { setValue('difficultyLevel', e.target.value); updateFormData({ difficultyLevel: e.target.value }) }}
            className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white appearance-none pr-10"
          >
            <option value="">Select difficulty</option>
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
            <option value="EXPERT">Expert</option>
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">▼</div>
        </div>
      </div>

      {/* MOBILE ONLY: Pace select dropdown */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-gray-700">Pace</label>
          <Link
            to="/pace-faq"
            className="flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-800 transition-colors"
          >
            <Info className="h-3.5 w-3.5" />
            What do these mean?
          </Link>
        </div>
        <div className="relative">
          <select
            value={watch('paceLevel') || ''}
            onChange={(e) => { setValue('paceLevel', e.target.value); updateFormData({ paceLevel: e.target.value }) }}
            className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white appearance-none pr-10"
          >
            <option value="">Select pace</option>
            <option value="LEISURELY">🐢 Leisurely</option>
            <option value="STEADY">🚶 Steady</option>
            <option value="BRISK">🏃 Brisk</option>
            <option value="FAST">⚡ Fast</option>
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">▼</div>
        </div>
      </div>

      {/* DESKTOP ONLY: Difficulty radio buttons */}
      <div className="hidden sm:block bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-4 sm:p-6 border-2 border-orange-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-orange-600" />
            Difficulty level
          </h3>
          <Link
            to="/hiking-grade-faq"
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

      {/* DESKTOP ONLY: Pace radio buttons */}
      <div className="hidden sm:block bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-4 sm:p-6 border-2 border-purple-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
            <Timer className="h-5 w-5 text-purple-600" />
            Pace
          </h3>
          <Link
            to="/pace-faq"
            className="flex items-center gap-1 text-sm font-semibold text-purple-600 hover:text-purple-800 transition-colors"
          >
            <Info className="h-4 w-4" />
            What do these mean?
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {PACE_OPTIONS.map(opt => (
            <label key={opt.value} className="relative cursor-pointer">
              <input
                type="radio"
                {...register('paceLevel')}
                value={opt.value}
                className="peer sr-only"
              />
              <div className="bg-white border-2 border-gray-300 rounded-xl p-4 hover:border-purple-500 peer-checked:border-purple-500 peer-checked:bg-purple-50 transition-all">
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

      {/* MOBILE ONLY: Trail stats - no card, no heading */}
      <div className="sm:hidden">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Distance (km)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={watch('distanceKm') || ''}
              onChange={(e) => { setValue('distanceKm', e.target.value); updateFormData({ distanceKm: e.target.value }) }}
              className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              placeholder="12.5"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Elevation Gain (m)</label>
            <input
              type="number"
              min="0"
              value={watch('elevationGainM') || ''}
              onChange={(e) => { setValue('elevationGainM', e.target.value); updateFormData({ elevationGainM: e.target.value }) }}
              className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              placeholder="500"
            />
          </div>
        </div>
      </div>

      {/* DESKTOP ONLY: Trail stats - full card */}
      <div className="hidden sm:block bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-4 sm:p-6 border-2 border-blue-200">
        <h3 className="font-bold text-gray-900 text-lg mb-5 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Trail Statistics (Optional)
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:gap-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md">
                <Compass className="h-3.5 w-3.5 text-white" />
              </div>
              Distance (km)
            </label>
            <input
              {...register('distanceKm')}
              type="number"
              step="0.1"
              min="0"
              className="w-full px-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 font-medium transition-all bg-white shadow-sm hover:shadow-md hover:border-blue-300"
              placeholder="12.5"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 shadow-md">
                <TrendingUp className="h-3.5 w-3.5 text-white" />
              </div>
              Elevation Gain (m)
            </label>
            <input
              {...register('elevationGainM')}
              type="number"
              min="0"
              className="w-full px-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium transition-all bg-white shadow-sm hover:shadow-md hover:border-emerald-300"
              placeholder="500"
            />
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
            className="relative w-full pl-11 sm:pl-14 pr-3 sm:pr-4 py-3 sm:py-5 text-base sm:text-lg border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 font-medium transition-all shadow-sm hover:shadow-md hover:border-purple-300 bg-white" 
            placeholder="20" 
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-500">
            <Users className="h-6 w-6" />
          </div>
        </div>
        <p className="hidden sm:block text-sm text-gray-500 mt-2 ml-1">💡 Leave blank for unlimited participants</p>
      </div>

      {/* ========== REQUIRED GEAR (Custom Tags) ========== */}

      {/* MOBILE ONLY: Required gear - minimal */}
      <div className="sm:hidden">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Required gear</label>
        <TagInput
          tags={selectedRequirements}
          onChange={setSelectedRequirements}
          placeholder="Add gear item..."
          hideHint
        />
      </div>

      {/* DESKTOP ONLY: Required gear - full card */}
      <div className="hidden sm:block bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 sm:p-6 border-2 border-purple-200">
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
              className="relative w-full pl-11 sm:pl-14 pr-3 sm:pr-4 py-3 sm:py-5 text-base sm:text-lg border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 font-medium transition-all shadow-sm hover:shadow-md hover:border-green-300 bg-white" 
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
            value={watchedHostName}
            onChange={(value) => {
              if (typeof value === 'object' && value.id) {
                // Member selected from dropdown
                setValue('hostMemberId', value.id)
                setValue('hostName', value.name)
              } else {
                // Manual text input
                setValue('hostMemberId', null)
                setValue('hostName', value)
              }
            }}
            error={errors.hostName?.message}
          />
          <input type="hidden" {...register('hostMemberId')} />
          <input type="hidden" {...register('hostName', { required: 'Host name is required' })} />
          {errors.hostName && <p className="text-red-500 text-sm mt-2 flex items-center gap-1"><span>⚠️</span>{errors.hostName.message}</p>}
          <p className="text-sm text-gray-500 mt-2">Select from group members or type any name</p>
        </div>
      </div>

      {/* ========== JOIN QUESTION (Optional) ========== */}
      <div className="border-2 border-indigo-100 rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg flex-shrink-0">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm sm:text-base">Ask members a question</p>
              <p className="text-xs text-gray-500">Members answer when they join the event</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setJoinQuestionEnabled(prev => !prev)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${joinQuestionEnabled ? 'bg-indigo-600' : 'bg-gray-200'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${joinQuestionEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
        {joinQuestionEnabled && (
          <div className="mt-4">
            <textarea
              value={watch('joinQuestion') || ''}
              onChange={(e) => setValue('joinQuestion', e.target.value)}
              rows={2}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm sm:text-base transition-all bg-white resize-none"
              placeholder="e.g., What's your experience level with long-distance hikes?"
            />
          </div>
        )}
      </div>

      <div className="flex gap-3 sm:justify-between pt-3 sm:pt-4">
        <button 
          type="button" 
          onClick={prevStep} 
          className="flex-1 sm:flex-none py-3 sm:py-4 px-4 sm:px-8 bg-gray-100 text-gray-700 font-bold text-base sm:text-lg rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" /> Back
        </button>
        <button
          type="submit"
          className="flex-1 sm:flex-none py-3 sm:py-4 px-4 sm:px-10 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-base sm:text-lg rounded-xl hover:shadow-xl hover:shadow-purple-500/50 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2"
        >
          Continue <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </div>
    </form>
  )

  // STEP 4: REVIEW - Final review of all entered data before publishing
  const renderReviewStep = () => {
    const difficultyOption = DIFFICULTY_OPTIONS.find(opt => opt.value === formData.difficultyLevel)
    const paceOption = PACE_OPTIONS.find(opt => opt.value === formData.paceLevel)
    const durationLabel = formData.estimatedDurationHours === 'custom'
      ? (formData.endDate ? `Until ${new Date(formData.endDate + 'T00:00').toLocaleDateString('en-GB')}${formData.endTime ? ` ${formData.endTime}` : ''}` : 'Custom end date')
      : DURATION_OPTIONS.find(o => o.value === (formData.estimatedDurationHours || ''))?.label || ''
    const diffColors = { BEGINNER: 'bg-green-500', INTERMEDIATE: 'bg-amber-400', ADVANCED: 'bg-orange-500', EXPERT: 'bg-red-500' }
    const diffTextColors = { BEGINNER: 'text-white', INTERMEDIATE: 'text-gray-900', ADVANCED: 'text-white', EXPERT: 'text-white' }

    return (
      <div className="space-y-6">

        {/* MOBILE ONLY: Simple header */}
        <div className="sm:hidden mb-1">
          <h2 className="text-2xl font-extrabold text-gray-900">4. Review &amp; Confirm</h2>
        </div>

        {/* DESKTOP ONLY: Large gradient icon header */}
        <div className="hidden sm:block text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-24 sm:h-24 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-2xl sm:rounded-3xl mb-3 sm:mb-6 shadow-lg sm:shadow-2xl shadow-emerald-500/30 hover:scale-105 transition-transform duration-300">
            <Check className="h-7 w-7 sm:h-12 sm:w-12 text-white" />
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 mb-2 sm:mb-3">
            Review your hike
          </h2>
          <p className="text-gray-600 text-sm sm:text-lg max-w-2xl mx-auto">Everything look good? You can edit any section before publishing your adventure!</p>
        </div>

        {/* MOBILE ONLY: Condensed single review card */}
        <div className="sm:hidden bg-white rounded-2xl border-2 border-gray-100 shadow-sm overflow-hidden">
          {/* Hike title */}
          <div className="px-4 pt-4 pb-3 border-b border-gray-100">
            <div className="flex items-start gap-2">
              <Mountain className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 font-medium">Hike Title</p>
                <p className="font-bold text-gray-900 text-base leading-tight">{formData.title || 'Untitled Event'}</p>
              </div>
              <button type="button" onClick={() => goToStep(STEPS.BASICS)} className="ml-auto text-xs text-purple-600 font-semibold flex-shrink-0">Edit</button>
            </div>
          </div>
          {/* Date & Time */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 font-medium">Date &amp; Time</p>
                <p className="text-sm text-gray-800">
                  {formData.eventDate && new Date(formData.eventDate + 'T00:00').toLocaleDateString('en-GB')} at {formData.startTime}
                  {durationLabel && <span className="text-gray-500"> ({durationLabel})</span>}
                </p>
              </div>
            </div>
          </div>
          {/* Location */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 font-medium">Location</p>
                <p className="text-sm text-gray-800 truncate">{formData.location || <span className="text-red-500">Not set</span>}</p>
                {formData.latitude && formData.longitude && (
                  <p className="text-xs text-green-600 flex items-center gap-1 mt-0.5"><Check className="h-3 w-3" /> Verified</p>
                )}
              </div>
              <button type="button" onClick={() => goToStep(STEPS.LOCATION)} className="ml-auto text-xs text-purple-600 font-semibold flex-shrink-0">Edit</button>
            </div>
          </div>
          {/* Difficulty + Pace + Stats */}
          {(difficultyOption || paceOption || formData.distanceKm || formData.elevationGainM) && (
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2 flex-wrap">
                {difficultyOption && (
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${diffColors[difficultyOption.value] || 'bg-gray-200'} ${diffTextColors[difficultyOption.value] || 'text-gray-800'}`}>
                    {difficultyOption.icon} {difficultyOption.label}
                  </span>
                )}
                {paceOption && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                    {paceOption.icon} {paceOption.label}
                  </span>
                )}
                {(formData.distanceKm || formData.elevationGainM) && (
                  <span className="text-sm text-gray-700 font-medium">
                    {formData.distanceKm && `${formData.distanceKm}km`}{formData.distanceKm && formData.elevationGainM && ' / '}{formData.elevationGainM && `${formData.elevationGainM}m`}
                  </span>
                )}
              </div>
            </div>
          )}
          {/* Host & Cost */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700">{formData.hostName || '—'}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-semibold text-gray-600">£{formData.price || 0}</span>
              </div>
              <button type="button" onClick={() => goToStep(STEPS.DETAILS)} className="text-xs text-purple-600 font-semibold">Edit</button>
            </div>
          </div>
          {/* Required gear */}
          {selectedRequirements.length > 0 && (
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-start gap-2">
                <Mountain className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 font-medium">Required Gear</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedRequirements.map((item, i) => (
                      <span key={i} className="inline-block px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-md font-medium">{item}</span>
                    ))}
                  </div>
                </div>
                <button type="button" onClick={() => goToStep(STEPS.DETAILS)} className="ml-auto text-xs text-purple-600 font-semibold flex-shrink-0">Edit</button>
              </div>
            </div>
          )}
          {/* Description & Photo */}
          {(formData.description || formData.imageUrl) && (
            <div className="px-4 py-3">
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 font-medium">Hike Description &amp; Photo</p>
                  {formData.description && <p className="text-xs text-gray-700 line-clamp-2 mt-0.5">{formData.description.replace(/[#*_]/g, '')}</p>}
                  {formData.imageUrl && <p className="text-xs text-green-600 mt-0.5">📷 Photo added</p>}
                </div>
                <button type="button" onClick={() => goToStep(STEPS.BASICS)} className="ml-auto text-xs text-purple-600 font-semibold flex-shrink-0">Edit</button>
              </div>
            </div>
          )}
        </div>

        {/* DESKTOP ONLY: Multi-section review cards */}
        <div className="hidden sm:block space-y-4">
          {/* ========== REVIEW: BASICS SECTION ========== */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-purple-200 shadow-sm">
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
              {/* Start Date and Time */}
              <p className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="font-semibold">Start:</span> 
                {formData.eventDate}
                {formData.startTime && ` at ${formData.startTime}`}
              </p>
              
              {/* End Date and Time (if provided) */}
              {(formData.endDate || formData.endTime) && (
                <p className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="font-semibold">End:</span> 
                  {formData.endDate ? formData.endDate : formData.eventDate}
                  {formData.endTime && ` at ${formData.endTime}`}
                </p>
              )}
              
              {formData.description && (
                <div className="mt-3 bg-gray-50 p-3 rounded-lg text-gray-700 prose prose-sm max-w-none">
                  <ReactMarkdown>{formData.description}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>

          {/* ========== REVIEW: LOCATION SECTION ========== */}
          {isEventLocationEnabled() && (
          <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-pink-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <MapPin className="h-6 w-6 text-pink-600" />
                Hiking Location
              </h3>
              <button
                type="button"
                onClick={() => goToStep(isGoogleMapsEnabled() ? STEPS.LOCATION : STEPS.DETAILS)}
                className="py-2 px-4 bg-pink-100 text-pink-600 hover:bg-pink-200 rounded-lg font-semibold flex items-center gap-1 text-sm transition-all"
              >
                <Edit2 className="h-4 w-4" /> Edit
              </button>
            </div>
            
            {formData.location ? (
              <div className="bg-gradient-to-br from-pink-50 to-orange-50 rounded-xl p-4 border-2 border-pink-200">
                <div className="flex items-start gap-3">
                  <div className="bg-pink-500 rounded-full p-2 mt-1">
                    <MapPin className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 font-bold text-lg">{formData.location}</p>
                    {formData.latitude && formData.longitude && (
                      <>
                        <div className="mt-3 bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-pink-200">
                          <p className="text-xs text-gray-600 font-semibold mb-1">GPS Coordinates:</p>
                          <p className="text-sm text-gray-800 font-mono">
                            📍 Lat: {formData.latitude?.toFixed(6)}, Long: {formData.longitude?.toFixed(6)}
                          </p>
                        </div>
                        <p className="text-xs text-green-600 font-semibold mt-2 flex items-center gap-1">
                          <Check className="h-3 w-3" /> Location verified with coordinates
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                <p className="text-amber-700 font-semibold flex items-center gap-2">
                  <span>📍</span> No location set
                </p>
              </div>
            )}
          </div>
          )}

          {/* ========== REVIEW: HIKE DETAILS SECTION ========== */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-green-200 shadow-sm">
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
              {paceOption && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="font-semibold">Pace:</span> {paceOption.icon} {paceOption.label}
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

        <div className="flex gap-3 sm:justify-between mt-6 sm:mt-8 pt-3 sm:pt-4">
          <button 
            type="button" 
            onClick={prevStep} 
            className="flex-1 sm:flex-none py-3 sm:py-4 px-4 sm:px-8 bg-gray-100 text-gray-700 font-bold text-base sm:text-lg rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" /> Back
          </button>
          <button 
            type="button" 
            className="flex-1 sm:flex-none py-3 sm:py-4 px-4 sm:px-10 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-base sm:text-lg rounded-xl hover:shadow-2xl hover:shadow-green-500/50 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2" 
            onClick={() => handleSubmit(onFinalSubmit)()}
            disabled={isSubmitting}
          >
            <Check className="h-5 w-5 sm:h-6 sm:w-6" /> {isSubmitting ? 'Publishing...' : 'Publish Hike Event'}
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
        // Only show location step if EVENT_LOCATION feature is enabled
        return isEventLocationEnabled()
          ? renderLocationStep() 
          : renderDetailsStep() // Skip to details if location disabled
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
    <>
      {/* ── MOBILE: Full-screen app-like layout ── */}
      <div className="sm:hidden">
        {renderMobileLayout()}
      </div>

      {/* ── DESKTOP: Original gorgeous multi-step layout ── */}
      <div className="hidden sm:block min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-8">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h1 className="text-5xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent mb-4 animate-fade-in">
              🏔️ Create a Hike Event
            </h1>
            <p className="text-gray-600 text-xl font-medium mb-6">Plan an amazing hiking adventure for your group</p>
          </div>

          {renderProgressBar()}
          <div className="bg-white/90 backdrop-blur-lg rounded-3xl p-10 border-2 border-white/50 shadow-2xl shadow-purple-500/10 hover:shadow-purple-500/20 transition-shadow duration-300">
            {renderCurrentStep()}
          </div>
        </div>
      </div>
    </>
  )
}
