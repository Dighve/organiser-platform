import React, { useState } from 'react'
import { X, FileText, Users, CheckCircle } from 'lucide-react'

const GroupGuidelinesModal = ({ isOpen, onClose, onAccept, groupName, guidelines, isLoading }) => {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
  const [hasAcceptedGuidelines, setHasAcceptedGuidelines] = useState(false)

  if (!isOpen) return null

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target
    // Consider "scrolled to bottom" if within 10px of the bottom
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      setHasScrolledToBottom(true)
    }
  }

  const handleAccept = () => {
    if (hasAcceptedGuidelines && (hasScrolledToBottom || guidelines.length < 500)) {
      onAccept()
    }
  }

  const canAccept = hasAcceptedGuidelines && (hasScrolledToBottom || guidelines.length < 500)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Group Guidelines</h3>
              <p className="text-sm text-gray-600 flex items-center mt-1">
                <Users className="w-4 h-4 mr-1" />
                {groupName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-700 leading-relaxed">
              Before joining <span className="font-semibold text-purple-600">{groupName}</span>, please read and accept the group guidelines below. These guidelines help ensure a positive experience for all members.
            </p>
          </div>

          {/* Guidelines Content */}
          <div className="mb-6">
            <div 
              className="max-h-64 overflow-y-auto p-4 bg-gray-50 rounded-xl border border-gray-200 prose prose-sm max-w-none"
              onScroll={handleScroll}
            >
              {guidelines ? (
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {guidelines}
                </div>
              ) : (
                <div className="text-gray-500 italic text-center py-8">
                  No specific guidelines have been set for this group.
                </div>
              )}
            </div>
            
            {/* Scroll indicator */}
            {guidelines && guidelines.length > 500 && !hasScrolledToBottom && (
              <p className="text-xs text-amber-600 mt-2 flex items-center">
                <span className="w-2 h-2 bg-amber-400 rounded-full mr-2 animate-pulse"></span>
                Please scroll to the bottom to read all guidelines
              </p>
            )}
          </div>

          {/* Acceptance Checkbox */}
          <div className="mb-6">
            <label className="flex items-start space-x-3 cursor-pointer">
              <div className="flex-shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={hasAcceptedGuidelines}
                  onChange={(e) => setHasAcceptedGuidelines(e.target.checked)}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                />
              </div>
              <span className="text-sm text-gray-700 leading-relaxed">
                I have read and agree to follow the group guidelines for{' '}
                <span className="font-semibold text-purple-600">{groupName}</span>
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleAccept}
              disabled={!canAccept || isLoading}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all flex items-center space-x-2 ${
                canAccept && !isLoading
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Joining...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Accept & Join Group</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GroupGuidelinesModal
