import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { eventsAPI, reviewsAPI } from '../lib/api';
import ProfileAvatar from '../components/ProfileAvatar';
import RatingStars from '../components/RatingStars';
import { formatDistanceToNow } from 'date-fns';

const EventReviewsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expandedReviews, setExpandedReviews] = useState({});

  const toggleReview = (reviewId) => {
    setExpandedReviews(prev => ({
      ...prev,
      [reviewId]: !prev[reviewId]
    }));
  };

  // Fetch event details
  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsAPI.getEventById(id),
  });

  // Fetch reviews for this event
  const { data: data, isLoading: reviewsLoading } = useQuery({
    queryKey: ['eventReviews', id],
    queryFn: () => reviewsAPI.getEventReviews(id),
  });

  const reviews = data?.data?.content || [];
  
  const displayEvent = event;

  if (eventLoading || reviewsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-purple-600 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>

          <div className="flex items-center gap-3 mb-2">
            <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
            <h1 className="text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Event Reviews ({reviews.length})
            </h1>
          </div>
          
          <span 
            onClick={() => navigate(`/events/${id}`)}
            className="text-base font-semibold text-purple-600 cursor-pointer hover:underline inline-flex items-center gap-1"
          >
            {displayEvent.title}
          </span>
        </div>

        {/* Category Ratings - Without heading */}
        {reviews.length > 0 && (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 lg:p-8 mb-8">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <div className="text-sm text-gray-600 mb-2">Organization</div>
                <div className="text-3xl font-bold text-purple-600">
                  {(reviews.reduce((sum, r) => sum + r.organizationRating, 0) / reviews.length).toFixed(1)}
                </div>
                <div className="flex justify-center mt-2">
                  <RatingStars rating={reviews.reduce((sum, r) => sum + r.organizationRating, 0) / reviews.length} size="sm" />
                </div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <div className="text-sm text-gray-600 mb-2">Route</div>
                <div className="text-3xl font-bold text-blue-600">
                  {(reviews.reduce((sum, r) => sum + r.routeRating, 0) / reviews.length).toFixed(1)}
                </div>
                <div className="flex justify-center mt-2">
                  <RatingStars rating={reviews.reduce((sum, r) => sum + r.routeRating, 0) / reviews.length} size="sm" />
                </div>
              </div>
              <div className="text-center p-4 bg-pink-50 rounded-xl">
                <div className="text-sm text-gray-600 mb-2">Atmosphere</div>
                <div className="text-3xl font-bold text-pink-600">
                  {(reviews.reduce((sum, r) => sum + r.groupRating, 0) / reviews.length).toFixed(1)}
                </div>
                <div className="flex justify-center mt-2">
                  <RatingStars rating={reviews.reduce((sum, r) => sum + r.groupRating, 0) / reviews.length} size="sm" />
                </div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <div className="text-sm text-gray-600 mb-2">Safety</div>
                <div className="text-3xl font-bold text-green-600">
                  {(reviews.reduce((sum, r) => sum + r.safetyRating, 0) / reviews.length).toFixed(1)}
                </div>
                <div className="flex justify-center mt-2">
                  <RatingStars rating={reviews.reduce((sum, r) => sum + r.safetyRating, 0) / reviews.length} size="sm" />
                </div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-xl">
                <div className="text-sm text-gray-600 mb-2">Value</div>
                <div className="text-3xl font-bold text-orange-600">
                  {(reviews.reduce((sum, r) => sum + r.valueRating, 0) / reviews.length).toFixed(1)}
                </div>
                <div className="flex justify-center mt-2">
                  <RatingStars rating={reviews.reduce((sum, r) => sum + r.valueRating, 0) / reviews.length} size="sm" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reviews List */}
        <div className="space-y-6">
          {reviews.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-12 text-center">
              <div className="text-6xl mb-4">⭐</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No reviews yet</h3>
              <p className="text-gray-600">Be the first to review this event!</p>
            </div>
          ) : (
            reviews.map((review) => {
              const isExpanded = expandedReviews[review.id];
              
              return (
                <div
                  key={review.id}
                  onClick={() => toggleReview(review.id)}
                  className="relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-shadow lg:cursor-default cursor-pointer"
                >
                  {/* Reviewer Info */}
                  <div className="flex items-start gap-4 mb-4">
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        review.reviewerId && navigate(`/members/${review.reviewerId}`);
                      }}
                      className={review.reviewerId ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}
                    >
                      <ProfileAvatar
                        imageUrl={review.reviewerAvatarUrl}
                        displayName={review.reviewerName}
                        size="lg"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 
                          onClick={(e) => {
                            e.stopPropagation();
                            review.reviewerId && navigate(`/members/${review.reviewerId}`);
                          }}
                          className={`font-bold text-lg ${review.reviewerId ? 'text-purple-600 cursor-pointer hover:underline' : 'text-gray-900'}`}
                        >
                          {review.reviewerName}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Review for{' '}
                        <span 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/events/${id}`);
                          }}
                          className="font-semibold text-purple-600 cursor-pointer hover:underline"
                        >
                          {displayEvent.title}
                        </span>
                      </p>
                      <div className="flex items-center gap-2">
                        <RatingStars rating={review.overallRating} size="sm" />
                        <span className="text-sm font-semibold text-purple-600">
                          {review.overallRating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Review Comment */}
                  {review.comment && (
                    <p className="text-gray-700 leading-relaxed mb-4">
                      {review.comment}
                    </p>
                  )}

                  {/* Mobile: Expandable Section, Desktop: Always Visible */}
                  <div className={`space-y-4 pb-12 lg:pb-0 ${isExpanded ? 'block' : 'hidden'} lg:block`}>
                    {/* Category Ratings */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">Organization</div>
                        <div className="text-lg font-bold text-purple-600">
                          {review.organizationRating}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">Route</div>
                        <div className="text-lg font-bold text-blue-600">
                          {review.routeRating}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-pink-50 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">Atmosphere</div>
                        <div className="text-lg font-bold text-pink-600">
                          {review.groupRating}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">Safety</div>
                        <div className="text-lg font-bold text-green-600">
                          {review.safetyRating}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">Value</div>
                        <div className="text-lg font-bold text-orange-600">
                          {review.valueRating}
                        </div>
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div className="flex gap-2">
                      {review.wouldRecommend && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                          👍 Would recommend
                        </span>
                      )}
                      {review.wouldJoinAgain && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                          🔄 Would join again
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Mobile Only: Expand/Collapse Button (Bottom Right) */}
                  <button
                    onClick={() => toggleReview(review.id)}
                    className="lg:hidden absolute bottom-4 right-4 p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-full transition-all"
                    aria-label={isExpanded ? "Show less" : "Show details"}
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default EventReviewsPage;
