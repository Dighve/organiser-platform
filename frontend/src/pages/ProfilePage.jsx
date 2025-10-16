import { useAuthStore } from '../store/authStore'

export default function ProfilePage() {
  const { user } = useAuthStore()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-8">👤 My Profile</h1>
        
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 border border-gray-100 shadow-2xl">
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="flex items-center gap-6 pb-6 border-b border-gray-200">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-4xl text-white font-bold">{user?.email?.[0]?.toUpperCase() || '?'}</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{user?.email || 'Not available'}</h2>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full border border-purple-200">
                  <span className="text-lg">{user?.isOrganiser ? '💼' : '🌟'}</span>
                  <span className="font-semibold text-purple-700">{user?.isOrganiser ? 'Organiser' : 'Member'}</span>
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span>📧</span> Email Address
                </label>
                <p className="text-lg font-medium text-gray-900">{user?.email || 'Not available'}</p>
              </div>
              
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-6 border border-orange-100">
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span>🎭</span> Account Type
                </label>
                <p className="text-lg font-medium text-gray-900">{user?.isOrganiser ? 'Organiser Account' : 'Member Account'}</p>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span>🆔</span> User ID
                </label>
                <p className="text-lg font-medium text-gray-900 font-mono">{user?.userId || 'Not available'}</p>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-100">
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span>🔐</span> Authentication
                </label>
                <p className="text-lg font-medium text-gray-900">Magic Link</p>
              </div>
            </div>

            {/* Info Message */}
            <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 rounded-2xl p-6 border border-purple-100 text-center">
              <p className="text-sm text-gray-600 mb-2">✨ <strong>More profile features coming soon!</strong></p>
              <p className="text-xs text-gray-500">We're working on adding profile editing, preferences, and more.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
