import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { eventsAPI } from '../lib/api'
import { format } from 'date-fns'
import { MapPin, Calendar, Users, Mountain, Clock } from 'lucide-react'

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&h=400&fit=crop'

export default function EventEmbedPage() {
  const { id } = useParams()

  const { data, isLoading, error } = useQuery({
    queryKey: ['event-embed', id],
    queryFn: () => eventsAPI.getEventById(id),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const event = data?.data

  const joinUrl = `${window.location.origin}/events/${id}?action=join`

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 rounded-full border-2 border-purple-200 border-t-purple-600 animate-spin" />
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-400 text-sm">Event not found</p>
      </div>
    )
  }

  const eventDate = event.eventDate ? new Date(event.eventDate) : null
  const isFull = event.maxParticipants != null && event.currentParticipants >= event.maxParticipants
  const spotsLeft = event.maxParticipants != null
    ? Math.max(0, event.maxParticipants - (event.currentParticipants || 0))
    : null
  const eventPageUrl = `${window.location.origin}/events/${id}`
  const shortDescription = event.description
    ? event.description.replace(/[#*_>`[\]]/g, '').trim().slice(0, 120) + (event.description.length > 120 ? '…' : '')
    : null

  return (
    <div className="min-h-screen bg-white flex items-stretch">
      <div className="w-full flex flex-col">
        {/* Hero image */}
        <div className="relative h-32 overflow-hidden flex-shrink-0">
          <img
            src={event.imageUrl || DEFAULT_IMAGE}
            alt={event.title}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = DEFAULT_IMAGE }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          {/* OutMeets branding */}
          <a
            href={window.location.origin}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1"
          >
            <img src={`${window.location.origin}/favicon1.svg`} alt="" className="w-3 h-3" />
            <span className="text-[10px] font-bold text-gray-700">OutMeets</span>
          </a>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-4 gap-3">
          <a
            href={eventPageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-gray-900 text-base leading-snug line-clamp-2 hover:text-purple-700 transition-colors"
          >
            {event.title}
          </a>

          <div className="space-y-1.5">
            {eventDate && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4 text-purple-500 flex-shrink-0" />
                <span>{format(eventDate, 'EEE, d MMM · h:mm a')}</span>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-pink-500 flex-shrink-0" />
                <span className="truncate">{event.location}</span>
              </div>
            )}
            {event.estimatedDurationHours && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4 text-blue-400 flex-shrink-0" />
                <span>{event.estimatedDurationHours}h estimated duration</span>
              </div>
            )}
            {event.difficultyLevel && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mountain className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>{event.difficultyLevel}</span>
              </div>
            )}
            {event.maxParticipants != null && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="h-4 w-4 text-orange-500 flex-shrink-0" />
                <span>
                  {isFull
                    ? `Full · ${event.currentParticipants} attending`
                    : `${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left · ${event.currentParticipants || 0} attending`}
                </span>
              </div>
            )}
          </div>

          {shortDescription && (
            <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
              {shortDescription}
            </p>
          )}

          {/* Action row */}
          <div className="mt-auto flex items-center gap-2">
            <a
              href={joinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-center text-sm transition-all ${
                isFull
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none'
                  : 'bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white hover:opacity-90 active:scale-95'
              }`}
            >
              {isFull ? 'Event Full' : 'Join'}
            </a>
            <a
              href={eventPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-4 rounded-xl font-semibold text-sm text-purple-600 border border-purple-200 hover:bg-purple-50 transition-all whitespace-nowrap"
            >
              View event
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
