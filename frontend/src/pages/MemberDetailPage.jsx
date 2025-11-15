import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { groupsAPI, eventsAPI } from '../lib/api'
import { ArrowLeft, Users, Calendar, MapPin, Mail } from 'lucide-react'

export default function MemberDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  // For now, we'll fetch group members to find this member
  // In a real app, you'd have a dedicated member API endpoint
  const [memberInfo, setMemberInfo] = React.useState(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    // This is a temporary solution - in production, you'd want a dedicated API endpoint
    // For now, we'll show a placeholder page
    setLoading(false)
  }, [id])

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading member profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(-1)}
          className="group flex items-center text-gray-600 hover:text-purple-600 mb-6 font-semibold transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>

        {/* Member Profile Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Header with gradient */}
          <div className="relative h-48 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500">
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
          </div>

          {/* Profile Content */}
          <div className="relative px-8 pb-8">
            {/* Profile Picture - Overlapping header */}
            <div className="flex justify-center -mt-20 mb-6">
              <div className="h-40 w-40 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-6xl border-8 border-white shadow-2xl">
                {id ? String(id).charAt(0).toUpperCase() : 'M'}
              </div>
            </div>

            {/* Member Info */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
                Member Profile
              </h1>
              <p className="text-gray-500 text-lg">Member ID: {id}</p>
            </div>

            {/* Info Notice */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100 text-center">
              <div className="text-5xl mb-4">🚧</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Coming Soon</h2>
              <p className="text-gray-600 mb-6">
                Member profile pages are currently under development. Soon you'll be able to view:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
                <div className="flex items-start gap-3 bg-white/60 p-4 rounded-xl">
                  <Users className="h-6 w-6 text-purple-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Member Details</h3>
                    <p className="text-sm text-gray-600">Name, bio, and interests</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-white/60 p-4 rounded-xl">
                  <Calendar className="h-6 w-6 text-orange-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Events Attended</h3>
                    <p className="text-sm text-gray-600">Past and upcoming events</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-white/60 p-4 rounded-xl">
                  <Users className="h-6 w-6 text-pink-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Group Memberships</h3>
                    <p className="text-sm text-gray-600">Groups they've joined</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-white/60 p-4 rounded-xl">
                  <Mail className="h-6 w-6 text-blue-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Contact Options</h3>
                    <p className="text-sm text-gray-600">Send messages to members</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
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

        {/* Additional Note */}
        <div className="mt-6 text-center text-gray-500 text-sm">
          💡 Tip: In the meantime, you can view member information on the group members page
        </div>
      </div>
    </div>
  )
}
