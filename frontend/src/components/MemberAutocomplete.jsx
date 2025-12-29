import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { groupsAPI } from '../lib/api'
import { UserPlus, ChevronDown, Check } from 'lucide-react'

export default function MemberAutocomplete({ groupId, value, onChange, error }) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState(value || '')
  const dropdownRef = useRef(null)

  const { data: membersData, isLoading } = useQuery({
    queryKey: ['groupMembers', groupId],
    queryFn: () => groupsAPI.getGroupMembers(groupId),
    enabled: !!groupId,
  })

  const members = membersData?.data || []

  // Filter members based on search term
  const filteredMembers = members.filter(member => {
    const displayName = member.displayName || member.email.split('@')[0]
    return displayName.toLowerCase().includes(searchTerm.toLowerCase())
  })

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (member) => {
    const displayName = member.displayName || member.email.split('@')[0]
    setSearchTerm(displayName)
    // Pass the member object with ID instead of just the name
    onChange({ id: member.id, name: displayName })
    setIsOpen(false)
  }

  const handleInputChange = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    onChange(value)
    setIsOpen(true)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder="Search group members or type a name..."
          className={`w-full px-4 py-4 pr-10 text-base border-2 rounded-xl focus:ring-2 focus:ring-purple-500 font-medium transition-all ${
            error ? 'border-red-500' : 'border-gray-300 focus:border-purple-500'
          }`}
        />
        <ChevronDown 
          className={`absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border-2 border-purple-200 max-h-60 overflow-auto">
          {isLoading ? (
            <div className="px-4 py-8 text-center text-gray-500">
              <div className="animate-spin inline-block w-6 h-6 border-3 border-purple-600 border-t-transparent rounded-full"></div>
              <p className="mt-2 text-sm">Loading members...</p>
            </div>
          ) : filteredMembers.length > 0 ? (
            <>
              <div className="px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
                <p className="text-xs font-semibold text-purple-700 uppercase">Group Members ({filteredMembers.length})</p>
              </div>
              {filteredMembers.map((member) => {
                const displayName = member.displayName || member.email.split('@')[0]
                const isSelected = searchTerm === displayName
                
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => handleSelect(member)}
                    className={`w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all flex items-center gap-3 ${
                      isSelected ? 'bg-purple-50' : ''
                    }`}
                  >
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{displayName}</p>
                      <p className="text-xs text-gray-500 truncate">{member.email}</p>
                    </div>
                    {isSelected && (
                      <Check className="h-5 w-5 text-purple-600 flex-shrink-0" />
                    )}
                  </button>
                )
              })}
            </>
          ) : (
            <div className="px-4 py-8 text-center">
              <UserPlus className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">
                {searchTerm ? 'No members match your search' : 'No members found'}
              </p>
              <p className="text-gray-400 text-xs mt-1">
                You can still type any name manually
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
