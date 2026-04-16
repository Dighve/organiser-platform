// ============================================================
// IMPORTS
// ============================================================
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { MapPin, Clock, Users, ArrowRight, ArrowLeft, Check, Edit2, Mountain, Compass, Activity, TrendingUp, DollarSign, Info, Upload, UserPlus, Calendar, Timer, Image, Backpack, Package, X, Camera, ChevronDown, ChevronUp, FileText, MessageSquare, Train, Car, Bus, Footprints, AlignLeft, Plus } from 'lucide-react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { activityTypesAPI, eventsAPI } from '../lib/api'
import toast from 'react-hot-toast'
import GooglePlacesAutocomplete from '../components/GooglePlacesAutocomplete'
import TagInput from '../components/TagInput'
import MemberAutocomplete from '../components/MemberAutocomplete'
import ImageUpload from '../components/ImageUpload'
import MarkdownEditor from '../components/MarkdownEditor'

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

// Pace level options with visual indicators
const PACE_OPTIONS = [
  { value: 'LEISURELY', label: 'Leisurely', description: 'Relaxed, frequent stops, social', icon: '🐢' },
  { value: 'STEADY', label: 'Steady', description: 'Comfortable pace, regular breaks', icon: '🚶' },
  { value: 'BRISK', label: 'Brisk', description: 'Purposeful, stops at key points only', icon: '🏃' },
  { value: 'FAST', label: 'Fast', description: 'Demanding, very few stops', icon: '⚡' }
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
  const [showPhotoDescription, setShowPhotoDescription] = useState(false) // Mobile: toggle photo/description section
  const [showDescriptionModal, setShowDescriptionModal] = useState(false)  // Mobile: full-screen description editor modal
  const [joinQuestionEnabled, setJoinQuestionEnabled] = useState(false)    // Whether organiser wants to ask attendees a question
  const [transportDetailMode, setTransportDetailMode] = useState('FREEFORM')
  const [transportNotes, setTransportNotes] = useState('')
  const [transportLegNotes, setTransportLegNotes] = useState('')
  const [transportLegs, setTransportLegs] = useState({
    OUTBOUND: { mode: 'TRAIN', departureLocation: '', arrivalLocation: '', departureTime: '', arrivalTime: '' },
    RETURN: { mode: 'TRAIN', departureLocation: '', arrivalLocation: '', departureTime: '', arrivalTime: '', openReturn: false }
  })
  const [transportOpen, setTransportOpen] = useState(false)
  
  // Watch individual fields for validation and conditional rendering
  const watchedTitle = watch('title')
  const watchedEventDate = watch('eventDate')
  const watchedStartTime = watch('startTime')
  const watchedImageUrl = watch('imageUrl')
  const watchedLocation = watch('location')
  const watchedLatitude = watch('latitude')
  const watchedLongitude = watch('longitude')
  const watchedHostName = watch('hostName')
  const watchedDescription = watch('description', '')
  const watchedDifficultyLevel = watch('difficultyLevel')
  const watchedPaceLevel = watch('paceLevel')
  const selectedDate = watch('eventDate')
  const selectedEndDate = watch('endDate')
  
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
        description: event.description || '',  // Ensure empty string instead of null/undefined
        eventDate: startDateStr,
        startTime: startTimeStr,
        endDate: endDateStr,
        endTime: endTimeStr,
        location: event.location,
        latitude: event.latitude,
        longitude: event.longitude,
        maxParticipants: event.maxParticipants,
        maxWaitlist: event.maxWaitlist,
        price: event.price || 0,
        difficultyLevel: event.difficultyLevel,
        paceLevel: event.paceLevel,
        distanceKm: event.distanceKm,
        elevationGainM: event.elevationGainM,
        imageUrl: event.imageUrl,
        hostMemberId: event.hostMemberId || null,  // Preserve host member ID
        hostName: event.hostMemberName || event.organiserName || '',  // Pre-fill host name
        joinQuestion: event.joinQuestion || ''
      }
      
      if (event.joinQuestion) {
        setJoinQuestionEnabled(true)
      }

      // Pre-fill transport
      if (event.transportDetailMode) {
        setTransportDetailMode(event.transportDetailMode)
      }
      if (event.transportNotes) {
        setTransportNotes(event.transportNotes)
      }
      if (event.transportLegs?.length > 0) {
        const ob = event.transportLegs.find(l => l.direction === 'OUTBOUND')
        const ret = event.transportLegs.find(l => l.direction === 'RETURN')
        setTransportLegs({
          OUTBOUND: ob
            ? { mode: ob.mode || 'TRAIN', departureLocation: ob.departureLocation || '', arrivalLocation: ob.arrivalLocation || '', departureTime: ob.departureTime || '', arrivalTime: ob.arrivalTime || '' }
            : { mode: 'TRAIN', departureLocation: '', arrivalLocation: '', departureTime: '', arrivalTime: '' },
          RETURN: ret
            ? { mode: ret.mode || 'TRAIN', departureLocation: ret.departureLocation || '', arrivalLocation: ret.arrivalLocation || '', departureTime: ret.departureTime || '', arrivalTime: ret.arrivalTime || '', openReturn: ret.openReturn || false }
            : { mode: 'TRAIN', departureLocation: '', arrivalLocation: '', departureTime: '', arrivalTime: '', openReturn: false }
        })
        const combinedNotes = event.transportLegs.map(l => l.notes).filter(Boolean).join(' • ')
        if (combinedNotes) setTransportLegNotes(combinedNotes)
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
      // Send as UTC ISO string for proper timezone handling
      eventDate: data.eventDate && data.startTime 
        ? new Date(data.eventDate + 'T' + data.startTime).toISOString() 
        : null,
      endDate: data.endDate && data.endTime 
        ? new Date(data.endDate + 'T' + data.endTime).toISOString() 
        : (data.eventDate && data.endTime ? new Date(data.eventDate + 'T' + data.endTime).toISOString() : null),
      location: data.location,
      latitude: data.latitude ? Number(data.latitude) : null,
      longitude: data.longitude ? Number(data.longitude) : null,
      maxParticipants: data.maxParticipants ? Number(data.maxParticipants) : null,
      maxWaitlist: data.maxWaitlist ? Number(data.maxWaitlist) : null,
      minParticipants: 1,
      price: data.price ? Number(data.price) : 0,
      difficultyLevel: data.difficultyLevel || null,
      paceLevel: data.paceLevel || null,
      distanceKm: data.distanceKm ? Number(data.distanceKm) : null,
      elevationGainM: data.elevationGainM ? Number(data.elevationGainM) : null,
      estimatedDurationHours: null,
      imageUrl: data.imageUrl || null,
      additionalImages: [],
      requirements: selectedRequirements,
      includedItems: [],
      cancellationPolicy: null,
      joinQuestion: joinQuestionEnabled ? (data.joinQuestion?.trim() || null) : null,
      hostMemberId: formData.hostMemberId ? Number(formData.hostMemberId) : null,
      transportDetailMode,
      transportNotes: transportDetailMode === 'FREEFORM' ? (transportNotes || null) : null,
      transportLegs: transportDetailMode === 'STRUCTURED' ? buildTransportLegsPayload() : []
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

  const buildTransportLegsPayload = () => {
    const legs = []
    const ob = transportLegs.OUTBOUND
    if (ob.departureLocation || ob.arrivalLocation || ob.departureTime) {
      legs.push({ direction: 'OUTBOUND', mode: ob.mode, departureLocation: ob.departureLocation || null, arrivalLocation: ob.arrivalLocation || null, departureTime: ob.departureTime || null, arrivalTime: ob.arrivalTime || null, openReturn: false, notes: transportLegNotes || null, sortOrder: 0 })
    }
    const ret = transportLegs.RETURN
    if (ret.openReturn || ret.departureLocation || ret.arrivalLocation || ret.departureTime) {
      legs.push({ direction: 'RETURN', mode: ret.mode, departureLocation: ret.openReturn ? null : (ret.departureLocation || null), arrivalLocation: ret.openReturn ? null : (ret.arrivalLocation || null), departureTime: ret.openReturn ? null : (ret.departureTime || null), arrivalTime: ret.openReturn ? null : (ret.arrivalTime || null), openReturn: ret.openReturn, notes: legs.length === 0 ? (transportLegNotes || null) : null, sortOrder: 1 })
    }
    return legs
  }

  const updateTransportLeg = (direction, field, value) => {
    setTransportLegs(prev => ({ ...prev, [direction]: { ...prev[direction], [field]: value } }))
  }

  // ============================================================
  // MOBILE-ONLY RENDER FUNCTIONS (sm:hidden — full-screen app layout)
  // ============================================================

  const renderMobileProgressBar = () => (
    <div className="flex-none flex items-center gap-3 px-4 py-3.5 bg-white border-b border-gray-100">
      <button
        type="button"
        onClick={currentStep === 0 ? () => navigate(`/events/${id}`) : prevStep}
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
          Update your hike
        </h1>
        <p className="text-sm text-gray-400 mt-1">Edit the basics — changes save when you proceed</p>
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

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">End date</label>
          <input
            type="date"
            min={watchedEventDate || ''}
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
              updateFormData({ endTime: newEndTime })
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
    </div>
  )

  const renderMobileLocationContent = () => (
    <div className="px-4 pt-6 pb-36 space-y-5">
      <div className="pb-1">
        <h1 className="text-2xl font-extrabold text-gray-900 leading-tight flex items-center gap-2.5">
          <span className="text-3xl">📍</span>
          Update location
        </h1>
        <p className="text-sm text-gray-400 mt-1">Search for your trailhead or meeting point</p>
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Search location *</label>
        <GooglePlacesAutocomplete
          value={watchedLocation}
          onChange={(value) => setValue('location', value)}
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

      {/* Getting there */}
      <div className="border border-gray-200 rounded-2xl overflow-hidden">
        <button
          type="button"
          onClick={() => setTransportOpen(prev => !prev)}
          className="w-full flex items-center justify-between px-4 py-3.5 bg-white text-left"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500">
              <Train className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Getting there</p>
              {!transportOpen && (transportDetailMode === 'FREEFORM' ? (
                <p className="text-xs text-gray-400">{transportNotes ? 'Free text added' : 'Optional — add transport info'}</p>
              ) : (
                <p className="text-xs text-gray-400">Structured legs</p>
              ))}
            </div>
          </div>
          {transportOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </button>

        {transportOpen && (
          <div className="px-4 pb-4 pt-1 space-y-4 border-t border-gray-100">
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setTransportDetailMode('FREEFORM')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-sm font-semibold border-2 transition-all ${transportDetailMode === 'FREEFORM' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500'}`}>
                <AlignLeft className="h-3.5 w-3.5" /> Free text
              </button>
              <button type="button" onClick={() => setTransportDetailMode('STRUCTURED')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-sm font-semibold border-2 transition-all ${transportDetailMode === 'STRUCTURED' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500'}`}>
                <Plus className="h-3.5 w-3.5" /> Build it out
              </button>
            </div>
            {transportDetailMode === 'FREEFORM' ? (
              <textarea value={transportNotes} onChange={e => setTransportNotes(e.target.value)} rows={4}
                placeholder={"Train Departs: 9:45 AM from London Waterloo (arriving Guildford 10:24 AM).\nReturn: Open return — last train ~22:30.\nTrain ticket: approx £12 with Network Railcard."}
                className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-700 placeholder-gray-300" />
            ) : (
              <div className="space-y-4">
                {['OUTBOUND', 'RETURN'].map(direction => {
                  const leg = transportLegs[direction]
                  const isReturn = direction === 'RETURN'
                  const modeOptions = [
                    { value: 'TRAIN', icon: <Train className="h-3.5 w-3.5" />, label: 'Train' },
                    { value: 'CAR', icon: <Car className="h-3.5 w-3.5" />, label: 'Car' },
                    { value: 'BUS', icon: <Bus className="h-3.5 w-3.5" />, label: 'Bus' },
                    { value: 'WALK', icon: <Footprints className="h-3.5 w-3.5" />, label: 'Walk' },
                    { value: 'OTHER', icon: <MapPin className="h-3.5 w-3.5" />, label: 'Other' },
                  ]
                  return (
                    <div key={direction} className="space-y-3">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{isReturn ? '↩ Return' : '→ Outbound'}</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {modeOptions.map(opt => (
                          <button key={opt.value} type="button" onClick={() => updateTransportLeg(direction, 'mode', opt.value)}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${leg.mode === opt.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 bg-white'}`}>
                            {opt.icon} {opt.label}
                          </button>
                        ))}
                      </div>
                      {isReturn && (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={leg.openReturn} onChange={e => updateTransportLeg(direction, 'openReturn', e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                          <span className="text-sm text-gray-700 font-medium">Open return</span>
                        </label>
                      )}
                      {!(isReturn && leg.openReturn) && (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <input type="text" value={leg.departureLocation} onChange={e => updateTransportLeg(direction, 'departureLocation', e.target.value)} placeholder="From"
                              className="px-3 py-2 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                            <input type="text" value={leg.arrivalLocation} onChange={e => updateTransportLeg(direction, 'arrivalLocation', e.target.value)} placeholder="To"
                              className="px-3 py-2 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input type="text" value={leg.departureTime} onChange={e => updateTransportLeg(direction, 'departureTime', e.target.value)} placeholder="Departs (e.g. 9:45 AM)"
                              className="px-3 py-2 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                            <input type="text" value={leg.arrivalTime} onChange={e => updateTransportLeg(direction, 'arrivalTime', e.target.value)} placeholder="Arrives (e.g. 10:24 AM)"
                              className="px-3 py-2 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                          </div>
                        </div>
                      )}
                      {direction === 'OUTBOUND' && <hr className="border-gray-100" />}
                    </div>
                  )
                })}
                <input type="text" value={transportLegNotes} onChange={e => setTransportLegNotes(e.target.value)}
                  placeholder="Notes (e.g. approx £12 with Network Railcard)"
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )

  const renderMobileDetailsContent = () => (
    <div className="px-4 pt-6 pb-36 space-y-6">
      <div className="pb-1">
        <h1 className="text-2xl font-extrabold text-gray-900 leading-tight flex items-center gap-2.5">
          <span className="text-3xl">⛰️</span>
          Update details
        </h1>
        <p className="text-sm text-gray-400 mt-1">Edit difficulty, stats, and requirements</p>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Difficulty level</label>
        <div className="grid grid-cols-2 gap-2.5">
          {DIFFICULTY_OPTIONS.map(opt => {
            const selected = watchedDifficultyLevel === opt.value
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
            const selected = watchedPaceLevel === opt.value
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

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Distance (km)</label>
          <input
            type="number"
            step="0.1"
            value={watch('distanceKm') || ''}
            onChange={(e) => { setValue('distanceKm', e.target.value); updateFormData({ distanceKm: e.target.value }) }}
            className="w-full px-3 py-4 text-sm border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            placeholder="15.5"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Elevation (m)</label>
          <input
            type="number"
            value={watch('elevationGainM') || ''}
            onChange={(e) => { setValue('elevationGainM', e.target.value); updateFormData({ elevationGainM: e.target.value }) }}
            className="w-full px-3 py-4 text-sm border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            placeholder="600"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Max participants</label>
        <input
          type="number"
          value={watch('maxParticipants') || ''}
          onChange={(e) => { setValue('maxParticipants', e.target.value); updateFormData({ maxParticipants: e.target.value }) }}
          className="w-full px-4 py-4 text-[15px] border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
          placeholder="20 (leave empty for unlimited)"
        />
      </div>

      {watch('maxParticipants') && (
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Max waitlist</label>
          <input
            type="number"
            value={watch('maxWaitlist') || ''}
            onChange={(e) => { setValue('maxWaitlist', e.target.value); updateFormData({ maxWaitlist: e.target.value }) }}
            className="w-full px-4 py-4 text-[15px] border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            placeholder="10 (leave empty for no waitlist)"
          />
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Required gear</label>
        <TagInput
          tags={selectedRequirements}
          onChange={setSelectedRequirements}
          placeholder="Type item and press Enter..."
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Cost per person (£)</label>
        <input
          type="number"
          step="0.01"
          value={watch('price') || ''}
          onChange={(e) => { setValue('price', e.target.value); updateFormData({ price: e.target.value }) }}
          className="w-full px-4 py-4 text-[15px] border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
          placeholder="0.00 (leave empty if free)"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Host / Guide *</label>
        <MemberAutocomplete
          groupId={event?.groupId}
          value={watchedHostName}
          onChange={(value) => {
            if (typeof value === 'object' && value.id) {
              setValue('hostMemberId', value.id)
              setValue('hostName', value.name)
              updateFormData({ hostMemberId: value.id, hostName: value.name })
            } else {
              setValue('hostMemberId', null)
              setValue('hostName', value)
              updateFormData({ hostName: value })
            }
          }}
          error={errors.hostName?.message}
        />
        <input type="hidden" {...register('hostMemberId')} />
        <input type="hidden" {...register('hostName', { required: 'Host name is required' })} />
        {errors.hostName && <p className="text-red-500 text-xs mt-1.5">⚠ {errors.hostName.message}</p>}
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

  const renderMobileReviewContent = () => (
    <div className="px-4 pt-6 pb-36 space-y-4">
      <div className="pb-1">
        <h1 className="text-2xl font-extrabold text-gray-900 leading-tight flex items-center gap-2.5">
          <span className="text-3xl">✅</span>
          Review changes
        </h1>
        <p className="text-sm text-gray-400 mt-1">Everything look good? Tap update to save</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Basics</p>
          <button type="button" onClick={() => goToStep(STEPS.BASICS)} className="text-xs font-semibold text-purple-600 active:opacity-60">Edit</button>
        </div>
        <p className="font-bold text-gray-900 text-base mb-2">{formData.title || '—'}</p>
        <p className="text-sm text-gray-600 flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-gray-400" />
          {formData.eventDate} at {formData.startTime}
        </p>
        {(formData.endDate || formData.endTime) && (
          <p className="text-sm text-gray-600 flex items-center gap-1.5 mt-1">
            <Clock className="h-3.5 w-3.5 text-gray-400" />
            Ends: {formData.endDate || formData.eventDate} {formData.endTime ? `at ${formData.endTime}` : ''}
          </p>
        )}
        {formData.imageUrl && (
          <img src={formData.imageUrl} alt="" className="w-full h-28 object-cover rounded-xl mt-3" />
        )}
        {formData.description && (
          <p className="text-xs text-gray-600 mt-2 line-clamp-3 leading-relaxed">{formData.description.replace(/[#*_[\]()]/g, '')}</p>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Location</p>
          <button type="button" onClick={() => goToStep(STEPS.LOCATION)} className="text-xs font-semibold text-purple-600 active:opacity-60">Edit</button>
        </div>
        <p className="text-sm text-gray-700 font-medium">{formData.location || '—'}</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Details</p>
          <button type="button" onClick={() => goToStep(STEPS.DETAILS)} className="text-xs font-semibold text-purple-600 active:opacity-60">Edit</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.difficultyLevel && (
            <span className="px-2.5 py-1 bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold rounded-lg">{formData.difficultyLevel}</span>
          )}
          {formData.paceLevel && (
            <span className="px-2.5 py-1 bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold rounded-lg">
              {PACE_OPTIONS.find(o => o.value === formData.paceLevel)?.icon} {formData.paceLevel}
            </span>
          )}
          {formData.distanceKm && (
            <span className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded-lg">{formData.distanceKm} km</span>
          )}
          {formData.elevationGainM && (
            <span className="px-2.5 py-1 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-lg">↑ {formData.elevationGainM} m</span>
          )}
          {formData.maxParticipants && (
            <span className="px-2.5 py-1 bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold rounded-lg">{formData.maxParticipants} max</span>
          )}
          {(Number(formData.price) > 0) && (
            <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold rounded-lg">£{formData.price}</span>
          )}
        </div>
        {selectedRequirements.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-semibold text-gray-500 mb-1.5">Required gear</p>
            <div className="flex flex-wrap gap-1.5">
              {selectedRequirements.map((item, i) => (
                <span key={i} className="px-2.5 py-1 bg-purple-50 border border-purple-200 text-purple-700 text-xs font-medium rounded-lg">{item}</span>
              ))}
            </div>
          </div>
        )}
        {formData.hostName && (
          <p className="text-sm text-gray-600 mt-2 flex items-center gap-1.5">
            <UserPlus className="h-3.5 w-3.5 text-gray-400" />
            {formData.hostName}
          </p>
        )}
        {joinQuestionEnabled && (formData.joinQuestion || watch('joinQuestion')) && (
          <div className="mt-3">
            <p className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-gray-400" />
              Join question
            </p>
            <p className="text-xs text-gray-600 italic">"{formData.joinQuestion || watch('joinQuestion')}"</p>
          </div>
        )}
      </div>

      {(transportDetailMode === 'FREEFORM' ? !!transportNotes : (transportLegs.OUTBOUND.departureLocation || transportLegs.OUTBOUND.departureTime || transportLegs.RETURN.openReturn || transportLegs.RETURN.departureLocation)) && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Getting here</p>
            <button type="button" onClick={() => goToStep(STEPS.DETAILS)} className="text-xs font-semibold text-purple-600 active:opacity-60">Edit</button>
          </div>
          {transportDetailMode === 'FREEFORM' ? (
            <p className="text-xs text-gray-600 leading-relaxed">{transportNotes}</p>
          ) : (
            <div className="space-y-2">
              {(transportLegs.OUTBOUND.departureLocation || transportLegs.OUTBOUND.departureTime) && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">→ Outbound</p>
                  <p className="text-xs text-gray-700 font-medium">
                    {transportLegs.OUTBOUND.mode}
                    {transportLegs.OUTBOUND.departureLocation && ` · ${transportLegs.OUTBOUND.departureLocation}`}
                    {transportLegs.OUTBOUND.arrivalLocation && ` → ${transportLegs.OUTBOUND.arrivalLocation}`}
                    {transportLegs.OUTBOUND.departureTime && ` · ${transportLegs.OUTBOUND.departureTime}`}
                    {transportLegs.OUTBOUND.arrivalTime && ` → ${transportLegs.OUTBOUND.arrivalTime}`}
                  </p>
                </div>
              )}
              {(transportLegs.RETURN.openReturn || transportLegs.RETURN.departureLocation || transportLegs.RETURN.departureTime) && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">↩ Return</p>
                  <p className="text-xs text-gray-700 font-medium">
                    {transportLegs.RETURN.openReturn ? 'Open return' : (
                      <>
                        {transportLegs.RETURN.mode}
                        {transportLegs.RETURN.departureLocation && ` · ${transportLegs.RETURN.departureLocation}`}
                        {transportLegs.RETURN.arrivalLocation && ` → ${transportLegs.RETURN.arrivalLocation}`}
                        {transportLegs.RETURN.departureTime && ` · ${transportLegs.RETURN.departureTime}`}
                        {transportLegs.RETURN.arrivalTime && ` → ${transportLegs.RETURN.arrivalTime}`}
                      </>
                    )}
                  </p>
                </div>
              )}
              {transportLegNotes && <p className="text-xs text-gray-500 mt-1">{transportLegNotes}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  )

  const renderMobileLayout = () => (
    <div className="sm:hidden fixed top-16 left-0 right-0 bottom-0 z-40 flex flex-col bg-gray-50">
      {renderMobileProgressBar()}
      <form
        onSubmit={handleSubmit(currentStep === STEPS.REVIEW ? onFinalSubmit : onStepSubmit)}
        className="flex flex-col flex-1 min-h-0"
      >
        <div className="flex-1 overflow-y-auto">
          {currentStep === STEPS.BASICS && renderMobileBasicsContent()}
          {currentStep === STEPS.LOCATION && renderMobileLocationContent()}
          {currentStep === STEPS.DETAILS && renderMobileDetailsContent()}
          {currentStep === STEPS.REVIEW && renderMobileReviewContent()}
        </div>
        <div className="flex-none px-4 py-4 bg-white border-t border-gray-100 shadow-md">
          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-2xl text-base active:scale-95 transition-all shadow-lg"
          >
            {currentStep === STEPS.REVIEW ? '✅ Update Event' : 'Continue →'}
          </button>
        </div>
      </form>
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

  // ============================================================
  // RENDER FUNCTIONS
  // ============================================================
  
  // PROGRESS BAR - Visual indicator of current step
  const renderProgressBar = () => {
    const progress = ((currentStep + 1) / Object.keys(STEPS).length) * 100
    
    return (
      <div className="mb-10">
        <div className="flex items-center justify-center mb-4">
          <div className="flex items-center w-full" style={{ maxWidth: '600px' }}>
            {Object.keys(STEPS).map((_, index) => (
              <div key={index} className={`flex items-center ${index < Object.keys(STEPS).length - 1 ? 'flex-1' : 'flex-none'}`}>
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
  // PAST EVENT CHECK - Cannot edit past events
  // ============================================================
  const eventDate = new Date(event.eventDate)
  const now = new Date()
  const isPastEvent = eventDate < now

  if (isPastEvent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white/90 backdrop-blur-lg rounded-3xl p-10 shadow-2xl shadow-orange-500/10 border-2 border-orange-200">
            <div className="text-center">
              {/* Warning Icon */}
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-orange-400 to-red-500 rounded-full mb-6 shadow-2xl shadow-orange-500/30">
                <Clock className="h-12 w-12 text-white" />
              </div>
              
              {/* Title */}
              <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600 mb-4">
                Cannot Edit Past Event
              </h2>
              
              {/* Message */}
              <p className="text-gray-700 text-lg mb-3 leading-relaxed">
                This event has already taken place and cannot be edited.
              </p>
              <p className="text-gray-600 text-base mb-8">
                Past events are locked to preserve event history and maintain data integrity.
              </p>
              
              {/* Event Info */}
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 mb-8 border-2 border-orange-200">
                <h3 className="font-bold text-gray-900 text-xl mb-3">{event.title}</h3>
                <div className="flex items-center justify-center gap-2 text-gray-700">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <span className="font-medium">
                    {new Date(event.eventDate).toLocaleDateString('en-GB', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate(`/events/${id}`)}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="h-5 w-5" />
                  View Event Details
                </button>
                <button
                  onClick={() => navigate(`/groups/${event.groupId}`)}
                  className="px-8 py-4 bg-white text-gray-700 border-2 border-gray-300 rounded-xl font-bold hover:border-purple-500 hover:text-purple-600 transition-all"
                >
                  Back to Group
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ============================================================
  // MAIN COMPONENT RETURN
  // ============================================================
  return (
    <>
      {renderMobileLayout()}
      <div className="hidden sm:block min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-8 px-4 pb-8">
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
                
                {/* Event Title */}
                <div>
                  <label htmlFor="title" className="flex items-center gap-2 text-base font-bold text-gray-900 mb-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg">
                      <Mountain className="h-4 w-4 text-white" />
                    </div>
                    Event Title <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                    <input
                      {...register('title', { required: 'Title is required' })}
                      type="text"
                      className="relative w-full pl-14 pr-4 py-5 text-lg border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 font-medium transition-all shadow-sm hover:shadow-md hover:border-purple-300 bg-white"
                      placeholder="e.g., Morning Hike at Box Hill"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-500">
                      <Mountain className="h-6 w-6" />
                    </div>
                  </div>
                  {errors.title && <p className="text-red-500 text-sm mt-2 flex items-center gap-1"><span>⚠️</span>{errors.title.message}</p>}
                </div>

                {/* Date & Time Fields */}
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
                        min={new Date().toISOString().split('T')[0]}
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
                
                {/* End Date & Time (Optional) */}
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
                        min={selectedDate || new Date().toISOString().split('T')[0]}
                        className="relative w-full pl-14 pr-4 py-5 text-lg border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium transition-all shadow-sm hover:shadow-md hover:border-indigo-300 bg-white"
                      />
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500">
                        <Calendar className="h-6 w-6" />
                      </div>
                    </div>
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

                {/* Featured Photo */}
                <div>
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

                {/* Description */}
                <div>
                  <label htmlFor="description" className="flex items-center gap-2 text-base font-bold text-gray-900 mb-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg">
                      <Info className="h-4 w-4 text-white" />
                    </div>
                    About This Event
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
                  <label htmlFor="location" className="flex items-center gap-2 text-base font-bold text-gray-900 mb-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-orange-500 shadow-lg">
                      <MapPin className="h-4 w-4 text-white" />
                    </div>
                    Hiking location <span className="text-red-500">*</span>
                  </label>
                  <GooglePlacesAutocomplete
                    value={watchedLocation}
                    onChange={(value) => setValue('location', value)}
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

                {watchedLatitude && watchedLongitude && (
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
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
                )}

                {/* Getting there */}
                <div className="border border-gray-200 rounded-2xl overflow-hidden">
                  <button type="button" onClick={() => setTransportOpen(prev => !prev)}
                    className="w-full flex items-center justify-between px-4 py-3.5 bg-white text-left">
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500">
                        <Train className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">Getting there</p>
                        {!transportOpen && (transportDetailMode === 'FREEFORM' ? (
                          <p className="text-xs text-gray-400">{transportNotes ? 'Free text added' : 'Optional — add transport info'}</p>
                        ) : (
                          <p className="text-xs text-gray-400">Structured legs</p>
                        ))}
                      </div>
                    </div>
                    {transportOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                  </button>
                  {transportOpen && (
                    <div className="px-4 pb-4 pt-1 space-y-4 border-t border-gray-100">
                      <div className="flex gap-2 pt-1">
                        <button type="button" onClick={() => setTransportDetailMode('FREEFORM')}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-sm font-semibold border-2 transition-all ${transportDetailMode === 'FREEFORM' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500'}`}>
                          <AlignLeft className="h-3.5 w-3.5" /> Free text
                        </button>
                        <button type="button" onClick={() => setTransportDetailMode('STRUCTURED')}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-sm font-semibold border-2 transition-all ${transportDetailMode === 'STRUCTURED' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500'}`}>
                          <Plus className="h-3.5 w-3.5" /> Build it out
                        </button>
                      </div>
                      {transportDetailMode === 'FREEFORM' ? (
                        <textarea value={transportNotes} onChange={e => setTransportNotes(e.target.value)} rows={4}
                          placeholder={"Train Departs: 9:45 AM from London Waterloo (arriving Guildford 10:24 AM).\nReturn: Open return — last train ~22:30.\nTrain ticket: approx £12 with Network Railcard."}
                          className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-700 placeholder-gray-300" />
                      ) : (
                        <div className="space-y-4">
                          {['OUTBOUND', 'RETURN'].map(direction => {
                            const leg = transportLegs[direction]
                            const isReturn = direction === 'RETURN'
                            const modeOptions = [
                              { value: 'TRAIN', icon: <Train className="h-3.5 w-3.5" />, label: 'Train' },
                              { value: 'CAR', icon: <Car className="h-3.5 w-3.5" />, label: 'Car' },
                              { value: 'BUS', icon: <Bus className="h-3.5 w-3.5" />, label: 'Bus' },
                              { value: 'WALK', icon: <Footprints className="h-3.5 w-3.5" />, label: 'Walk' },
                              { value: 'OTHER', icon: <MapPin className="h-3.5 w-3.5" />, label: 'Other' },
                            ]
                            return (
                              <div key={direction} className="space-y-3">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{isReturn ? '↩ Return' : '→ Outbound'}</p>
                                <div className="flex gap-1.5 flex-wrap">
                                  {modeOptions.map(opt => (
                                    <button key={opt.value} type="button" onClick={() => updateTransportLeg(direction, 'mode', opt.value)}
                                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${leg.mode === opt.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 bg-white'}`}>
                                      {opt.icon} {opt.label}
                                    </button>
                                  ))}
                                </div>
                                {isReturn && (
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={leg.openReturn} onChange={e => updateTransportLeg(direction, 'openReturn', e.target.checked)}
                                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                    <span className="text-sm text-gray-700 font-medium">Open return</span>
                                  </label>
                                )}
                                {!(isReturn && leg.openReturn) && (
                                  <div className="space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                      <input type="text" value={leg.departureLocation} onChange={e => updateTransportLeg(direction, 'departureLocation', e.target.value)} placeholder="From"
                                        className="px-3 py-2 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                                      <input type="text" value={leg.arrivalLocation} onChange={e => updateTransportLeg(direction, 'arrivalLocation', e.target.value)} placeholder="To"
                                        className="px-3 py-2 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <input type="text" value={leg.departureTime} onChange={e => updateTransportLeg(direction, 'departureTime', e.target.value)} placeholder="Departs (e.g. 9:45 AM)"
                                        className="px-3 py-2 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                                      <input type="text" value={leg.arrivalTime} onChange={e => updateTransportLeg(direction, 'arrivalTime', e.target.value)} placeholder="Arrives (e.g. 10:24 AM)"
                                        className="px-3 py-2 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                                    </div>
                                  </div>
                                )}
                                {direction === 'OUTBOUND' && <hr className="border-gray-100" />}
                              </div>
                            )
                          })}
                          <input type="text" value={transportLegNotes} onChange={e => setTransportLegNotes(e.target.value)}
                            placeholder="Notes (e.g. approx £12 with Network Railcard)"
                            className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                      )}
                    </div>
                  )}
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
                          ${watchedDifficultyLevel === option.value
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

              {/* ========== PACE LEVEL ========== */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 border-2 border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Timer className="h-5 w-5 text-purple-600" />
                    Pace
                  </label>
                  <Link
                    to="/pace-faq"
                    className="flex items-center gap-1 text-sm font-semibold text-purple-600 hover:text-purple-800 transition-colors"
                  >
                    <Info className="h-4 w-4" />
                    What do these mean?
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {PACE_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={`
                        relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all
                        ${watchedPaceLevel === option.value
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'}
                      `}
                    >
                      <input
                        type="radio"
                        {...register('paceLevel')}
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
                <label htmlFor="maxParticipants" className="flex items-center gap-2 text-base font-bold text-gray-900 mb-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 shadow-lg">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  Max Participants
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                  <input
                    {...register('maxParticipants')}
                    type="number"
                    className="relative w-full pl-14 pr-4 py-5 text-lg border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500 font-medium transition-all shadow-sm hover:shadow-md hover:border-teal-300 bg-white"
                    placeholder="20"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-500">
                    <Users className="h-6 w-6" />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2 ml-1">💡 Leave blank for unlimited participants</p>
              </div>

              {/* ========== REQUIRED GEAR (Custom Tags) ========== */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
                <h3 className="font-bold text-gray-900 text-lg mb-3 flex items-center gap-2">
                  <Backpack className="h-5 w-5 text-purple-600" />
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
                <label htmlFor="price" className="flex items-center gap-2 text-base font-bold text-gray-900 mb-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg">
                    <DollarSign className="h-4 w-4 text-white" />
                  </div>
                  Cost per Person (£)
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                  <input
                    {...register('price')}
                    type="number"
                    step="0.01"
                    className="relative w-full pl-14 pr-4 py-5 text-lg border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 font-medium transition-all shadow-sm hover:shadow-md hover:border-amber-300 bg-white"
                    placeholder="0.00"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500">
                    <DollarSign className="h-6 w-6" />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2 ml-1">💡 Leave as 0 if the hike is free</p>
              </div>

              {/* ========== HOSTED BY ========== */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-indigo-200">
                <label htmlFor="hostName" className="block text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-indigo-600" />
                  Hosted by <span className="text-red-500">*</span>
                </label>
                <MemberAutocomplete
                  groupId={event?.groupId}
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
                      {formData.paceLevel && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <span className="font-semibold">Pace:</span> {PACE_OPTIONS.find(o => o.value === formData.paceLevel)?.icon} {formData.paceLevel}
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
                    {joinQuestionEnabled && (formData.joinQuestion || watch('joinQuestion')) && (
                      <div className="mt-4 bg-purple-50 p-3 rounded-lg">
                        <p className="font-semibold text-sm mb-1 flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-indigo-600" />
                          Join question:
                        </p>
                        <p className="text-gray-700 ml-6 italic">"{formData.joinQuestion || watch('joinQuestion')}"</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* ========== REVIEW: TRANSPORT SECTION ========== */}
                {(transportDetailMode === 'FREEFORM' ? !!transportNotes : (transportLegs.OUTBOUND.departureLocation || transportLegs.OUTBOUND.departureTime || transportLegs.RETURN.openReturn || transportLegs.RETURN.departureLocation)) && (
                <div className="bg-white rounded-2xl p-6 border-2 border-blue-200 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                      <Train className="h-6 w-6 text-blue-600" />
                      Getting here
                    </h3>
                    <button
                      type="button"
                      onClick={() => goToStep(STEPS.DETAILS)}
                      className="py-2 px-4 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg font-semibold flex items-center gap-1 text-sm transition-all"
                    >
                      <Edit2 className="h-4 w-4" /> Edit
                    </button>
                  </div>
                  {transportDetailMode === 'FREEFORM' ? (
                    <p className="text-gray-700 text-sm whitespace-pre-line">{transportNotes}</p>
                  ) : (
                    <div className="space-y-3">
                      {(transportLegs.OUTBOUND.departureLocation || transportLegs.OUTBOUND.departureTime) && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">→ Outbound</p>
                          <p className="text-sm text-gray-700 font-medium">
                            {transportLegs.OUTBOUND.mode}
                            {transportLegs.OUTBOUND.departureLocation && ` · ${transportLegs.OUTBOUND.departureLocation}`}
                            {transportLegs.OUTBOUND.arrivalLocation && ` → ${transportLegs.OUTBOUND.arrivalLocation}`}
                            {transportLegs.OUTBOUND.departureTime && ` · ${transportLegs.OUTBOUND.departureTime}`}
                            {transportLegs.OUTBOUND.arrivalTime && ` → ${transportLegs.OUTBOUND.arrivalTime}`}
                          </p>
                        </div>
                      )}
                      {(transportLegs.RETURN.openReturn || transportLegs.RETURN.departureLocation || transportLegs.RETURN.departureTime) && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">↩ Return</p>
                          <p className="text-sm text-gray-700 font-medium">
                            {transportLegs.RETURN.openReturn ? 'Open return' : (
                              <>
                                {transportLegs.RETURN.mode}
                                {transportLegs.RETURN.departureLocation && ` · ${transportLegs.RETURN.departureLocation}`}
                                {transportLegs.RETURN.arrivalLocation && ` → ${transportLegs.RETURN.arrivalLocation}`}
                                {transportLegs.RETURN.departureTime && ` · ${transportLegs.RETURN.departureTime}`}
                                {transportLegs.RETURN.arrivalTime && ` → ${transportLegs.RETURN.arrivalTime}`}
                              </>
                            )}
                          </p>
                        </div>
                      )}
                      {transportLegNotes && (
                        <p className="text-sm text-gray-500 mt-1">{transportLegNotes}</p>
                      )}
                    </div>
                  )}
                </div>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            {/* Desktop / Tablet */}
            <div className="hidden sm:flex justify-between mt-8 pt-6 border-t-2 border-gray-100">
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
    </>
  )
}
