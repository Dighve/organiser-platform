import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { WifiOff, Wifi, Calendar, MapPin, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { getAllOfflineBundles } from '../lib/offlineCache'

// cacheKey format: "{userId}::{eventId}"
function getEventId(cacheKey) {
  return cacheKey.split('::')[1]
}

export default function OfflineSavedEventsPage() {
  const navigate = useNavigate()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    getAllOfflineBundles()
      .then((data) => setRecords([...data].sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt))))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false))
  }, [getAllOfflineBundles])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Offline banner */}
      <div className={`border-b px-4 py-2.5 flex items-center gap-2 text-sm ${isOnline ? 'bg-green-50 border-green-200 text-green-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
        {isOnline ? <Wifi className="h-4 w-4 flex-shrink-0" /> : <WifiOff className="h-4 w-4 flex-shrink-0" />}
        <span>{isOnline ? 'Back online' : "You're offline"}</span>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Saved events</h1>
        <p className="text-sm text-gray-500 mb-5">Available without internet connection</p>

        {loading && (
          <p className="text-sm text-gray-400">Loading saved events…</p>
        )}

        {!loading && records.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <WifiOff className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No events saved for offline use.</p>
            <p className="text-xs mt-1">Open an event and tap "Save offline" before heading out.</p>
          </div>
        )}

        {!loading && records.length > 0 && (
          <div className="space-y-3">
            {records.map((record) => {
              const { event = {} } = record.bundle || {}
              const eventId = getEventId(record.cacheKey)
              const eventDate = event.eventDate ? new Date(event.eventDate) : null
              return (
                <button
                  key={record.cacheKey}
                  onClick={() => navigate(`/events/${eventId}`)}
                  className="w-full text-left bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3 hover:border-purple-200 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{event.title || 'Untitled event'}</p>
                    {eventDate && (
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                        <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{format(eventDate, 'EEE d MMM · h:mm a')}</span>
                      </div>
                    )}
                    {event.location && (
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-500">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
