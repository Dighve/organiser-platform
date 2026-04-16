import { ExternalLink } from 'lucide-react'
import { PLATFORMS } from './ContactInfoEditor'

// ============================================================
// CONTACT INFO DISPLAY (used on MemberDetailPage)
// Opens app/website when clicked
// ============================================================
export default function ContactInfoDisplay({ contacts }) {
  if (!contacts || contacts.length === 0) return null

  return (
    <div className="space-y-2">
      {contacts.map((contact) => {
        const platform = PLATFORMS[contact.platform] || PLATFORMS.OTHER
        return (
          <a
            key={contact.id || contact.platform}
            href={contact.deepLink || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-white/80 px-4 py-3 shadow-sm hover:shadow-md hover:border-purple-200 hover:-translate-y-0.5 transition-all cursor-pointer backdrop-blur-sm"
          >
            {/* Platform icon */}
            <div className={`h-10 w-10 grid place-items-center rounded-xl bg-gradient-to-br ${platform.color} text-white text-lg shadow-sm`}>
              {platform.icon}
            </div>

            {/* Label + value */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase text-slate-500 tracking-wide">
                {contact.displayLabel || platform.label}
              </p>
              <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-purple-600 transition-colors">
                {contact.contactValue}
              </p>
            </div>

            {/* Open link icon */}
            <ExternalLink className="h-4 w-4 text-slate-300 group-hover:text-purple-500 transition-colors flex-shrink-0" />
          </a>
        )
      })}
    </div>
  )
}
