import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, LogOut, Search, Shield, User, Users, Bug } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { googleLogout } from '@react-oauth/google'
import { useAuthStore } from '../store/authStore'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { membersAPI, adminAPI } from '../lib/api'
import { useFeatureFlags } from '../contexts/FeatureFlagContext'
import ProfileAvatar from './ProfileAvatar'
import LoginModal from './LoginModal'
import OrganiserAgreementModal from './OrganiserAgreementModal'
import UserAgreementModal from './UserAgreementModal'
import NotificationBell from './NotificationBell'
import FeedbackWidget from './FeedbackWidget'

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [showOrganiserModal, setShowOrganiserModal] = useState(false)
  const [showUserAgreementModal, setShowUserAgreementModal] = useState(false)
  const [showCreateGroupPrompt, setShowCreateGroupPrompt] = useState(false)
  const { isAuthenticated, user, logout, updateUser, clearReturnUrl } = useAuthStore()
  const userAgreementShownRef = useRef(false)
  const organiserAgreementShownRef = useRef(false)
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const { featureFlags } = useFeatureFlags()

  // Sync search query with URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const urlSearch = urlParams.get('search') || ''
    setSearchQuery(urlSearch)
  }, [location.search])

  // Listen for global requests to open the login modal
  useEffect(() => {
    const handler = () => setLoginModalOpen(true)
    window.addEventListener('open-login-modal', handler)
    return () => window.removeEventListener('open-login-modal', handler)
  }, [])

  // Fetch current member data for profile photo
  const { data: memberData } = useQuery({
    queryKey: ['currentMember'],
    queryFn: () => membersAPI.getCurrentMember().then(res => res.data),
    enabled: isAuthenticated,
  })

  // Check if user is admin
  const { data: isAdmin } = useQuery({
    queryKey: ['isAdmin'],
    queryFn: () => adminAPI.checkAdminStatus().then(res => res.data),
    enabled: isAuthenticated,
  })

  const isNewUser = false // no longer used

  // Reset session refs on logout so modals re-trigger on next login if still not accepted
  useEffect(() => {
    if (!isAuthenticated) {
      userAgreementShownRef.current = false
      organiserAgreementShownRef.current = false
    }
  }, [isAuthenticated])

  // Sync memberData with auth store - CRITICAL for organiser features!
  useEffect(() => {
    if (memberData && isAuthenticated) {
      // Safety guard: if memberData email/id doesn't match the current JWT user, the cache is
      // stale from a previous session. Invalidate and bail out – the re-fetch will provide
      // the correct data.  This prevents Safari (and all browsers) from bleeding one user's
      // identity into another after a logout/login cycle.
      if (user?.id && memberData.id && String(memberData.id) !== String(user.id)) {
        queryClient.invalidateQueries({ queryKey: ['currentMember'] })
        queryClient.invalidateQueries({ queryKey: ['isAdmin'] })
        return
      }
      // Update auth store with latest member data
      updateUser({
        hasOrganiserRole: memberData.hasOrganiserRole,
        hasAcceptedOrganiserAgreement: memberData.hasAcceptedOrganiserAgreement,
        hasAcceptedUserAgreement: memberData.hasAcceptedUserAgreement,
        displayName: memberData.displayName,
        profilePhotoUrl: memberData.profilePhotoUrl,
      })
      
      // Show user agreement modal if not accepted - only once per session
      // Skipped entirely when USER_AGREEMENT_ENABLED feature flag is false
      if (!memberData.hasAcceptedUserAgreement && !userAgreementShownRef.current) {
        userAgreementShownRef.current = true
        console.log('USER_AGREEMENT_ENABLED:', featureFlags.USER_AGREEMENT_ENABLED)
        if (featureFlags.USER_AGREEMENT_ENABLED !== false) {
          setShowUserAgreementModal(true)
        }
      }
      
      // Show organiser agreement modal if user has organiser role but hasn't accepted current agreement - only once per session
      if (memberData.hasOrganiserRole && !memberData.hasAcceptedOrganiserAgreement && !organiserAgreementShownRef.current) {
        console.log('⚠️ Existing organiser has not accepted current Organiser Agreement - showing modal')
        organiserAgreementShownRef.current = true
        setShowOrganiserModal(true)
      }
    }
  }, [memberData, isAuthenticated]) // updateUser intentionally omitted - stable Zustand action

  // Close bell when menu closes

  // Handle becoming an organiser - show modal
  const handleBecomeOrganiser = () => {
    setShowOrganiserModal(true)
    setMobileMenuOpen(false) // Close mobile menu if open
  }

  const handleLogout = () => {
    queryClient.clear() // Clear ALL React Query cache so stale data from previous user never bleeds into next session
    // Revoke the Google OAuth session so Safari doesn't silently reuse the previous
    // Google account the next time "Continue with Google" is clicked
    try { googleLogout() } catch (e) { /* ignore if no Google session active */ }
    logout()
    navigate('/')
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/events?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  // Handle login button click - clear any stale returnUrl
  const handleLoginClick = () => {
    clearReturnUrl() // Clear any old returnUrl from previous sessions
    setLoginModalOpen(true)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with modern vibrant gradient - Hide only on welcome screen */}
      {!(location.pathname === '/' && location.search.includes('welcome=true')) && (
        <header className="relative bg-transparent sticky top-0 z-[999] overflow-visible shadow-lg">
        {/* Modern gradient background */}
        <div className="absolute inset-0 -z-10 w-full h-full bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500">
          {/* Smooth gradient fade at bottom of header */}
          <div className="absolute left-0 right-0 bottom-0 h-2 -z-10" style={{background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(255,255,255,0) 100%)'}} />
        </div>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-4">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0">
              <Link to="/" className="flex items-center h-10">
                {/* Modern Logo with text */}
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 md:w-11 md:h-11">
                    <img 
                      src="/favicon1.svg" 
                      alt="OutMeets" 
                      className="w-full h-full object-contain drop-shadow-lg"
                    />
                  </div>
                  <span className="text-2xl font-extrabold text-white drop-shadow-md hidden sm:block">OutMeets</span>
                </div>
              </Link>
            </div>

            {/* Search Bar - Mobile & Desktop - Hide on welcome screen */}
            {!(location.pathname === '/' && location.search.includes('welcome=true')) && (
              <div className="flex-1 max-w-md mx-4 flex items-center">
                <form onSubmit={handleSearch} className="w-full">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search events..."
                      className="w-full pl-8 md:pl-10 pr-8 py-1.5 md:py-2 text-sm rounded-full border-2 border-white/30 focus:outline-none focus:ring-2 focus:ring-white focus:border-white bg-white/20 backdrop-blur-md placeholder-white/70 text-white font-medium transition-all"
                    />
                    <Search className="absolute left-2.5 md:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 md:h-4 md:w-4 text-white/70" />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 md:right-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 md:h-4 md:w-4 text-white/70 hover:text-white transition-colors"
                        aria-label="Clear search"
                      >
                        <X className="h-full w-full" />
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4 flex-shrink-0">
              {isAuthenticated ? (
                <>
                  {/* Notification Bell */}
                  <NotificationBell 
                    onOrganiserInvitationClick={() => setShowOrganiserModal(true)}
                  />
                  
                  <div className="relative group z-[1000]">
                    {/* Invisible bridge to keep dropdown open */}
                    <div className="absolute right-0 top-full w-48 h-2 hidden group-hover:block"></div>
                    <button className="flex items-center space-x-2 text-white/90 hover:text-white px-3 py-2 rounded-full text-sm font-semibold bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all border border-white/20">
                      <ProfileAvatar member={memberData} size="sm" className="border-2 border-white" />
                      <span className="max-w-[120px] truncate">{memberData?.displayName || user?.email}</span>
                    </button>
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-2xl py-2 hidden group-hover:block z-[1000] border border-gray-100">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Profile
                      </Link>
                      <Link
                        to="/my-groups"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Groups
                      </Link>
                      <Link
                        to="/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Settings
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          className="block px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 font-semibold flex items-center space-x-2"
                        >
                          <Shield className="h-4 w-4" />
                          <span>Admin </span>
                        </Link>
                      )}
                      {!memberData?.hasOrganiserRole && !featureFlags?.DISABLE_BECOME_ORGANISER_BUTTON && (
                        <button
                          onClick={handleBecomeOrganiser}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Become Organiser
                        </button>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <button
                  onClick={handleLoginClick}
                  className="bg-white text-purple-600 hover:bg-white/90 px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Login
                </button>
              )}
            </div>
            {/* Mobile actions */}
            {isAuthenticated && (
              <div className="md:hidden flex items-center gap-3">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="text-white hover:text-white/80 transition-colors"
                  aria-label="Open menu"
                >
                  {mobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </button>
              </div>
            )}
          </div>
          {/* Mobile Navigation - side drawer */}
          {mobileMenuOpen && isAuthenticated && (
            <div className="fixed inset-0 z-[1100] md:hidden">
              <button
                aria-label="Close menu"
                className="absolute inset-0 w-full h-full bg-[rgba(0,0,0,0.5)] backdrop-blur-sm"
                onClick={() => setMobileMenuOpen(false)}
              />
              <div className="absolute inset-y-0 right-0 left-auto ml-auto h-full w-80 max-w-[80%] bg-gradient-to-b from-purple-600 via-pink-600 to-orange-500 shadow-2xl flex flex-col relative">
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="self-end p-3 text-white hover:text-white/80"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="flex-1 overflow-y-auto pb-4 space-y-1">
                  <Link
                    to="/profile"
                    className={`flex items-center gap-3 pl-5 pr-4 py-3 text-base font-semibold text-white hover:bg-white/10 ${location.pathname === '/profile' ? 'bg-white/10' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="h-5 w-5 text-white" />
                    <span>Profile</span>
                  </Link>
                  <Link
                    to="/my-groups"
                    className={`flex items-center gap-3 pl-5 pr-4 py-3 text-base font-semibold text-white hover:bg-white/10 ${location.pathname === '/my-groups' ? 'bg-white/10' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Users className="h-5 w-5 text-white" />
                    <span>Groups</span>
                  </Link>
                  <Link
                    to="/settings"
                    className={`flex items-center gap-3 pl-5 pr-4 py-3 text-base font-semibold text-white hover:bg-white/10 ${location.pathname === '/settings' ? 'bg-white/10' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="h-5 w-5 text-white" />
                    <span>Settings</span>
                  </Link>
                  <button
                    className="flex w-full items-center gap-3 pl-5 pr-4 py-3 text-base font-semibold text-white hover:bg-white/10"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      navigate('/notifications')
                    }}
                  >
                    <NotificationBell
                      className="flex-shrink-0"
                      buttonClassName="p-0 text-white hover:text-white"
                      iconClassName="h-5 w-5"
                      onOrganiserInvitationClick={() => setShowOrganiserModal(true)}
                      size="compact"
                      disableDropdown
                      showBadge
                    />
                    <span>Notifications</span>
                  </button>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className={`flex items-center gap-3 pl-5 pr-4 py-3 text-base font-semibold text-white hover:bg-white/10 ${location.pathname.startsWith('/admin') ? 'bg-white/10' : ''}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Shield className="h-5 w-5 text-white" />
                      <span>Admin</span>
                    </Link>
                  )}
                  {!memberData?.hasOrganiserRole && !featureFlags?.DISABLE_BECOME_ORGANISER_BUTTON && (
                    <button
                      onClick={() => {
                        handleBecomeOrganiser()
                        setMobileMenuOpen(false)
                      }}
                      className="flex items-center gap-3 w-full text-left pl-5 pr-4 py-3 text-base font-semibold text-white hover:bg-white/10"
                    >
                      <Shield className="h-5 w-5 text-white" />
                      Become Organiser
                    </button>
                  )}
                  <button
                    onClick={() => {
                      handleLogout()
                      setMobileMenuOpen(false)
                    }}
                    className="flex items-center gap-3 w-full text-left pl-5 pr-4 py-3 text-base font-semibold text-white hover:bg-white/10"
                  >
                    <LogOut className="h-5 w-5 text-white" />
                    <span>Logout</span>
                  </button>
                </div>
                <button
                  onClick={() => {
                    const trigger = document.querySelector('[data-feedback-trigger]')
                    if (trigger) {
                      setMobileMenuOpen(false)
                      // wait for drawer close transition (~250ms) before triggering modal for smoother UX
                      setTimeout(() => trigger.click(), 260)
                    }
                  }}
                  className="absolute right-4 bottom-6 h-12 w-12 rounded-full bg-white text-orange-500 shadow-lg flex items-center justify-center"
                  aria-label="Feedback"
                >
                  <Bug className="h-6 w-6" />
                </button>
              </div>
            </div>
          )}
        </nav>
      </header>
      )}

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Login Modal */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSuccess={() => setLoginModalOpen(false)}
      />

      {/* Organiser Agreement Modal */}
      <OrganiserAgreementModal
        isOpen={showOrganiserModal}
        onClose={() => setShowOrganiserModal(false)}
        onAccept={() => {
          setShowOrganiserModal(false)
          // Show create group prompt after organiser agreement accepted
          setShowCreateGroupPrompt(true)
          // Refresh member data after acceptance
          queryClient.invalidateQueries(['currentMember'])
        }}
        isAlreadyOrganiser={memberData?.hasOrganiserRole || false}
      />

      {/* User Agreement Modal - Cannot be dismissed */}
      <UserAgreementModal
        isOpen={showUserAgreementModal}
        onClose={() => {
          // User agreement cannot be dismissed - they must accept
          console.log('⚠️ User Agreement modal cannot be closed without accepting')
        }}
        onAccept={() => {
          setShowUserAgreementModal(false)
          // Refresh member data after acceptance
          queryClient.invalidateQueries(['currentMember'])
        }}
      />

      {/* Create Group Prompt Modal */}
      {showCreateGroupPrompt && (
        <div className="fixed inset-0 z-[2000]">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative z-10 flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
              <div className="text-center">
                {/* Icon */}
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>

                {/* Title */}
                <h3 className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  Welcome, Organiser! 🎉
                </h3>
                
                {/* Message */}
                <p className="text-gray-600 mb-2">
                  You now have organiser privileges!
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Would you like to create your first group to start building your outdoor community?
                </p>

                {/* Actions */}
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setShowCreateGroupPrompt(false)
                      navigate('/groups/create')
                    }}
                    className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-200 transform hover:scale-105"
                  >
                    Start Creating Your First Group
                  </button>
                  
                  <button
                    onClick={() => setShowCreateGroupPrompt(false)}
                    className="w-full py-2 px-6 text-gray-500 font-medium rounded-xl hover:bg-gray-50 transition-all text-sm"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback floating button */}
      {isAuthenticated && <FeedbackWidget />}
    </div>
  )
}
