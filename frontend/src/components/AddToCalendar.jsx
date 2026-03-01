import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronDown, Download } from 'lucide-react'
import { 
  generateGoogleCalendarUrl, 
  generateOutlookCalendarUrl, 
  generateYahooCalendarUrl,
  downloadICSFile 
} from '../utils/calendarUtils'

/**
 * AddToCalendar Component
 * Beautiful dropdown button that allows users to add events to their preferred calendar
 * Supports: Google Calendar, Apple Calendar, Outlook, Yahoo, and ICS download
 */
export default function AddToCalendar({ calendarData, className = '', variant = 'button' }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

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

  const handleCalendarClick = (provider) => {
    let url
    
    switch (provider) {
      case 'google':
        url = generateGoogleCalendarUrl(calendarData)
        window.open(url, '_blank', 'noopener,noreferrer')
        break
      case 'outlook':
        url = generateOutlookCalendarUrl(calendarData)
        window.open(url, '_blank', 'noopener,noreferrer')
        break
      case 'yahoo':
        url = generateYahooCalendarUrl(calendarData)
        window.open(url, '_blank', 'noopener,noreferrer')
        break
      case 'apple':
      case 'ics':
        downloadICSFile(calendarData)
        break
      default:
        break
    }
    
    setIsOpen(false)
  }

  const calendarOptions = [
    {
      id: 'google',
      name: 'Google Calendar',
      icon: '📅',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'apple',
      name: 'Apple Calendar',
      icon: '🍎',
      color: 'from-gray-700 to-gray-800'
    },
    {
      id: 'outlook',
      name: 'Outlook',
      icon: '📧',
      color: 'from-blue-600 to-indigo-600'
    },
    {
      id: 'yahoo',
      name: 'Yahoo Calendar',
      icon: '🟣',
      color: 'from-purple-600 to-purple-700'
    },
    {
      id: 'ics',
      name: 'Download ICS',
      icon: '💾',
      color: 'from-green-600 to-emerald-600'
    }
  ]

  if (variant === 'list') {
    return (
      <div className={`space-y-2 ${className}`}>
        {calendarOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => handleCalendarClick(option.id)}
            className="group w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-all text-left"
          >
            <div className={`flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br ${option.color} text-white shadow-sm`}>
              <span className="text-lg">{option.icon}</span>
            </div>
            <span className="flex-1 font-semibold text-gray-800">{option.name}</span>
            {option.id === 'ics' && (
              <Download className="h-4 w-4 text-gray-400 group-hover:text-green-600 transition-colors" />
            )}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Main Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
      >
        <Calendar className="h-5 w-5 group-hover:rotate-12 transition-transform" />
        <span>Add to Calendar</span>
        <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-[100] mt-2 w-full bg-white/95 backdrop-blur-lg rounded-xl shadow-2xl border-2 border-gray-100 overflow-hidden animate-fade-in">
          <div className="p-2 space-y-1">
            {calendarOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleCalendarClick(option.id)}
                className="group w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-200 text-left"
              >
                {/* Icon */}
                <div className={`flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${option.color} text-white shadow-md group-hover:scale-110 transition-transform`}>
                  <span className="text-xl">{option.icon}</span>
                </div>
                
                {/* Name */}
                <span className="flex-1 font-semibold text-gray-700 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 group-hover:bg-clip-text transition-all">
                  {option.name}
                </span>
                
                {/* Download icon for ICS */}
                {option.id === 'ics' && (
                  <Download className="h-4 w-4 text-gray-400 group-hover:text-green-600 transition-colors" />
                )}
              </button>
            ))}
          </div>
          
          {/* Helper Text */}
          <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 border-t border-gray-100">
            <p className="text-xs text-gray-600 text-center">
              💡 Choose your preferred calendar app
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
