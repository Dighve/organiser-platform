import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader, CheckCircle, AlertCircle, Clock, Ban } from 'lucide-react';
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

  // Fetch event details
  const { data: event, isLoading: eventLoading, error: eventError } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventsAPI.getEventById(eventId).then(res => res.data),
    staleTime: 2 * 60 * 1000,
  });

  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: (reviewData) => reviewsAPI.submitReview(eventId, reviewData),
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries(['eventReviews', eventId]);
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
      console.error('Failed to submit review:', error);
      throw error;
    }
  });

  const handleSubmit = async (reviewData) => {
    await submitReviewMutation.mutateAsync(reviewData);
  };

  const handleCancel = () => {
    navigate(`/events/${eventId}`);
  };

  // Check review eligibility
  const eligibility = event ? checkReviewEligibility(event) : null;

  if (eventLoading) {
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
            Your review has been submitted successfully.
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

        {/* Review Form - Only show if eligible */}
        {eligibility?.canReview ? (
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
            <ReviewForm
              eventId={eventId}
              groupId={event.group?.id}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
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
