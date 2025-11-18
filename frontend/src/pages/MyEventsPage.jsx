// ============================================================
// IMPORTS
// ============================================================
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { eventsAPI } from '../lib/api'
import { useAuthStore } from '../store/authStore'

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function MyEventsPage() {
  // ============================================================
  // HOOKS & ROUTING
  // ============================================================
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()  // Global auth state
  
  // ============================================================
  // DATA FETCHING
  // ============================================================
  
  // Fetch all events user is registered for
  const { data, isLoading, error } = useQuery({
    queryKey: ['myEvents'],
    queryFn: () => eventsAPI.getMyEvents(0, 50),
    enabled: isAuthenticated,
  })
  
  // ============================================================
  // DERIVED STATE
  // ============================================================
  const events = data?.data?.content || []  // Extract events from paginated response
  
  // ============================================================
  // UNAUTHENTICATED STATE
  // ============================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 flex items-center justify-center px-4">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-10 text-center max-w-md">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
          <p className="text-gray-600 mb-6">Please login to view your events.</p>
          <button
            onClick={() => navigate('/login')}
            className="py-3 px-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all transform hover:scale-105"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }
  
  // ============================================================
  // LOADING STATE
  // ============================================================
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-8">🎪 My Events</h1>
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 border border-gray-100 shadow-lg text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium">Loading your events...</p>
          </div>
        </div>
      </div>
    )
  }
  
  // ============================================================
  // ERROR STATE
  // ============================================================
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-8">🎪 My Events</h1>
          <div className="bg-red-50 backdrop-blur-sm rounded-3xl p-8 border-2 border-red-200 shadow-lg">
            <div className="text-5xl mb-4">⚠️</div>
            <p className="text-red-600 font-semibold">Error loading events: {error.message}</p>
          </div>
        </div>
      </div>
    )
  }
  
  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ========== PAGE HEADER ========== */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">🎪 My Events</h1>
          <button
            onClick={() => navigate('/create-event')}
            className="py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-xl hover:shadow-purple-500/50 transition-all transform hover:scale-105"
          >
            ✨ Create Event
          </button>
        </div>
        
        {/* ========== EVENT LIST ========== */}
        {events.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-16 text-center border border-gray-100 shadow-lg">
            {/* EMPTY STATE - No events registered */}
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Events Yet</h3>
            <p className="text-gray-600">Create your first event to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* EVENT GRID - Display all registered events */}
            {events.map(event => (
              <div
                key={event.id}
                className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all cursor-pointer transform hover:scale-105 border border-gray-100"
                onClick={() => navigate(`/events/${event.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/events/${event.id}`)}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-xl text-gray-900">{event.title}</h3>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full shadow-sm ${
                      event.status === 'PUBLISHED' ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white' :
                      event.status === 'DRAFT' ? 'bg-gray-200 text-gray-800' :
                      'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
                    }`}>
                      {event.status}
                    </span>
                  </div>
                
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {event.description || 'No description'}
                </p>
                
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <span>📅</span>
                    <span>{new Date(event.eventDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>⏰</span>
                    <span>{new Date(event.eventDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📍</span>
                    <span className="line-clamp-1">{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🎯</span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                      {event.difficultyLevel}
                    </span>
                  </div>
                </div>
                
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center text-sm">
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg font-semibold">
                        👥 {event.currentParticipants} / {event.maxParticipants}
                      </span>
                      {event.cost > 0 && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg font-bold">
                          £{event.cost.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
