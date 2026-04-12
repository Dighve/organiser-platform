import { Link } from 'react-router-dom'
import { Calendar, MapPin, Users, DollarSign, Mountain, Star } from 'lucide-react'
import { format } from 'date-fns'
import { useState } from 'react'
import { useFeatureFlags } from '../contexts/FeatureFlagContext'

export default function EventCard({ event, isPast = false }) {
  const formattedDate = format(new Date(event.eventDate), 'MMM dd, yyyy')
  const formattedTime = format(new Date(event.eventDate), 'h:mm a')
  const isPastLocal = new Date(event.eventDate) < new Date()
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const { isEventLocationEnabled, isGoogleMapsEnabled } = useFeatureFlags()

  return (
    <Link
      to={`/events/${event.id}`}
      className={`card hover:shadow-lg transition-shadow duration-200 sm:p-0 ${(isPast || isPastLocal) ? 'opacity-80 grayscale-[0.2]' : ''}`}
    >
      {/* Event Image */}
      <div className="relative h-28 sm:h-48 mb-3 sm:mb-4 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-200 to-pink-200">
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
        {(isPast || isPastLocal) && (
          <div className="absolute top-2 left-2 bg-gray-700/80 text-white px-3 py-1 rounded-full text-sm font-medium">
            Past
          </div>
        )}
        {event.difficultyLevel && (
          <div className="absolute top-2 left-2 bg-white/90 px-3 py-1 rounded-full text-sm font-medium">
            {event.difficultyLevel}
          </div>
        )}
      </div>

      {/* Event Details with padding (desktop only) */}
      <div className="px-0 pb-0 sm:px-4 sm:pb-4">
        {/* Event Details - Mobile (unchanged) */}
        <div className="sm:hidden">
          <h3 className="text-base font-semibold mb-2 line-clamp-2 leading-snug">{event.title}</h3>

          <div className="space-y-1.5 text-xs text-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                <span>{formattedDate} at {formattedTime}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <span role="img" aria-label="attendees">👤</span>
                <span className="font-semibold">{event.currentParticipants}</span>
              </div>
            </div>

            {isEventLocationEnabled() && isGoogleMapsEnabled() && (
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                <span className="line-clamp-1">{event.location}</span>
              </div>
            )}

            {event.price > 0 && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-gray-500">Price</span>
                <div className="flex items-center font-semibold text-primary-600">
                  <DollarSign className="h-4 w-4" />
                  <span>{event.price}</span>
                </div>
              </div>
            )}

            {event.totalReviews >= 3 && (
              <div className="flex items-center gap-1.5 pt-1">
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-xs">{Number(event.averageRating).toFixed(1)}</span>
                <span className="text-xs text-gray-500">
                  ({event.totalReviews})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Event Details - Desktop (mirrors Home page desktop card) */}
        <div className="hidden sm:block">
          <h3 className="font-bold text-lg text-gray-900 mb-3 line-clamp-2 leading-snug">{event.title}</h3>
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between gap-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-500" />
                <span className="font-medium">{formattedDate}</span>
              </div>
            </div>
            {isEventLocationEnabled() && isGoogleMapsEnabled() && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-pink-500" />
                <span className="truncate">{event.location}</span>
              </div>
            )}
            {event.totalReviews >= 3 && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-sm">{Number(event.averageRating).toFixed(1)}</span>
                </div>
                <span className="text-xs text-gray-600">
                  ({event.totalReviews} {event.totalReviews === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                {event.currentParticipants}
              </div>
              <span className="text-sm text-gray-600 font-medium">
                {event.currentParticipants}{event.maxParticipants ? `/${event.maxParticipants}` : ''} going
              </span>
            </div>
            <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  )
}
