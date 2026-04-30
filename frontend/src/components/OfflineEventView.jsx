import { MapPin, Calendar, Mountain, WifiOff, ArrowLeft } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

export default function OfflineEventView({ bundle = {}, savedAt, onGoBack }) {
  const { event = {}, contacts = [], viewerRole } = bundle
  const eventDate = event.eventDate ? new Date(event.eventDate) : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Offline banner */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center gap-2 text-sm text-amber-800">
        <WifiOff className="h-4 w-4 flex-shrink-0" />
        <span>
          Offline · saved{' '}
          {savedAt ? formatDistanceToNow(savedAt, { addSuffix: true }) : ''}
        </span>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 pb-10 space-y-5">
        {/* Back button */}
        <button
          onClick={onGoBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {/* Title */}
        <h1 className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent leading-tight">
          {event.title}
        </h1>

        {/* Date/Time */}
        {eventDate && (
          <div className="flex items-center gap-3 text-gray-700">
            <Calendar className="h-5 w-5 text-purple-500 flex-shrink-0" />
            <div>
              <p className="font-semibold">{format(eventDate, 'EEEE, d MMMM yyyy')}</p>
              <p className="text-sm text-gray-500">{format(eventDate, 'h:mm a')}</p>
            </div>
          </div>
        )}

        {/* Location */}
        {event.location && (
          <div className="flex items-start gap-3 text-gray-700">
            <MapPin className="h-5 w-5 text-pink-500 flex-shrink-0 mt-0.5" />
            <p className="font-medium">{event.location}</p>
          </div>
        )}

        {/* Activity / Difficulty */}
        {(event.activityTypeName || event.difficultyLevel) && (
          <div className="flex items-center gap-3 text-gray-700">
            <Mountain className="h-5 w-5 text-orange-500 flex-shrink-0" />
            <p className="font-medium">
              {event.activityTypeName}
              {event.difficultyLevel && ` · ${event.difficultyLevel}`}
              {event.distanceKm && ` · ${event.distanceKm} km`}
            </p>
          </div>
        )}

        {/* Description */}
        {event.description && (
          <div>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">About</h2>
            <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
              {event.description}
            </p>
          </div>
        )}

        {/* Contacts */}
        {contacts.length > 0 && (
          <div>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
              {viewerRole === 'host' ? 'Attendee Contacts' : 'Host Contact'}
            </h2>
            <div className="space-y-3">
              {contacts.map((person) => (
                <div
                  key={person.memberId}
                  className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm"
                >
                  <p className="font-bold text-gray-900 mb-2">{person.memberName}</p>
                  <div className="space-y-1.5">
                    {person.contacts.map((c, i) =>
                      c.deepLink ? (
                        <a
                          key={i}
                          href={c.deepLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-purple-700 hover:underline"
                        >
                          <span className="font-medium capitalize">
                            {c.displayLabel || c.platform.replace('_', ' ').toLowerCase()}:
                          </span>
                          <span>{c.contactValue}</span>
                        </a>
                      ) : (
                        <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                          <span className="font-medium capitalize">
                            {c.displayLabel || c.platform.replace('_', ' ').toLowerCase()}:
                          </span>
                          <span>{c.contactValue}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {contacts.length === 0 && (
          <p className="text-sm text-gray-400 italic">No contact info available offline.</p>
        )}
      </div>
    </div>
  )
}
