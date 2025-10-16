import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { groupsAPI, eventsAPI } from '../lib/api'
import { useAuthStore } from '../store/authStore'

export default function HomePage() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuthStore()
  const [activeGroupTab, setActiveGroupTab] = useState('organiser')
  
  // Fetch user's subscribed groups (only if authenticated)
  const { data: groupsData, isLoading: groupsLoading } = useQuery({
    queryKey: ['myGroups'],
    queryFn: () => groupsAPI.getMyGroups(),
    enabled: isAuthenticated,
  })
  
  // Fetch user's organised groups (only if authenticated and is organiser)
  const { data: organisedGroupsData, isLoading: organisedGroupsLoading } = useQuery({
    queryKey: ['myOrganisedGroups'],
    queryFn: () => groupsAPI.getMyOrganisedGroups(),
    enabled: isAuthenticated && user?.isOrganiser,
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
  
  const memberGroups = groupsData?.data || []
  const organisedGroups = organisedGroupsData?.data || []
  const yourEvents = yourEventsData?.data?.content || []
  const allEvents = allEventsData?.data?.content || []

  // Check if user has already clicked discover before
  const [showDiscover, setShowDiscover] = useState(() => {
    const hasDiscovered = localStorage.getItem('hasDiscovered')
    return hasDiscovered !== 'true'
  })

  // Handle discover button click
  const handleDiscoverClick = () => {
    localStorage.setItem('hasDiscovered', 'true')
    setShowDiscover(false)
  }

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

  if (showDiscover) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden bg-gradient-to-b from-green-200 to-green-400">
        {cartoonBg}
        <h1 className="text-4xl sm:text-5xl font-bold text-green-900 mb-4 drop-shadow-lg">Platform for organising and participate in a hiking event.</h1>
        <p className="text-lg text-green-800 mb-8">Find your next hike, subscribe to hiking groups, and create hiking events!</p>
        <button
          className="btn px-8 py-3 text-xl rounded-full shadow-lg bg-black hover:bg-gray-800 text-white"
          onClick={handleDiscoverClick}
        >
          Discover
        </button>
      </div>
    )
  }

  // Discover view: groups/events layout, grey background
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col lg:flex-row gap-6 px-4 py-8">
      {/* Left: Your Groups */}
      <div className="w-full lg:w-1/5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Your Groups</h2>
          <button
            onClick={() => navigate('/browse-groups')}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Explore
          </button>
        </div>
        
        {/* Tabs */}
        {isAuthenticated && (
          <div className="mb-4 border-b border-gray-200">
            <nav className="-mb-px flex space-x-4">
              {user?.isOrganiser && (
                <button
                  onClick={() => setActiveGroupTab('organiser')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${activeGroupTab === 'organiser'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  Organiser
                </button>
              )}
              <button
                onClick={() => setActiveGroupTab('member')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeGroupTab === 'member'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Member
              </button>
              
            </nav>
          </div>
        )}
        
        <div className="space-y-3">
          {/* Member Tab */}
          {activeGroupTab === 'member' && (
            <>
              {groupsLoading ? (
                <div className="text-gray-600">Loading groups...</div>
              ) : memberGroups.length > 0 ? (
                memberGroups.map(group => (
                  <div key={group.id} className="bg-white rounded-lg shadow overflow-hidden">
                    {/* Group Banner */}
                    <div className="relative h-24 bg-gradient-to-r from-primary-300 to-primary-500 overflow-hidden">
                      <img 
                        src={group.bannerImage || [
                          'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&h=300&fit=crop',
                          'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&h=300&fit=crop',
                          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=300&fit=crop',
                          'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=600&h=300&fit=crop',
                          'https://images.unsplash.com/photo-1445308394109-4ec2920981b1?w=600&h=300&fit=crop',
                          'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=600&h=300&fit=crop'
                        ][Number.parseInt(group.id) % 6]}
                        alt={`${group.name} banner`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <div className="mb-3">
                        <div 
                          className="font-bold text-gray-900 hover:text-primary-600 cursor-pointer transition-colors"
                          onClick={() => navigate(`/groups/${group.id}`)}
                        >
                          {group.name}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">👥 {group.currentMembers || 0} members</div>
                        <div className="text-xs text-gray-500 mt-1">{group.activityName}</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-600">
                  {isAuthenticated ? 'No groups yet. Join some groups to get started!' : 'Login to see your groups'}
                </div>
              )}
            </>
          )}
          
          {/* Organiser Tab */}
          {activeGroupTab === 'organiser' && user?.isOrganiser && (
            <>
              {organisedGroupsLoading ? (
                <div className="text-gray-600">Loading organised groups...</div>
              ) : organisedGroups.length > 0 ? (
                organisedGroups.map(group => (
                  <div key={group.id} className="bg-white rounded-lg shadow overflow-hidden">
                    {/* Group Banner */}
                    <div className="relative h-24 bg-gradient-to-r from-primary-300 to-primary-500 overflow-hidden">
                      <img 
                        src={group.bannerImage || [
                          'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&h=300&fit=crop',
                          'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&h=300&fit=crop',
                          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=300&fit=crop',
                          'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=600&h=300&fit=crop',
                          'https://images.unsplash.com/photo-1445308394109-4ec2920981b1?w=600&h=300&fit=crop',
                          'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=600&h=300&fit=crop'
                        ][Number.parseInt(group.id) % 6]}
                        alt={`${group.name} banner`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <div className="mb-3">
                        <div 
                          className="font-bold text-gray-900 hover:text-primary-600 cursor-pointer transition-colors"
                          onClick={() => navigate(`/groups/${group.id}`)}
                        >
                          {group.name}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">👥 {group.currentMembers || 0} members</div>
                        <div className="text-xs text-gray-500 mt-1">{group.activityName}</div>
                      </div>
                      <button
                        className="w-full btn btn-primary btn-sm"
                        onClick={() => navigate(`/create-event?groupId=${group.id}`)}
                      >
                        Create Event
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-600">
                  No organised groups yet. Create a group to get started!
                </div>
              )}
              <button
                className="w-full btn btn-primary mb-4"
                onClick={() => navigate('/groups/create')}
              >
                + Create Group
              </button>
            </>
          )}
        </div>
      </div>

      {/* Right: Events */}
      <div className="w-full lg:w-4/5 flex flex-col gap-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {yourEventsLoading ? (
              <div className="text-gray-600">Loading your events...</div>
            ) : yourEvents.length > 0 ? (
              yourEvents.map(event => (
                <div 
                  key={event.id} 
                  className="bg-white rounded-lg shadow overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/events/${event.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/events/${event.id}`)}
                >
                  {/* Event Image */}
                  <div className="w-full h-40 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center overflow-hidden">
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
                  </div>
                  {/* Event Content */}
                  <div className="p-4">
                    <div className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">{event.title}</div>
                    <div className="text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span>📅 {new Date(event.eventDate).toLocaleDateString()}</span>
                      </div>
                      <div className="mb-1 truncate">📍 {event.location}</div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allEventsLoading ? (
              <div className="text-gray-600">Loading events...</div>
            ) : allEvents.length > 0 ? (
              allEvents.map(event => (
                <div 
                  key={event.id} 
                  className="bg-white rounded-lg shadow overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/events/${event.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/events/${event.id}`)}
                >
                  {/* Event Image */}
                  <div className="w-full h-40 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center overflow-hidden">
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
                  </div>
                  {/* Event Content */}
                  <div className="p-4">
                    <div className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">{event.title}</div>
                    <div className="text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span>📅 {new Date(event.eventDate).toLocaleDateString()}</span>
                      </div>
                      <div className="mb-1 truncate">📍 {event.location}</div>
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
