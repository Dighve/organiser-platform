import { Link } from 'react-router-dom'
import { Calendar, MapPin, Users, DollarSign, Mountain } from 'lucide-react'
import { format } from 'date-fns'
import { useState } from 'react'
import { useFeatureFlags } from '../contexts/FeatureFlagContext'

export default function EventCard({ event }) {
  const formattedDate = format(new Date(event.eventDate), 'MMM dd, yyyy')
  const formattedTime = format(new Date(event.eventDate), 'h:mm a')
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const { isEventLocationEnabled, isGoogleMapsEnabled } = useFeatureFlags()

  return (
    <Link to={`/events/${event.id}`} className="card hover:shadow-lg transition-shadow duration-200">
      {/* Event Image */}
      <div className="relative h-48 mb-4 rounded-lg overflow-hidden bg-gradient-to-br from-purple-200 to-pink-200">
        {/* Always show gradient background with icon when no image or image failed */}
        {(!event.imageUrl || imageError || !imageLoaded) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Mountain className="w-16 h-16 text-white/60" />
          </div>
        )}
        
        {event.imageUrl && !imageError && (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageError(true)
              setImageLoaded(false)
            }}
          />
        )}
        {event.status === 'FULL' && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            Full
          </div>
        )}
        {event.difficultyLevel && (
          <div className="absolute top-2 left-2 bg-white/90 px-3 py-1 rounded-full text-sm font-medium">
            {event.difficultyLevel}
          </div>
        )}
      </div>

      {/* Event Details */}
      <div>
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded text-xs font-medium">
            {event.activityTypeName}
          </span>
        </div>

        <h3 className="text-xl font-semibold mb-2 line-clamp-2">{event.title}</h3>

        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            <span>{formattedDate} at {formattedTime}</span>
          </div>

          {/* Only show location if location features are enabled */}
          {isEventLocationEnabled() && isGoogleMapsEnabled() && (
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              <span>
                {event.currentParticipants}
                {event.maxParticipants && `/${event.maxParticipants}`} joined
              </span>
            </div>

            {event.price > 0 && (
              <div className="flex items-center font-semibold text-primary-600">
                <DollarSign className="h-4 w-4" />
                <span>{event.price}</span>
              </div>
            )}
          </div>
        </div>

        {event.organiserName && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Organized by <span className="font-medium text-gray-700">{event.organiserName}</span>
            </p>
          </div>
        )}
      </div>
    </Link>
  )
}
