// ============================================================
// IMPORTS
// ============================================================
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Mountain, Mail, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI } from '../lib/api'
import { useAuthStore } from '../store/authStore'

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function LoginPage() {
  // ============================================================
  // HOOKS & STATE
  // ============================================================
  const navigate = useNavigate()
  const { setPendingEmail } = useAuthStore()  // Global auth state
  const { register, handleSubmit, formState: { errors }, watch } = useForm()  // React Hook Form
  
  // ============================================================
  // LOCAL STATE
  // ============================================================
  const [isLoading, setIsLoading] = useState(false)  // Loading state for API request
  const [emailSent, setEmailSent] = useState(false)  // Success state after magic link sent

  // ============================================================
  // FORM WATCHERS
  // ============================================================
  const email = watch('email')  // Watch email field for display in success state

  // ============================================================
  // EVENT HANDLERS
  // ============================================================
  
  // Handle magic link request submission
  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      await authAPI.requestMagicLink({
        email: data.email,
        displayName: data.displayName,
      })
      
      setPendingEmail(data.email)
      setEmailSent(true)
      toast.success('Magic link sent! Check your email.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send magic link. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // ============================================================
  // SUCCESS STATE - Email sent confirmation
  // ============================================================
  if (emailSent) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-40 right-10 w-64 h-64 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        
        <div className="max-w-md w-full space-y-8 text-center relative z-10">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-10">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-600 rounded-full blur-xl opacity-50 animate-pulse" />
                <CheckCircle className="h-20 w-20 text-green-500 relative" />
              </div>
            </div>
            <h2 className="mt-8 text-center text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Check your email
            </h2>
            <p className="mt-4 text-center text-gray-700 text-lg">
              We've sent a magic link to
            </p>
            <p className="mt-2 text-center font-bold text-purple-600 text-xl">
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

            <div className="mt-8">
              <button
                onClick={() => setEmailSent(false)}
                className="w-full py-3 px-6 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 font-semibold rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                Didn't receive it? Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ============================================================
  // MAIN RENDER - Login form
  // ============================================================
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
      <div className="absolute top-40 right-10 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-orange-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      
      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-10">
          <div>
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur-xl opacity-50" />
                <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-2xl">
                  <Mountain className="h-10 w-10 text-white" />
                </div>
              </div>
            </div>
            <h2 className="mt-8 text-center text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Welcome to HikeHub
            </h2>
            <p className="mt-3 text-center text-base text-gray-600">
              🔐 No password needed! We'll send you a secure magic link.
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
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
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-medium"
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <span>⚠️</span> {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    <span>Sending magic link...</span>
                  </>
                ) : (
                  <>
                    <Mail className="h-5 w-5" />
                    <span>Send Magic Link</span>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </div>

            <div className="text-center text-xs text-gray-500 pt-4 border-t border-gray-200">
              <p>
                By continuing, you agree to our <span className="text-purple-600 font-medium">Terms of Service</span> and <span className="text-purple-600 font-medium">Privacy Policy</span>
              </p>
            </div>
          </form>
        </div>
        
        {/* Info card */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center">
          <p className="text-sm text-gray-600">
            ✨ <strong>Magic Link Login</strong> - More secure, easier to use, no passwords to remember!
          </p>
        </div>
      </div>
    </div>
  )
}
