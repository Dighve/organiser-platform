import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Mountain, CheckCircle, XCircle, Loader2, Star, Users, Calendar, ArrowLeft } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { invitesAPI } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import LoginModal from '../components/LoginModal'

export default function InvitePage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { setInviteToken, isAuthenticated, user } = useAuthStore()
  const [loginModalOpen, setLoginModalOpen] = useState(false)

  const { data: invite, isLoading, isError } = useQuery({
    queryKey: ['inviteValidate', token],
    queryFn: async () => {
      const response = await invitesAPI.validateInvite(token)
      return response.data
    },
    retry: false,
    staleTime: 60 * 1000,
  })

  // If already authenticated with organiser role, redirect to homepage where T&C modal will show
  useEffect(() => {
    if (isAuthenticated && user?.role === 'ORGANISER') {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  const handleAcceptInvite = () => {
    // Store invite token so it survives the auth flow (magic link redirect)
    setInviteToken(token)
    setLoginModalOpen(true)
  }

  const handleLoginSuccess = () => {
    setLoginModalOpen(false)
    // Navigation to homepage is handled in LoginModal / VerifyMagicLinkPage where T&C modal will show
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Validating invite link...</p>
        </div>
      </div>
    )
  }

  if (isError || !invite || !invite.isValid || invite.isUsed) {
    const getErrorMessage = () => {
      if (invite?.isUsed) {
        return "This invite link has already been used. Each invite can only be used once."
      }
      if (invite?.isExpired) {
        return "This invite link has expired. Please contact the admin for a new invite."
      }
      return "This invite link has expired, been used, or doesn't exist. Please contact the admin for a new invite."
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 text-center">
          <div className="relative mx-auto w-20 h-20 mb-6">
            <div className="absolute inset-0 bg-red-400 rounded-full blur-xl opacity-40" />
            <XCircle className="h-20 w-20 text-red-500 relative" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-3">
            {invite?.isUsed ? 'Invite Already Used' : 'Invalid Invite Link'}
          </h1>
          <p className="text-gray-600 mb-8">
            {getErrorMessage()}
          </p>
          {invite?.isUsed && invite?.usedByMemberEmail && (
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl">
              <p className="text-sm text-orange-700">
                <span className="font-semibold">Used by:</span> {invite.usedByMemberEmail}
              </p>
              {invite.usedAt && (
                <p className="text-sm text-orange-700">
                  <span className="font-semibold">Used on:</span> {new Date(invite.usedAt).toLocaleDateString('en-GB')}
                </p>
              )}
            </div>
          )}
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 sm:flex sm:items-center sm:justify-center px-4 py-12 sm:py-12 pb-32 sm:pb-12 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
      <div className="absolute top-40 right-10 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-orange-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />

      <div className="max-w-lg w-full relative z-10 space-y-6">
        
        {/* ========== MOBILE HEADER (Back button only) ========== */}
        <div className="sm:hidden">
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-lg text-gray-600 hover:text-purple-600 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        </div>

        {/* Invite card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Gradient banner */}
          <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 px-8 py-10 text-center">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-white/30 rounded-full blur-xl" />
              <div className="relative w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto">
                <Star className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-extrabold text-white mb-2">
              You're invited!
            </h1>
            <p className="text-white/90 text-lg">
              You've been selected to become an OutMeets Organiser
            </p>
          </div>

          {/* Body */}
          <div className="px-8 py-8">
            {invite.note && (
              <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-100">
                <p className="text-sm font-semibold text-purple-700 mb-1">Personal note</p>
                <p className="text-gray-700 italic">"{invite.note}"</p>
              </div>
            )}

            {/* What you get */}
            <h2 className="text-lg font-bold text-gray-900 mb-4">As an organiser, you can:</h2>
            <ul className="space-y-3 mb-8">
              {[
                { icon: Users, text: 'Create and manage outdoor activity groups' },
                { icon: Calendar, text: 'Host and publish hiking events' },
                { icon: Star, text: 'Build a community of outdoor enthusiasts' },
                { icon: CheckCircle, text: 'Manage members and event attendance' },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-gray-700">{text}</span>
                </li>
              ))}
            </ul>

            {invite.expiresAt && (
              <p className="text-xs text-gray-400 text-center mb-4">
                This invite expires on{' '}
                {new Date(invite.expiresAt).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </p>
            )}

            {/* Desktop button - inside card */}
            <button
              onClick={handleAcceptInvite}
              className="hidden sm:flex w-full py-4 px-6 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white font-bold text-lg rounded-xl hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-200 transform hover:scale-105 items-center justify-center gap-2"
            >
              Accept Invite & Sign In
            </button>

            <p className="mt-4 text-center text-xs text-gray-400">
              By accepting, you agree to OutMeets' terms for organisers.
            </p>
          </div>
        </div>
      </div>

      {/* ========== FIXED BOTTOM BUTTON (Mobile Only) ========== */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 p-4 z-40">
        <button
          onClick={handleAcceptInvite}
          className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white font-bold text-base rounded-xl hover:shadow-2xl hover:shadow-purple-500/50 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
        >
          <CheckCircle className="h-5 w-5" />
          <span>Accept Invite & Sign In</span>
        </button>
      </div>

      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  )
}
