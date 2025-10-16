import { useAuthStore } from '../store/authStore'

export default function ProfilePage() {
  const { user } = useAuthStore()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Profile</h1>
      <div className="card">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <p className="text-gray-900">{user?.email || 'Not available'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
            <p className="text-gray-900">{user?.isOrganiser ? 'Organiser' : 'Member'}</p>
          </div>
          <p className="text-sm text-gray-500 mt-4">More profile features coming soon...</p>
        </div>
      </div>
    </div>
  )
}
