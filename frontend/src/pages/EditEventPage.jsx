import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { MapPin, Clock, Users, ArrowRight, ArrowLeft, Check, Edit2, Mountain, Compass, Activity, TrendingUp, DollarSign, Info, Upload, UserPlus } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
  [STEPS.BASICS]: 'Update the basics',
  [STEPS.LOCATION]: 'Update location',
  [STEPS.DETAILS]: 'Update hike details',
  [STEPS.REVIEW]: 'Review your changes'
}

const DIFFICULTY_OPTIONS = [
  { value: 'BEGINNER', label: 'Beginner', description: 'Easy trails, minimal elevation', icon: '🟢' },
  { value: 'INTERMEDIATE', label: 'Intermediate', description: 'Moderate trails, some elevation', icon: '🟡' },
  { value: 'ADVANCED', label: 'Advanced', description: 'Challenging trails, steep sections', icon: '🟠' },
  { value: 'EXPERT', label: 'Expert', description: 'Very challenging, technical terrain', icon: '🔴' }
]

export default function EditEventPage() {
  const [currentStep, setCurrentStep] = useState(STEPS.BASICS)
  const [formData, setFormData] = useState({})
  const [selectedRequirements, setSelectedRequirements] = useState([])
  const { register, handleSubmit, watch, formState: { errors }, setValue } = useForm()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { id } = useParams()
  
  // Fetch the existing event
  const { data: eventData, isLoading: eventLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsAPI.getEventById(id),
  })
  
  const event = eventData?.data
  
  // Pre-fill form with existing event data
  useEffect(() => {
    if (event) {
      // Extract date and time from eventDate
      const eventDate = new Date(event.eventDate)
      const dateStr = eventDate.toISOString().split('T')[0]
      const timeStr = eventDate.toTimeString().slice(0, 5)
      
      const initialData = {
        title: event.title,
        description: event.description,
        eventDate: dateStr,
        startTime: timeStr,
        endTime: event.endDate ? new Date(event.endDate).toTimeString().slice(0, 5) : '',
        location: event.location,
        latitude: event.latitude,
        longitude: event.longitude,
        maxParticipants: event.maxParticipants,
        minParticipants: event.minParticipants,
        price: event.price,
        difficultyLevel: event.difficultyLevel,
        distanceKm: event.distanceKm,
        elevationGainM: event.elevationGainM,
        estimatedDurationHours: event.estimatedDurationHours,
        imageUrl: event.imageUrl,
        includedItems: event.includedItems?.join(', ') || '',
        cancellationPolicy: event.cancellationPolicy
      }
      
      setFormData(initialData)
      setSelectedRequirements(event.requirements || [])
      
      // Set form values
      Object.keys(initialData).forEach(key => {
        setValue(key, initialData[key])
      })
    }
  }, [event, setValue])
  
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
      endDate: data.eventDate && data.endTime ? new Date(data.eventDate + 'T' + data.endTime).toISOString() : null,
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
      additionalImages: [],
      requirements: selectedRequirements,
      includedItems: data.includedItems ? data.includedItems.split(',').map(s => s.trim()).filter(Boolean) : [],
      cancellationPolicy: data.cancellationPolicy || null
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

  const goToStep = (step) => {
    setCurrentStep(step)
  }

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

  if (eventLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 flex items-center justify-center">
        <div className="animate-pulse text-purple-600">Loading event...</div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Event not found</h2>
          <button onClick={() => navigate('/')} className="text-purple-600 hover:underline">Go back home</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/events/${id}`)}
            className="flex items-center text-gray-600 hover:text-purple-600 mb-4 font-semibold transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Event
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
              <Edit2 className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Edit Event
            </h1>
          </div>
          <p className="text-gray-600">Update your event details below</p>
        </div>

        {/* Progress Bar */}
        {renderProgressBar()}

        {/* Form */}
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
          <form onSubmit={handleSubmit(currentStep === STEPS.REVIEW ? onFinalSubmit : onStepSubmit)}>
            
            {/* Step Content */}
            {currentStep === STEPS.BASICS && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Event Title *</label>
                  <input
                    type="text"
                    {...register('title', { required: 'Title is required' })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all"
                    placeholder="e.g., Morning Hike at Box Hill"
                  />
                  {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Description *</label>
                  <textarea
                    {...register('description', { required: 'Description is required' })}
                    rows={6}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all"
                    placeholder="Describe your hike..."
                  />
                  {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Date *</label>
                    <input
                      type="date"
                      {...register('eventDate', { required: 'Date is required' })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all"
                    />
                    {errors.eventDate && <p className="text-red-500 text-sm mt-1">{errors.eventDate.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Start Time *</label>
                    <input
                      type="time"
                      {...register('startTime', { required: 'Start time is required' })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all"
                    />
                    {errors.startTime && <p className="text-red-500 text-sm mt-1">{errors.startTime.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Event Image URL</label>
                  <input
                    type="url"
                    {...register('imageUrl')}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
            )}

            {currentStep === STEPS.LOCATION && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Location *</label>
                  <GooglePlacesAutocomplete
                    onPlaceSelect={(place) => {
                      setValue('location', place.formatted_address)
                      setValue('latitude', place.geometry.location.lat())
                      setValue('longitude', place.geometry.location.lng())
                      updateFormData({
                        location: place.formatted_address,
                        latitude: place.geometry.location.lat(),
                        longitude: place.geometry.location.lng()
                      })
                    }}
                    defaultValue={formData.location}
                  />
                  <input type="hidden" {...register('location', { required: 'Location is required' })} />
                  <input type="hidden" {...register('latitude')} />
                  <input type="hidden" {...register('longitude')} />
                  {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Difficulty Level</label>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Estimated Duration (hours)</label>
                  <input
                    type="number"
                    step="0.5"
                    {...register('estimatedDurationHours')}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all"
                    placeholder="4.5"
                  />
                </div>
              </div>
            )}

            {currentStep === STEPS.DETAILS && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Max Participants</label>
                    <input
                      type="number"
                      {...register('maxParticipants')}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all"
                      placeholder="20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Min Participants</label>
                    <input
                      type="number"
                      {...register('minParticipants')}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all"
                      placeholder="5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Price (£)</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('price')}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Requirements</label>
                  <TagInput
                    tags={selectedRequirements}
                    onTagsChange={setSelectedRequirements}
                    placeholder="Add requirement..."
                    suggestions={['Hiking boots', 'Water bottle', 'Backpack', 'Rain jacket', 'First aid kit']}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Included Items (comma-separated)</label>
                  <input
                    type="text"
                    {...register('includedItems')}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all"
                    placeholder="Guide, Snacks, Maps"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Cancellation Policy</label>
                  <textarea
                    {...register('cancellationPolicy')}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all"
                    placeholder="Full refund if cancelled 48 hours before..."
                  />
                </div>
              </div>
            )}

            {currentStep === STEPS.REVIEW && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
                  <h3 className="font-bold text-xl mb-4 text-purple-900">Review Your Changes</h3>
                  <div className="space-y-3 text-sm">
                    <div><span className="font-semibold">Title:</span> {formData.title}</div>
                    <div><span className="font-semibold">Date:</span> {formData.eventDate} at {formData.startTime}</div>
                    <div><span className="font-semibold">Location:</span> {formData.location || 'Not set'}</div>
                    <div><span className="font-semibold">Difficulty:</span> {formData.difficultyLevel || 'Not set'}</div>
                    <div><span className="font-semibold">Price:</span> £{formData.price || '0.00'}</div>
                    {selectedRequirements.length > 0 && (
                      <div><span className="font-semibold">Requirements:</span> {selectedRequirements.join(', ')}</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              {currentStep > STEPS.BASICS && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-300 hover:border-purple-500 hover:bg-purple-50 transition-all font-semibold"
                >
                  <ArrowLeft className="h-5 w-5" />
                  Previous
                </button>
              )}
              
              <button
                type="submit"
                className="ml-auto flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all font-bold"
              >
                {currentStep === STEPS.REVIEW ? (
                  <>
                    <Check className="h-5 w-5" />
                    Update Event
                  </>
                ) : (
                  <>
                    Next
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
