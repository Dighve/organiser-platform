import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, LogOut, Search, Shield } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { membersAPI, adminAPI } from '../lib/api'
import ProfileAvatar from './ProfileAvatar'
import LoginModal from './LoginModal'
import OrganiserAgreementModal from './OrganiserAgreementModal'
import UserAgreementModal from './UserAgreementModal'
import NotificationBell from './NotificationBell'

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [showOrganiserModal, setShowOrganiserModal] = useState(false)
  const [showUserAgreementModal, setShowUserAgreementModal] = useState(false)
  const { isAuthenticated, user, logout, updateUser, clearReturnUrl } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()

  // Sync search query with URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const urlSearch = urlParams.get('search') || ''
    setSearchQuery(urlSearch)
  }, [location.search])

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

  // Sync memberData with auth store - CRITICAL for organiser features!
  useEffect(() => {
    if (memberData && isAuthenticated) {
      // Update auth store with latest member data
      updateUser({
        hasOrganiserRole: memberData.hasOrganiserRole,
        hasAcceptedOrganiserAgreement: memberData.hasAcceptedOrganiserAgreement,
        hasAcceptedUserAgreement: memberData.hasAcceptedUserAgreement,
        displayName: memberData.displayName,
        profilePhotoUrl: memberData.profilePhotoUrl,
      })
      // console.log('🔄 Auth store updated with member data:', {
      //   hasOrganiserRole: memberData.hasOrganiserRole,
      //   hasAcceptedOrganiserAgreement: memberData.hasAcceptedOrganiserAgreement,
      //   hasAcceptedUserAgreement: memberData.hasAcceptedUserAgreement,
      //   isAdmin: memberData.isAdmin
      // })
      
      // Show user agreement modal if not accepted
      if (!memberData.hasAcceptedUserAgreement) {
        console.log('⚠️ User has not accepted User Agreement - showing modal')
        setShowUserAgreementModal(true)
      }
    }
  }, [memberData, isAuthenticated, updateUser])

  // Handle becoming an organiser - show modal
  const handleBecomeOrganiser = () => {
    setShowOrganiserModal(true)
    setMobileMenuOpen(false) // Close mobile menu if open
  }

  const handleLogout = () => {
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
              <Link to="/" className="flex items-center">
                {/* Modern Logo with text */}
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10">
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
              <div className="flex-1 max-w-md mx-4">
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
                  <NotificationBell />
                  
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
                        My Groups
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          className="block px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 font-semibold flex items-center space-x-2"
                        >
                          <Shield className="h-4 w-4" />
                          <span>Admin Dashboard</span>
                        </Link>
                      )}
                      {!memberData?.hasAcceptedOrganiserAgreement && (
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
            {/* Mobile menu button - only show for authenticated users */}
            {isAuthenticated && (
              <div className="md:hidden flex items-center">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="text-white hover:text-white/80 transition-colors"
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
          {/* Mobile Navigation */}
          {mobileMenuOpen && isAuthenticated && (
            <div className="md:hidden py-4 space-y-2 bg-white/10 backdrop-blur-md rounded-b-2xl mt-2">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    className="block text-white hover:text-white/80 px-3 py-2 rounded-md text-base font-semibold"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    to="/my-groups"
                    className="block text-white hover:text-white/80 px-3 py-2 rounded-md text-base font-semibold"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Groups
                  </Link>
                  {!memberData?.hasAcceptedOrganiserAgreement && (
                    <button
                      onClick={handleBecomeOrganiser}
                      className="block w-full text-left text-white hover:text-white/80 px-3 py-2 rounded-md text-base font-semibold"
                    >
                      Become Organiser
                    </button>
                  )}
                  <button
                    onClick={() => {
                      handleLogout()
                      setMobileMenuOpen(false)
                    }}
                    className="block w-full text-left text-white hover:text-white/80 px-3 py-2 rounded-md text-base font-semibold"
                  >
                    Logout
                  </button>
                </>
              ) : null}
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
          // Refresh member data after acceptance
          queryClient.invalidateQueries(['currentMember'])
        }}
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
    </div>
  )
}
