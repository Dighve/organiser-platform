import { ExternalLink } from 'lucide-react'
import { PLATFORMS, VISIBILITY_OPTIONS } from './ContactInfoEditor'

const VISIBILITY_BADGES = {
  EVERYONE:        { label: 'Everyone',    icon: '🌍', color: 'bg-green-50 text-green-700 border-green-200' },
  GROUP_MEMBERS:   { label: 'Group members', icon: '👥', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  EVENT_ATTENDEES: { label: 'Event attendees', icon: '🎯', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  NOBODY:          { label: 'Only me',     icon: '🔒', color: 'bg-slate-50 text-slate-500 border-slate-200' },
}

// ============================================================
// CONTACT INFO DISPLAY
// showPrivacy: true on own profile, false on other profiles
// ============================================================
export default function ContactInfoDisplay({ contacts, showPrivacy = false }) {
  if (!contacts || contacts.length === 0) return null

  return (
    <div className="space-y-2">
      {contacts.map((contact) => {
        const platform = PLATFORMS[contact.platform] || PLATFORMS.OTHER
        const badge = VISIBILITY_BADGES[contact.visibility]
        return (
          <a
            key={contact.id || contact.platform}
            href={contact.deepLink || '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-white/80 px-4 py-3 shadow-sm hover:shadow-md hover:border-purple-200 hover:-translate-y-0.5 transition-all cursor-pointer backdrop-blur-sm"
          >
            {/* Platform icon */}
            <div className={`h-10 w-10 grid place-items-center rounded-xl bg-gradient-to-br ${platform.color} text-white text-lg shadow-sm`}>
              {platform.icon}
            </div>

            {/* Label + value + privacy */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase text-slate-500 tracking-wide">
                {contact.displayLabel || platform.label}
              </p>
              <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-purple-600 transition-colors">
                {contact.contactValue}
              </p>
              {showPrivacy && badge && (
                <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${badge.color}`}>
                  {badge.icon} {badge.label}
                </span>
              )}
            </div>

            {/* Open link icon */}
            <ExternalLink className="h-4 w-4 text-slate-300 group-hover:text-purple-500 transition-colors flex-shrink-0" />
          </a>
        )
      })}
    </div>
  )
}
