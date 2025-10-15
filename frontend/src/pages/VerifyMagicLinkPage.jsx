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
      const { token: jwtToken, userId, email, role } = response.data
      
      login({ userId, email, role }, jwtToken)
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
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        {status === 'verifying' && (
          <>
            <Loader2 className="h-16 w-16 text-primary-600 animate-spin mx-auto" />
            <h2 className="text-2xl font-bold text-gray-900">
              Verifying your magic link...
            </h2>
            <p className="text-gray-600">Please wait while we sign you in.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
            <h2 className="text-2xl font-bold text-gray-900">
              Successfully signed in!
            </h2>
            <p className="text-gray-600">Redirecting you to the homepage...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="h-16 w-16 text-red-600 mx-auto" />
            <h2 className="text-2xl font-bold text-gray-900">
              Verification failed
            </h2>
            <p className="text-gray-600">{error}</p>
            <div className="mt-8">
              <button
                onClick={() => navigate('/login')}
                className="btn btn-primary"
              >
                Request a new magic link
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
