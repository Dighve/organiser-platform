import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { MapPin, Clock, FileText, Users, ArrowRight, ArrowLeft, Check, Edit2 } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { activityTypesAPI, eventsAPI } from '../lib/api'
import toast from 'react-hot-toast'

const STEPS = {
  LOCATION: 0,
  TIME: 1,
  DESCRIPTION: 2,
  REVIEW: 3
}

const STEP_TITLES = {
  [STEPS.LOCATION]: 'Where are we going?',
  [STEPS.TIME]: 'When does it happen?',
  [STEPS.DESCRIPTION]: 'Tell us about the event',
  [STEPS.REVIEW]: 'Review & Create'
}

const DIFFICULTY_OPTIONS = [
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
  { value: 'EXPERT', label: 'Expert' }
]

export default function CreateEventPage() {
  const [currentStep, setCurrentStep] = useState(STEPS.LOCATION)
  const [formData, setFormData] = useState({})
  const { register, handleSubmit, watch, formState: { errors }, reset, setValue } = useForm()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const groupId = searchParams.get('groupId')
  
  // Redirect if no groupId is provided (events must be created for a group)
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

  // Load saved form data into form fields when returning to a step
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
    if (currentStep > STEPS.LOCATION) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const onStepSubmit = (data) => {
    updateFormData(data)
    nextStep()
  }

  const onFinalSubmit = async (data) => {
    // Ensure groupId is present
    if (!groupId) {
      toast.error('Group ID is required to create an event')
      return
    }
    
    // Map form data to DTO
    const payload = {
      groupId: Number(groupId),
      title: data.title,
      description: data.description,
      activityTypeId: data.activityTypeId ? Number(data.activityTypeId) : null,
      eventDate: data.eventDate ? new Date(data.eventDate + 'T' + (data.startTime || '00:00')).toISOString() : null,
      endDate: data.endDate ? new Date(data.endDate + 'T' + (data.endTime || '00:00')).toISOString() : null,
      registrationDeadline: data.registrationDeadline ? new Date(data.registrationDeadline).toISOString() : null,
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
      additionalImages: data.additionalImages ? data.additionalImages.split(',').map(s => s.trim()).filter(Boolean) : [],
      requirements: data.requirements ? data.requirements.split(',').map(s => s.trim()).filter(Boolean) : [],
      includedItems: data.includedItems ? data.includedItems.split(',').map(s => s.trim()).filter(Boolean) : [],
      cancellationPolicy: data.cancellationPolicy || null
    }
    try {
      await eventsAPI.createEvent(payload)
      // Invalidate group events query to refresh the events list
      queryClient.invalidateQueries(['groupEvents', groupId])
      queryClient.invalidateQueries(['events'])
      toast.success('Event created successfully!')
      navigate(groupId ? `/groups/${groupId}` : '/')
    } catch (error) {
      console.error('Error creating event:', error)
      toast.error('Failed to create event. Please try again.')
    }
  }

  const renderProgressBar = () => {
    const progress = ((currentStep + 1) / Object.keys(STEPS).length) * 100
    
    return (
      <div className="mb-8">
        <div className="flex justify-between text-sm font-semibold mb-3">
          <span className="text-purple-600">Step {currentStep + 1} of {Object.keys(STEPS).length}</span>
          <span className="text-pink-600">{Math.round(progress)}% complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
          <div 
            className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full transition-all duration-500 ease-in-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    )
  }

  const renderLocationStep = () => (
    <form onSubmit={handleSubmit(onStepSubmit)} className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 to-orange-500 rounded-2xl mb-4 shadow-lg">
          <MapPin className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">📍 Where are we going?</h2>
        <p className="text-gray-600">Enter the main location for this event</p>
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-2">
          🌄 Location *
        </label>
        <input
          {...register('location', { required: 'Location is required' })}
          type="text"
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium transition-all"
          placeholder="e.g., Lake District, Peak District, Snowdonia..."
        />
        {errors.location && <p className="text-red-500 text-sm mt-2 flex items-center gap-1"><span>⚠️</span>{errors.location.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="latitude" className="block text-sm font-semibold text-gray-700 mb-2">🌐 Latitude</label>
          <input {...register('latitude')} type="number" step="any" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium transition-all" placeholder="e.g., 54.456" />
        </div>
        <div>
          <label htmlFor="longitude" className="block text-sm font-semibold text-gray-700 mb-2">🌐 Longitude</label>
          <input {...register('longitude')} type="number" step="any" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium transition-all" placeholder="e.g., -3.123" />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          className="py-3 px-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-xl hover:shadow-purple-500/50 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none flex items-center gap-2"
          disabled={!watchedValues.location}
        >
          Next <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </form>
  )

  // Travel step removed, not present in DTO

  const renderTimeStep = () => (
    <form onSubmit={handleSubmit(onStepSubmit)} className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl mb-4 shadow-lg">
          <Clock className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">⏰ Event Timing</h2>
        <p className="text-gray-600">Set the start, end, and registration deadline</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="eventDate" className="block text-sm font-semibold text-gray-700 mb-2">📅 Event Date *</label>
          <input {...register('eventDate', { required: 'Event date is required' })} type="date" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium transition-all" />
          {errors.eventDate && <p className="text-red-500 text-sm mt-2 flex items-center gap-1"><span>⚠️</span>{errors.eventDate.message}</p>}
        </div>
        <div>
          <label htmlFor="startTime" className="block text-sm font-semibold text-gray-700 mb-2">🕒 Start Time</label>
          <input {...register('startTime')} type="time" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium transition-all" />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-semibold text-gray-700 mb-2">📅 End Date</label>
          <input {...register('endDate')} type="date" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium transition-all" />
        </div>
        <div>
          <label htmlFor="endTime" className="block text-sm font-semibold text-gray-700 mb-2">🕕 End Time</label>
          <input {...register('endTime')} type="time" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium transition-all" />
        </div>
        <div className="col-span-2">
          <label htmlFor="registrationDeadline" className="block text-sm font-semibold text-gray-700 mb-2">⏳ Registration Deadline</label>
          <input {...register('registrationDeadline')} type="date" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium transition-all" />
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button type="button" onClick={prevStep} className="py-3 px-6 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all flex items-center gap-2">
          <ArrowLeft className="h-5 w-5" /> Back
        </button>
        <button type="submit" className="py-3 px-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-xl hover:shadow-purple-500/50 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none flex items-center gap-2" disabled={!watchedValues.eventDate}>
          Next <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </form>
  )

  const renderDescriptionStep = () => (
    <form onSubmit={handleSubmit(onStepSubmit)} className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl mb-4 shadow-lg">
          <FileText className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">📝 Event Details</h2>
        <p className="text-gray-600">Describe the event and set requirements</p>
      </div>

      {/* Basic Info */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 space-y-4 border border-purple-100">
        <h3 className="font-bold text-purple-900 text-lg mb-4">✨ Basic Information</h3>
        <div>
          <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">🎯 Title *</label>
          <input {...register('title', { required: 'Title is required' })} type="text" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium transition-all bg-white" placeholder="e.g., Hiking in the Peak District" />
          {errors.title && <p className="text-red-500 text-sm mt-2 flex items-center gap-1"><span>⚠️</span>{errors.title.message}</p>}
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">📝 Description</label>
          <textarea {...register('description')} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium transition-all bg-white min-h-[100px]" placeholder="Describe the activity, meeting points, etc..." />
        </div>
        <div>
          <label htmlFor="activityTypeId" className="block text-sm font-semibold text-gray-700 mb-2">🏞️ Activity Type *</label>
          {activitiesLoading ? (
            <div className="flex items-center gap-2 text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
              <p>Loading activities...</p>
            </div>
          ) : (
            <select {...register('activityTypeId', { required: 'Activity type is required' })} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium transition-all bg-white">
              <option value="">Select an activity</option>
              {activities.map(activity => (
                <option key={activity.id} value={activity.id}>
                  {activity.name}
                </option>
              ))}
            </select>
          )}
          {errors.activityTypeId && <p className="text-red-500 text-sm mt-2 flex items-center gap-1"><span>⚠️</span>{errors.activityTypeId.message}</p>}
        </div>
      </div>

      {/* Difficulty & Participants */}
      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-6 space-y-4 border border-orange-100">
        <h3 className="font-bold text-orange-900 text-lg mb-4">🎯 Challenge Level</h3>
        <div>
          <label htmlFor="difficultyLevel" className="block text-sm font-semibold text-gray-700 mb-2">⚡ Difficulty Level</label>
          <select {...register('difficultyLevel')} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent font-medium transition-all bg-white">
            <option value="">Select difficulty...</option>
            {DIFFICULTY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="maxParticipants" className="block text-sm font-semibold text-gray-700 mb-2">👥 Max Participants</label>
            <input {...register('maxParticipants')} type="number" min="1" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent font-medium transition-all bg-white" placeholder="e.g., 20" />
          </div>
          <div>
            <label htmlFor="minParticipants" className="block text-sm font-semibold text-gray-700 mb-2">👥 Min Participants</label>
            <input {...register('minParticipants')} type="number" min="1" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent font-medium transition-all bg-white" placeholder="e.g., 1" />
          </div>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 space-y-4 border border-green-100">
        <h3 className="font-bold text-green-900 text-lg mb-4">📊 Activity Stats</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="distanceKm" className="block text-sm font-semibold text-gray-700 mb-2">🚶 Distance (km)</label>
            <input {...register('distanceKm')} type="number" step="any" min="0" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent font-medium transition-all bg-white" placeholder="e.g., 12.5" />
          </div>
          <div>
            <label htmlFor="elevationGainM" className="block text-sm font-semibold text-gray-700 mb-2">⛰️ Elevation Gain (m)</label>
            <input {...register('elevationGainM')} type="number" min="0" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent font-medium transition-all bg-white" placeholder="e.g., 500" />
          </div>
        </div>
        <div>
          <label htmlFor="estimatedDurationHours" className="block text-sm font-semibold text-gray-700 mb-2">⏱️ Estimated Duration (hours)</label>
          <input {...register('estimatedDurationHours')} type="number" step="any" min="0" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent font-medium transition-all bg-white" placeholder="e.g., 5" />
        </div>
      </div>

      {/* Pricing & Images */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 space-y-4 border border-blue-100">
        <h3 className="font-bold text-blue-900 text-lg mb-4">💰 Pricing & Media</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="price" className="block text-sm font-semibold text-gray-700 mb-2">💵 Price (£)</label>
            <input {...register('price')} type="number" step="any" min="0" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium transition-all bg-white" placeholder="e.g., 10.00" />
          </div>
          <div>
            <label htmlFor="imageUrl" className="block text-sm font-semibold text-gray-700 mb-2">🖼️ Image URL</label>
            <input {...register('imageUrl')} type="url" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium transition-all bg-white" placeholder="https://..." />
          </div>
        </div>
        <div>
          <label htmlFor="additionalImages" className="block text-sm font-semibold text-gray-700 mb-2">🖼️ Additional Images (comma separated URLs)</label>
          <input {...register('additionalImages')} type="text" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium transition-all bg-white" placeholder="https://img1, https://img2" />
        </div>
      </div>

      {/* Requirements & Policies */}
      <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-6 space-y-4 border border-red-100">
        <h3 className="font-bold text-red-900 text-lg mb-4">📋 Requirements & Policies</h3>
        <div>
          <label htmlFor="requirements" className="block text-sm font-semibold text-gray-700 mb-2">⚠️ Requirements (comma separated)</label>
          <input {...register('requirements')} type="text" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent font-medium transition-all bg-white" placeholder="e.g., hiking boots, waterproofs" />
        </div>
        <div>
          <label htmlFor="includedItems" className="block text-sm font-semibold text-gray-700 mb-2">✨ Included Items (comma separated)</label>
          <input {...register('includedItems')} type="text" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent font-medium transition-all bg-white" placeholder="e.g., lunch, drinks" />
        </div>
        <div>
          <label htmlFor="cancellationPolicy" className="block text-sm font-semibold text-gray-700 mb-2">🚫 Cancellation Policy</label>
          <textarea {...register('cancellationPolicy')} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent font-medium transition-all bg-white min-h-[80px]" placeholder="Describe the cancellation policy..." />
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button type="button" onClick={prevStep} className="py-3 px-6 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all flex items-center gap-2">
          <ArrowLeft className="h-5 w-5" /> Back
        </button>
        <button type="submit" className="py-3 px-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-xl hover:shadow-purple-500/50 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none flex items-center gap-2" disabled={!watchedValues.title || !watchedValues.activityTypeId || !watchedValues.eventDate}>
          Next <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </form>
  )

  // GPX step removed

  // Social step removed

  const goToStep = (step) => {
    setCurrentStep(step)
  }

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl mb-4 shadow-lg">
          <Check className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">✅ Review & Confirm</h2>
        <p className="text-gray-600">Preview all event details below. Click any Edit button to make changes.</p>
      </div>

      <div className="space-y-4">
        <div className="bg-gradient-to-r from-pink-50 to-orange-50 rounded-2xl p-6 border-2 border-pink-200 hover:border-pink-300 transition-colors">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              <MapPin className="h-6 w-6 text-pink-600" />
              📍 Location
            </h3>
            <button
              type="button"
              onClick={() => goToStep(STEPS.LOCATION)}
              className="py-2 px-4 bg-white text-pink-600 hover:text-pink-700 rounded-lg font-semibold flex items-center gap-1 text-sm shadow-sm hover:shadow transition-all"
            >
              <Edit2 className="h-4 w-4" /> Edit
            </button>
          </div>
          <div className="text-gray-700 space-y-1">
            <p className="font-bold text-lg">{formData.location || 'Not set'}</p>
            {formData.latitude && <p className="text-sm text-gray-600">🌐 Latitude: {formData.latitude}</p>}
            {formData.longitude && <p className="text-sm text-gray-600">🌐 Longitude: {formData.longitude}</p>}
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 border-2 border-purple-200 hover:border-purple-300 transition-colors">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              <Clock className="h-6 w-6 text-purple-600" />
              ⏰ Timing
            </h3>
            <button
              type="button"
              onClick={() => goToStep(STEPS.TIME)}
              className="py-2 px-4 bg-white text-purple-600 hover:text-purple-700 rounded-lg font-semibold flex items-center gap-1 text-sm shadow-sm hover:shadow transition-all"
            >
              <Edit2 className="h-4 w-4" /> Edit
            </button>
          </div>
          <div className="text-gray-700 space-y-2">
            <p><span className="font-semibold">📅 Event Date:</span> {formData.eventDate} {formData.startTime && `at ${formData.startTime}`}</p>
            {formData.endDate && <p className="text-sm text-gray-600">🏁 End: {formData.endDate} {formData.endTime && `at ${formData.endTime}`}</p>}
            {formData.registrationDeadline && <p className="text-sm text-gray-600">⏳ Registration Deadline: {formData.registrationDeadline}</p>}
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl p-6 border-2 border-green-200 hover:border-green-300 transition-colors">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              <FileText className="h-6 w-6 text-green-600" />
              📝 Event Details
            </h3>
            <button
              type="button"
              onClick={() => goToStep(STEPS.DESCRIPTION)}
              className="py-2 px-4 bg-white text-green-600 hover:text-green-700 rounded-lg font-semibold flex items-center gap-1 text-sm shadow-sm hover:shadow transition-all"
            >
              <Edit2 className="h-4 w-4" /> Edit
            </button>
          </div>
          <div className="text-gray-700 space-y-3">
            <p className="font-bold text-xl text-gray-900">{formData.title || 'No title'}</p>
            {formData.description && <p className="text-gray-600">{formData.description}</p>}
            <div className="grid grid-cols-2 gap-3 text-sm mt-3">
              {formData.activityTypeId && <p className="bg-white px-3 py-2 rounded-lg"><span className="font-semibold">🏞️ Activity ID:</span> {formData.activityTypeId}</p>}
              {formData.difficultyLevel && <p className="bg-white px-3 py-2 rounded-lg"><span className="font-semibold">⚡ Difficulty:</span> {formData.difficultyLevel}</p>}
              {formData.maxParticipants && <p className="bg-white px-3 py-2 rounded-lg"><span className="font-semibold">👥 Max:</span> {formData.maxParticipants}</p>}
              {formData.minParticipants && <p className="bg-white px-3 py-2 rounded-lg"><span className="font-semibold">👥 Min:</span> {formData.minParticipants}</p>}
              <p className="bg-white px-3 py-2 rounded-lg"><span className="font-semibold">💵 Price:</span> £{formData.price || 0}</p>
              {formData.distanceKm && <p className="bg-white px-3 py-2 rounded-lg"><span className="font-semibold">🚶 Distance:</span> {formData.distanceKm} km</p>}
              {formData.elevationGainM && <p className="bg-white px-3 py-2 rounded-lg"><span className="font-semibold">⛰️ Elevation:</span> {formData.elevationGainM} m</p>}
              {formData.estimatedDurationHours && <p className="bg-white px-3 py-2 rounded-lg"><span className="font-semibold">⏱️ Duration:</span> {formData.estimatedDurationHours} hrs</p>}
            </div>
            {formData.imageUrl && (
              <div className="mt-3">
                <p className="text-sm font-semibold mb-2">🖼️ Main Image:</p>
                <img src={formData.imageUrl} alt="Event" className="w-full h-48 object-cover rounded-xl shadow-lg" onError={(e) => e.target.style.display = 'none'} />
              </div>
            )}
            {formData.additionalImages && (
              <div className="mt-3">
                <p className="text-sm font-semibold mb-2">🖼️ Additional Images:</p>
                <div className="flex gap-2 flex-wrap">
                  {formData.additionalImages.split(',').map((img, i) => (
                    <img key={i} src={img.trim()} alt={`Additional ${i+1}`} className="w-24 h-24 object-cover rounded-lg shadow" onError={(e) => e.target.style.display = 'none'} />
                  ))}
                </div>
              </div>
            )}
            {formData.requirements && (
              <div className="mt-3 bg-white p-3 rounded-lg">
                <p className="text-sm font-semibold mb-1">⚠️ Requirements:</p>
                <p className="text-sm text-gray-600">{formData.requirements}</p>
              </div>
            )}
            {formData.includedItems && (
              <div className="mt-3 bg-white p-3 rounded-lg">
                <p className="text-sm font-semibold mb-1">✨ Included Items:</p>
                <p className="text-sm text-gray-600">{formData.includedItems}</p>
              </div>
            )}
            {formData.cancellationPolicy && (
              <div className="mt-3 bg-white p-3 rounded-lg">
                <p className="text-sm font-semibold mb-1">🚫 Cancellation Policy:</p>
                <p className="text-sm text-gray-600">{formData.cancellationPolicy}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-8 pt-4">
        <button type="button" onClick={prevStep} className="py-3 px-6 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all flex items-center gap-2">
          <ArrowLeft className="h-5 w-5" /> Back
        </button>
        <button type="button" className="py-4 px-10 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:shadow-2xl hover:shadow-green-500/50 transition-all transform hover:scale-105 flex items-center gap-2" onClick={() => handleSubmit(onFinalSubmit)()}>
          <Check className="h-6 w-6" /> Confirm & Submit
        </button>
      </div>
    </div>
  )

  const renderCurrentStep = () => {
    switch (currentStep) {
      case STEPS.LOCATION:
        return renderLocationStep()
      case STEPS.TIME:
        return renderTimeStep()
      case STEPS.DESCRIPTION:
        return renderDescriptionStep()
      case STEPS.REVIEW:
        return renderReviewStep()
      default:
        return renderLocationStep()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
            {groupId ? '✨ Create Event for Group' : '✨ Create New Event'}
          </h1>
          <p className="text-gray-700 text-lg font-medium">{STEP_TITLES[currentStep]}</p>
        </div>

        {renderProgressBar()}

        <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 border border-gray-100 shadow-2xl">
          {renderCurrentStep()}
        </div>
      </div>
    </div>
  )
}
