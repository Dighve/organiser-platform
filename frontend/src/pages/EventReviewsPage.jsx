import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Star, ChevronDown, ChevronUp, Filter, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { eventsAPI, reviewsAPI } from '../lib/api';
import ProfileAvatar from '../components/ProfileAvatar';
import RatingStars from '../components/RatingStars';
import { formatDistanceToNow } from 'date-fns';

const EventReviewsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [expandedReviews, setExpandedReviews] = useState({});
  const [selectedRating, setSelectedRating] = useState('all'); // 'all', '5', '4', '3', '2', '1'
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // Get return navigation parameters
  const returnTab = searchParams.get('returnTab');
  const groupId = searchParams.get('groupId');

  const toggleReview = (reviewId) => {
    setExpandedReviews(prev => ({
      ...prev,
      [reviewId]: !prev[reviewId]
    }));
  };

  // Fetch event details
  const { data: eventData, isLoading: eventLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsAPI.getEventById(id),
  });

  // Fetch reviews for this event
  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ['eventReviews', id],
    queryFn: () => reviewsAPI.getEventReviews(id),
  });

  const event = eventData?.data;
  const allReviews = reviewsData?.data?.content || [];
  
  // Filter reviews by selected rating
  const reviews = selectedRating === 'all' 
    ? allReviews 
    : allReviews.filter(review => Math.floor(review.overallRating) === parseInt(selectedRating));

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
            onClick={() => {
              if (returnTab && groupId) {
                navigate(`/groups/${groupId}/reviews?tab=${returnTab}`);
              } else {
                navigate(-1);
              }
            }}
            className="flex items-center gap-2 text-gray-600 hover:text-purple-600 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>

          <div className="flex items-center gap-3 mb-3">
            <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
            <h1 className="text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Event Reviews
            </h1>
          </div>
          
          <p className="text-lg text-gray-700">
            Reviews for{' '}
            <span 
              onClick={() => navigate(`/events/${id}`)}
              className="font-bold text-purple-600 cursor-pointer hover:underline"
            >
              {event?.title}
            </span>
          </p>
        </div>

        {/* Overall Event Rating Summary - Combined Card */}
        {reviews.length > 0 && (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 lg:p-8 mb-8">
            {/* Total Rating Display */}
            <div className="text-center mb-6 pb-6 border-b border-gray-200">
              <div className="text-6xl font-bold text-purple-600 mb-2">
                {(reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviews.length).toFixed(1)}
              </div>
              <div className="flex justify-center mb-2">
                <RatingStars rating={reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviews.length} size="lg" />
              </div>
              <p className="text-gray-600">
                Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
              </p>
            </div>

            {/* Category Breakdown */}
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
          {/* Rating Filter - Desktop Only */}
          {reviews.length > 0 && (
            <div className="hidden lg:block bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-900">Filter by Rating:</h3>
                </div>
                
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setSelectedRating('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedRating === 'all'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                        : 'bg-white border border-gray-300 text-gray-700 hover:border-purple-400 hover:text-purple-600'
                    }`}
                  >
                    All ({allReviews.length})
                  </button>
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = allReviews.filter(r => Math.floor(r.overallRating) === rating).length;
                    return (
                      <button
                        key={rating}
                        onClick={() => setSelectedRating(rating.toString())}
                        className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                          selectedRating === rating.toString()
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                            : 'bg-white border border-gray-300 text-gray-700 hover:border-purple-400 hover:text-purple-600'
                        }`}
                      >
                        <span>{rating}</span>
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          
          {/* Mobile Filter Button - Floating Bottom Right */}
          <button
            onClick={() => setShowMobileFilter(true)}
            className="lg:hidden fixed bottom-24 right-4 z-40 w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform"
          >
            <Filter className="w-6 h-6" />
            {selectedRating !== 'all' && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                1
              </span>
            )}
          </button>

          {/* Mobile Filter Modal */}
          {showMobileFilter && (
            <div className="lg:hidden fixed inset-0 z-50 flex items-end">
              {/* Backdrop */}
              <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setShowMobileFilter(false)}
              />
              
              {/* Modal Content */}
              <div className="relative w-full bg-white rounded-t-3xl shadow-2xl p-6 pb-8 animate-slide-up">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                    <h3 className="text-xl font-bold text-gray-900">Filter by Rating</h3>
                  </div>
                  <button
                    onClick={() => setShowMobileFilter(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
                
                {/* Filter Options */}
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setSelectedRating('all');
                      setShowMobileFilter(false);
                    }}
                    className={`w-full px-4 py-4 rounded-xl font-medium transition-all text-left flex items-center justify-between ${
                      selectedRating === 'all'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-lg">All Reviews</span>
                    <span className="text-sm opacity-80">({allReviews.length})</span>
                  </button>
                  
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = allReviews.filter(r => Math.floor(r.overallRating) === rating).length;
                    return (
                      <button
                        key={rating}
                        onClick={() => {
                          setSelectedRating(rating.toString());
                          setShowMobileFilter(false);
                        }}
                        className={`w-full px-4 py-4 rounded-xl font-medium transition-all text-left flex items-center justify-between ${
                          selectedRating === rating.toString()
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{rating}</span>
                          <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                          <span className="text-lg">Star{rating !== 1 ? 's' : ''}</span>
                        </div>
                        <span className="text-sm opacity-80">({count})</span>
                      </button>
                    );
                  })}
                </div>
                
                {/* Clear Filter Button */}
                {selectedRating !== 'all' && (
                  <button
                    onClick={() => {
                      setSelectedRating('all');
                      setShowMobileFilter(false);
                    }}
                    className="w-full mt-4 px-4 py-3 rounded-xl font-medium bg-white border-2 border-purple-600 text-purple-600 hover:bg-purple-50 transition-colors"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            </div>
          )}

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
                        review.memberId && navigate(`/members/${review.memberId}`);
                      }}
                      className={review.memberId ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}
                    >
                      <ProfileAvatar
                        imageUrl={review.memberPhotoUrl}
                        displayName={review.memberName}
                        size="lg"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 
                          onClick={(e) => {
                            e.stopPropagation();
                            review.memberId && navigate(`/members/${review.memberId}`);
                          }}
                          className={`font-bold text-lg ${review.memberId ? 'text-purple-600 cursor-pointer hover:underline' : 'text-gray-900'}`}
                        >
                          {review.memberName}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                        </span>
                      </div>
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
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleReview(review.id);
                    }}
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
