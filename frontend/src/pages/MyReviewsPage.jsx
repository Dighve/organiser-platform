import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Star, Edit, Trash2, MessageSquare, ThumbsUp, RotateCcw } from 'lucide-react'
import { reviewsAPI } from '../lib/api'
import { useSmartBack } from '../hooks/useSmartBack'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

function StarRating({ value, size = 'sm' }) {
  const sizeClass = size === 'lg' ? 'w-5 h-5' : 'w-3.5 h-3.5'
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClass} ${star <= Math.round(value) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
        />
      ))}
    </div>
  )
}

export default function MyReviewsPage() {
  const navigate = useNavigate()
  const goBack = useSmartBack('/profile')
  const queryClient = useQueryClient()
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['myReviews'],
    queryFn: () => reviewsAPI.getMyReviews().then(res => res.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (reviewId) => reviewsAPI.deleteReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries(['myReviews'])
      toast.success('Review deleted')
      setConfirmDeleteId(null)
    },
    onError: () => {
      toast.error('Failed to delete review')
      setConfirmDeleteId(null)
    },
  })

  const reviews = data?.content || []

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading your reviews...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-purple-50 via-white to-blue-50">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-purple-300/35 blur-3xl" />
      <div className="pointer-events-none absolute right-[-40px] top-6 h-64 w-64 rounded-full bg-pink-300/30 blur-3xl" />

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 pt-8 pb-16">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-gray-600 hover:text-purple-600 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>

          <div className="flex items-center gap-3">
            <Star className="w-7 h-7 fill-yellow-400 text-yellow-400" />
            <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              My Reviews
            </h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {reviews.length === 0 ? 'No reviews yet' : `${reviews.length} ${reviews.length === 1 ? 'review' : 'reviews'} submitted`}
          </p>
        </div>

        {/* Empty state */}
        {reviews.length === 0 && (
          <div className="text-center py-16 bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No reviews yet</h3>
            <p className="text-sm text-gray-500 mb-6">Reviews you submit for events will appear here.</p>
            <button
              onClick={() => navigate('/events?search=:me :past')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold shadow-lg hover:-translate-y-0.5 transition-all"
            >
              View Past Events
            </button>
          </div>
        )}

        {/* Reviews list */}
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white/90 backdrop-blur-xl rounded-2xl border border-white/70 shadow-lg p-5"
            >
              {/* Event / group info */}
              <div className="mb-3">
                <button
                  onClick={() => navigate(`/events/${review.eventId}`)}
                  className="text-base font-bold text-gray-900 hover:text-purple-600 transition-colors text-left"
                >
                  {review.eventName}
                </button>
                {review.groupName && (
                  <button
                    onClick={() => navigate(`/groups/${review.groupId}`)}
                    className="block text-sm text-purple-600 hover:underline text-left mt-0.5"
                  >
                    {review.groupName}
                  </button>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {review.createdAt
                    ? formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })
                    : ''}
                  {review.updatedAt && review.updatedAt !== review.createdAt && ' · edited'}
                </p>
              </div>

              {/* Overall rating */}
              <div className="flex items-center gap-2 mb-3">
                <StarRating value={review.overallRating} size="lg" />
                <span className="text-sm font-semibold text-gray-700">
                  {review.overallRating?.toFixed(1)}
                </span>
              </div>

              {/* Category breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
                {[
                  { label: 'Org', value: review.organizationRating },
                  { label: 'Route', value: review.routeRating },
                  { label: 'Group', value: review.groupRating },
                  { label: 'Safety', value: review.safetyRating },
                  { label: 'Value', value: review.valueRating },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-lg px-2 py-1.5 text-center">
                    <p className="text-[10px] text-gray-500 font-medium">{label}</p>
                    <p className="text-sm font-bold text-gray-800">{value}</p>
                  </div>
                ))}
              </div>

              {/* Comment */}
              {review.comment && (
                <p className="text-sm text-gray-700 leading-relaxed mb-3 border-t border-gray-100 pt-3">
                  {review.comment}
                </p>
              )}

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-3">
                {review.wouldRecommend && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-0.5">
                    <ThumbsUp className="w-3 h-3" />
                    Would recommend
                  </span>
                )}
                {review.wouldJoinAgain && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-0.5">
                    <RotateCcw className="w-3 h-3" />
                    Would join again
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => navigate(`/events/${review.eventId}/review`)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <span className="text-gray-200">|</span>
                {confirmDeleteId === review.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">Delete this review?</span>
                    <button
                      onClick={() => deleteMutation.mutate(review.id)}
                      disabled={deleteMutation.isLoading}
                      className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                    >
                      {deleteMutation.isLoading ? 'Deleting…' : 'Yes, delete'}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-xs font-semibold text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(review.id)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
