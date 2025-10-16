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

  // Modern hero background with animated gradient
  const heroBackground = (
    <div className="absolute inset-0 -z-10 w-full h-full overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-500 via-purple-600 to-indigo-700 animate-gradient" />
      {/* Overlay pattern */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />
      {/* Floating shapes */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
      <div className="absolute top-40 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
    </div>
  )

  if (showDiscover) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden">
        {heroBackground}
        <div className="relative z-10 max-w-5xl mx-auto px-4 py-20">
          <div className="inline-block mb-6 px-6 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white font-semibold text-sm border border-white/30">
            🏔️ Your Adventure Starts Here
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-white mb-6 drop-shadow-2xl leading-tight">
            Discover Amazing <br/>
            <span className="bg-gradient-to-r from-yellow-300 via-orange-400 to-pink-400 bg-clip-text text-transparent">Hiking Events</span>
          </h1>
          <p className="text-xl sm:text-2xl text-white/90 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            Join a community of adventurers. Find your next trail, connect with fellow hikers, and create unforgettable memories.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              className="group relative px-10 py-4 text-lg font-bold rounded-full shadow-2xl bg-gradient-to-r from-orange-500 to-pink-600 text-white hover:shadow-orange-500/50 transform hover:scale-105 transition-all duration-300 overflow-hidden"
              onClick={handleDiscoverClick}
            >
              <span className="relative z-10 flex items-center gap-2">
                Discover Events
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
          {/* Decorative elements */}
          <div className="mt-16 flex justify-center gap-12 text-white/80">
            <div className="text-center">
              <div className="text-3xl font-bold">500+</div>
              <div className="text-sm">Events</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">1000+</div>
              <div className="text-sm">Hikers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">50+</div>
              <div className="text-sm">Groups</div>
            </div>
          </div>
        </div>
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    )
  }

  // Discover view: groups/events layout with modern background
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 flex flex-col lg:flex-row gap-8 px-4 sm:px-6 lg:px-8 py-10">
      {/* Left: Your Groups */}
      <div className="w-full lg:w-1/4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Your Groups</h2>
          <button
            onClick={() => navigate('/browse-groups')}
            className="text-sm font-semibold text-purple-600 hover:text-pink-600 transition-colors flex items-center gap-1 group"
          >
            Explore
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        {/* Tabs - Modern pill style */}
        {isAuthenticated && (
          <div className="mb-6 bg-white/60 backdrop-blur-sm p-1.5 rounded-full inline-flex">
            <nav className="flex gap-2">
              {user?.isOrganiser && (
                <button
                  onClick={() => setActiveGroupTab('organiser')}
                  className={`px-6 py-2 rounded-full font-semibold text-sm transition-all duration-200 ${
                    activeGroupTab === 'organiser'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Organiser
                </button>
              )}
              <button
                onClick={() => setActiveGroupTab('member')}
                className={`px-6 py-2 rounded-full font-semibold text-sm transition-all duration-200 ${
                  activeGroupTab === 'member'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                    : 'text-gray-600 hover:text-gray-900'
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
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : memberGroups.length > 0 ? (
                memberGroups.map(group => (
                  <div key={group.id} className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                    onClick={() => navigate(`/groups/${group.id}`)}>
                    {/* Group Banner */}
                    <div className="relative h-20 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-90" />
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
                        className="w-full h-full object-cover mix-blend-overlay group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 group-hover:bg-clip-text transition-all mb-2">
                        {group.name}
                      </h3>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                          </svg>
                          <span className="font-medium">{group.currentMembers || 0}</span>
                        </div>
                        <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">{group.activityName}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 text-center border border-gray-200">
                  <div className="text-gray-500">
                    {isAuthenticated ? '🎯 No groups yet. Join some groups to get started!' : '🔐 Login to see your groups'}
                  </div>
                </div>
              )}
            </>
          )}
          
          {/* Organiser Tab */}
          {activeGroupTab === 'organiser' && user?.isOrganiser && (
            <>
              {organisedGroupsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : organisedGroups.length > 0 ? (
                organisedGroups.map(group => (
                  <div key={group.id} className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 overflow-hidden transition-all duration-300">
                    {/* Group Banner */}
                    <div className="relative h-20 overflow-hidden cursor-pointer" onClick={() => navigate(`/groups/${group.id}`)}>
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-pink-500 opacity-90" />
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
                        className="w-full h-full object-cover mix-blend-overlay group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute top-2 right-2 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-orange-600">ORGANISER</div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 mb-2 cursor-pointer hover:text-transparent hover:bg-gradient-to-r hover:from-orange-600 hover:to-pink-600 hover:bg-clip-text transition-all"
                        onClick={() => navigate(`/groups/${group.id}`)}>
                        {group.name}
                      </h3>
                      <div className="flex items-center gap-4 text-sm mb-3">
                        <div className="flex items-center gap-1 text-gray-600">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                          </svg>
                          <span className="font-medium">{group.currentMembers || 0}</span>
                        </div>
                        <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full font-medium">{group.activityName}</span>
                      </div>
                      <button
                        className="w-full py-2 px-4 bg-gradient-to-r from-orange-500 to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-orange-500/50 transition-all duration-200 transform hover:scale-105"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/create-event?groupId=${group.id}`)
                        }}
                      >
                        + Create Event
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 text-center border border-gray-200">
                  <div className="text-gray-500">
                    🎯 No organised groups yet. Create a group to get started!
                  </div>
                </div>
              )}
              <button
                className="w-full mt-4 py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
                onClick={() => navigate('/groups/create')}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Group
              </button>
            </>
          )}
        </div>
      </div>

      {/* Right: Events */}
      <div className="w-full lg:w-3/4 flex flex-col gap-12">
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Your Events</h2>
            <span className="text-sm text-gray-500 font-medium">{yourEvents.length} event{yourEvents.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {yourEventsLoading ? (
              <div className="col-span-full flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : yourEvents.length > 0 ? (
              yourEvents.map(event => (
                <div 
                  key={event.id} 
                  className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-2xl border border-gray-100 overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-2"
                  onClick={() => navigate(`/events/${event.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/events/${event.id}`)}
                >
                  {/* Event Image */}
                  <div className="relative w-full h-48 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 opacity-20" />
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
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    />
                    <div className="absolute top-3 right-3 px-3 py-1 bg-white/95 backdrop-blur-sm rounded-full text-xs font-bold text-purple-600 shadow-lg">
                      {event.difficultyLevel}
                    </div>
                  </div>
                  {/* Event Content */}
                  <div className="p-5">
                    <h3 className="font-bold text-lg text-gray-900 mb-3 line-clamp-2 group-hover:text-purple-600 transition-colors">{event.title}</h3>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium">{new Date(event.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">{event.location}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 border-2 border-white flex items-center justify-center text-white text-xs font-bold">{event.currentParticipants}</div>
                        </div>
                        <span className="text-sm text-gray-600 font-medium">{event.currentParticipants}/{event.maxParticipants} going</span>
                      </div>
                      <svg className="w-5 h-5 text-purple-600 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full bg-white/60 backdrop-blur-sm rounded-2xl p-12 text-center border border-gray-200">
                <div className="text-gray-500 text-lg">
                  {isAuthenticated ? '🎯 No events yet. Discover events below!' : '🔐 Login to see your events'}
                </div>
              </div>
            )}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">Discover Events</h2>
            <span className="text-sm text-gray-500 font-medium">{allEvents.length} event{allEvents.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {allEventsLoading ? (
              <div className="col-span-full flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
              </div>
            ) : allEvents.length > 0 ? (
              allEvents.map(event => (
                <div 
                  key={event.id} 
                  className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-2xl border border-gray-100 overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-2"
                  onClick={() => navigate(`/events/${event.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/events/${event.id}`)}
                >
                  {/* Event Image */}
                  <div className="relative w-full h-48 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-pink-500 opacity-20" />
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
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    />
                    <div className="absolute top-3 right-3 px-3 py-1 bg-white/95 backdrop-blur-sm rounded-full text-xs font-bold text-orange-600 shadow-lg">
                      {event.difficultyLevel}
                    </div>
                  </div>
                  {/* Event Content */}
                  <div className="p-5">
                    <h3 className="font-bold text-lg text-gray-900 mb-3 line-clamp-2 group-hover:text-orange-600 transition-colors">{event.title}</h3>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium">{new Date(event.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">{event.location}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 border-2 border-white flex items-center justify-center text-white text-xs font-bold">{event.currentParticipants}</div>
                        </div>
                        <span className="text-sm text-gray-600 font-medium">{event.currentParticipants}/{event.maxParticipants} going</span>
                      </div>
                      <svg className="w-5 h-5 text-orange-600 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full bg-white/60 backdrop-blur-sm rounded-2xl p-12 text-center border border-gray-200">
                <div className="text-gray-500 text-lg">🔍 No events found.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
