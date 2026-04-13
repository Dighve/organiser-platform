import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader, CheckCircle, AlertCircle, Clock, Ban, Trash2 } from 'lucide-react';
import ReviewForm from '../components/ReviewForm';
import { eventsAPI, reviewsAPI } from '../lib/api';
import toast from 'react-hot-toast';
import { 
  checkReviewEligibility, 
  getEligibilityMessage, 
  getEligibilityIcon,
  getEligibilityClasses 
} from '../utils/reviewEligibility';

const ReviewSubmissionPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // TEST MODE: Set to true to bypass eligibility checks for testing
  const TEST_MODE = import.meta.env.DEV; // Auto-enabled in development

  // Fetch event details
  const { data: event, isLoading: eventLoading, error: eventError } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventsAPI.getEventById(eventId).then(res => res.data),
    staleTime: 2 * 60 * 1000,
  });

  // Fetch existing review for this event (if any)
  const { data: existingReview, isLoading: reviewLoading } = useQuery({
    queryKey: ['myReview', eventId],
    queryFn: () => reviewsAPI.getMyReviewForEvent(eventId)
      .then(res => res.data)
      .catch(err => {
        // 404 means no review exists, which is fine
        if (err.response?.status === 404) return null;
        throw err;
      }),
    enabled: !!eventId,
    staleTime: 2 * 60 * 1000,
  });

  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: (reviewData) => {
      if (existingReview && isEditMode) {
        // Update existing review
        return reviewsAPI.updateReview(existingReview.id, reviewData);
      } else {
        // Create new review
        return reviewsAPI.submitReview(eventId, reviewData);
      }
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries(['eventReviews', eventId]);
      queryClient.invalidateQueries(['myReview', eventId]);
      queryClient.invalidateQueries(['groupRating', event?.group?.id]);
      queryClient.invalidateQueries(['groupReviews', event?.group?.id]);
      queryClient.invalidateQueries(['pendingReviews']);
      
      setIsSubmitted(true);
      
      // Redirect after 3 seconds
      setTimeout(() => {
        navigate(`/events/${eventId}`);
      }, 3000);
    },
    onError: (error) => {
      const status = error?.response?.status;
      const message = error?.response?.data?.message || error?.response?.data || 'Failed to submit review';

      if (status === 403) {
        toast.error('You must have attended this event to leave a review.');
      } else if (status === 409) {
        toast.error('You have already reviewed this event.');
      } else if (status === 410) {
        toast.error('The review window has closed (30 days after the event).');
      } else if (status === 422) {
        // Server sends the exact message e.g. "You can review this event in 3 hours"
        toast.error(message);
      } else {
        toast.error(typeof message === 'string' ? message : 'Failed to submit review. Please try again.');
      }
    }
  });

  // Delete review mutation
  const deleteReviewMutation = useMutation({
    mutationFn: () => reviewsAPI.deleteReview(existingReview.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['eventReviews', eventId]);
      queryClient.invalidateQueries(['myReview', eventId]);
      queryClient.invalidateQueries(['groupRating', event?.group?.id]);
      queryClient.invalidateQueries(['groupReviews', event?.group?.id]);
      queryClient.invalidateQueries(['pendingReviews']);
      
      toast.success('Your review has been deleted.');
      navigate(`/events/${eventId}`);
    },
    onError: (error) => {
      const message = error?.response?.data?.message || error?.response?.data || 'Failed to delete review';
      toast.error(typeof message === 'string' ? message : 'Failed to delete review. Please try again.');
    }
  });

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete your review? This cannot be undone.')) {
      deleteReviewMutation.mutate();
    }
  };

  const handleSubmit = async (reviewData) => {
    await submitReviewMutation.mutateAsync(reviewData);
  };

  const handleCancel = () => {
    navigate(`/events/${eventId}`);
  };

  // Check review eligibility
  const eligibility = event ? checkReviewEligibility(event) : null;
  
  // Override eligibility in TEST_MODE or if editing existing review
  const canShowForm = TEST_MODE || eligibility?.canReview || (existingReview && !isEditMode);

  if (eventLoading || reviewLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (eventError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 shadow-lg max-w-md text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h2>
          <p className="text-gray-600 mb-6">
            We couldn't find the event you're trying to review.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 shadow-lg max-w-md text-center">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent mb-2">
            Thank You!
          </h2>
          <p className="text-gray-600 mb-2">
            Your review has been {isEditMode ? 'updated' : 'submitted'} successfully.
          </p>
          <p className="text-sm text-gray-500">
            Redirecting you back to the event page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(`/events/${eventId}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-purple-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Event
        </button>

        {/* Event Info Card */}
        <div className="bg-white rounded-xl p-6 shadow-lg mb-6 border border-gray-100">
          <div className="flex items-start gap-4">
            {event.imageUrl && (
              <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{event.title}</h1>
              <p className="text-gray-600 mb-1">
                <span className="font-semibold">Group:</span> {event.group?.name}
              </p>
              <p className="text-gray-600">
                <span className="font-semibold">Date:</span>{' '}
                {new Date(event.eventDate).toLocaleDateString('en-GB', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* TEST MODE Banner */}
        {TEST_MODE && !eligibility?.canReview && (
          <div className="rounded-xl p-4 mb-6 border-2 bg-yellow-50 border-yellow-300 text-yellow-900">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🧪</div>
              <div>
                <p className="font-bold text-sm">TEST MODE ENABLED</p>
                <p className="text-xs">Review form is accessible for testing even though eligibility requirements aren't met</p>
              </div>
            </div>
          </div>
        )}

        {/* Eligibility Status Banner */}
        {eligibility && (
          <div className={`rounded-xl p-6 mb-6 border-2 ${getEligibilityClasses(eligibility)}`}>
            <div className="flex items-start gap-4">
              <div className="text-4xl">{getEligibilityIcon(eligibility)}</div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-1">
                  {eligibility.canReview ? 'Ready to Review' : 'Review Not Available'}
                </h3>
                <p className="text-sm font-medium">
                  {getEligibilityMessage(eligibility)}
                </p>
                {eligibility.canReview && eligibility.daysRemaining !== undefined && (
                  <p className="text-xs mt-2 opacity-75">
                    {eligibility.daysRemaining <= 7 
                      ? `⏰ ${eligibility.daysRemaining} days remaining in review window`
                      : `Review window open for ${eligibility.daysRemaining} more days`
                    }
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Existing Review Display or Edit Form */}
        {existingReview && !isEditMode ? (
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
            <div className="mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent mb-2">
                Your Review
              </h2>
              <p className="text-sm text-gray-600">
                You've already reviewed this event. You can edit your review below.
              </p>
            </div>

            {/* Display existing review */}
            <div className="space-y-6 mb-8">
              {/* Overall Rating */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">Overall Rating</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-purple-600">{existingReview.overallRating.toFixed(1)}</span>
                    <span className="text-gray-500">/ 5.0</span>
                  </div>
                </div>
              </div>

              {/* Individual Ratings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Organization</div>
                  <div className="font-semibold text-gray-900">{existingReview.organizationRating} / 5</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Route Quality</div>
                  <div className="font-semibold text-gray-900">{existingReview.routeRating} / 5</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Group Experience</div>
                  <div className="font-semibold text-gray-900">{existingReview.groupRating} / 5</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Safety</div>
                  <div className="font-semibold text-gray-900">{existingReview.safetyRating} / 5</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg md:col-span-2">
                  <div className="text-sm text-gray-600 mb-1">Value for Money</div>
                  <div className="font-semibold text-gray-900">{existingReview.valueRating} / 5</div>
                </div>
              </div>

              {/* Comment */}
              {existingReview.comment && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm font-semibold text-gray-700 mb-2">Your Comment</div>
                  <p className="text-gray-900 whitespace-pre-wrap">{existingReview.comment}</p>
                </div>
              )}

              {/* Recommendations */}
              <div className="flex flex-wrap gap-3">
                {existingReview.wouldRecommend && (
                  <div className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    ✓ Would recommend this group
                  </div>
                )}
                {existingReview.wouldJoinAgain && (
                  <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    ✓ Would join again
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => setIsEditMode(true)}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all"
              >
                Edit Review
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteReviewMutation.isPending}
                className="px-6 py-3 border-2 border-red-300 text-red-600 font-bold rounded-xl hover:bg-red-50 hover:border-red-400 transition-all flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {deleteReviewMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => navigate(`/events/${eventId}`)}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:border-gray-400 transition-all"
              >
                Back to Event
              </button>
            </div>
          </div>
        ) : canShowForm ? (
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
            {isEditMode && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <span className="font-semibold">Editing Mode:</span> You're updating your existing review.
                </p>
              </div>
            )}
            <ReviewForm
              eventId={eventId}
              groupId={event.group?.id}
              onSubmit={handleSubmit}
              onCancel={isEditMode ? () => setIsEditMode(false) : handleCancel}
              initialData={isEditMode ? existingReview : null}
              isEditMode={isEditMode}
            />
          </div>
        ) : (
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Unable to Submit Review
            </h3>
            <p className="text-gray-600 mb-6">
              {eligibility?.message || 'You are not eligible to review this event at this time.'}
            </p>
            <button
              onClick={() => navigate(`/events/${eventId}`)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all"
            >
              Back to Event
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewSubmissionPage;
