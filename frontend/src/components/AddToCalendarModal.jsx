import { X, Calendar, CheckCircle, Compass } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AddToCalendar from './AddToCalendar'

/**
 * AddToCalendarModal Component
 * Beautiful modal that appears after successfully joining an event
 * Encourages users to add the event to their calendar immediately
 */
export default function AddToCalendarModal({ isOpen, onClose, calendarData, eventTitle, isWaitlisted = false }) {
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
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm sm:max-w-md w-full pointer-events-auto animate-scale-in">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
              aria-label="Close modal"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>

            {/* Desktop / tablet richer content */}
            <div className="hidden sm:block">
              <div className={`p-8 text-center rounded-t-2xl ${isWaitlisted ? 'bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400' : 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500'}`}>
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-lg rounded-full flex items-center justify-center">
                    <CheckCircle className="h-10 w-10 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {isWaitlisted ? "You're on the Waitlist! \u23f3" : "\uD83C\uDF89 You're In!"}
                </h2>
                <p className="text-white/90 text-sm">
                  {isWaitlisted
                    ? <span>We&apos;ll notify you if a spot opens up for <span className="font-semibold">{eventTitle}</span></span>
                    : <span>Successfully joined <span className="font-semibold">{eventTitle}</span></span>
                  }
                </p>
              </div>

              <div className="p-6 space-y-6">
                {isWaitlisted ? (
                  <div className="text-center space-y-2">
                    <p className="text-gray-600 text-sm">
                      You&apos;ll receive an email and notification as soon as a spot becomes available. Keep an eye out!
                    </p>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 text-gray-700">
                      <Calendar className="h-5 w-5 text-purple-600" />
                      <h3 className="text-lg font-bold">Don&apos;t Miss This Adventure!</h3>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Add this event to your calendar to get reminders and never miss out.
                    </p>
                  </div>
                )}

                {!isWaitlisted && calendarData && (
                  <AddToCalendar calendarData={calendarData} />
                )}

                <button
                  onClick={onClose}
                  className="w-full py-3 px-6 text-gray-700 hover:text-gray-900 font-semibold rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
                >
                  {isWaitlisted ? 'Got it' : 'Maybe Later'}
                </button>

                <button
                  onClick={handleExploreEvents}
                  className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Compass className="h-5 w-5" />
                  Explore Other Events
                </button>
              </div>
            </div>

            {/* Mobile minimal content */}
            <div className="sm:hidden p-6 space-y-4">
              <div className="text-center text-sm font-semibold text-gray-800">
                {isWaitlisted ? "You're on the waitlist \u23f3" : "You're all in \uD83C\uDF89"}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={onClose}
                  className="h-14 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center shadow-sm hover:bg-purple-100 transition-all"
                  aria-label="Close"
                >
                  <Calendar className="h-6 w-6" />
                </button>
                <button
                  onClick={handleExploreEvents}
                  className="h-14 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center justify-center shadow-sm hover:shadow-lg transition-all"
                  aria-label="Explore events"
                >
                  <Compass className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
