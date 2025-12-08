import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Mountain, Mail, CheckCircle, X } from 'lucide-react'
import { useGoogleLogin } from '@react-oauth/google'
import toast from 'react-hot-toast'
import { authAPI } from '../lib/api'
import { useAuthStore } from '../store/authStore'

export default function LoginModal({ isOpen, onClose, onSuccess }) {
  const { setPendingEmail, returnUrl, login, isAuthenticated } = useAuthStore()
  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm()
  
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [showMagicLink, setShowMagicLink] = useState(false)
  
  const email = watch('email')

  // Auto-close modal when user logs in from another tab
  useEffect(() => {
    if (isAuthenticated && isOpen) {
      // User logged in (possibly from another tab)
      toast.success('✅ Successfully logged in!')
      setEmailSent(false)
      setShowMagicLink(false)
      reset()
      onClose()
      if (onSuccess) {
        onSuccess()
      }
    }
  }, [isAuthenticated, isOpen, onClose, onSuccess, reset])

  // Google OAuth login with custom button - using access token
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true)
      try {
        // Use access token to get user info from Google
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        })
        
        const userInfo = await userInfoResponse.json()
        
        // Send user info to backend (backend will create/update user)
        const response = await authAPI.authenticateWithGoogle({
          idToken: tokenResponse.access_token, // Send access token
          redirectUrl: returnUrl,
          userInfo: userInfo // Send user info directly
        })
        
        const { token, userId, email, role, isOrganiser } = response.data
        login({ id: userId, userId, email, role, isOrganiser }, token)
        
        toast.success('🎉 Signed in with Google!')
        handleClose()
        
        if (onSuccess) {
          onSuccess()
        }
      } catch (error) {
        console.error('Google OAuth error:', error)
        toast.error(error.response?.data?.message || 'Google sign-in failed. Please try again.')
      } finally {
        setIsLoading(false)
      }
    },
    onError: () => {
      toast.error('Google sign-in was cancelled or failed')
    },
  })

  // Handle magic link request
  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      await authAPI.requestMagicLink({
        email: data.email,
        displayName: data.displayName,
        redirectUrl: returnUrl, // Include redirect URL for cross-browser support
      })
      
      setPendingEmail(data.email)
      setEmailSent(true)
      toast.success('Magic link sent! Check your email.')
      
      // Don't call onSuccess here - keep modal open to show "Check your email" message
      // User will close it manually after seeing the instructions
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send magic link. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle modal close
  const handleClose = () => {
    setEmailSent(false)
    setShowMagicLink(false)
    reset()
    onClose()
  }

  // Don't render if not open
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 transform transition-all">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {emailSent ? (
            // Success state
            <div className="text-center">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-600 rounded-full blur-xl opacity-50 animate-pulse" />
                  <CheckCircle className="h-16 w-16 text-green-500 relative" />
                </div>
              </div>
              <h2 className="mt-6 text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Check your email
              </h2>
              <p className="mt-4 text-gray-700">
                We've sent a magic link to
              </p>
              <p className="mt-2 font-bold text-purple-600 text-lg">
                {email}
              </p>
              <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-100">
                <p className="text-sm text-gray-600">
                  ✨ Click the link in the email to sign in
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  The link will expire in 15 minutes
                </p>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={() => setEmailSent(false)}
                  className="w-full py-3 px-6 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
                >
                  Didn't receive it? Try again
                </button>
                <button
                  onClick={handleClose}
                  className="w-full py-3 px-6 text-gray-600 font-semibold rounded-xl hover:bg-gray-100 transition-all duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            // Login form
            <div>
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur-xl opacity-50" />
                  <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 p-3 rounded-2xl">
                    <Mountain className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
              <h2 className="mt-6 text-center text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Sign in to join
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                {showMagicLink ? '🔐 No password needed! We\'ll send you a secure magic link.' : '⚡ Quick and secure sign-in'}
              </p>

              {!showMagicLink ? (
                // Google OAuth primary option
                <div className="mt-6 space-y-4">
                  <button
                    type="button"
                    onClick={() => googleLogin()}
                    disabled={isLoading}
                    className="w-full py-3 px-6 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-purple-300 transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600" />
                    ) : (
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    )}
                    <span>Continue with Google</span>
                  </button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-gray-500 font-medium">or</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowMagicLink(true)}
                    className="w-full py-3 px-6 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-purple-300 transition-all duration-200 flex items-center justify-center gap-3"
                  >
                    <Mail className="h-5 w-5 text-purple-600" />
                    <span>Continue with Email</span>
                  </button>

                  <div className="mt-4 text-center text-xs text-gray-500 pt-4 border-t border-gray-200">
                    <p>
                      ✨ <strong>Instant sign-in</strong> with Google or secure magic link
                    </p>
                  </div>
                </div>
              ) : (
                // Magic link fallback
                <div>
                <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                      type="email"
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="you@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <span>⚠️</span> {errors.email.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="h-5 w-5" />
                      <span>Send Magic Link</span>
                    </>
                  )}
                </button>
                </form>

                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setShowMagicLink(false)}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    ← Back to Google sign-in
                  </button>
                </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
