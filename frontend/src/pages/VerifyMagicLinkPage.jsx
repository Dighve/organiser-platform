import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { authAPI } from '../lib/api'
import { useAuthStore } from '../store/authStore'

export default function VerifyMagicLinkPage() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('verifying') // verifying, success, error
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login } = useAuthStore()

  useEffect(() => {
    const token = searchParams.get('token')
    
    if (!token) {
      setStatus('error')
      setError('Invalid magic link')
      return
    }

    verifyToken(token)
  }, [searchParams])

  const verifyToken = async (token) => {
    try {
      const response = await authAPI.verifyMagicLink(token)
      const { token: jwtToken, userId, email, role, isOrganiser } = response.data
      
      login({ id: userId, userId, email, role, isOrganiser }, jwtToken)
      setStatus('success')
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/')
      }, 2000)
    } catch (error) {
      setStatus('error')
      setError(error.response?.data?.message || 'Invalid or expired magic link')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
      <div className="absolute top-40 right-10 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-orange-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      
      <div className="max-w-md w-full space-y-8 text-center relative z-10">
        {status === 'verifying' && (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-10">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-50 animate-pulse" />
              <Loader2 className="h-20 w-20 text-purple-600 animate-spin mx-auto relative" />
            </div>
            <h2 className="mt-8 text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Verifying your magic link...
            </h2>
            <p className="mt-4 text-gray-700 text-lg">Please wait while we sign you in.</p>
            <div className="mt-6 flex justify-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-10">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-600 rounded-full blur-xl opacity-50 animate-pulse" />
              <CheckCircle className="h-20 w-20 text-green-500 mx-auto relative" />
            </div>
            <h2 className="mt-8 text-3xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Successfully signed in!
            </h2>
            <p className="mt-4 text-gray-700 text-lg">Redirecting you to the homepage...</p>
            <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-100">
              <p className="text-sm text-gray-600">
                ✨ Welcome to HikeHub!
              </p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-10">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-red-600 rounded-full blur-xl opacity-50" />
              <XCircle className="h-20 w-20 text-red-500 mx-auto relative" />
            </div>
            <h2 className="mt-8 text-3xl font-extrabold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
              Verification failed
            </h2>
            <div className="mt-6 p-4 bg-red-50 rounded-2xl border border-red-100">
              <p className="text-red-600 font-medium">⚠️ {error}</p>
            </div>
            <div className="mt-8">
              <button
                onClick={() => navigate('/login')}
                className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-200 transform hover:scale-105"
              >
                Request a new magic link
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
