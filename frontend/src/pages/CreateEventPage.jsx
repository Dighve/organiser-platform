import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { MapPin, Clock, Users, ArrowRight, ArrowLeft, Check, Edit2, Mountain, Compass, Activity, TrendingUp, DollarSign, Info, Upload, UserPlus } from 'lucide-react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { activityTypesAPI, eventsAPI } from '../lib/api'
import toast from 'react-hot-toast'
import GooglePlacesAutocomplete from '../components/GooglePlacesAutocomplete'
import TagInput from '../components/TagInput'

const STEPS = {
  BASICS: 0,
  LOCATION: 1,
  DETAILS: 2,
  REVIEW: 3
}

const STEP_TITLES = {
  [STEPS.BASICS]: 'Start with the basics',
  [STEPS.LOCATION]: 'Where will you hike?',
  [STEPS.DETAILS]: 'Add hike details',
  [STEPS.REVIEW]: 'Review your event'
}

const DIFFICULTY_OPTIONS = [
  { value: 'BEGINNER', label: 'Beginner', description: 'Easy trails, minimal elevation', icon: '🟢' },
  { value: 'INTERMEDIATE', label: 'Intermediate', description: 'Moderate trails, some elevation', icon: '🟡' },
  { value: 'ADVANCED', label: 'Advanced', description: 'Challenging trails, steep sections', icon: '🟠' },
  { value: 'EXPERT', label: 'Expert', description: 'Very challenging, technical terrain', icon: '🔴' }
]

// Removed HIKING_REQUIREMENTS - now using custom tag input
// CHUNK 1: Component Function and State
// Copy this after the HIKING_REQUIREMENTS array (after line 43)

export default function CreateEventPage() {
  const [currentStep, setCurrentStep] = useState(STEPS.BASICS)
  const [formData, setFormData] = useState({})
  const [selectedRequirements, setSelectedRequirements] = useState([])
  const { register, handleSubmit, watch, formState: { errors }, setValue } = useForm()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const groupId = searchParams.get('groupId')
  
  // Redirect if no groupId is provided
  useEffect(() => {
    if (!groupId) {
      toast.error('Events must be created for a specific group')
      navigate('/')
    }
  }, [groupId, navigate])
  
  // Fetch activities
  const { data: activitiesData, isLoading: activitiesLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: () => activityTypesAPI.getAll(),
  })
  
  const activities = activitiesData?.data || []
  const watchedValues = watch()

  // Load saved form data into form fields
  useEffect(() => {
    Object.keys(formData).forEach(key => {
      setValue(key, formData[key])
    })
  }, [currentStep, formData, setValue])

  const updateFormData = (stepData) => {
    setFormData(prev => ({ ...prev, ...stepData }))
  }

  const nextStep = () => {
    if (currentStep < STEPS.REVIEW) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > STEPS.BASICS) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const onStepSubmit = (data) => {
    updateFormData(data)
    nextStep()
  }

  const toggleRequirement = (req) => {
    setSelectedRequirements(prev => 
      prev.includes(req) 
        ? prev.filter(r => r !== req)
        : [...prev, req]
    )
  }

  const onFinalSubmit = async (data) => {
    if (!groupId) {
      toast.error('Group ID is required to create an event')
      return
    }
    
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
      await eventsAPI.createEvent(payload)
      queryClient.invalidateQueries(['groupEvents', groupId])
      queryClient.invalidateQueries(['events'])
      toast.success('🎉 Hike event created successfully!')
      navigate(`/groups/${groupId}`)
    } catch (error) {
      console.error('Error creating event:', error)
      toast.error('Failed to create event. Please try again.')
    }
  }

  const goToStep = (step) => {
    setCurrentStep(step)
  }
