import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { groupsAPI } from '../lib/api'
import { X, Users, MapPin, Lock, CheckCircle, Loader } from 'lucide-react'
import toast from 'react-hot-toast'

/**
 * JoinGroupModal - Modal overlay for joining a group without leaving current page
 * 
 * Features:
 * - Shows group preview with name, location, member count
 * - Join button with loading state
 * - Success state with checkmark
 * - Auto-closes after successful join
 * - Refreshes parent page data
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is visible
 * @param {Function} props.onClose - Callback to close modal
 * @param {string} props.groupId - ID of group to join
 * @param {string} props.groupName - Name of group (optional, for display)
 * @param {Function} props.onSuccess - Callback after successful join
 */
export default function JoinGroupModal({ isOpen, onClose, groupId, groupName, onSuccess }) {
  const queryClient = useQueryClient()
  const [joinSuccess, setJoinSuccess] = useState(false)

  // Fetch full group details
  const { data: groupData, isLoading: isLoadingGroup } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => groupsAPI.getGroupById(groupId),
    enabled: isOpen && !!groupId,
  })

  const group = groupData?.data

  // Join group mutation
  const joinMutation = useMutation({
    mutationFn: () => groupsAPI.subscribeToGroup(groupId),
    onSuccess: async () => {
      setJoinSuccess(true)
      
      // Invalidate all relevant queries
      await queryClient.invalidateQueries(['group', groupId])
      await queryClient.invalidateQueries(['myGroups'])
      await queryClient.invalidateQueries(['event']) // Refresh event data to show unlocked content
      
      toast.success(`🎉 Successfully joined ${group?.name || 'the group'}!`)
      
      // Call parent success callback
      if (onSuccess) {
        onSuccess()
      }
      
      // Auto-close after 1.5 seconds
      setTimeout(() => {
        setJoinSuccess(false)
        onClose()
      }, 1500)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to join group')
    },
  })

  // Don't render if not open
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-white rounded-3xl shadow-2xl max-w-md w-full pointer-events-auto transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative p-6 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 rounded-t-3xl">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-white" />
            </button>
            
            <div className="flex items-center gap-3 text-white">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                <Users className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Join Group</h2>
                <p className="text-white/90 text-sm">Unlock full event access</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {isLoadingGroup ? (
              /* Loading state */
              <div className="text-center py-8">
                <Loader className="h-12 w-12 mx-auto mb-4 text-purple-600 animate-spin" />
                <p className="text-gray-600">Loading group details...</p>
              </div>
            ) : joinSuccess ? (
              /* Success state */
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 mb-4 animate-bounce">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Welcome! 🎉</h3>
                <p className="text-gray-600">You're now a member of {group?.name}</p>
              </div>
            ) : (
              /* Join form */
              <>
                {/* Group Info Card */}
                <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 rounded-2xl p-6 mb-6 border border-purple-100">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {group?.name || groupName || 'Loading...'}
                  </h3>
                  
                  {group?.location && (
                    <div className="flex items-center gap-2 text-gray-700 mb-2">
                      <MapPin className="h-4 w-4 text-pink-600" />
                      <span className="text-sm">{group.location}</span>
                    </div>
                  )}
                  
                  {group?.currentMembers !== undefined && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Users className="h-4 w-4 text-purple-600" />
                      <span className="text-sm">
                        {group.currentMembers} {group.currentMembers === 1 ? 'member' : 'members'}
                        {group.maxMembers && ` (max ${group.maxMembers})`}
                      </span>
                    </div>
                  )}
                  
                  {group?.description && (
                    <p className="text-sm text-gray-600 mt-3 line-clamp-3">
                      {group.description}
                    </p>
                  )}
                </div>

                {/* Benefits Section */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-purple-600" />
                    What you'll unlock:
                  </h4>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>Full event details and location</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>Ability to register for events</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>Comment and interact with members</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>Access to all group events</span>
                    </li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => joinMutation.mutate()}
                    disabled={joinMutation.isLoading}
                    className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2"
                  >
                    {joinMutation.isLoading ? (
                      <>
                        <Loader className="h-5 w-5 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      <>
                        <Users className="h-5 w-5" />
                        Join Group
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
