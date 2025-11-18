// ============================================================
// IMPORTS
// ============================================================
import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { membersAPI } from '../lib/api'
import { ArrowLeft, Calendar } from 'lucide-react'

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function MemberDetailPage() {
  // ============================================================
  // HOOKS & ROUTING
  // ============================================================
  const { id } = useParams()  // Get member ID from URL
  const navigate = useNavigate()

  // ============================================================
  // DATA FETCHING
  // ============================================================
  
  // Fetch member details by ID
  const { data: member, isLoading, isError } = useQuery({
    queryKey: ['member', id],
    queryFn: () => membersAPI.getMemberById(id).then(res => res.data),
    enabled: !!id,
  })

  // ============================================================
  // HELPER FUNCTIONS
  // ============================================================
  
  // Generate initials from name or email for avatar fallback
  const getInitials = (name, email) => {
    if (name && name.trim()) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    if (email) {
      return email[0].toUpperCase()
    }
    return '?'
  }

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading member profile...</p>
        </div>
      </div>
    )
  }

  // ============================================================
  // ERROR STATE
  // ============================================================
  if (isError || !member) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Member Not Found</h2>
          <p className="text-gray-600 mb-6">We couldn't find the member you're looking for.</p>
          <button
            onClick={() => navigate(-1)}
            className="py-3 px-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all transform hover:scale-105"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ========== BACK BUTTON ========== */}
        <button
          onClick={() => navigate(-1)}
          className="group flex items-center text-gray-600 hover:text-purple-600 mb-6 font-semibold transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>

        {/* ========== MEMBER PROFILE CARD ========== */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          
          {/* GRADIENT BANNER */}
          <div className="relative h-48 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500">
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
          </div>

          {/* ========== PROFILE CONTENT ========== */}
          <div className="relative px-8 pb-8">
            
            {/* PROFILE PICTURE - Overlaps gradient banner */}
            <div className="flex justify-center -mt-20 mb-6">
              {member.profilePhotoUrl ? (
                <img
                  src={member.profilePhotoUrl}
                  alt={member.displayName || member.email}
                  className="h-40 w-40 rounded-full border-8 border-white shadow-2xl object-cover"
                />
              ) : (
                <div className="h-40 w-40 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-6xl border-8 border-white shadow-2xl">
                  {getInitials(member.displayName, member.email)}
                </div>
              )}
            </div>

            {/* ========== MEMBER INFO ========== */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
                {member.displayName || 'OutMeets Member'}
              </h1>
              {member.isOrganiser && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-100 to-pink-100 rounded-full border border-orange-200 mb-3">
                  <span className="text-lg">💼</span>
                  <span className="font-semibold text-orange-700">Organiser</span>
                </div>
              )}
            </div>

            {/* ========== MEMBER DETAILS ========== */}
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Member Since */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100 text-center">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <Calendar className="h-6 w-6 text-purple-600" />
                  <h3 className="font-bold text-gray-900 text-lg">Member Since</h3>
                </div>
                <p className="text-gray-700 text-2xl font-bold">
                  {new Date(member.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </div>

              {/* Additional Info Coming Soon */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-100 text-center">
                <div className="text-4xl mb-3">🚀</div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">More Features Coming Soon!</h3>
                <p className="text-gray-600 text-sm">
                  We're working on adding activity history, group memberships, and more details to member profiles.
                </p>
              </div>
            </div>

            {/* ========== ACTION BUTTONS ========== */}
            <div className="mt-8 flex gap-4 justify-center">
              <button
                onClick={() => navigate(-1)}
                className="py-3 px-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all transform hover:scale-105"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
