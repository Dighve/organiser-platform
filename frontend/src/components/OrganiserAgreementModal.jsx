import { useState } from 'react'
import { X, AlertTriangle, FileText } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { legalAPI } from '../lib/api'
import toast from 'react-hot-toast'

export default function OrganiserAgreementModal({ isOpen, onClose, onAccept }) {
  const [hasRead, setHasRead] = useState(false)
  const [understandsInsurance, setUnderstandsInsurance] = useState(false)
  const [scrolledToBottom, setScrolledToBottom] = useState(false)
  const queryClient = useQueryClient()

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

          {/* Scrollable Agreement Content */}
          <div 
            className="flex-1 overflow-y-auto border-2 border-gray-200 rounded-xl p-6 mb-6 prose prose-sm max-w-none"
            onScroll={handleScroll}
          >
            <div className="space-y-4 text-gray-700">
              <h3 className="text-lg font-bold text-gray-900">OutMeets Organiser Agreement</h3>
              
              <p className="text-sm text-gray-500">Last Updated: December 9, 2025</p>
              
              <h4 className="font-bold text-gray-900 mt-6">1. ACCEPTANCE OF ORGANISER RESPONSIBILITIES</h4>
              <p>By creating a group or event, you:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Agree to be bound by this Organiser Agreement</li>
                <li>Accept full responsibility for the safety and conduct of your events</li>
                <li>Acknowledge that you are NOT an employee or agent of OutMeets</li>
                <li>Understand that OutMeets is NOT liable for your events</li>
              </ul>

              <h4 className="font-bold text-gray-900 mt-6">2. YOUR RESPONSIBILITIES</h4>
              <p>As an Organiser, you must:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Duty of Care:</strong> Ensure participant safety at all times</li>
                <li><strong>Risk Assessment:</strong> Evaluate hazards before and during events</li>
                <li><strong>Qualifications:</strong> Have adequate experience and training (First Aid recommended)</li>
                <li><strong>Emergency Preparedness:</strong> Carry first aid kit, communication device, emergency contacts</li>
                <li><strong>Accurate Information:</strong> Provide truthful event descriptions and difficulty ratings</li>
                <li><strong>Weather Monitoring:</strong> Cancel events in dangerous conditions</li>
              </ul>

              <h4 className="font-bold text-gray-900 mt-6">3. LIABILITY & INSURANCE</h4>
              <p className="font-bold text-red-600">YOU ARE PERSONALLY LIABLE for:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Injuries or deaths of participants</li>
                <li>Property damage caused by you or participants</li>
                <li>Negligent route planning or decision-making</li>
                <li>Failure to provide adequate supervision</li>
              </ul>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-4">
                <p className="font-bold text-yellow-900">🛡️ INSURANCE REQUIREMENTS</p>
                <p className="text-sm text-yellow-800 mt-2">You MUST obtain adequate insurance coverage:</p>
                <ul className="list-disc pl-5 text-sm text-yellow-800 mt-2 space-y-1">
                  <li><strong>Public Liability:</strong> £5,000,000+ (STRONGLY RECOMMENDED)</li>
                  <li><strong>Personal Accident:</strong> £100,000+</li>
                  <li><strong>Professional Indemnity:</strong> £1,000,000+ (if charging fees)</li>
                </ul>
                <p className="text-sm text-yellow-800 mt-2">
                  <strong>Where to get insurance:</strong> British Mountaineering Council (BMC), Ramblers Association
                </p>
              </div>

              <h4 className="font-bold text-gray-900 mt-6">4. WHAT OUTMEETS IS NOT RESPONSIBLE FOR</h4>
              <p>OutMeets is NOT LIABLE for:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Your actions or decisions as an Organiser</li>
                <li>Injuries or damages arising from your events</li>
                <li>Your failure to obtain insurance</li>
                <li>Your violation of laws or regulations</li>
              </ul>

              <h4 className="font-bold text-gray-900 mt-6">5. INDEMNIFICATION</h4>
              <p className="font-bold">You agree to INDEMNIFY and HOLD HARMLESS OutMeets from:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>All claims, damages, losses, and expenses (including legal fees)</li>
                <li>Arising from your events or activities</li>
                <li>Caused by your negligence or breach of this agreement</li>
              </ul>

              <h4 className="font-bold text-gray-900 mt-6">6. EMERGENCY PROCEDURES</h4>
              <p>Before every event, you must:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Carry a first aid kit</li>
                <li>Carry a communication device (mobile phone)</li>
                <li>Have emergency contacts for all participants</li>
                <li>Know the location of nearest emergency services</li>
                <li>Have a contingency plan (escape routes, bad weather plan)</li>
              </ul>

              <h4 className="font-bold text-gray-900 mt-6">7. PROHIBITED ACTIVITIES</h4>
              <p>You must NOT:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Lead activities beyond your competence</li>
                <li>Misrepresent your qualifications or experience</li>
                <li>Organise events while under the influence of alcohol or drugs</li>
                <li>Discriminate against participants</li>
                <li>Endanger participants through reckless behavior</li>
              </ul>

              <div className="bg-red-50 border-l-4 border-red-400 p-4 my-4">
                <p className="font-bold text-red-900">🚨 CRITICAL WARNING</p>
                <p className="text-sm text-red-800 mt-2">
                  By accepting this agreement, you acknowledge that outdoor activities carry inherent risks including 
                  serious injury or death. You are solely responsible for participant safety. OutMeets provides a 
                  platform only and assumes no responsibility for your events.
                </p>
              </div>

              <p className="text-sm text-gray-500 mt-8">
                For the full Organiser Agreement, visit: /legal/organiser-agreement
              </p>
            </div>
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
