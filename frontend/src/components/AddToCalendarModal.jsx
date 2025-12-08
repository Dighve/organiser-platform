import { X, Calendar, CheckCircle, Compass } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AddToCalendar from './AddToCalendar'

/**
 * AddToCalendarModal Component
 * Beautiful modal that appears after successfully joining an event
 * Encourages users to add the event to their calendar immediately
 */
export default function AddToCalendarModal({ isOpen, onClose, calendarData, eventTitle }) {
  const navigate = useNavigate()
  
  if (!isOpen) return null

  const handleExploreEvents = () => {
    onClose()
    navigate('/events')
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal Container - Scrollable */}
      <div className="fixed inset-0 z-50 overflow-y-auto pointer-events-none">
        <div className="min-h-screen px-4 py-8 flex items-center justify-center">
          {/* Modal - with pointer events enabled */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full pointer-events-auto animate-scale-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
          aria-label="Close modal"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>

        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-lg rounded-full flex items-center justify-center animate-bounce-slow">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            🎉 You're In!
          </h2>
          <p className="text-white/90 text-sm">
            Successfully joined <span className="font-semibold">{eventTitle}</span>
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Message */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-gray-700">
              <Calendar className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-bold">Don't Miss This Adventure!</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Add this event to your calendar to get reminders and never miss out.
            </p>
          </div>

          {/* Add to Calendar Button */}
          {calendarData && (
            <AddToCalendar calendarData={calendarData} />
          )}

          {/* Skip Button */}
          <button
            onClick={onClose}
            className="w-full py-3 px-6 text-gray-700 hover:text-gray-900 font-semibold rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
          >
            Maybe Later
          </button>

          {/* Explore Other Events Button */}
          <button
            onClick={handleExploreEvents}
            className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all transform hover:scale-105 flex items-center justify-center gap-2"
          >
            <Compass className="h-5 w-5" />
            Explore Other Events
          </button>

          {/* Helper Text */}
          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              💡 You can always add this to your calendar later from the event page
            </p>
          </div>
        </div>
          </div>
        </div>
      </div>
    </>
  )
}