// CHUNK 2: Progress Bar
// Copy this after the goToStep function

  const renderProgressBar = () => {
    const progress = ((currentStep + 1) / Object.keys(STEPS).length) * 100
    
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {Object.keys(STEPS).map((_, index) => (
            <div key={index} className="flex items-center flex-1">
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm
                ${index <= currentStep 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
                  : 'bg-gray-200 text-gray-500'}
                transition-all duration-300
              `}>
                {index < currentStep ? <Check className="h-5 w-5" /> : index + 1}
              </div>
              {index < Object.keys(STEPS).length - 1 && (
                <div className={`
                  flex-1 h-1 mx-2
                  ${index < currentStep ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gray-200'}
                  transition-all duration-300
                `} />
              )}
            </div>
          ))}
        </div>
        <p className="text-center text-sm font-semibold text-gray-600">
          Step {currentStep + 1} of {Object.keys(STEPS).length}: {STEP_TITLES[currentStep]}
        </p>
      </div>
    )
  }
// CHUNK 3: Basics Step
// Copy this after the renderProgressBar function

  const renderBasicsStep = () => (
    <form onSubmit={handleSubmit(onStepSubmit)} className="space-y-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-4 shadow-lg">
          <Mountain className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">What's your hike about?</h2>
        <p className="text-gray-600">Give your hiking event a clear, descriptive name and date</p>
      </div>

      <div>
        <label htmlFor="title" className="block text-base font-bold text-gray-900 mb-3">
          Event title *
        </label>
        <input
          {...register('title', { required: 'Event title is required' })}
          type="text"
          className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium transition-all"
          placeholder="e.g., Sunday Morning Hike in Peak District"
        />
        {errors.title && <p className="text-red-500 text-sm mt-2 flex items-center gap-1"><span>⚠️</span>{errors.title.message}</p>}
        <p className="text-sm text-gray-500 mt-2">Choose a name that clearly describes your hike</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="eventDate" className="block text-base font-bold text-gray-900 mb-3">Date *</label>
          <input 
            {...register('eventDate', { required: 'Event date is required' })} 
            type="date" 
            className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium transition-all" 
          />
          {errors.eventDate && <p className="text-red-500 text-sm mt-2 flex items-center gap-1"><span>⚠️</span>{errors.eventDate.message}</p>}
        </div>
        <div>
          <label htmlFor="startTime" className="block text-base font-bold text-gray-900 mb-3">Start time *</label>
          <input 
            {...register('startTime', { required: 'Start time is required' })} 
            type="time" 
            className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium transition-all" 
          />
          {errors.startTime && <p className="text-red-500 text-sm mt-2 flex items-center gap-1"><span>⚠️</span>{errors.startTime.message}</p>}
        </div>
        <div>
          <label htmlFor="endTime" className="block text-base font-bold text-gray-900 mb-3">End time *</label>
          <input 
            {...register('endTime', { required: 'End time is required' })} 
            type="time" 
            className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium transition-all" 
          />
          {errors.endTime && <p className="text-red-500 text-sm mt-2 flex items-center gap-1"><span>⚠️</span>{errors.endTime.message}</p>}
          <p className="text-sm text-gray-500 mt-2">Approximate finish time</p>
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-base font-bold text-gray-900 mb-3">
          Description
        </label>
        <textarea 
          {...register('description')} 
          className="w-full px-4 py-4 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium transition-all min-h-[120px] resize-none" 
          placeholder="Describe your hike, meeting point, what to expect..."
        />
        <p className="text-sm text-gray-500 mt-2">Help hikers know what to expect on this adventure</p>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          className="py-4 px-10 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg rounded-xl hover:shadow-xl hover:shadow-purple-500/50 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none flex items-center gap-2"
          disabled={!watchedValues.title || !watchedValues.eventDate || !watchedValues.startTime || !watchedValues.endTime}
        >
          Continue <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </form>
  )
// CHUNK 4: Location Step (with Google Maps)
// Copy this after the renderBasicsStep function

  const renderLocationStep = () => (
    <form onSubmit={handleSubmit(onStepSubmit)} className="space-y-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 to-orange-500 rounded-2xl mb-4 shadow-lg">
          <MapPin className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Where will you hike?</h2>
        <p className="text-gray-600">Search for your hiking location using Google Maps</p>
      </div>

      <div>
        <label htmlFor="location" className="block text-base font-bold text-gray-900 mb-3">
          Hiking location *
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
          disabled={!watchedValues.location}
        >
          Continue <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </form>
  )
// CHUNK 5: Details Step Part 1 (Difficulty & Trail Stats)
// Copy this after the renderLocationStep function

  const renderDetailsStep = () => (
    <form onSubmit={handleSubmit(onStepSubmit)} className="space-y-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl mb-4 shadow-lg">
          <Compass className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Add hike details</h2>
        <p className="text-gray-600">Help hikers prepare for your adventure</p>
      </div>

      {/* Difficulty Level */}
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

      {/* Hike Stats */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200">
        <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Trail statistics
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Distance (km)</label>
            <input 
              {...register('distanceKm')} 
              type="number" 
              step="0.1" 
              min="0" 
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium transition-all bg-white" 
              placeholder="12.5" 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Elevation gain (m)</label>
            <input 
              {...register('elevationGainM')} 
              type="number" 
              min="0" 
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium transition-all bg-white" 
              placeholder="500" 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Duration (hours)</label>
            <input 
              {...register('estimatedDurationHours')} 
              type="number" 
              step="0.5" 
              min="0" 
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium transition-all bg-white" 
              placeholder="5" 
            />
          </div>
        </div>
      </div>
// CHUNK 6: Details Step Part 2 (Activity Type, Gear, Additional Fields & Buttons)
// Copy this immediately after CHUNK 5 (continues the renderDetailsStep function)

      {/* Group Size */}
      <div>
        <label className="block text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-600" />
          Max participants
        </label>
        <input 
          {...register('maxParticipants')} 
          type="number" 
          min="1" 
          className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium transition-all" 
          placeholder="20" 
        />
        <p className="text-sm text-gray-500 mt-2">Leave blank for unlimited participants</p>
      </div>

      {/* Required Gear */}
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

      {/* Additional Info */}
      <div className="space-y-4">
        <div>
          <label className="block text-base font-bold text-gray-900 mb-3">
            <DollarSign className="inline h-5 w-5 text-green-600 mr-1" />
            Cost per person (£)
          </label>
          <input 
            {...register('price')} 
            type="number" 
            step="0.01" 
            min="0" 
            className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium transition-all" 
            placeholder="0.00" 
          />
          <p className="text-sm text-gray-500 mt-2">Leave as 0 if the hike is free</p>
        </div>

        <div>
          <label className="block text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600" />
            Feature photo
          </label>
          <input 
            {...register('imageUrl')} 
            type="url" 
            className="w-full px-4 py-4 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium transition-all" 
            placeholder="https://example.com/trail-photo.jpg" 
          />
          <p className="text-sm text-gray-500 mt-2">Add a beautiful photo of the trail or location (URL)</p>
        </div>

        <div>
          <label className="block text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-indigo-600" />
            Host / Guide name
          </label>
          <input 
            {...register('hostName')} 
            type="text" 
            className="w-full px-4 py-4 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium transition-all" 
            placeholder="Your name or guide's name" 
          />
          <p className="text-sm text-gray-500 mt-2">Optional: Who will be leading this hike?</p>
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
// CHUNK 7: Review Step Part 1
// Copy this after the renderDetailsStep function

  const renderReviewStep = () => {
    const difficultyOption = DIFFICULTY_OPTIONS.find(opt => opt.value === formData.difficultyLevel)
    
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl mb-4 shadow-lg">
            <Check className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Review your hike</h2>
          <p className="text-gray-600">Everything look good? You can edit any section before publishing</p>
        </div>

        <div className="space-y-4">
          {/* Basics */}
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

          {/* Location */}
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
// CHUNK 8: Review Step Part 2 (Hike Details & Buttons)
// Copy this immediately after CHUNK 7 (continues the renderReviewStep function)

          {/* Hike Details */}
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
              {formData.estimatedDurationHours && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="font-semibold">Duration:</span> {formData.estimatedDurationHours} hrs
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
                <p className="font-semibold text-sm mb-1 flex items-center gap-2">
                  <Upload className="h-4 w-4 text-blue-600" />
                  Feature photo:
                </p>
                <a href={formData.imageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm ml-6 break-all">
                  {formData.imageUrl}
                </a>
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
            className="py-4 px-10 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-lg rounded-xl hover:shadow-2xl hover:shadow-green-500/50 transition-all transform hover:scale-105 flex items-center gap-2" 
            onClick={() => handleSubmit(onFinalSubmit)()}
          >
            <Check className="h-6 w-6" /> Publish Hike Event
          </button>
        </div>
      </div>
    )
  }
// CHUNK 9: Final - Step Renderer & Main Component Return
// Copy this after the renderReviewStep function to complete the component

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
            🏔️ Create a Hike Event
          </h1>
          <p className="text-gray-600 text-lg">Plan an amazing hiking adventure for your group</p>
        </div>
        
        {renderProgressBar()}
        
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200 shadow-2xl">
          {renderCurrentStep()}
        </div>
      </div>
    </div>
  )
}
