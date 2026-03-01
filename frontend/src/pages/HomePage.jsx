// ============================================================
// IMPORTS
// ============================================================
import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { groupsAPI, eventsAPI } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import LoginModal from '../components/LoginModal'
import WelcomeScreen from '../components/WelcomeScreen'

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function HomePage() {
  // ============================================================
  // HOOKS & ROUTING
  // ============================================================
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuthStore()  // Global auth state
  
  // ============================================================
  // LOCAL STATE
  // ============================================================
  const [activeGroupTab, setActiveGroupTab] = useState('member')  // Tab selection: 'member' or 'organiser'
  const [hasInitializedTab, setHasInitializedTab] = useState(false)  // Track if tab has been auto-selected
  const [loginModalOpen, setLoginModalOpen] = useState(false)  // Login modal state
  
  // Check if user has already clicked discover before (localStorage)
  const [showDiscover, setShowDiscover] = useState(() => {
    const hasDiscovered = localStorage.getItem('hasDiscovered')
    return hasDiscovered !== 'true'
  })
  
  // ============================================================
  // DATA FETCHING
  // ============================================================
  
  // Fetch user's subscribed groups (only if authenticated)
  const { data: groupsData, isLoading: groupsLoading } = useQuery({
    queryKey: ['myGroups'],
    queryFn: () => groupsAPI.getMyGroups(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes - user's groups don't change often
    refetchOnWindowFocus: false,
  })
  
  // Fetch user's organised groups (only if authenticated and is organiser)
  const { data: organisedGroupsData, isLoading: organisedGroupsLoading } = useQuery({
    queryKey: ['myOrganisedGroups'],
    queryFn: () => groupsAPI.getMyOrganisedGroups(),
    enabled: isAuthenticated && Boolean(user?.hasOrganiserRole),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })
  
  // Fetch user's events (only if authenticated)
  const { data: yourEventsData, isLoading: yourEventsLoading } = useQuery({
    queryKey: ['myEvents'],
    queryFn: () => eventsAPI.getMyEvents(0, 10),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes - user's events don't change often
    refetchOnWindowFocus: false,
  })
  
  // Fetch all public events for discovery
  const { data: allEventsData, isLoading: allEventsLoading } = useQuery({
    queryKey: ['allEvents'],
    queryFn: () => eventsAPI.getUpcomingEvents(0, 10),
    // OPTIMIZED: Longer cache for better production performance
    // Events don't change frequently, so 10 minutes is safe
    staleTime: 10 * 60 * 1000, // 10 minutes - aggressive caching for production speed
    cacheTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnWindowFocus: false, // Disable refetch on window focus to reduce API calls
    refetchOnMount: false, // Don't refetch if data is still fresh
  })
  
  // ============================================================
  // DERIVED STATE
  // ============================================================
  
  // Extract data from API responses
  const memberGroups = groupsData?.data || []
  const organisedGroups = organisedGroupsData?.data || []
  const yourEventsRaw = yourEventsData?.data?.content || []
  const allEvents = allEventsData?.data?.content || []
  
  // Filter to show only upcoming events in "Your Events"
  const yourEvents = useMemo(() => {
    const now = new Date()
    // Reset time to start of day for consistent date comparison across devices
    now.setHours(0, 0, 0, 0)
    return yourEventsRaw.filter(event => {
      const eventDate = new Date(event.eventDate)
      eventDate.setHours(0, 0, 0, 0)
      return eventDate >= now
    })
  }, [yourEventsRaw])
  
  // Filter member groups to exclude groups already in organiser tab (avoid duplicates)
  const filteredMemberGroups = useMemo(() => {
    if (organisedGroups.length === 0) {
      return memberGroups
    }
    const organisedGroupIds = new Set(organisedGroups.map(group => group.id))
    return memberGroups.filter(group => !organisedGroupIds.has(group.id))
  }, [memberGroups, organisedGroups])
  
  // Filter discover events to exclude events already in user's events (avoid duplicates)
  const discoverEvents = useMemo(() => {
    if (!isAuthenticated || yourEvents.length === 0) {
      return allEvents
    }
    const yourEventIds = new Set(yourEvents.map(event => event.id))
    return allEvents.filter(event => !yourEventIds.has(event.id))
  }, [allEvents, yourEvents, isAuthenticated])

  // ============================================================
  // EFFECTS
  // ============================================================
  
  // Handle welcome URL parameter on mount
  useEffect(() => {
    if (showDiscover) {
      const currentUrl = new URL(window.location)
      if (!currentUrl.searchParams.has('welcome')) {
        currentUrl.searchParams.set('welcome', 'true')
        navigate(`/?welcome=true`, { replace: true })
      }
    }
  }, [showDiscover, navigate])
  
  // Smart tab selection: Auto-select organiser tab if user has organised groups
  useEffect(() => {
    if (!hasInitializedTab && !organisedGroupsLoading && user?.hasOrganiserRole) {
      // If organiser has groups, default to organiser tab
      // If organiser has no groups, stay on member tab
      if (organisedGroups.length > 0) {
        setActiveGroupTab('organiser')
      }
      setHasInitializedTab(true)
    }
  }, [organisedGroupsLoading, organisedGroups.length, user?.hasOrganiserRole, hasInitializedTab])

  // ============================================================
  // EVENT HANDLERS
  // ============================================================
  
  // Handle discover button click (save to localStorage and show dashboard)
  const handleDiscoverClick = () => {
    localStorage.setItem('hasDiscovered', 'true')
    setShowDiscover(false)
    // Clean URL by removing welcome parameter
    window.history.replaceState({}, '', '/')
    // Also use navigate to ensure React Router state is updated
    navigate('/', { replace: true })
  }

  // ============================================================
  // HERO VIEW - First-time visitor landing page
  // ============================================================
  if (showDiscover) {
    return <WelcomeScreen onDiscoverClick={handleDiscoverClick} />
  }

  // ============================================================
  // DASHBOARD VIEW - Main home page with groups and events
  // ============================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30">
      <div className="flex flex-col lg:flex-row gap-8 px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 lg:pt-10 pb-10">
        
        {/* ========== LEFT SIDEBAR: YOUR GROUPS ========== */}
        <div className="hidden md:block w-full lg:w-1/4 order-3 lg:order-1">
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
          
          {/* Login prompt for non-authenticated users - Hidden on mobile (fixed bottom button shows instead) */}
          {!isAuthenticated ? (
            <div className="hidden md:block bg-white/80 backdrop-blur-sm rounded-2xl p-8 text-center border-2 border-dashed border-purple-300 shadow-lg">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 002 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Login to See Your Groups</h3>
              <p className="text-sm text-gray-600 mb-4">Join groups and connect with outdoor enthusiasts</p>
              <button
                onClick={() => setLoginModalOpen(true)}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all transform hover:scale-105"
              >
                Login Now
              </button>
            </div>
          ) : (
            <>
              {/* Tabs - Completely hidden on mobile, visible on tablet+ */}
              <div className="mb-6 hidden md:block">
                {/* Desktop version - full tabs */}
                <div className="hidden lg:flex bg-white/60 backdrop-blur-sm p-1.5 rounded-full inline-flex">
                  <nav className="flex gap-2">
                    {user?.hasOrganiserRole && (
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
                
                {/* Tablet version - icon only */}
                <div className="flex lg:hidden bg-white/60 backdrop-blur-sm p-1.5 rounded-full inline-flex">
                  <nav className="flex gap-2">
                    {user?.hasOrganiserRole && (
                      <button
                        onClick={() => setActiveGroupTab('organiser')}
                        className={`p-3 rounded-full font-semibold text-sm transition-all duration-200 ${
                          activeGroupTab === 'organiser'
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                        title="Organiser"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => setActiveGroupTab('member')}
                      className={`p-3 rounded-full font-semibold text-sm transition-all duration-200 ${
                        activeGroupTab === 'member'
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      title="Member"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
              
              <div className="space-y-3">
                {/* ========== MEMBER TAB - Subscribed Groups ========== */}
                {activeGroupTab === 'member' && (
                  <>
                    {groupsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                      </div>
                    ) : filteredMemberGroups.length > 0 ? (
                      filteredMemberGroups.map(group => (
                        <div key={group.id} className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                          onClick={() => navigate(`/groups/${group.id}`)}>
                          {/* Group Banner */}
                          <div className="relative h-20 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-90" />
                            {group.bannerImage ? (
                              <img 
                                src={group.bannerImage}
                                alt={`${group.name} banner`}
                                className="w-full h-full object-cover mix-blend-overlay group-hover:scale-110 transition-transform duration-300"
                                loading="lazy"
                                decoding="async"
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                }}
                              />
                            ) : null}
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
                          🎯 No groups yet. Join some groups to get started!
                        </div>
                      </div>
                    )}
                  </>
                )}
                
                {/* ========== ORGANISER TAB - Managed Groups ========== */}
                {activeGroupTab === 'organiser' && user?.hasOrganiserRole && (
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
                            {group.imageUrl ? (
                              <img 
                                src={group.imageUrl}
                                alt={`${group.name} banner`}
                                className="w-full h-full object-cover mix-blend-overlay group-hover:scale-110 transition-transform duration-300"
                                loading="lazy"
                                decoding="async"
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                }}
                              />
                            ) : null}
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
            </>
          )}
        </div>

        {/* ========== RIGHT CONTENT: EVENTS ========== */}
        <div className="w-full lg:w-3/4 flex flex-col gap-12 order-1 lg:order-2">
          
          {/* ========== DISCOVER EVENTS SECTION (FIRST ON MOBILE FOR UNAUTHENTICATED) ========== */}
          <div className={!isAuthenticated ? 'order-1' : 'order-2'}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">Discover Events</h2>
              </div>
              <span className="text-sm text-gray-500 font-medium">{discoverEvents.length} event{discoverEvents.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {allEventsLoading ? (
                <div className="col-span-full flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
                </div>
              ) : discoverEvents.length > 0 ? (
                discoverEvents.map(event => (
                  <div 
                    key={event.id} 
                    className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-2xl border border-gray-100 overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-2"
                    onClick={() => navigate(`/events/${event.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && navigate(`/events/${event.id}`)}
                  >
                    {/* Event Image */}
                    <div className="relative w-full h-48 overflow-hidden bg-gradient-to-br from-orange-500 to-pink-500">
                      {/* Mountain icon placeholder when no image */}
                      {!event.imageUrl && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-16 h-16 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                        </div>
                      )}
                      {event.imageUrl && (
                        <img 
                          src={event.imageUrl}
                          alt={event.title} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            e.target.style.display = 'none'
                          }}
                        />
                      )}
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
          
          {/* ========== YOUR EVENTS SECTION (SECOND ON MOBILE FOR UNAUTHENTICATED, FIRST FOR AUTHENTICATED) ========== */}
          {isAuthenticated && (
            <div className="order-1">
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
                      <div className="relative w-full h-48 overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500">
                        {/* Mountain icon placeholder when no image */}
                        {!event.imageUrl && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="w-16 h-16 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                          </div>
                        )}
                        {event.imageUrl && (
                          <img 
                            src={event.imageUrl}
                            alt={event.title} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              e.target.style.display = 'none'
                            }}
                          />
                        )}
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
                      🎯 No events yet. Discover events below!
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Fixed Login Button - Only show on mobile for unauthenticated users */}
      {!isAuthenticated && (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
          {/* Overlay backdrop */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-black/10 to-transparent pointer-events-none" />
          {/* Login button */}
          <div className="relative bg-white/95 backdrop-blur-md border-t border-gray-200/50 px-4 py-4 safe-area-pb">
            <button
              onClick={() => setLoginModalOpen(true)}
              className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-3 text-lg"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Sign in
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
            </button>
          </div>
        </div>
      )}


      {/* Login Modal */}
      <LoginModal 
        isOpen={loginModalOpen} 
        onClose={() => setLoginModalOpen(false)} 
      />
    </div>
  )
}
