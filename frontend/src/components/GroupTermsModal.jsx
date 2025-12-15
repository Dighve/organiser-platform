import { useState } from 'react'
import { FileText, X } from 'lucide-react'

export default function GroupTermsModal({ isOpen, onClose, onAccept, groupName, terms, isLoading }) {
  const [hasAccepted, setHasAccepted] = useState(false)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 max-h-[85vh] flex flex-col animate-fade-in">
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Header */}
          <div className="mb-6">
            <h2 className="text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Group Terms & Conditions
            </h2>
            <p className="text-gray-600">
              Please review and accept the terms for <span className="font-semibold text-gray-900">{groupName}</span>
            </p>
          </div>

          {/* Terms Content - Scrollable */}
          <div className="flex-1 overflow-y-auto border-2 border-gray-200 rounded-xl p-6 mb-6 bg-gray-50">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-bold text-gray-900">Terms You Must Accept</h3>
            </div>
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
              {terms}
            </div>
          </div>

          {/* Acceptance Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer group mb-6 p-4 rounded-xl hover:bg-purple-50 transition-colors">
            <input
              type="checkbox"
              checked={hasAccepted}
              onChange={(e) => setHasAccepted(e.target.checked)}
              className="mt-1 h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
            />
            <span className="text-sm text-gray-700 group-hover:text-gray-900 font-medium">
              I have read and agree to the group's terms and conditions
            </span>
          </label>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-3 px-6 rounded-xl font-semibold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={onAccept}
              disabled={!hasAccepted || isLoading}
              className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
                hasAccepted && !isLoading
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:shadow-purple-500/50 transform hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  <span>Joining...</span>
                </div>
              ) : (
                'Join Event'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
