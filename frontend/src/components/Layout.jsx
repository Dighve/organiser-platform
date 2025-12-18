import { Outlet, Link, useNavigate } from 'react-router-dom'
import { Menu, X, LogOut, Search, Shield } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { membersAPI, adminAPI } from '../lib/api'
import ProfileAvatar from './ProfileAvatar'
import LoginModal from './LoginModal'
import OrganiserAgreementModal from './OrganiserAgreementModal'
import UserAgreementModal from './UserAgreementModal'

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [showOrganiserModal, setShowOrganiserModal] = useState(false)
  const [showUserAgreementModal, setShowUserAgreementModal] = useState(false)
  const { isAuthenticated, user, logout, updateUser, clearReturnUrl } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

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
        isOrganiser: memberData.isOrganiser,
        hasAcceptedOrganiserAgreement: memberData.hasAcceptedOrganiserAgreement,
        hasAcceptedUserAgreement: memberData.hasAcceptedUserAgreement,
        displayName: memberData.displayName,
        profilePhotoUrl: memberData.profilePhotoUrl,
      })
      // console.log('🔄 Auth store updated with member data:', {
      //   isOrganiser: memberData.isOrganiser,
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
      setSearchQuery('')
    }
  }

  // Handle login button click - clear any stale returnUrl
  const handleLoginClick = () => {
    clearReturnUrl() // Clear any old returnUrl from previous sessions
    setLoginModalOpen(true)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with modern vibrant gradient */}
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
                  <div className="relative">
                    <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
                      {/* Mountain range - updated colors */}
                      <polygon points="2,44 14,24 24,44" fill="#FBBF24" opacity="0.9" />
                      <polygon points="14,44 26,18 38,44" fill="#F59E0B" opacity="0.9" />
                      <polygon points="26,44 36,28 46,44" fill="#FDE68A" opacity="0.8" />
                      {/* Hiker */}
                      <circle cx="32" cy="32" r="3" fill="white" opacity="0.95" />
                      <rect x="31" y="35" width="2" height="7" rx="1" fill="white" opacity="0.95" />
                      <rect x="30" y="40" width="1.5" height="6" rx="0.75" fill="white" opacity="0.95" transform="rotate(-20 30 40)" />
                      <rect x="33" y="40" width="1.5" height="6" rx="0.75" fill="white" opacity="0.95" transform="rotate(20 33 40)" />
                      <rect x="32.5" y="36" width="1" height="6" rx="0.5" fill="white" opacity="0.95" transform="rotate(-30 32.5 36)" />
                    </svg>
                  </div>
                  <span className="text-2xl font-extrabold text-white drop-shadow-md hidden sm:block">OutMeets</span>
                </div>
              </Link>
            </div>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-lg">
              <form onSubmit={handleSearch} className="w-full">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search events..."
                    className="w-full pl-12 pr-4 py-3 rounded-full border-2 border-white/30 focus:outline-none focus:ring-2 focus:ring-white focus:border-white bg-white/20 backdrop-blur-md placeholder-white/70 text-white font-medium transition-all"
                  />
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/70" />
                </div>
              </form>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4 flex-shrink-0">
              {isAuthenticated ? (
                <>
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
            {/* Mobile menu button and login */}
            <div className="md:hidden flex items-center gap-3">
              {!isAuthenticated && (
                <button
                  onClick={handleLoginClick}
                  className="bg-white text-purple-600 hover:bg-white/90 px-4 py-2 rounded-full text-sm font-bold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Login
                </button>
              )}
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
          </div>
          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-2 bg-white/10 backdrop-blur-md rounded-b-2xl mt-2">
              {/* Search Bar - Mobile */}
              <form onSubmit={handleSearch} className="px-3 pb-2">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search events..."
                    className="w-full pl-12 pr-4 py-3 rounded-full border-2 border-white/30 focus:outline-none focus:ring-2 focus:ring-white bg-white/20 backdrop-blur-sm placeholder-white/70 text-white font-medium"
                  />
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/70" />
                </div>
              </form>
              
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
              ) : (
                <button
                  onClick={() => {
                    handleLoginClick()
                    setMobileMenuOpen(false)
                  }}
                  className="block mx-3 text-center bg-white text-purple-600 hover:bg-white/90 px-6 py-2.5 rounded-full text-base font-bold transition-all shadow-lg w-[calc(100%-1.5rem)]"
                >
                  Login
                </button>
              )}
            </div>
          )}
        </nav>
      </header>

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

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polygon points="2,44 14,24 24,44" fill="#FBBF24" opacity="0.9" />
                <polygon points="14,44 26,18 38,44" fill="#F59E0B" opacity="0.9" />
                <polygon points="26,44 36,28 46,44" fill="#FDE68A" opacity="0.8" />
              </svg>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">OutMeets</span>
            </div>
            <div className="text-center text-gray-400">
              <p className="text-sm">&copy; 2025 OutMeets. Connect through outdoor adventures. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
