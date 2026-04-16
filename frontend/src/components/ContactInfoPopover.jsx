import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MessageCircle, X, Loader } from 'lucide-react'
import { membersAPI } from '../lib/api'
import ContactInfoDisplay from './ContactInfoDisplay'

// ============================================================
// CONTACT INFO POPOVER
// Shows a member's contacts in a floating card on chat icon click
// ============================================================
export default function ContactInfoPopover({ memberId, memberName, iconClassName = 'text-purple-400 hover:text-purple-600 hover:bg-purple-100' }) {
  const [open, setOpen] = useState(false)
  const popoverRef = useRef(null)

  // Fetch contacts only when popover is opened
  const { data: contacts, isLoading } = useQuery({
    queryKey: ['memberContacts', memberId],
    queryFn: () => membersAPI.getMemberContacts(memberId).then(res => res.data),
    enabled: open && !!memberId,
    staleTime: 2 * 60 * 1000,
  })

  // Close on click outside
  useEffect(() => {
    if (!open) return
    const handleClick = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
        title={`${memberName || 'Member'}'s contact info`}
        className={`flex-shrink-0 p-2 rounded-lg transition-colors ${iconClassName}`}
      >
        <MessageCircle className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-72 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-700 truncate">
              {memberName || 'Contact Info'}
            </p>
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false) }}
              className="p-1 rounded-md hover:bg-white/60 transition-colors"
            >
              <X className="h-3.5 w-3.5 text-gray-500" />
            </button>
          </div>

          {/* Body */}
          <div className="p-3 max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader className="h-5 w-5 animate-spin text-purple-400" />
              </div>
            ) : contacts && contacts.length > 0 ? (
              <ContactInfoDisplay contacts={contacts} />
            ) : (
              <div className="text-center py-6">
                <MessageCircle className="h-6 w-6 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400">No contact info available</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
