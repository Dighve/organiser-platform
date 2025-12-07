import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Mountain, Mail, CheckCircle, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI } from '../lib/api'
import { useAuthStore } from '../store/authStore'

export default function LoginModal({ isOpen, onClose, onSuccess }) {
  const { setPendingEmail, returnUrl } = useAuthStore()
  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm()
  
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  
  const email = watch('email')

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
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send magic link. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle modal close
  const handleClose = () => {
    setEmailSent(false)
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
                🔐 No password needed! We'll send you a secure magic link.
              </p>

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

              <div className="mt-4 text-center text-xs text-gray-500 pt-4 border-t border-gray-200">
                <p>
                  ✨ <strong>Magic Link Login</strong> - More secure, no passwords!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
