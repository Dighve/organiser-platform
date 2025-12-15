import { useState } from 'react'
import { AlertTriangle, FileText } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { legalAPI } from '../lib/api'
import toast from 'react-hot-toast'

export default function UserAgreementModal({ isOpen, onClose, onAccept }) {
  const [hasRead, setHasRead] = useState(false)
  const [acknowledgesRisks, setAcknowledgesRisks] = useState(false)
  const [scrolledToBottom, setScrolledToBottom] = useState(false)
  const queryClient = useQueryClient()

  const acceptMutation = useMutation({
    mutationFn: async () => {
      console.log('🔄 Accepting user agreement...')
      
      try {
        const response = await legalAPI.acceptUserAgreement({
          ipAddress: null, // Backend will extract from request
          userAgent: navigator.userAgent || 'Unknown'
        })
        console.log('✅ User Agreement accepted:', response)
        return response
      } catch (error) {
        console.error('❌ Accept user agreement error:', error)
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

  const canAccept = hasRead && acknowledgesRisks && scrolledToBottom

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
      
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-3xl shadow-2xl max-w-4xl w-full p-8 max-h-[90vh] flex flex-col">
          
          <div className="mb-6">
            <h2 className="text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Welcome to OutMeets!
            </h2>
            <p className="text-gray-600">Please read and accept our Terms of Service to continue</p>
          </div>

          {/* Warning Banner */}
          <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-orange-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-orange-900 mb-2">⚠️ Important: Assumption of Risk</h3>
                <ul className="text-sm text-orange-800 space-y-1">
                  <li>• Outdoor activities carry inherent risks including injury or death</li>
                  <li>• You participate voluntarily at your own risk</li>
                  <li>• OutMeets is NOT liable for accidents, injuries, or property damage</li>
                  <li>• You are responsible for your own safety and fitness</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Agreement Content */}
          <div 
            className="flex-1 overflow-y-auto border-2 border-gray-200 rounded-xl p-6 mb-6 bg-gray-50"
            onScroll={handleScroll}
          >
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
                  <p>By creating an account and using OutMeets, you agree to be bound by these Terms of Service and all applicable laws. If you do not agree, you may not use the Platform.</p>
                </section>

                <section>
                  <h4 className="font-bold text-gray-900 mb-2">2. Description of Service</h4>
                  <p>OutMeets connects outdoor enthusiasts for hiking, running, climbing, swimming, and other outdoor activities. We provide tools for creating and joining groups, organizing events, and building community.</p>
                </section>

                <section>
                  <h4 className="font-bold text-gray-900 mb-2">3. Outdoor Activities - Assumption of Risk</h4>
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
                  <h4 className="font-bold text-gray-900 mb-2">4. Personal Responsibility</h4>
                  <p>You are solely responsible for:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Assessing your own physical fitness and capabilities</li>
                    <li>Bringing appropriate gear and equipment</li>
                    <li>Following safety guidelines and best practices</li>
                    <li>Making informed decisions about participation</li>
                    <li>Your own safety and well-being</li>
                  </ul>
                </section>

                <section>
                  <h4 className="font-bold text-gray-900 mb-2">5. Limitation of Liability</h4>
                  <p className="font-semibold text-red-900">TO THE MAXIMUM EXTENT PERMITTED BY LAW:</p>
                  <p className="mt-2"><strong>OutMeets SHALL NOT BE LIABLE for:</strong></p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Any injuries, accidents, or deaths occurring during outdoor activities</li>
                    <li>Any property damage or loss</li>
                    <li>Actions or negligence of event organizers (third parties)</li>
                    <li>Disputes between users</li>
                    <li>Any direct, indirect, incidental, or consequential damages</li>
                  </ul>
                </section>

                <section>
                  <h4 className="font-bold text-gray-900 mb-2">6. Indemnification</h4>
                  <p>You agree to <strong>INDEMNIFY, DEFEND, AND HOLD HARMLESS</strong> OutMeets from any claims, damages, losses, and expenses (including legal fees) arising from:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Your use of the Platform</li>
                    <li>Your participation in outdoor activities</li>
                    <li>Your violation of these Terms</li>
                    <li>Your user-generated content</li>
                  </ul>
                </section>

                <section>
                  <h4 className="font-bold text-gray-900 mb-2">7. User Responsibilities</h4>
                  <p>You agree to:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Provide accurate and current information</li>
                    <li>Use the Platform only for lawful purposes</li>
                    <li>Not harass, abuse, or harm other users</li>
                    <li>Maintain the security of your account</li>
                  </ul>
                </section>

                <section>
                  <h4 className="font-bold text-gray-900 mb-2">8. Medical Disclaimer</h4>
                  <p>OutMeets does not provide medical advice. Consult your physician before participating in strenuous outdoor activities. You are responsible for your own health assessment.</p>
                </section>

                <section>
                  <h4 className="font-bold text-gray-900 mb-2">9. Privacy</h4>
                  <p>Your use of OutMeets is governed by our Privacy Policy. By using the Platform, you consent to our collection and use of personal data as described.</p>
                </section>

                <section>
                  <h4 className="font-bold text-gray-900 mb-2">10. Termination</h4>
                  <p>We reserve the right to suspend or terminate your account if you violate these Terms, engage in fraudulent activity, or misuse the Platform.</p>
                </section>

                <section>
                  <h4 className="font-bold text-gray-900 mb-2">11. Modifications</h4>
                  <p>OutMeets may modify these Terms at any time. Continued use after changes constitutes acceptance of modified Terms.</p>
                </section>

                <section className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                  <h4 className="font-bold text-purple-900 mb-2">ACKNOWLEDGMENT</h4>
                  <p className="text-purple-900">By clicking "I Accept", you acknowledge that:</p>
                  <ul className="list-none mt-2 space-y-1 text-purple-900">
                    <li>✅ You have read and understood these Terms</li>
                    <li>✅ You understand the risks of outdoor activities</li>
                    <li>✅ You assume all risks associated with participation</li>
                    <li>✅ You release OutMeets from all liability</li>
                    <li>✅ You are at least 18 years old</li>
                  </ul>
                </section>

                <p className="text-xs text-gray-500 mt-6 text-center">
                  Last Updated: December 15, 2024 | Version 1.0
                </p>
              </div>
            </div>
          </div>

          {!scrolledToBottom && (
            <div className="text-center text-sm text-orange-600 mb-4 font-semibold">
              ⬇️ Please scroll to the bottom to continue
            </div>
          )}

          {/* Checkboxes */}
          <div className="space-y-3 mb-6">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={hasRead}
                onChange={(e) => setHasRead(e.target.checked)}
                className="mt-1 h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">
                I have read and understood the Terms of Service
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={acknowledgesRisks}
                onChange={(e) => setAcknowledgesRisks(e.target.checked)}
                className="mt-1 h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">
                I acknowledge the risks of outdoor activities and release OutMeets from all liability
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => acceptMutation.mutate()}
              disabled={!canAccept || acceptMutation.isPending}
              className={`flex-1 py-4 px-6 rounded-xl font-bold text-lg transition-all ${
                canAccept && !acceptMutation.isPending
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-xl hover:shadow-purple-500/50 hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {acceptMutation.isPending ? 'Accepting...' : 'I Accept'}
            </button>
          </div>

          {!canAccept && (
            <p className="text-xs text-gray-500 text-center mt-3">
              {!scrolledToBottom && '📜 Scroll to bottom • '}
              {!hasRead && '☑️ Check "I have read" • '}
              {!acknowledgesRisks && '☑️ Check "I acknowledge risks"'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
