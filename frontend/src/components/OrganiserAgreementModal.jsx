import { useState, useEffect } from 'react'
import { X, AlertTriangle, FileText, Loader2 } from 'lucide-react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { legalAPI } from '../lib/api'
import toast from 'react-hot-toast'

export default function OrganiserAgreementModal({ isOpen, onClose, onAccept }) {
  const [hasRead, setHasRead] = useState(false)
  const [understandsInsurance, setUnderstandsInsurance] = useState(false)
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
      setHasRead(false)
      setUnderstandsInsurance(false)
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

  const canAccept = hasRead && understandsInsurance && scrolledToBottom

  if (!isOpen) return null

  // Show error state if agreement failed to load
  if (agreementError && !isLoadingAgreement) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="flex min-h-full items-center justify-center p-4">
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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-3xl shadow-2xl max-w-4xl w-full p-8 max-h-[90vh] flex flex-col">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="mb-6">
            <h2 className="text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Become an Organiser
            </h2>
            <p className="text-gray-600">Please read and accept the Organiser Agreement to create groups and events</p>
          </div>

          {/* Warning Banner */}
          <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-orange-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-orange-900 mb-2">⚠️ Important Responsibilities</h3>
                <ul className="text-sm text-orange-800 space-y-1">
                  <li>• <strong>You are personally liable</strong> for participant safety</li>
                  <li>• <strong>Public liability insurance</strong> (£5M+) is strongly recommended</li>
                  <li>• You must have adequate qualifications and experience</li>
                  <li>• OutMeets is NOT liable for your events</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Scrollable Agreement Content - Dynamic from Backend */}
          <div 
            className="flex-1 overflow-y-auto border-2 border-gray-200 rounded-xl p-6 mb-6"
            onScroll={handleScroll}
          >
            {isLoadingAgreement ? (
              // Loading state
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 text-purple-600 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Loading organiser agreement...</p>
                </div>
              </div>
            ) : agreementData ? (
              // Dynamic content from backend
              <div className="prose prose-sm max-w-none">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  OutMeets Organiser Agreement
                </h3>
                
                <div className="text-sm text-gray-600 mb-4">
                  <strong>Effective Date:</strong> {agreementData.effectiveDate ? new Date(agreementData.effectiveDate).toLocaleDateString() : 'N/A'} | 
                  <strong> Version:</strong> {agreementData.version || 'N/A'}
                  <br />
                  <strong>Agreement Type:</strong> {agreementData.agreementType || 'ORGANISER'}
                </div>

                {/* Dynamic Agreement Text */}
                <div className="space-y-4 text-gray-700 whitespace-pre-wrap">
                  {agreementData.agreementText || 'Agreement text not available.'}
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

          {!scrolledToBottom && (
            <p className="text-sm text-purple-600 text-center mb-4 font-medium animate-pulse">
              ↓ Please scroll to the bottom to continue
            </p>
          )}

          {/* Checkboxes */}
          <div className="space-y-3 mb-6">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={hasRead}
                onChange={(e) => setHasRead(e.target.checked)}
                className="mt-1 h-5 w-5 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                disabled={!scrolledToBottom}
              />
              <span className={`text-sm ${scrolledToBottom ? 'text-gray-700' : 'text-gray-400'}`}>
                I have read and agree to the <strong>Organiser Agreement</strong>
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={understandsInsurance}
                onChange={(e) => setUnderstandsInsurance(e.target.checked)}
                className="mt-1 h-5 w-5 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                disabled={!scrolledToBottom}
              />
              <span className={`text-sm ${scrolledToBottom ? 'text-gray-700' : 'text-gray-400'}`}>
                I understand I need <strong>public liability insurance</strong> (recommended £5M+ coverage)
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-6 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => acceptMutation.mutate()}
              disabled={!canAccept || acceptMutation.isPending}
              className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {acceptMutation.isPending ? 'Accepting...' : 'Accept & Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
