import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Mountain, Mail, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI } from '../lib/api'
import { useAuthStore } from '../store/authStore'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const navigate = useNavigate()
  const { setPendingEmail } = useAuthStore()
  const { register, handleSubmit, formState: { errors }, watch } = useForm()

  const email = watch('email')

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

  if (emailSent) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-primary-600" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Check your email
            </h2>
            <p className="mt-2 text-center text-gray-600">
              We've sent a magic link to <strong>{email}</strong>
            </p>
            <p className="mt-4 text-sm text-gray-500">
              Click the link in the email to sign in. The link will expire in 15 minutes.
            </p>
          </div>

          <div className="mt-8">
            <button
              onClick={() => setEmailSent(false)}
              className="btn btn-secondary"
            >
              Didn't receive it? Try again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <Mountain className="h-12 w-12 text-primary-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in with Magic Link
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            No password needed! We'll send you a secure link to sign in.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
                  className="input pl-10"
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                Display Name (optional - can be a pseudonym)
              </label>
              <input
                {...register('displayName')}
                type="text"
                className="input"
                placeholder="Your name or pseudonym"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn btn-primary py-3 text-base flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <span>Sending magic link...</span>
              ) : (
                <>
                  <Mail className="h-5 w-5" />
                  <span>Send Magic Link</span>
                </>
              )}
            </button>
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
