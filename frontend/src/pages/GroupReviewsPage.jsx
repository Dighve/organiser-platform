import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Calendar, MapPin, ChevronRight, ChevronDown, ChevronUp, Filter, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { groupsAPI, reviewsAPI } from '../lib/api';
import ProfileAvatar from '../components/ProfileAvatar';
import RatingStars from '../components/RatingStars';
import { format, formatDistanceToNow } from 'date-fns';

const GroupReviewsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('reviews'); // 'events' or 'reviews'
  const [expandedReviews, setExpandedReviews] = useState({});
  const [selectedRating, setSelectedRating] = useState('all'); // 'all', '5', '4', '3', '2', '1'
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  const toggleReview = (reviewId) => {
    setExpandedReviews(prev => ({
      ...prev,
      [reviewId]: !prev[reviewId]
    }));
  };

  // Fetch group details
  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ['group', id],
    queryFn: () => groupsAPI.getGroupById(id),
  });

  // TODO: Replace with actual API call when backend is ready
  // const { data: events, isLoading: eventsLoading } = useQuery({
  //   queryKey: ['groupEvents', id],
  //   queryFn: () => groupsAPI.getGroupEvents(id),
  // });

  // Using mock data for now - events with ratings
  const events = [
    {
      id: 1,
      title: 'Peak District Sunrise Hike',
      eventDate: '2024-03-15T06:00:00Z',
      location: 'Mam Tor, Peak District',
      imageUrl: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop',
      averageRating: 4.8,
      totalReviews: 12,
      organizationAvg: 4.9,
      routeAvg: 4.7,
      groupAvg: 4.8,
      safetyAvg: 5.0,
      valueAvg: 4.6
    },
    {
      id: 2,
      title: 'Lake District Challenge',
      eventDate: '2024-03-08T08:00:00Z',
      location: 'Scafell Pike, Lake District',
      imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=300&fit=crop',
      averageRating: 4.5,
      totalReviews: 8,
      organizationAvg: 4.6,
      routeAvg: 4.4,
      groupAvg: 4.5,
      safetyAvg: 4.7,
      valueAvg: 4.3
    },
    {
      id: 3,
      title: 'Snowdonia Adventure',
      eventDate: '2024-02-28T07:30:00Z',
      location: 'Mount Snowdon, Wales',
      imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
      averageRating: 4.7,
      totalReviews: 15,
      organizationAvg: 4.8,
      routeAvg: 4.6,
      groupAvg: 4.7,
      safetyAvg: 4.9,
      valueAvg: 4.5
    }
  ];
  const eventsLoading = false;

  // Fetch reviews for this group
  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ['groupReviews', id],
    queryFn: () => reviewsAPI.getGroupReviews(id),
  });

  const allReviews = reviewsData?.data?.content || [];

  // Filter reviews by selected rating
  const reviews = selectedRating === 'all' 
    ? allReviews 
    : allReviews.filter(review => Math.floor(review.overallRating) === parseInt(selectedRating));

  // Calculate total review count
  const totalReviews = events.reduce((sum, event) => sum + event.totalReviews, 0);

  if (groupLoading || eventsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading events...</p>
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

          <div className="flex items-center gap-3">
            <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
            <h1 className="text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Group Reviews
            </h1>
          </div>
        </div>

        {/* Overall Group Rating Summary - Without heading */}
        {(events.length > 0 || reviews.length > 0) && (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 lg:p-8 mb-8">
            {/* Total Rating Display */}
            <div className="text-center mb-6 pb-6 border-b border-gray-200">
              <div className="text-6xl font-bold text-purple-600 mb-2">
                {((events.reduce((sum, e) => sum + e.organizationAvg + e.routeAvg + e.groupAvg + e.safetyAvg + e.valueAvg, 0) / events.length) / 5).toFixed(1)}
              </div>
              <div className="flex justify-center mb-2">
                <RatingStars rating={(events.reduce((sum, e) => sum + e.organizationAvg + e.routeAvg + e.groupAvg + e.safetyAvg + e.valueAvg, 0) / events.length) / 5} size="lg" />
              </div>
              <p className="text-gray-600">
                Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
              </p>
            </div>

            {/* Category Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <div className="text-sm text-gray-600 mb-2">Organization</div>
                <div className="text-3xl font-bold text-purple-600">
                  {(events.reduce((sum, e) => sum + e.organizationAvg, 0) / events.length).toFixed(1)}
                </div>
                <div className="flex justify-center mt-2">
                  <RatingStars rating={events.reduce((sum, e) => sum + e.organizationAvg, 0) / events.length} size="sm" />
                </div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <div className="text-sm text-gray-600 mb-2">Route</div>
                <div className="text-3xl font-bold text-blue-600">
                  {(events.reduce((sum, e) => sum + e.routeAvg, 0) / events.length).toFixed(1)}
                </div>
                <div className="flex justify-center mt-2">
                  <RatingStars rating={events.reduce((sum, e) => sum + e.routeAvg, 0) / events.length} size="sm" />
                </div>
              </div>
              <div className="text-center p-4 bg-pink-50 rounded-xl">
                <div className="text-sm text-gray-600 mb-2">Atmosphere</div>
                <div className="text-3xl font-bold text-pink-600">
                  {(events.reduce((sum, e) => sum + e.groupAvg, 0) / events.length).toFixed(1)}
                </div>
                <div className="flex justify-center mt-2">
                  <RatingStars rating={events.reduce((sum, e) => sum + e.groupAvg, 0) / events.length} size="sm" />
                </div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <div className="text-sm text-gray-600 mb-2">Safety</div>
                <div className="text-3xl font-bold text-green-600">
                  {(events.reduce((sum, e) => sum + e.safetyAvg, 0) / events.length).toFixed(1)}
                </div>
                <div className="flex justify-center mt-2">
                  <RatingStars rating={events.reduce((sum, e) => sum + e.safetyAvg, 0) / events.length} size="sm" />
                </div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-xl">
                <div className="text-sm text-gray-600 mb-2">Value</div>
                <div className="text-3xl font-bold text-orange-600">
                  {(events.reduce((sum, e) => sum + e.valueAvg, 0) / events.length).toFixed(1)}
                </div>
                <div className="flex justify-center mt-2">
                  <RatingStars rating={events.reduce((sum, e) => sum + e.valueAvg, 0) / events.length} size="sm" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'events' ? (
          /* Events List */
          <div className="space-y-6">
            {events.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-12 text-center">
                <div className="text-6xl mb-4">⭐</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No events with reviews yet</h3>
                <p className="text-gray-600">Events will appear here once they have reviews!</p>
              </div>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  onClick={() => navigate(`/events/${event.id}/reviews`)}
                  className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 overflow-hidden hover:shadow-2xl transition-all cursor-pointer group"
                >
                  {/* Event Image Banner */}
                  <div className="relative w-full h-40">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500">
                      {event.imageUrl && (
                        <img
                          src={event.imageUrl}
                          alt={event.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                      )}
                    </div>
                    {/* Rating Badge */}
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-lg">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-bold text-gray-900">{event.averageRating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors line-clamp-2">
                        {event.title}
                      </h3>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors flex-shrink-0 mt-0.5" />
                    </div>

                    {/* Date and Location - Compact */}
                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-xs">
                          {format(new Date(event.eventDate), 'MMM dd, yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="text-xs truncate">{event.location}</span>
                      </div>
                    </div>

                    {/* Rating Info */}
                    <div className="flex items-center gap-2 mb-3">
                      <RatingStars rating={event.averageRating} size="sm" />
                      <span className="text-xs text-gray-600">
                        ({event.totalReviews})
                      </span>
                    </div>

                    {/* Category Ratings - Compact Pills */}
                    <div className="flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                        Org {event.organizationAvg.toFixed(1)}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                        Route {event.routeAvg.toFixed(1)}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-pink-50 text-pink-700 rounded-full text-xs font-medium">
                        Atmos {event.groupAvg.toFixed(1)}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                        Safety {event.safetyAvg.toFixed(1)}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-medium">
                        Value {event.valueAvg.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* All Reviews List */
          <div className="space-y-6">
            {/* Rating Filter - Desktop Only */}
            <div className="hidden lg:block bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
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
              
              {/* Active Filter Indicator */}
              {selectedRating !== 'all' && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Showing <span className="font-semibold text-purple-600">{reviews.length}</span> review{reviews.length !== 1 ? 's' : ''} with {selectedRating} star{selectedRating === '1' ? '' : 's'}
                    <button
                      onClick={() => setSelectedRating('all')}
                      className="ml-2 text-purple-600 hover:text-purple-700 font-medium underline"
                    >
                      Clear filter
                    </button>
                  </p>
                </div>
              )}
            </div>
            
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
                <p className="text-gray-600">Be the first to review this group after attending an event!</p>
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
                        <div className="flex items-center justify-between mb-1">
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
                        {review.eventName && review.eventId && (
                          <p className="text-sm text-gray-600 mb-2">
                            Review for{' '}
                            <span 
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/events/${review.eventId}`);
                              }}
                              className="font-semibold text-purple-600 cursor-pointer hover:underline"
                            >
                              {review.eventName}
                            </span>
                          </p>
                        )}
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
        )}

        {/* Tabs - Fixed at bottom */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-lg p-4 z-40">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('reviews')}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                  activeTab === 'reviews'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                <span className="hidden sm:inline">All Reviews ({totalReviews})</span>
                <span className="sm:hidden flex items-center justify-center gap-1">
                  <Star className="w-4 h-4" />
                  <span className="text-sm">({totalReviews})</span>
                </span>
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                  activeTab === 'events'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                <span className="hidden sm:inline">Events ({events.length})</span>
                <span className="sm:hidden flex items-center justify-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">({events.length})</span>
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom padding to prevent content from being hidden behind fixed tabs */}
        <div className="h-24"></div>
      </div>
    </div>
  );
};

export default GroupReviewsPage;
