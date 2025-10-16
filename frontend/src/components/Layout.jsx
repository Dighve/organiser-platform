import { Outlet, Link, useNavigate } from 'react-router-dom'
import { Menu, X, User, LogOut } from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '../store/authStore'

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isAuthenticated, user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with cartoon hiking background */}
  <header className="relative bg-transparent sticky top-0 z-[999] overflow-visible">
        {/* Cartoon hiking SVG background */}
  <div className="absolute inset-0 -z-10 w-full h-full bg-gradient-to-b from-green-200 to-green-400 flex items-center justify-center">
  {/* Smooth gradient fade at bottom of header */}
  <div className="absolute left-0 right-0 bottom-0 h-8 -z-10" style={{background: 'linear-gradient(to bottom, rgba(126,217,87,0.5) 0%, rgba(255,255,255,0) 100%)'}} />
          <svg width="100%" height="100%" viewBox="0 0 800 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <ellipse cx="400" cy="100" rx="350" ry="40" fill="#7ed957" />
            <ellipse cx="200" cy="80" rx="120" ry="20" fill="#b6e388" />
            <ellipse cx="600" cy="90" rx="100" ry="15" fill="#b6e388" />
            <ellipse cx="400" cy="60" rx="60" ry="10" fill="#4e944f" />
            <ellipse cx="500" cy="70" rx="40" ry="8" fill="#4e944f" />
            <ellipse cx="300" cy="70" rx="40" ry="8" fill="#4e944f" />
            {/* Cartoon trees */}
            <circle cx="150" cy="65" r="10" fill="#388e3c" />
            <rect x="145" y="65" width="5" height="10" fill="#795548" />
            <circle cx="650" cy="75" r="9" fill="#388e3c" />
            <rect x="645" y="75" width="4" height="8" fill="#795548" />
          </svg>
        </div>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                {/* Custom SVG: Mountain range and hiker with pole */}
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Mountain range */}
                  <polygon points="2,44 14,24 24,44" fill="#7ed957" />
                  <polygon points="14,44 26,18 38,44" fill="#4e944f" />
                  <polygon points="26,44 36,28 46,44" fill="#b6e388" />
                  {/* Hiker */}
                  <circle cx="32" cy="32" r="3" fill="#795548" /> {/* Head */}
                  <rect x="31" y="35" width="2" height="7" rx="1" fill="#388e3c" /> {/* Body */}
                  <rect x="30" y="40" width="1.5" height="6" rx="0.75" fill="#795548" transform="rotate(-20 30 40)" /> {/* Left leg */}
                  <rect x="33" y="40" width="1.5" height="6" rx="0.75" fill="#795548" transform="rotate(20 33 40)" /> {/* Right leg */}
                  <rect x="32.5" y="36" width="1" height="6" rx="0.5" fill="#795548" transform="rotate(-30 32.5 36)" /> {/* Hiking pole */}
                </svg>
              </Link>
            </div>
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <div className="relative group z-[1000]">
                    {/* Invisible bridge to keep dropdown open */}
                    <div className="absolute right-0 top-full w-48 h-2 hidden group-hover:block"></div>
                    <button className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium">
                      <User className="h-4 w-4" />
                      <span>{user?.email}</span>
                    </button>
                    <div className="absolute right-0 top-full w-48 bg-white rounded-md shadow-lg py-1 hidden group-hover:block z-[1000]">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Profile
                      </Link>
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
                <Link
                  to="/login"
                  className="bg-primary-600 text-white hover:bg-primary-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Login
                </Link>
              )}
            </div>
            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-700 hover:text-primary-600"
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
            <div className="md:hidden py-4 space-y-2">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    className="block text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout()
                      setMobileMenuOpen(false)
                    }}
                    className="block w-full text-left text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-base font-medium"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="block text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Organiser Platform</h3>
              <p className="text-gray-400">
                Connect with outdoor enthusiasts and join amazing activities.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/groups/browse" className="text-gray-400 hover:text-white">
                    Browse Groups
                  </Link>
                </li>
                <li>
                  <Link to="/events" className="text-gray-400 hover:text-white">
                    Browse Events
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <p className="text-gray-400">
                Email: support@organiserplatform.com
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400">
            <p>&copy; 2025 Organiser Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
