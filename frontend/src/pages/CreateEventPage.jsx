import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { MapPin, Clock, FileText, Users, ArrowRight, ArrowLeft, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const STEPS = {
  LOCATION: 0,
  TRAVEL: 1,
  TIME: 2,
  DESCRIPTION: 3,
  GPX: 4,
  SOCIAL: 5,
  REVIEW: 6
}

const STEP_TITLES = {
  [STEPS.LOCATION]: 'Where are we going?',
  [STEPS.TRAVEL]: 'How do we get there?',
  [STEPS.TIME]: 'When does it happen?',
  [STEPS.DESCRIPTION]: 'Tell us about the event',
  [STEPS.GPX]: 'Route details (optional)',
  [STEPS.SOCIAL]: 'Social arrangements (optional)',
  [STEPS.REVIEW]: 'Review & Create'
}

const DIFFICULTY_OPTIONS = [
  { value: 'EASY', label: 'Easy' },
  { value: 'MODERATE', label: 'Moderate' },
  { value: 'CHALLENGING', label: 'Challenging' },
  { value: 'EXPERT', label: 'Expert' }
]

export default function CreateEventPage() {
  const [currentStep, setCurrentStep] = useState(STEPS.LOCATION)
  const [formData, setFormData] = useState({})
  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm()
  const navigate = useNavigate()

  const watchedValues = watch()

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
    // Map form data to DTO
    const payload = {
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
      price: data.price ? Number(data.price) : 0,
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
      const res = await fetch('http://localhost:8080/api/v1/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Failed to create event')
      toast.success('Event created successfully!')
      navigate('/events')
    } catch (error) {
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
        <label htmlFor="activityTypeId" className="block text-sm font-medium text-gray-700 mb-2">Activity Type ID *</label>
        <input {...register('activityTypeId', { required: 'Activity type is required' })} type="number" className="input" placeholder="e.g., 1" />
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

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Check className="mx-auto h-16 w-16 text-primary-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Confirm</h2>
        <p className="text-gray-600">Preview all event details below. Click Confirm & Submit to create your event.</p>
      </div>

      <div className="space-y-6">
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-2">Location</h3>
          <p>{formData.location}</p>
          {formData.latitude && <p className="text-gray-600">Latitude: {formData.latitude}</p>}
          {formData.longitude && <p className="text-gray-600">Longitude: {formData.longitude}</p>}
        </div>
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-2">Timing</h3>
          <p>Event Date: {formData.eventDate} {formData.startTime && `at ${formData.startTime}`}</p>
          {formData.endDate && <p className="text-gray-600">End: {formData.endDate} {formData.endTime && `at ${formData.endTime}`}</p>}
          {formData.registrationDeadline && <p className="text-gray-600">Registration Deadline: {formData.registrationDeadline}</p>}
        </div>
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-2">Details</h3>
          <p>Title: {formData.title}</p>
          {formData.description && <p className="text-gray-600">{formData.description}</p>}
          {formData.activityTypeId && <p className="text-gray-600">Activity Type ID: {formData.activityTypeId}</p>}
          {formData.difficultyLevel && <p className="text-gray-600">Difficulty: {formData.difficultyLevel}</p>}
        </div>
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-2">Participants & Price</h3>
          {formData.maxParticipants && <p>Max: {formData.maxParticipants}</p>}
          {formData.minParticipants && <p>Min: {formData.minParticipants}</p>}
          <p>Price: £{formData.price || 0}</p>
        </div>
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-2">Route & Images</h3>
          {formData.distanceKm && <p>Distance: {formData.distanceKm} km</p>}
          {formData.elevationGainM && <p>Elevation Gain: {formData.elevationGainM} m</p>}
          {formData.estimatedDurationHours && <p>Estimated Duration: {formData.estimatedDurationHours} hours</p>}
          {formData.imageUrl && <p>Image: <a href={formData.imageUrl} target="_blank" rel="noopener noreferrer" className="underline">{formData.imageUrl}</a></p>}
          {formData.additionalImages && formData.additionalImages.split(',').map((img, i) => <p key={i} className="text-gray-600">Additional: <a href={img.trim()} target="_blank" rel="noopener noreferrer" className="underline">{img.trim()}</a></p>)}
        </div>
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-2">Requirements & Included Items</h3>
          {formData.requirements && <p>Requirements: {formData.requirements}</p>}
          {formData.includedItems && <p>Included: {formData.includedItems}</p>}
        </div>
        {formData.cancellationPolicy && (
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-2">Cancellation Policy</h3>
            <p>{formData.cancellationPolicy}</p>
          </div>
        )}
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
      case STEPS.TRAVEL:
        return renderTravelStep()
      case STEPS.TIME:
        return renderTimeStep()
      case STEPS.DESCRIPTION:
        return renderDescriptionStep()
      case STEPS.GPX:
        return renderGpxStep()
      case STEPS.SOCIAL:
        return renderSocialStep()
      case STEPS.REVIEW:
        return renderReviewStep()
      default:
        return renderLocationStep()
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Event</h1>
        <p className="text-gray-600">{STEP_TITLES[currentStep]}</p>
      </div>

      {renderProgressBar()}

      <div className="card">
        {renderCurrentStep()}
      </div>
    </div>
  )
}
