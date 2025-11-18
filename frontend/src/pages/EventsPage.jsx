// ============================================================
// IMPORTS
// ============================================================
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { eventsAPI } from '../lib/api'
import EventCard from '../components/EventCard'

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function EventsPage() {
  // ============================================================
  // HOOKS & URL PARAMS
  // ============================================================
  const [searchParams, setSearchParams] = useSearchParams()  // URL query parameters
  const urlSearch = searchParams.get('search') || ''  // Get search from URL
  
  // ============================================================
  // LOCAL STATE
  // ============================================================
  const [page, setPage] = useState(0)  // Current pagination page (0-indexed)
  const [searchKeyword, setSearchKeyword] = useState(urlSearch)  // Active search query for API
  const [searchInput, setSearchInput] = useState(urlSearch)  // Search input field value
  
  // ============================================================
  // EFFECTS
  // ============================================================
  
  // Sync local state with URL parameters (enables shareable search URLs)
  useEffect(() => {
    const urlSearch = searchParams.get('search') || ''
    setSearchKeyword(urlSearch)
    setSearchInput(urlSearch)
    setPage(0)
  }, [searchParams])

  // ============================================================
  // DATA FETCHING
  // ============================================================
  
  // Fetch events - either search results or all upcoming events
  const { data, isLoading } = useQuery({
    queryKey: ['events', page, searchKeyword],
    queryFn: () => 
      searchKeyword 
        ? eventsAPI.searchEvents(searchKeyword, page, 20)
        : eventsAPI.getUpcomingEvents(page, 20),
  })

  // ============================================================
  // DERIVED STATE
  // ============================================================
  const events = data?.data?.content || []  // Extract events array from paginated response
  const totalPages = data?.data?.totalPages || 0  // Total pages for pagination

  // ============================================================
  // EVENT HANDLERS
  // ============================================================
  
  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault()
    if (searchInput.trim()) {
      setSearchParams({ search: searchInput.trim() })
    } else {
      setSearchParams({})
    }
    setPage(0)
  }
  
  // Clear search and reset to all events
  const handleClearSearch = () => {
    setSearchInput('')
    setSearchKeyword('')
    setSearchParams({})
    setPage(0)
  }

  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">🎉 Browse Events</h1>
          
          {/* ========== SEARCH BAR ========== */}
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by title, location, difficulty, group, or organiser..."
                className="w-full pl-14 pr-6 py-4 bg-white/60 backdrop-blur-sm border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium text-lg shadow-lg"
              />
            </div>
            <button type="submit" className="py-4 px-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-xl hover:shadow-purple-500/50 transition-all transform hover:scale-105">
              Search
            </button>
            {searchKeyword && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="py-4 px-6 bg-white/60 backdrop-blur-sm text-gray-700 font-semibold rounded-xl hover:bg-white transition-all border border-gray-200 shadow-lg"
              >
                Clear
              </button>
            )}
          </form>
          
          {/* ========== SEARCH RESULTS MESSAGE ========== */}
          {searchKeyword && (
            <div className="mt-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-purple-200">
              <p className="text-gray-700">
                <span className="font-semibold">Searching for:</span>{' '}
                <span className="text-purple-600 font-bold">"{searchKeyword}"</span>
                {!isLoading && (
                  <span className="ml-2 text-gray-600">- Found {events.length} event{events.length !== 1 ? 's' : ''}</span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* ========== EVENTS GRID ========== */}
        
        {/* LOADING STATE - Skeleton cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 animate-pulse border border-gray-100 shadow-lg">
                <div className="h-48 bg-gradient-to-br from-purple-200 to-pink-200 rounded-xl mb-4"></div>
                <div className="h-6 bg-gray-200 rounded-lg w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded-lg w-1/2"></div>
              </div>
            ))}
          </div>
        ) : events.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>

            {/* ========== PAGINATION ========== */}
            {totalPages > 1 && (
              <div className="mt-10 flex justify-center items-center gap-3">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="py-3 px-6 bg-white/60 backdrop-blur-sm text-gray-700 font-semibold rounded-xl hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 shadow-lg"
                >
                  ← Previous
                </button>
                <span className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-lg">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="py-3 px-6 bg-white/60 backdrop-blur-sm text-gray-700 font-semibold rounded-xl hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 shadow-lg"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-16 text-center border border-gray-100 shadow-lg">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No events found</h3>
            <p className="text-gray-600">Try a different search or browse all events.</p>
          </div>
        )}
      </div>
    </div>
  )
}
