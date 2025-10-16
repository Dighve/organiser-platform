import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function HomePage() {
  const navigate = useNavigate()
  // Dummy data for groups and events
  const groups = [
    { id: 1, name: 'Peak District Hikers', members: 156 },
    { id: 2, name: 'Lake District Explorers', members: 243 },
    { id: 3, name: 'Snowdonia Trekkers', members: 89 },
    { id: 4, name: 'Yorkshire Dales Wanderers', members: 124 }
  ]
  const yourEvents = [
    { 
      id: 1, 
      title: 'Hike to Kinder Scout', 
      date: '2025-10-20',
      time: '09:00 AM',
      location: 'Peak District',
      participants: 12,
      maxParticipants: 20,
      difficulty: 'Intermediate'
    },
    { 
      id: 2, 
      title: 'Snowdon Summit Challenge', 
      date: '2025-11-05',
      time: '07:00 AM',
      location: 'Snowdonia',
      participants: 15,
      maxParticipants: 15,
      difficulty: 'Advanced'
    },
    { 
      id: 3, 
      title: 'Coastal Walk - Whitby', 
      date: '2025-10-28',
      time: '10:30 AM',
      location: 'North Yorkshire Coast',
      participants: 8,
      maxParticipants: 25,
      difficulty: 'Beginner'
    }
  ]
  const allEvents = [
    { 
      id: 4, 
      title: 'Helvellyn Adventure', 
      date: '2025-10-25',
      time: '08:00 AM',
      location: 'Lake District',
      participants: 18,
      maxParticipants: 20,
      difficulty: 'Advanced'
    },
    { 
      id: 5, 
      title: 'Mam Tor Sunrise Hike', 
      date: '2025-11-10',
      time: '06:00 AM',
      location: 'Peak District',
      participants: 10,
      maxParticipants: 15,
      difficulty: 'Intermediate'
    },
    { 
      id: 6, 
      title: 'Scafell Pike Expedition', 
      date: '2025-11-15',
      time: '07:30 AM',
      location: 'Lake District',
      participants: 5,
      maxParticipants: 12,
      difficulty: 'Expert'
    },
    { 
      id: 7, 
      title: 'Three Peaks Challenge', 
      date: '2025-11-20',
      time: '05:00 AM',
      location: 'Yorkshire Dales',
      participants: 20,
      maxParticipants: 30,
      difficulty: 'Expert'
    },
    { 
      id: 8, 
      title: 'Forest Trail Walk', 
      date: '2025-10-30',
      time: '11:00 AM',
      location: 'Sherwood Forest',
      participants: 14,
      maxParticipants: 25,
      difficulty: 'Beginner'
    },
    { 
      id: 9, 
      title: 'Countryside Ramble', 
      date: '2025-11-02',
      time: '09:30 AM',
      location: 'Cotswolds',
      participants: 7,
      maxParticipants: 20,
      difficulty: 'Beginner'
    }
  ]

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
          {groups.map(group => (
            <div key={group.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-bold text-gray-900">{group.name}</div>
                  <div className="text-sm text-gray-600 mt-1">👥 {group.members} members</div>
                </div>
              </div>
              <button
                className="w-full btn btn-outline btn-sm text-gray-700 border-gray-400 hover:bg-gray-200"
                onClick={() => navigate('/create-event')}
              >
                Create Event
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Events */}
      <div className="w-full lg:w-2/3 flex flex-col gap-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {yourEvents.map(event => (
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
                    <span>📅 {event.date}</span>
                    <span>⏰ {event.time}</span>
                  </div>
                  <div className="mb-1">📍 {event.location}</div>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
                    {event.difficulty}
                  </span>
                  <span className="text-gray-600">
                    👥 {event.participants}/{event.maxParticipants}
                  </span>
                </div>
              </div>
            ))}
            {yourEvents.length === 0 && <div className="text-gray-700">No events yet.</div>}
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">All Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allEvents.map(event => (
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
                    <span>📅 {event.date}</span>
                    <span>⏰ {event.time}</span>
                  </div>
                  <div className="mb-1">📍 {event.location}</div>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                    {event.difficulty}
                  </span>
                  <span className="text-gray-600">
                    👥 {event.participants}/{event.maxParticipants}
                  </span>
                </div>
              </div>
            ))}
            {allEvents.length === 0 && <div className="text-gray-700">No events found.</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
