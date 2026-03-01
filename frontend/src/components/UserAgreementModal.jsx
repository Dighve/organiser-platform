import { useState } from 'react'
import { AlertTriangle, FileText } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { legalAPI } from '../lib/api'
import toast from 'react-hot-toast'

export default function UserAgreementModal({ isOpen, onClose, onAccept }) {
  const [hasAgreed, setHasAgreed] = useState(false)
  const [scrolledToBottom, setScrolledToBottom] = useState(false)
  const queryClient = useQueryClient()

  const acceptMutation = useMutation({
    mutationFn: async () => {
      console.log('🔄 Accepting user agreement...')
      console.log('📡 API Base URL:', import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1')
      
      try {
        const response = await legalAPI.acceptUserAgreement({
          ipAddress: null, // Backend will extract from request
          userAgent: navigator.userAgent || 'Unknown'
        })
        console.log('✅ User Agreement accepted:', response)
        return response
      } catch (error) {
        console.error('❌ Accept user agreement error:', error)
        console.error('❌ Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          url: error.config?.url
        })
        throw error
      }
    },
    onSuccess: async () => {
      toast.success('✅ Welcome to OutMeets!')
      // Invalidate and wait for refetch to complete
      await queryClient.invalidateQueries(['currentMember'])
      // Small delay to ensure UI updates
      setTimeout(() => {
        if (onAccept) onAccept()
        if (onClose) onClose()
      }, 500)
    },
    onError: (error) => {
      console.error('❌ Mutation error:', error)
      
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

  return (
    <div className="fixed inset-0 z-[2000]">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
      
      <div className="relative z-10 flex min-h-full items-center justify-center p-0 sm:p-4">
        <div className="relative bg-white w-full h-[100svh] sm:h-auto sm:max-h-[90vh] sm:rounded-3xl shadow-2xl max-w-4xl flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 flex items-start justify-between gap-4 px-5 sm:px-8 py-5 border-b border-gray-100 bg-white">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1">
                Welcome to OutMeets!
              </h2>
              <p className="text-sm sm:text-base text-gray-600">Please read and accept our Terms of Service to continue</p>
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
            {/* Warning Banner */}
            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-orange-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-orange-900 mb-2">⚠️ Important: Assumption of Risk</h3>
                  <p className="text-sm text-orange-800">
                    Outdoor activities carry inherent risks. By using OutMeets, you participate voluntarily at your own risk.
                  </p>
                </div>
              </div>
            </div>

            {/* Agreement Content */}
            <div className="border-2 border-gray-200 rounded-2xl p-4 sm:p-6 bg-gray-50">
              <div className="prose prose-sm max-w-none">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  OutMeets User Agreement & Terms of Service
                </h3>
                
                <p className="text-sm text-gray-600 mb-4">
                  <strong>Effective Date:</strong> December 15, 2024 | <strong>Version:</strong> 1.0
                </p>

                <div className="space-y-6 text-gray-700">
                  <section>
                    <h4 className="font-bold text-gray-900 mb-2">1. Acceptance of Terms</h4>
                    <p>By creating an account or using OutMeets, you agree to these Terms of Service and all applicable laws. If you do not agree, do not use the Platform.</p>
                  </section>

                  <section>
                    <h4 className="font-bold text-gray-900 mb-2">2. Eligibility</h4>
                    <p>You must be at least 18 years old to use OutMeets. By using the Platform, you represent and warrant that you meet this requirement.</p>
                  </section>

                  <section>
                    <h4 className="font-bold text-gray-900 mb-2">3. Description of Service</h4>
                    <p>OutMeets connects outdoor enthusiasts for hiking, running, climbing, swimming, and other activities. We provide tools for creating and joining groups, organizing events, and building community.</p>
                  </section>

                  <section>
                    <h4 className="font-bold text-gray-900 mb-2">4. Account & Security</h4>
                    <p>You are responsible for maintaining the confidentiality of your account and for all activity under your account. Notify us immediately of any unauthorized use.</p>
                  </section>

                  <section>
                    <h4 className="font-bold text-gray-900 mb-2">5. User Content & License</h4>
                    <p>You retain ownership of content you post. By posting content, you grant OutMeets a non-exclusive, worldwide, royalty-free license to host, store, display, and distribute that content solely to operate and improve the Platform.</p>
                    <p className="mt-2">You are responsible for your content and must have all necessary rights to post it.</p>
                  </section>

                  <section>
                    <h4 className="font-bold text-gray-900 mb-2">6. Community Guidelines & Prohibited Conduct</h4>
                    <p>You agree not to misuse the Platform. Prohibited conduct includes harassment, fraud, illegal activity, impersonation, and posting harmful, misleading, or infringing content.</p>
                  </section>

                  <section>
                    <h4 className="font-bold text-gray-900 mb-2">7. Events, Organizers, and Participant Responsibility</h4>
                    <p>OutMeets is a platform provider. Event organizers and attendees are third parties. We do not vet, supervise, or control events, organizers, or attendees.</p>
                    <p className="mt-2">You are solely responsible for evaluating events, preparing appropriately, and deciding whether to participate.</p>
                  </section>

                  <section>
                    <h4 className="font-bold text-gray-900 mb-2">8. Outdoor Activities - Assumption of Risk</h4>
                    <p className="font-semibold text-orange-900">YOU ACKNOWLEDGE AND AGREE that outdoor activities carry inherent risks including:</p>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>Physical injury or death</li>
                      <li>Exposure to weather conditions</li>
                      <li>Wildlife encounters</li>
                      <li>Equipment failure</li>
                      <li>Getting lost or stranded</li>
                      <li>Medical emergencies</li>
                    </ul>
                    <p className="mt-3 font-semibold">You voluntarily choose to participate and ASSUME ALL RISKS.</p>
                  </section>

                  <section>
                    <h4 className="font-bold text-gray-900 mb-2">9. Medical Disclaimer</h4>
                    <p>OutMeets does not provide medical advice. Consult a physician before participating in strenuous activities. You are responsible for your own health assessment.</p>
                  </section>

                  <section>
                    <h4 className="font-bold text-gray-900 mb-2">10. Disclaimer of Warranties</h4>
                    <p>THE PLATFORM IS PROVIDED “AS IS” AND “AS AVAILABLE.” OUTMEETS DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON‑INFRINGEMENT.</p>
                  </section>

                  <section>
                    <h4 className="font-bold text-gray-900 mb-2">11. Limitation of Liability</h4>
                    <p className="font-semibold text-red-900">TO THE MAXIMUM EXTENT PERMITTED BY LAW:</p>
                    <p className="mt-2"><strong>OutMeets SHALL NOT BE LIABLE for:</strong></p>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>Any injuries, accidents, or deaths occurring during activities</li>
                      <li>Any property damage or loss</li>
                      <li>Actions or negligence of organizers or attendees</li>
                      <li>Disputes between users</li>
                      <li>Any direct, indirect, incidental, or consequential damages</li>
                    </ul>
                  </section>

                  <section>
                    <h4 className="font-bold text-gray-900 mb-2">12. Indemnification</h4>
                    <p>You agree to <strong>INDEMNIFY, DEFEND, AND HOLD HARMLESS</strong> OutMeets from claims, damages, losses, and expenses (including legal fees) arising from your use of the Platform, participation in activities, violation of these Terms, or your content.</p>
                  </section>

                  <section>
                    <h4 className="font-bold text-gray-900 mb-2">13. Third‑Party Services & Links</h4>
                    <p>The Platform may link to third‑party services (e.g., maps or calendars). OutMeets is not responsible for third‑party content, services, or policies.</p>
                  </section>

                  <section>
                    <h4 className="font-bold text-gray-900 mb-2">14. Privacy</h4>
                    <p>Your use of OutMeets is governed by our Privacy Policy. By using the Platform, you consent to our collection and use of personal data as described.</p>
                  </section>

                  <section>
                    <h4 className="font-bold text-gray-900 mb-2">15. Modifications to Service or Terms</h4>
                    <p>OutMeets may modify the Platform or these Terms at any time. Continued use after changes constitutes acceptance of the updated Terms.</p>
                  </section>

                  <section>
                    <h4 className="font-bold text-gray-900 mb-2">16. Termination</h4>
                    <p>We may suspend or terminate your account for violations of these Terms, unlawful activity, or misuse of the Platform.</p>
                  </section>

                  <section>
                    <h4 className="font-bold text-gray-900 mb-2">17. Governing Law & Venue</h4>
                    <p>These Terms are governed by the laws of England and Wales. You and OutMeets agree to the exclusive jurisdiction of the courts located in London, United Kingdom, for all disputes arising out of or relating to the Platform or these Terms.</p>
                  </section>

                  <section>
                    <h4 className="font-bold text-gray-900 mb-2">18. Arbitration & Class Action Waiver</h4>
                    <p>Except for claims seeking injunctive relief, any dispute arising out of or relating to these Terms or the Platform shall be finally resolved by binding arbitration under the LCIA Rules. The seat of arbitration is London, United Kingdom. The language of the arbitration is English. The tribunal will consist of one arbitrator appointed in accordance with the LCIA Rules. Judgment on the award may be entered in any court with jurisdiction.</p>
                    <p className="mt-2">You and OutMeets agree that all claims must be brought in an individual capacity, not as a claimant or class member in any purported class, collective, or representative proceeding. The arbitrator may not consolidate claims or preside over any form of representative proceeding.</p>
                  </section>

                  <section>
                    <h4 className="font-bold text-gray-900 mb-2">19. Severability, Assignment, and Entire Agreement</h4>
                    <p>If any provision is found unenforceable, the remainder will remain in effect. You may not assign your rights without consent. These Terms are the entire agreement between you and OutMeets.</p>
                  </section>

                  <section>
                    <h4 className="font-bold text-gray-900 mb-2">20. Contact</h4>
                    <p>Questions about these Terms? Contact OutMeets support.</p>
                  </section>

                <p className="text-xs text-gray-500 mt-6 text-center">
                  Last Updated: December 15, 2024 | Version 1.0
                </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 border-t border-gray-100 bg-white/95 backdrop-blur px-5 sm:px-8 py-4">
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
                I have read and agree to the Terms of Service
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
