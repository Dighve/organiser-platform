import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { membersAPI, groupsAPI } from '../lib/api'
import { X, Search, UserPlus, Send, Check, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import ProfileAvatar from './ProfileAvatar'

export default function InviteMembersModal({ 
  isOpen, 
  onClose, 
  type = 'event', // 'event' or 'group'
  itemId,
  title,
  url,
  groupId // Optional: to check if members are already in the group
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMembers, setSelectedMembers] = useState([])
  const [personalMessage, setPersonalMessage] = useState('')
  const searchInputRef = useRef(null)

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  // Fetch all members (you can add pagination later)
  const { data: membersData, isLoading } = useQuery({
    queryKey: ['allMembers'],
    queryFn: () => membersAPI.getAllMembers(),
    enabled: isOpen,
  })

  // Fetch group members if groupId is provided (to show "Not Member" badge)
  const { data: groupMembersData } = useQuery({
    queryKey: ['groupMembers', groupId],
    queryFn: () => groupsAPI.getGroupMembers(groupId),
    enabled: isOpen && !!groupId,
  })

  const members = membersData?.data || []
  const groupMemberIds = new Set(
    (groupMembersData?.data || []).map(m => m.id)
  )

  // Filter members based on search term
  const filteredMembers = members.filter(member => {
    const displayName = member.displayName || 'Unknown User'
    const searchLower = searchTerm.toLowerCase()
    return displayName.toLowerCase().includes(searchLower)
  })

  // Send invitations mutation
  const sendInvitationsMutation = useMutation({
    mutationFn: async (invitationData) => {
      return groupsAPI.sendInvitations(invitationData)
    },
    onSuccess: () => {
      toast.success(`Invitations sent to ${selectedMembers.length} member${selectedMembers.length > 1 ? 's' : ''}!`)
      setSelectedMembers([])
      setPersonalMessage('')
      onClose()
    },
    onError: (error) => {
      toast.error('Failed to send invitations. Please try again.')
      console.error('Invitation error:', error)
    }
  })

  const toggleMemberSelection = (member) => {
    setSelectedMembers(prev => {
      const isSelected = prev.some(m => m.id === member.id)
      if (isSelected) {
        return prev.filter(m => m.id !== member.id)
      } else {
        return [...prev, member]
      }
    })
  }

  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchTerm(value)
  }

  const handleSendInvitations = () => {
    if (selectedMembers.length === 0) {
      toast.error('Please select at least one member to invite')
      return
    }

    sendInvitationsMutation.mutate({
      type,
      itemId,
      memberIds: selectedMembers.map(m => m.id),
      message: personalMessage,
      url
    })
  }

  if (!isOpen) return null

  const modalContent = (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal - Centered, Wide */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header with Close Button */}
        <div className="relative p-6 border-b border-gray-200">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
          <div className="pr-12">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Invite Members
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Invite members from your community to {type === 'event' ? 'this event' : 'this group'}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search members by name..."
              className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm"
            />
          </div>
          
          {/* Selected Members Count */}
          {selectedMembers.length > 0 && (
            <div className="mt-2 flex items-center gap-2 text-xs">
              <div className="px-2.5 py-1 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full text-purple-700 font-semibold">
                {selectedMembers.length} selected
              </div>
              <button
                onClick={() => setSelectedMembers([])}
                className="text-gray-600 hover:text-purple-600 underline text-xs"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Members List - Single filtered list */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 text-purple-600 animate-spin mb-4" />
              <p className="text-gray-600">Loading members...</p>
            </div>
          ) : filteredMembers.length > 0 ? (
            <div className="space-y-1">
              {filteredMembers.map((member) => {
                const isSelected = selectedMembers.some(m => m.id === member.id)
                const displayName = member.displayName || 'Unknown User'
                const isMember = groupMemberIds.has(member.id)
                
                return (
                  <button
                    key={member.id}
                    onClick={() => toggleMemberSelection(member)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                      isSelected 
                        ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300' 
                        : 'hover:bg-gray-50 border-2 border-transparent'
                    }`}
                  >
                    <ProfileAvatar member={member} size="sm" />
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 truncate">{displayName}</p>
                        {groupId && !isMember && (
                          <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                            Not Member
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="flex-shrink-0 w-5 h-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <UserPlus className="h-16 w-16 text-gray-300 mb-4" />
              <p className="text-gray-600 font-semibold">No members found</p>
              <p className="text-sm text-gray-500 mt-1">
                {searchTerm ? 'Try a different search term' : 'No members available to invite'}
              </p>
            </div>
          )}
        </div>

        {/* Personal Message (Optional) */}
        {selectedMembers.length > 0 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Add a personal message (optional)
            </label>
            <textarea
              value={personalMessage}
              onChange={(e) => setPersonalMessage(e.target.value)}
              placeholder="Hey! I think you'd enjoy this..."
              rows={2}
              maxLength={500}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              {personalMessage.length}/500 characters
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-white rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 font-semibold hover:bg-gray-100 rounded-lg transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSendInvitations}
            disabled={selectedMembers.length === 0 || sendInvitationsMutation.isPending}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2 text-sm"
          >
            {sendInvitationsMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send {selectedMembers.length > 0 ? `(${selectedMembers.length})` : 'Invitations'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
