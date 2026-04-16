import { useState } from 'react'
import { Plus, Trash2, GripVertical, Eye, EyeOff, MessageCircle } from 'lucide-react'

// ============================================================
// PLATFORM DEFINITIONS
// ============================================================
export const PLATFORMS = {
  WHATSAPP:  { label: 'WhatsApp',  icon: '💬', color: 'from-green-500 to-green-600',  placeholder: 'Phone number e.g. +447911123456' },
  TELEGRAM:  { label: 'Telegram',  icon: '✈️', color: 'from-blue-400 to-blue-500',    placeholder: 'Username e.g. @johndoe' },
  INSTAGRAM: { label: 'Instagram', icon: '📷', color: 'from-pink-500 to-purple-500',   placeholder: 'Username e.g. @johndoe' },
  FACEBOOK:  { label: 'Facebook',  icon: '👤', color: 'from-blue-600 to-blue-700',     placeholder: 'Profile URL or username' },
  X_TWITTER: { label: 'X / Twitter', icon: '𝕏', color: 'from-gray-800 to-gray-900',  placeholder: 'Username e.g. @johndoe' },
  LINKEDIN:  { label: 'LinkedIn',  icon: '💼', color: 'from-blue-700 to-blue-800',     placeholder: 'Profile URL or username' },
  SNAPCHAT:  { label: 'Snapchat',  icon: '👻', color: 'from-yellow-400 to-yellow-500', placeholder: 'Username e.g. johndoe' },
  OTHER:     { label: 'Other',     icon: '🔗', color: 'from-gray-500 to-gray-600',     placeholder: 'URL or contact info' },
}

export const VISIBILITY_OPTIONS = [
  { value: 'EVERYONE',        label: 'Everyone',        desc: 'All logged-in users', icon: '🌍' },
  { value: 'GROUP_MEMBERS',   label: 'Group members',   desc: 'People in your groups', icon: '👥' },
  { value: 'EVENT_ATTENDEES', label: 'Event attendees', desc: 'People in your events', icon: '🎯' },
  { value: 'NOBODY',          label: 'Only me',         desc: 'Hidden from everyone', icon: '🔒' },
]

// ============================================================
// CONTACT INFO EDITOR (used in ProfilePage edit mode)
// ============================================================
export default function ContactInfoEditor({ contacts, onChange }) {

  const addContact = () => {
    const usedPlatforms = contacts.map(c => c.platform)
    const firstAvailable = Object.keys(PLATFORMS).find(p => !usedPlatforms.includes(p)) || 'OTHER'
    onChange([...contacts, {
      platform: firstAvailable,
      contactValue: '',
      visibility: 'GROUP_MEMBERS',
      displayOrder: contacts.length,
    }])
  }

  const removeContact = (index) => {
    onChange(contacts.filter((_, i) => i !== index))
  }

  const updateContact = (index, field, value) => {
    const updated = [...contacts]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }

  return (
    <div className="space-y-3">
      {contacts.map((contact, index) => (
        <div
          key={index}
          className="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-start gap-3">
            {/* Platform select */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{PLATFORMS[contact.platform]?.icon || '🔗'}</span>
                <select
                  value={contact.platform}
                  onChange={(e) => updateContact(index, 'platform', e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                >
                  {Object.entries(PLATFORMS).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Contact value */}
              <input
                type="text"
                value={contact.contactValue}
                onChange={(e) => updateContact(index, 'contactValue', e.target.value)}
                placeholder={PLATFORMS[contact.platform]?.placeholder || 'Enter contact info'}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 focus:bg-white outline-none transition-colors"
              />

              {/* Visibility */}
              <div className="flex items-center gap-2">
                <Eye className="h-3.5 w-3.5 text-slate-400" />
                <select
                  value={contact.visibility}
                  onChange={(e) => updateContact(index, 'visibility', e.target.value)}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-100 outline-none"
                >
                  {VISIBILITY_OPTIONS.map(({ value, label, icon }) => (
                    <option key={value} value={value}>{icon} {label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Remove button */}
            <button
              type="button"
              onClick={() => removeContact(index)}
              className="mt-1 p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Remove"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}

      {/* Add button */}
      {contacts.length < Object.keys(PLATFORMS).length && (
        <button
          type="button"
          onClick={addContact}
          className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 px-4 py-3 text-sm font-semibold text-slate-500 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50/50 transition-all"
        >
          <Plus className="h-4 w-4" />
          Add contact method
        </button>
      )}

      {contacts.length === 0 && (
        <div className="text-center py-4">
          <MessageCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No contact methods added yet</p>
        </div>
      )}
    </div>
  )
}
