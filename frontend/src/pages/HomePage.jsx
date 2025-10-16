import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { groupsAPI, eventsAPI } from '../lib/api'
import { useAuthStore } from '../store/authStore'

export default function HomePage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  
  // Fetch user's groups (only if authenticated)
  const { data: groupsData, isLoading: groupsLoading } = useQuery({
    queryKey: ['myGroups'],
    queryFn: () => groupsAPI.getMyGroups(),
    enabled: isAuthenticated,
  })
  
  // Fetch user's events (only if authenticated)
  const { data: yourEventsData, isLoading: yourEventsLoading } = useQuery({
    queryKey: ['myEvents'],
    queryFn: () => eventsAPI.getMyEvents(0, 10),
    enabled: isAuthenticated,
  })
  
  // Fetch all public events
  const { data: allEventsData, isLoading: allEventsLoading } = useQuery({
    queryKey: ['allEvents'],
    queryFn: () => eventsAPI.getUpcomingEvents(0, 10),
  })
  
  const groups = groupsData?.data || []
  const yourEvents = yourEventsData?.data?.content || []
  const allEvents = allEventsData?.data?.content || []

  const [showDiscover, setShowDiscover] = useState(false)

  // Cartoon hiking SVG background
  const cartoonBg = (
    <div className="absolute inset-0 -z-10 w-full h-full bg-gradient-to-b from-green-200 to-green-400 flex items-center justify-center">
      <svg width="100%" height="100%" viewBox="0 0 800 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <ellipse cx="400" cy="350" rx="350" ry="80" fill="#7ed957" />
        <ellipse cx="200" cy="300" rx="120" ry="40" fill="#b6e388" />
        <ellipse cx="600" cy="320" rx="100" ry="30" fill="#b6e388" />
        <ellipse cx="400" cy="250" rx="60" ry="20" fill="#4e944f" />
        <ellipse cx="500" cy="270" rx="40" ry="15" fill="#4e944f" />
        <ellipse cx="300" cy="270" rx="40" ry="15" fill="#4e944f" />
        {/* Cartoon trees */}
        <circle cx="150" cy="260" r="20" fill="#388e3c" />
        <rect x="145" y="260" width="10" height="20" fill="#795548" />
        <circle cx="650" cy="280" r="18" fill="#388e3c" />
        <rect x="645" y="280" width="8" height="16" fill="#795548" />
      </svg>
    </div>
  )

  if (!showDiscover) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden bg-gradient-to-b from-green-200 to-green-400">
        {cartoonBg}
        <h1 className="text-4xl sm:text-5xl font-bold text-green-900 mb-4 drop-shadow-lg">Platform for organising and participate in a hiking event.</h1>
        <p className="text-lg text-green-800 mb-8">Find your next hike, subscribe to hiking groups, and create hiking events!</p>
        <button
          className="btn px-8 py-3 text-xl rounded-full shadow-lg bg-black hover:bg-gray-800 text-white"
          onClick={() => setShowDiscover(true)}
        >
          Discover
        </button>
      </div>
    )
  }

  // Discover view: groups/events layout, grey background
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col lg:flex-row gap-8 px-4 py-8">
      {/* Left: Your Groups */}
      <div className="w-full lg:w-1/3">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Groups</h2>
        <div className="space-y-4">
          {groupsLoading ? (
            <div className="text-gray-600">Loading groups...</div>
          ) : groups.length > 0 ? (
            groups.map(group => (
              <div key={group.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-bold text-gray-900">{group.name}</div>
                    <div className="text-sm text-gray-600 mt-1">👥 {group.currentMembers || 0} members</div>
                    <div className="text-xs text-gray-500 mt-1">{group.activityName}</div>
                  </div>
                </div>
                <button
                  className="w-full btn btn-primary btn-sm"
                  onClick={() => navigate('/groups')}
                >
                  View Groups
                </button>
              </div>
            ))
          ) : (
            <div className="text-gray-600">
              {isAuthenticated ? 'No groups yet. Join some groups to get started!' : 'Login to see your groups'}
            </div>
          )}
        </div>
      </div>

      {/* Right: Events */}
      <div className="w-full lg:w-2/3 flex flex-col gap-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {yourEventsLoading ? (
              <div className="text-gray-600">Loading your events...</div>
            ) : yourEvents.length > 0 ? (
              yourEvents.map(event => (
                <div 
                  key={event.id} 
                  className="bg-white rounded-lg shadow p-5 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/events/${event.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/events/${event.id}`)}
                >
                  <div className="font-bold text-lg text-gray-900 mb-2">{event.title}</div>
                  <div className="text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span>📅 {new Date(event.eventDate).toLocaleDateString()}</span>
                      <span>⏰ {new Date(event.eventDate).toLocaleTimeString()}</span>
                    </div>
                    <div className="mb-1">📍 {event.location}</div>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
                      {event.difficultyLevel}
                    </span>
                    <span className="text-gray-600">
                      👥 {event.currentParticipants}/{event.maxParticipants}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-700">
                {isAuthenticated ? 'No events yet.' : 'Login to see your events'}
              </div>
            )}
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">All Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allEventsLoading ? (
              <div className="text-gray-600">Loading events...</div>
            ) : allEvents.length > 0 ? (
              allEvents.map(event => (
                <div 
                  key={event.id} 
                  className="bg-white rounded-lg shadow p-5 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/events/${event.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/events/${event.id}`)}
                >
                  <div className="font-bold text-lg text-gray-900 mb-2">{event.title}</div>
                  <div className="text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span>📅 {new Date(event.eventDate).toLocaleDateString()}</span>
                      <span>⏰ {new Date(event.eventDate).toLocaleTimeString()}</span>
                    </div>
                    <div className="mb-1">📍 {event.location}</div>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                      {event.difficultyLevel}
                    </span>
                    <span className="text-gray-600">
                      👥 {event.currentParticipants}/{event.maxParticipants}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-700">No events found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
