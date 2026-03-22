import { useState, useEffect } from 'react'
import { AlertTriangle, FileText, Loader2, X, ChevronRight, Mountain, Shield, Users, Heart } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { legalAPI } from '../lib/api'
import toast from 'react-hot-toast'

const KEY_POINTS = [
  {
    icon: AlertTriangle,
    color: 'text-orange-500',
    bg: 'bg-orange-50',
    text: 'Outdoor activities carry inherent risks including injury or death',
  },
  {
    icon: Shield,
    color: 'text-purple-500',
    bg: 'bg-purple-50',
    text: 'You voluntarily participate and are responsible for your own safety',
  },
  {
    icon: Users,
    color: 'text-pink-500',
    bg: 'bg-pink-50',
    text: 'Events are community-organised — OutMeets is a platform only',
  },
  {
    icon: Heart,
    color: 'text-rose-500',
    bg: 'bg-rose-50',
    text: 'Treat all members with respect and follow community guidelines',
  },
]

export default function UserAgreementModal({ isOpen, onClose, onAccept }) {
  const [hasAgreed, setHasAgreed] = useState(false)
  const [showFullText, setShowFullText] = useState(false)
  const [scrolledToBottom, setScrolledToBottom] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const queryClient = useQueryClient()

  const {
    data: agreementData,
    isLoading: isLoadingAgreement,
    error: agreementError,
    refetch: refetchAgreement,
  } = useQuery({
    queryKey: ['currentUserAgreement'],
    queryFn: async () => {
      const response = await legalAPI.getCurrentUserAgreement()
      return response.data
    },
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
    retry: 3,
  })

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640) // sm breakpoint
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setHasAgreed(false)
      setShowFullText(false)
      setScrolledToBottom(false)
    }
  }, [isOpen])

  const handleScroll = (e) => {
    const bottom = Math.abs(e.target.scrollHeight - e.target.scrollTop - e.target.clientHeight) < 5
    if (bottom) setScrolledToBottom(true)
  }

  const acceptMutation = useMutation({
    mutationFn: async () => {
      if (!agreementData?.agreementText) {
        throw new Error('Agreement text not available — cannot proceed with acceptance')
      }
      const response = await legalAPI.acceptUserAgreement({
        agreementText: agreementData.agreementText,
        ipAddress: null,
        userAgent: navigator.userAgent || 'Unknown',
        sessionId: null,
        referrerUrl: window.location.href,
        browserFingerprint: null,
      })
      return response
    },
    onSuccess: async () => {
      toast.success('✅ Welcome to OutMeets!')
      await queryClient.invalidateQueries(['currentMember'])
      setTimeout(() => {
        if (onAccept) onAccept()
        if (onClose) onClose()
      }, 500)
    },
    onError: (error) => {
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

  // Accept logic: Mobile = checkbox only, Desktop = checkbox + scroll to bottom
  const canAccept = isMobile 
    ? (hasAgreed && !!agreementData?.agreementText && !isLoadingAgreement)
    : (scrolledToBottom && hasAgreed && !!agreementData?.agreementText && !isLoadingAgreement)

  if (!isOpen) return null

  // Mobile: compact modal with key points
  if (isMobile) {
    return (
      <>
        {/* ── Compact main modal (MOBILE ONLY) ── */}
        <div className="fixed inset-0 z-[2000]" aria-modal="true" role="dialog">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Bottom-sheet on mobile */}
          <div className="relative z-10 flex min-h-full items-end justify-center p-0">
            <div className="relative bg-white w-full rounded-t-3xl shadow-2xl overflow-hidden">

            {/* Key points card */}
            <div className="mx-4 mt-6 bg-white rounded-2xl border border-gray-100 p-4 mb-4">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                Key things to know
              </p>
              <ul className="space-y-2.5">
                {KEY_POINTS.map(({ icon: Icon, color, bg, text }, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <div className={`flex-shrink-0 mt-0.5 w-6 h-6 ${bg} rounded-full flex items-center justify-center`}>
                      <Icon className={`h-3.5 w-3.5 ${color}`} />
                    </div>
                    <span className="text-sm text-gray-700 leading-snug">{text}</span>
                  </li>
                ))}
              </ul>

              {/* Read full terms link */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                {agreementError && !isLoadingAgreement ? (
                  <div className="flex items-center gap-2 text-sm text-orange-600">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    <span>Could not load full terms.</span>
                    <button
                      onClick={() => refetchAgreement()}
                      className="underline font-medium hover:text-orange-800"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowFullText(true)}
                    disabled={isLoadingAgreement && !agreementData}
                    className="flex items-center gap-1.5 text-sm font-semibold text-purple-600 hover:text-purple-800 transition-colors group disabled:opacity-50"
                  >
                    {isLoadingAgreement && !agreementData ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Loading full terms…</span>
                      </>
                    ) : (
                      <>
                        <FileText className="h-3.5 w-3.5" />
                        <span>Read full Terms of Service</span>
                        <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Footer: checkbox + button */}
            <div className="px-4 pb-7 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasAgreed}
                  onChange={(e) => setHasAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded accent-purple-600 cursor-pointer flex-shrink-0"
                />
                <span className="text-sm text-gray-700 leading-snug">
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowFullText(true) }}
                    className="text-purple-600 underline underline-offset-2 hover:text-purple-800 font-medium"
                  >
                    Terms of Service
                  </button>
                  {' '}and understand the risks of outdoor activities
                </span>
              </label>

              <button
                onClick={() => acceptMutation.mutate()}
                disabled={!canAccept || acceptMutation.isPending}
                className={`w-full py-3.5 px-6 rounded-xl font-bold text-base transition-all duration-200 ${
                  canAccept && !acceptMutation.isPending
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:shadow-purple-500/40 hover:scale-[1.01] active:scale-100'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {acceptMutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Joining…
                  </span>
                ) : isLoadingAgreement ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading…
                  </span>
                ) : (
                  'I Accept'
                )}
              </button>

              {!hasAgreed && !isLoadingAgreement && (
                <p className="text-xs text-gray-400 text-center">
                  Tick the checkbox above to continue
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

        {/* ── Full-text overlay (z above the main modal) - MOBILE ONLY ── */}
        {showFullText && (
          <div className="fixed inset-0 z-[3000]" aria-modal="true" role="dialog">
            <div
              className="fixed inset-0 bg-black/75 backdrop-blur-sm"
              onClick={() => setShowFullText(false)}
            />
            <div className="relative z-10 flex min-h-full items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-600 flex-shrink-0" />
                    <h3 className="font-bold text-gray-900">Terms of Service</h3>
                    {agreementData?.version && (
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full ml-1">
                        v{agreementData.version}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setShowFullText(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-5">
                  {isLoadingAgreement ? (
                    <div className="flex items-center justify-center h-40">
                      <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
                    </div>
                  ) : agreementData?.agreementText ? (
                    <div className="prose prose-sm max-w-none text-gray-700">
                      {agreementData.effectiveDate && (
                        <p className="text-xs text-gray-400 mb-4 not-prose">
                          Effective:{' '}
                          {new Date(agreementData.effectiveDate).toLocaleDateString()} ·{' '}
                          Hash: {agreementData.agreementHash?.substring(0, 8)}…
                        </p>
                      )}
                      <ReactMarkdown>{agreementData.agreementText}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-500">
                      <AlertTriangle className="h-8 w-8 text-orange-400" />
                      <p className="text-sm">Agreement text not available</p>
                      <button
                        onClick={() => refetchAgreement()}
                        className="text-sm text-purple-600 underline hover:text-purple-800"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0 border-t border-gray-100 px-6 py-4 bg-gray-50/80">
                  <button
                    onClick={() => setShowFullText(false)}
                    className="w-full py-2.5 px-6 rounded-xl font-semibold text-sm bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Close & Return
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  // Desktop: original full modal with scroll-to-bottom requirement
  return (
    <div className="fixed inset-0 z-[2000]">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
      
      <div className="relative z-10 flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white w-full max-h-[90vh] rounded-3xl shadow-2xl max-w-4xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex-shrink-0 flex items-start justify-between gap-4 px-8 py-5 border-b border-gray-100 bg-white">
            <div>
              <h2 className="text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1">
                Welcome to OutMeets!
              </h2>
              <p className="text-base text-gray-600">Please read and accept our Terms of Service to continue</p>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-8 pt-6 pb-5 space-y-6" onScroll={handleScroll}>
            {/* Enhanced Warning Banner */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 rounded-xl p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="bg-orange-100 rounded-full p-2">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-bold text-orange-900 mb-2 text-lg">⚠️ Important: Assumption of Risk</h3>
                  <p className="text-sm text-orange-800 leading-relaxed">
                    <strong>Outdoor activities carry inherent risks including injury or death.</strong> By using OutMeets, you voluntarily participate and assume all risks. Please read the full agreement below.
                  </p>
                </div>
              </div>
            </div>

            {/* Agreement Content - Dynamic from Backend */}
            <div className="border-2 border-purple-200 rounded-2xl p-6 bg-gradient-to-br from-white to-gray-50 shadow-lg">
              {isLoadingAgreement ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 text-purple-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading agreement...</p>
                  </div>
                </div>
              ) : agreementData ? (
                <div className="prose prose-sm max-w-none">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-600" />
                    OutMeets User Agreement & Terms of Service
                  </h3>
                  
                  <div className="text-sm text-gray-600 mb-4">
                    <strong>Effective Date:</strong> {agreementData.effectiveDate ? new Date(agreementData.effectiveDate).toLocaleDateString() : 'N/A'} | 
                    <strong> Version:</strong> {agreementData.version || 'N/A'}
                    <br />
                    <strong>Agreement Type:</strong> {agreementData.agreementType || 'USER'}
                  </div>

                  <div className="space-y-4 text-gray-700">
                    {agreementData.agreementText ? (
                      <div className="markdown-preview text-gray-800 text-base leading-relaxed">
                        <ReactMarkdown>{agreementData.agreementText}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-gray-600">Agreement text not available.</p>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-6 pt-4 border-t border-gray-200 text-center space-y-1">
                    <p>Version: {agreementData.version} | Hash: {agreementData.agreementHash?.substring(0, 8)}...</p>
                    <p>This agreement text is dynamically loaded and cryptographically verified</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No agreement content available</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 border-t border-gray-100 bg-white/95 backdrop-blur px-8 py-4 sticky bottom-0 left-0 right-0">
            {!scrolledToBottom && (
              <div className="text-center text-sm text-orange-600 mb-3 font-semibold">
                ⬇️ Please scroll to the bottom to continue
              </div>
            )}

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={hasAgreed}
                onChange={(e) => setHasAgreed(e.target.checked)}
                className="mt-1 h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">
                I have read and agree to the Terms of Service
              </span>
            </label>

            <div className="mt-4">
              <button
                onClick={() => acceptMutation.mutate()}
                disabled={!canAccept || acceptMutation.isPending}
                className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all ${
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
