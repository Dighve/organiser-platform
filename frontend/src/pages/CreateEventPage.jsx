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
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Step {currentStep + 1} of {Object.keys(STEPS).length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary-600 h-2 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    )
  }

  const renderLocationStep = () => (
    <form onSubmit={handleSubmit(onStepSubmit)} className="space-y-6">
      <div className="text-center mb-8">
        <MapPin className="mx-auto h-16 w-16 text-primary-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Where are we going?</h2>
        <p className="text-gray-600">Enter the main location for this event</p>
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
          Location *
        </label>
        <input
          {...register('location', { required: 'Location is required' })}
          type="text"
          className="input"
          placeholder="e.g., Lake District, Peak District, Snowdonia..."
        />
        {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
          <input {...register('latitude')} type="number" step="any" className="input" placeholder="e.g., 54.456" />
        </div>
        <div>
          <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
          <input {...register('longitude')} type="number" step="any" className="input" placeholder="e.g., -3.123" />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="btn btn-primary flex items-center gap-2"
          disabled={!watchedValues.location}
        >
          Next <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </form>
  )

  // Travel step removed, not present in DTO

  const renderTimeStep = () => (
    <form onSubmit={handleSubmit(onStepSubmit)} className="space-y-6">
      <div className="text-center mb-8">
        <Clock className="mx-auto h-16 w-16 text-primary-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Timing</h2>
        <p className="text-gray-600">Set the start, end, and registration deadline</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700 mb-2">Event Date *</label>
          <input {...register('eventDate', { required: 'Event date is required' })} type="date" className="input" />
          {errors.eventDate && <p className="text-red-500 text-sm mt-1">{errors.eventDate.message}</p>}
        </div>
        <div>
          <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
          <input {...register('startTime')} type="time" className="input" />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
          <input {...register('endDate')} type="date" className="input" />
        </div>
        <div>
          <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
          <input {...register('endTime')} type="time" className="input" />
        </div>
        <div>
          <label htmlFor="registrationDeadline" className="block text-sm font-medium text-gray-700 mb-2">Registration Deadline</label>
          <input {...register('registrationDeadline')} type="date" className="input" />
        </div>
      </div>

      <div className="flex justify-between">
        <button type="button" onClick={prevStep} className="btn btn-outline flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <button type="submit" className="btn btn-primary flex items-center gap-2" disabled={!watchedValues.eventDate}>
          Next <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </form>
  )

  const renderDescriptionStep = () => (
    <form onSubmit={handleSubmit(onStepSubmit)} className="space-y-6">
      <div className="text-center mb-8">
        <FileText className="mx-auto h-16 w-16 text-primary-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Details</h2>
        <p className="text-gray-600">Describe the event and set requirements</p>
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
        <input {...register('title', { required: 'Title is required' })} type="text" className="input" placeholder="e.g., Hiking in the Peak District" />
        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">Description</label>
        <textarea {...register('description')} className="input min-h-[100px]" placeholder="Describe the activity, meeting points, etc..." />
      </div>
      <div>
        <label htmlFor="activityTypeId" className="block text-sm font-medium text-gray-700 mb-2">Activity Type *</label>
        {activitiesLoading ? (
          <p className="text-gray-500">Loading activities...</p>
        ) : (
          <select {...register('activityTypeId', { required: 'Activity type is required' })} className="input">
            <option value="">Select an activity</option>
            {activities.map(activity => (
              <option key={activity.id} value={activity.id}>
                {activity.name}
              </option>
            ))}
          </select>
        )}
        {errors.activityTypeId && <p className="text-red-500 text-sm mt-1">{errors.activityTypeId.message}</p>}
      </div>
      <div>
        <label htmlFor="difficultyLevel" className="block text-sm font-medium text-gray-700 mb-2">Difficulty Level</label>
        <select {...register('difficultyLevel')} className="input">
          <option value="">Select difficulty...</option>
          {DIFFICULTY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="maxParticipants" className="block text-sm font-medium text-gray-700 mb-2">Max Participants</label>
          <input {...register('maxParticipants')} type="number" min="1" className="input" placeholder="e.g., 20" />
        </div>
        <div>
          <label htmlFor="minParticipants" className="block text-sm font-medium text-gray-700 mb-2">Min Participants</label>
          <input {...register('minParticipants')} type="number" min="1" className="input" placeholder="e.g., 1" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">Price (£)</label>
          <input {...register('price')} type="number" step="any" min="0" className="input" placeholder="e.g., 10.00" />
        </div>
        <div>
          <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
          <input {...register('imageUrl')} type="url" className="input" placeholder="https://..." />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="distanceKm" className="block text-sm font-medium text-gray-700 mb-2">Distance (km)</label>
          <input {...register('distanceKm')} type="number" step="any" min="0" className="input" placeholder="e.g., 12.5" />
        </div>
        <div>
          <label htmlFor="elevationGainM" className="block text-sm font-medium text-gray-700 mb-2">Elevation Gain (m)</label>
          <input {...register('elevationGainM')} type="number" min="0" className="input" placeholder="e.g., 500" />
        </div>
      </div>
      <div>
        <label htmlFor="estimatedDurationHours" className="block text-sm font-medium text-gray-700 mb-2">Estimated Duration (hours)</label>
        <input {...register('estimatedDurationHours')} type="number" step="any" min="0" className="input" placeholder="e.g., 5" />
      </div>
      <div>
        <label htmlFor="additionalImages" className="block text-sm font-medium text-gray-700 mb-2">Additional Images (comma separated URLs)</label>
        <input {...register('additionalImages')} type="text" className="input" placeholder="https://img1, https://img2" />
      </div>
      <div>
        <label htmlFor="requirements" className="block text-sm font-medium text-gray-700 mb-2">Requirements (comma separated)</label>
        <input {...register('requirements')} type="text" className="input" placeholder="e.g., hiking boots, waterproofs" />
      </div>
      <div>
        <label htmlFor="includedItems" className="block text-sm font-medium text-gray-700 mb-2">Included Items (comma separated)</label>
        <input {...register('includedItems')} type="text" className="input" placeholder="e.g., lunch, drinks" />
      </div>
      <div>
        <label htmlFor="cancellationPolicy" className="block text-sm font-medium text-gray-700 mb-2">Cancellation Policy</label>
        <textarea {...register('cancellationPolicy')} className="input min-h-[80px]" placeholder="Describe the cancellation policy..." />
      </div>
      <div className="flex justify-between">
        <button type="button" onClick={prevStep} className="btn btn-outline flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <button type="submit" className="btn btn-primary flex items-center gap-2" disabled={!watchedValues.title || !watchedValues.activityTypeId || !watchedValues.eventDate}>
          Next <ArrowRight className="h-4 w-4" />
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
        <Check className="mx-auto h-16 w-16 text-primary-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Confirm</h2>
        <p className="text-gray-600">Preview all event details below. Click any Edit button to make changes.</p>
      </div>

      <div className="space-y-4">
        <div className="card border-2 border-gray-200 hover:border-primary-300 transition-colors">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary-600" />
              Location
            </h3>
            <button
              type="button"
              onClick={() => goToStep(STEPS.LOCATION)}
              className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-sm font-medium"
            >
              <Edit2 className="h-4 w-4" /> Edit
            </button>
          </div>
          <div className="text-gray-700 space-y-1">
            <p className="font-medium">{formData.location || 'Not set'}</p>
            {formData.latitude && <p className="text-sm text-gray-600">Latitude: {formData.latitude}</p>}
            {formData.longitude && <p className="text-sm text-gray-600">Longitude: {formData.longitude}</p>}
          </div>
        </div>

        <div className="card border-2 border-gray-200 hover:border-primary-300 transition-colors">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary-600" />
              Timing
            </h3>
            <button
              type="button"
              onClick={() => goToStep(STEPS.TIME)}
              className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-sm font-medium"
            >
              <Edit2 className="h-4 w-4" /> Edit
            </button>
          </div>
          <div className="text-gray-700 space-y-1">
            <p><span className="font-medium">Event Date:</span> {formData.eventDate} {formData.startTime && `at ${formData.startTime}`}</p>
            {formData.endDate && <p className="text-sm text-gray-600">End: {formData.endDate} {formData.endTime && `at ${formData.endTime}`}</p>}
            {formData.registrationDeadline && <p className="text-sm text-gray-600">Registration Deadline: {formData.registrationDeadline}</p>}
          </div>
        </div>

        <div className="card border-2 border-gray-200 hover:border-primary-300 transition-colors">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary-600" />
              Event Details
            </h3>
            <button
              type="button"
              onClick={() => goToStep(STEPS.DESCRIPTION)}
              className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-sm font-medium"
            >
              <Edit2 className="h-4 w-4" /> Edit
            </button>
          </div>
          <div className="text-gray-700 space-y-2">
            <p className="font-medium text-lg">{formData.title || 'No title'}</p>
            {formData.description && <p className="text-gray-600 text-sm">{formData.description}</p>}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mt-2">
              {formData.activityTypeId && <p><span className="font-medium">Activity Type ID:</span> {formData.activityTypeId}</p>}
              {formData.difficultyLevel && <p><span className="font-medium">Difficulty:</span> {formData.difficultyLevel}</p>}
              {formData.maxParticipants && <p><span className="font-medium">Max Participants:</span> {formData.maxParticipants}</p>}
              {formData.minParticipants && <p><span className="font-medium">Min Participants:</span> {formData.minParticipants}</p>}
              <p><span className="font-medium">Price:</span> £{formData.price || 0}</p>
              {formData.distanceKm && <p><span className="font-medium">Distance:</span> {formData.distanceKm} km</p>}
              {formData.elevationGainM && <p><span className="font-medium">Elevation Gain:</span> {formData.elevationGainM} m</p>}
              {formData.estimatedDurationHours && <p><span className="font-medium">Duration:</span> {formData.estimatedDurationHours} hours</p>}
            </div>
            {formData.imageUrl && (
              <div className="mt-2">
                <p className="text-sm font-medium mb-1">Main Image:</p>
                <img src={formData.imageUrl} alt="Event" className="w-full h-48 object-cover rounded-lg" onError={(e) => e.target.style.display = 'none'} />
              </div>
            )}
            {formData.additionalImages && (
              <div className="mt-2">
                <p className="text-sm font-medium">Additional Images:</p>
                <div className="flex gap-2 flex-wrap mt-1">
                  {formData.additionalImages.split(',').map((img, i) => (
                    <img key={i} src={img.trim()} alt={`Additional ${i+1}`} className="w-20 h-20 object-cover rounded" onError={(e) => e.target.style.display = 'none'} />
                  ))}
                </div>
              </div>
            )}
            {formData.requirements && (
              <div className="mt-2">
                <p className="text-sm font-medium">Requirements:</p>
                <p className="text-sm text-gray-600">{formData.requirements}</p>
              </div>
            )}
            {formData.includedItems && (
              <div className="mt-2">
                <p className="text-sm font-medium">Included Items:</p>
                <p className="text-sm text-gray-600">{formData.includedItems}</p>
              </div>
            )}
            {formData.cancellationPolicy && (
              <div className="mt-2">
                <p className="text-sm font-medium">Cancellation Policy:</p>
                <p className="text-sm text-gray-600">{formData.cancellationPolicy}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button type="button" onClick={prevStep} className="btn btn-outline flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <button type="button" className="btn btn-primary flex items-center gap-2" onClick={() => handleSubmit(onFinalSubmit)()}>
          <Check className="h-4 w-4" /> Confirm & Submit
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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {groupId ? 'Create Event for Group' : 'Create New Event'}
        </h1>
        <p className="text-gray-600">{STEP_TITLES[currentStep]}</p>
      </div>

      {renderProgressBar()}

      <div className="card">
        {renderCurrentStep()}
      </div>
    </div>
  )
}
