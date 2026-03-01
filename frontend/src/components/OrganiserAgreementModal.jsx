import { useState, useEffect } from 'react'
import { AlertTriangle, FileText, Loader2 } from 'lucide-react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { legalAPI } from '../lib/api'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'

export default function OrganiserAgreementModal({ isOpen, onClose, onAccept }) {
  const [hasAgreed, setHasAgreed] = useState(false)
  const [scrolledToBottom, setScrolledToBottom] = useState(false)
  const queryClient = useQueryClient()

  // Fetch current organiser agreement from backend
  const {
    data: agreementData,
    isLoading: isLoadingAgreement,
    error: agreementError,
    refetch: refetchAgreement
  } = useQuery({
    queryKey: ['currentOrganiserAgreement'],
    queryFn: async () => {
      console.log('🔄 Fetching current organiser agreement from backend...')
      const response = await legalAPI.getCurrentOrganiserAgreement()
      console.log('✅ Organiser agreement data fetched:', response.data)
      return response.data
    },
    enabled: isOpen, // Only fetch when modal is open
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    retry: 3
  })

  // Reset states when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setHasAgreed(false)
      setScrolledToBottom(false)
    }
  }, [isOpen])

  const acceptMutation = useMutation({
    mutationFn: async () => {
      console.log('🔄 Accepting organiser agreement...')
      console.log('📝 Request data:', {
        ipAddress: null,
        userAgent: navigator.userAgent || 'Unknown'
      })
      
      try {
        const response = await legalAPI.acceptOrganiserAgreement({
          ipAddress: null, // Backend will extract from request
          userAgent: navigator.userAgent || 'Unknown'
        })
        console.log('✅ Agreement accepted:', response)
        return response
      } catch (error) {
        console.error('❌ Accept agreement error:', error)
        console.error('Error response:', error.response)
        console.error('Error status:', error.response?.status)
        console.error('Error data:', error.response?.data)
        throw error
      }
    },
    onSuccess: async () => {
      toast.success('✅ Organiser Agreement accepted!')
      // Invalidate and wait for refetch to complete
      await queryClient.invalidateQueries(['currentMember'])
      // Small delay to ensure UI updates
      setTimeout(() => {
        if (onAccept) onAccept()
        onClose()
      }, 500)
    },
    onError: (error) => {
      console.error('❌ Mutation error:', error)
      
      // Handle specific error cases
      if (error.response?.status === 403) {
        toast.error('⛔ Please log in to accept the agreement')
      } else if (error.response?.status === 400) {
        toast.error('❌ Invalid request. Please try again.')
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to accept agreement'
        toast.error(errorMessage)
      }
    },
  })

  const handleScroll = (e) => {
    const bottom = Math.abs(e.target.scrollHeight - e.target.scrollTop - e.target.clientHeight) < 5
    if (bottom) setScrolledToBottom(true)
  }

  const canAccept = scrolledToBottom && hasAgreed

  if (!isOpen) return null

  // Show error state if agreement failed to load
  if (agreementError && !isLoadingAgreement) {
    return (
      <div className="fixed inset-0 z-[2000]">
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
        <div className="relative z-10 flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Failed to Load Agreement</h3>
              <p className="text-gray-600 mb-4">Unable to fetch the current organiser agreement. Please try again.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => refetchAgreement()}
                  className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                >
                  Retry
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[2000]">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
      
      <div className="relative z-10 flex min-h-full items-center justify-center p-0 sm:p-4">
        <div className="relative bg-white w-full h-[100svh] sm:h-auto sm:max-h-[90vh] sm:rounded-3xl shadow-2xl max-w-4xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex-shrink-0 flex items-start justify-between gap-4 px-5 sm:px-8 py-5 border-b border-gray-100 bg-white">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1">
                Updated Organiser Terms
              </h2>
              <p className="text-sm sm:text-base text-gray-600">Please review and accept the updated Organiser Agreement to continue</p>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-800"
            >
              <span className="text-2xl leading-none">×</span>
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-5 sm:px-8 pt-6 pb-5 space-y-6" onScroll={handleScroll}>
            {/* Enhanced Warning Banner */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 rounded-xl p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="bg-orange-100 rounded-full p-2">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-bold text-orange-900 mb-2 text-lg">⚠️ Important: Organiser Responsibilities</h3>
                  <p className="text-sm text-orange-800 leading-relaxed">
                    <strong>As an event organiser, you assume responsibility for participant safety and event management.</strong> Please read the full agreement below for complete terms.
                  </p>
                </div>
              </div>
            </div>

            {/* Agreement Content - Dynamic from Backend */}
            <div className="border-2 border-purple-200 rounded-2xl p-4 sm:p-6 bg-gradient-to-br from-white to-gray-50 shadow-lg">
              {isLoadingAgreement ? (
                // Loading state
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 text-purple-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading agreement...</p>
                  </div>
                </div>
              ) : agreementData ? (
                // Dynamic content from backend
                <div className="prose prose-sm max-w-none">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-600" />
                    OutMeets Organiser Agreement & Terms
                  </h3>
                  
                  <div className="text-sm text-gray-600 mb-4">
                    <strong>Effective Date:</strong> {agreementData.effectiveDate ? new Date(agreementData.effectiveDate).toLocaleDateString() : 'N/A'} | 
                    <strong> Version:</strong> {agreementData.version || 'N/A'}
                    <br />
                    <strong>Agreement Type:</strong> {agreementData.agreementType || 'ORGANISER'}
                  </div>

                  {/* Dynamic Agreement Text - Markdown */}
                  <div className="space-y-4 text-gray-700">
                    {agreementData.agreementText ? (
                      <div className="markdown-preview text-gray-800 text-sm sm:text-base leading-relaxed">
                        <ReactMarkdown>{agreementData.agreementText}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-gray-600">Agreement text not available.</p>
                    )}
                  </div>
                  {/* Footer with metadata */}
                  <div className="text-xs text-gray-500 mt-6 pt-4 border-t border-gray-200 text-center space-y-1">
                    <p>Version: {agreementData.version} | Hash: {agreementData.agreementHash?.substring(0, 8)}...</p>
                    <p>This agreement text is dynamically loaded and cryptographically verified</p>
                  </div>
                </div>
              ) : (
                // Fallback state
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No agreement content available</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 border-t border-gray-100 bg-white/95 backdrop-blur px-5 sm:px-8 py-4 sticky bottom-0 left-0 right-0">
            {!scrolledToBottom && (
              <div className="text-center text-sm text-orange-600 mb-3 font-semibold">
                ⬇️ Please scroll to the bottom to continue
              </div>
            )}

            {/* Agreement Checkbox */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={hasAgreed}
                onChange={(e) => setHasAgreed(e.target.checked)}
                className="mt-1 h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">
                I have read and agree to the Organiser Agreement
              </span>
            </label>

            {/* Action Button */}
            <div className="mt-4">
              <button
                onClick={() => acceptMutation.mutate()}
                disabled={!canAccept || acceptMutation.isPending}
                className={`w-full py-3 sm:py-4 px-6 rounded-xl font-bold text-base sm:text-lg transition-all ${
                  canAccept && !acceptMutation.isPending
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-xl hover:shadow-purple-500/50 hover:scale-[1.02]'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {acceptMutation.isPending ? 'Accepting...' : 'I Accept'}
              </button>
            </div>

            {!canAccept && (
              <p className="text-xs text-gray-500 text-center mt-3">
                {!scrolledToBottom && '📜 Scroll to bottom • '}
                {!hasAgreed && '☑️ Check the agreement box'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
