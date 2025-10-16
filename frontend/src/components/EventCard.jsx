import { Link } from 'react-router-dom'
import { Calendar, MapPin, Users, DollarSign } from 'lucide-react'
import { format } from 'date-fns'

export default function EventCard({ event }) {
  const formattedDate = format(new Date(event.eventDate), 'MMM dd, yyyy')
  const formattedTime = format(new Date(event.eventDate), 'h:mm a')

  return (
    <Link to={`/events/${event.id}`} className="card hover:shadow-lg transition-shadow duration-200">
      {/* Event Image */}
      <div className="relative h-48 mb-4 rounded-lg overflow-hidden bg-gray-200">
        <img
          src={event.imageUrl || [
            'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&h=300&fit=crop',
            'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&h=300&fit=crop',
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=300&fit=crop',
            'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=600&h=300&fit=crop',
            'https://images.unsplash.com/photo-1445308394109-4ec2920981b1?w=600&h=300&fit=crop',
            'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=600&h=300&fit=crop'
          ][Number.parseInt(event.id) % 6]}
          alt={event.title}
          className="w-full h-full object-cover"
        />
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

          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2" />
            <span className="line-clamp-1">{event.location}</span>
          </div>

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
