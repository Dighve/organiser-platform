// ============================================================
// IMPORTS
// ============================================================
import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { groupsAPI } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { ArrowLeft, UserPlus, AlertTriangle, Users } from 'lucide-react'
import ProfileAvatar from '../components/ProfileAvatar'
import { toast } from 'react-hot-toast'

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function TransferOwnershipPage() {
  // ============================================================
  // HOOKS & ROUTING
  // ============================================================
  const navigate = useNavigate()
  const { id } = useParams()
  const { isAuthenticated } = useAuthStore()
  const queryClient = useQueryClient()
  
  // ============================================================
  // LOCAL STATE
  // ============================================================
  const [selectedNewOrganiser, setSelectedNewOrganiser] = useState(null)

  // ============================================================
  // QUERIES
  // ============================================================
  
  // Fetch group details
  const { data: groupData } = useQuery({
    queryKey: ['group', id],
    queryFn: () => groupsAPI.getGroupById(id),
    enabled: !!id,
  })

  // Fetch group members
  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ['groupMembers', id],
    queryFn: () => groupsAPI.getGroupMembers(id),
    enabled: !!id,
  })

  const group = groupData?.data

  // ============================================================
  // MUTATIONS
  // ============================================================
  
  // Transfer ownership mutation
  const transferOwnershipMutation = useMutation({
    mutationFn: (newOrganiserId) => groupsAPI.transferOwnership(id, newOrganiserId),
    onSuccess: () => {
      queryClient.invalidateQueries(['group', id])
      queryClient.invalidateQueries(['myGroups'])
      queryClient.invalidateQueries(['myOrganisedGroups'])
      queryClient.invalidateQueries(['groupMembers', id])
      toast.success('Group ownership transferred successfully!')
      navigate(`/groups/${id}`)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to transfer ownership')
    },
  })
  
  // ============================================================
  // EVENT HANDLERS
  // ============================================================
  
  const handleTransfer = () => {
    if (selectedNewOrganiser) {
      transferOwnershipMutation.mutate(selectedNewOrganiser.id)
    }
  }
  
  // ============================================================
  // UNAUTHENTICATED STATE
  // ============================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 flex items-center justify-center px-4">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-10 text-center max-w-md">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
          <p className="text-gray-600 mb-6">Please login to transfer group ownership.</p>
          <button
            onClick={() => navigate('/login')}
            className="py-3 px-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all transform hover:scale-105"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }
  
  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 pb-32">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        
        {/* ========== MOBILE HEADER ========== */}
        <div className="sm:hidden mb-6">
          <div className="flex items-center mb-4">
            <button
              onClick={() => navigate(`/groups/${id}`)}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-lg text-gray-600 hover:text-purple-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ========== DESKTOP HEADER ========== */}
        <div className="hidden sm:block">
          <button
            onClick={() => navigate(`/groups/${id}`)}
            className="group flex items-center text-gray-600 hover:text-purple-600 mb-6 font-semibold transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Group
          </button>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-8">Transfer Group Ownership</h1>
        </div>
        
        {/* ========== CONTENT ========== */}
        <div className="bg-white/80 sm:bg-white/60 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-gray-100 shadow-xl sm:shadow-2xl space-y-4 sm:space-y-6">
          
          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-amber-800 mb-1">Important: Transfer of Ownership</p>
                <p className="text-sm text-amber-700">
                  You will no longer be the organiser of this group. The new organiser will have full control over the group, including the ability to remove members and delete the group.
                </p>
              </div>
            </div>
          </div>

          {/* Select New Organiser */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Select New Organiser</h3>
            <p className="text-sm text-gray-600 mb-4">
              Choose an active member to become the new organiser of this group.
            </p>

            {membersLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading members...</p>
              </div>
            ) : membersData?.data && membersData.data.filter(member => !member.isOrganiser).length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {membersData.data
                  .filter(member => !member.isOrganiser)
                  .map((member) => (
                    <label
                      key={member.id}
                      className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all hover:bg-gray-50 ${
                        selectedNewOrganiser?.id === member.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="newOrganiser"
                        value={member.id}
                        checked={selectedNewOrganiser?.id === member.id}
                        onChange={() => setSelectedNewOrganiser(member)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      <ProfileAvatar member={member} size="md" />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {member.displayName || (member.email ? member.email.split('@')[0] : 'Member')}
                        </p>
                        <p className="text-sm text-gray-500">
                          Member since {new Date(member.joinedAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </p>
                      </div>
                    </label>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No other members to transfer ownership to.</p>
                <p className="text-sm">Invite more members first.</p>
              </div>
            )}
          </div>

          {/* Confirmation */}
          {selectedNewOrganiser && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <UserPlus className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-indigo-800 mb-1">Ready to Transfer</p>
                  <p className="text-sm text-indigo-700">
                    <strong>{selectedNewOrganiser.displayName || selectedNewOrganiser.email?.split('@')[0]}</strong> will become the new organiser of this group.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========== FIXED BOTTOM BUTTONS (Mobile & Desktop) ========== */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 p-4 sm:p-6 z-40">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => navigate(`/groups/${id}`)}
            className="w-full sm:flex-1 py-4 sm:py-3 px-6 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all order-2 sm:order-1"
            disabled={transferOwnershipMutation.isPending}
          >
            Cancel
          </button>
          <button
            onClick={handleTransfer}
            disabled={!selectedNewOrganiser || transferOwnershipMutation.isPending}
            className="w-full sm:flex-1 py-4 sm:py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-2xl hover:shadow-indigo-500/50 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 order-1 sm:order-2"
          >
            {transferOwnershipMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                <span>Transferring...</span>
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5" />
                <span>Transfer Ownership</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
