import React, { useState } from 'react';
import { Star, ThumbsUp, Flag, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import RatingStars from './RatingStars';
import ProfileAvatar from './ProfileAvatar';
import { formatDistanceToNow } from 'date-fns';

const ReviewCard = ({ 
  review, 
  onEdit = null, 
  onDelete = null, 
  onFlag = null,
  currentUserId = null 
}) => {
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const isOwnReview = currentUserId && review.memberId === currentUserId;

  const formatDate = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  const categoryRatings = [
    { label: 'Organization', value: review.organizationRating },
    { label: 'Route Quality', value: review.routeRating },
    { label: 'Group Atmosphere', value: review.groupRating },
    { label: 'Safety', value: review.safetyRating },
    { label: 'Value', value: review.valueRating }
  ];

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <ProfileAvatar
            member={review.member}
            size="lg"
          />
          <div>
            <h4 className="font-semibold text-gray-900">{review.member?.displayName || review.member?.email}</h4>
            <p className="text-sm text-gray-500">{formatDate(review.createdAt)}</p>
            {review.isVerifiedAttendee && (
              <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium mt-1">
                ✓ Verified Attendee
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {isOwnReview && onEdit && (
            <button
              onClick={() => onEdit(review)}
              className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              title="Edit review"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          {isOwnReview && onDelete && (
            <button
              onClick={() => onDelete(review.id)}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete review"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {!isOwnReview && onFlag && (
            <button
              onClick={() => onFlag(review.id)}
              className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
              title="Report review"
            >
              <Flag className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Overall Rating */}
      <div className="flex items-center gap-3 mb-4">
        <RatingStars rating={review.overallRating} size="lg" showValue />
        <span className="text-2xl font-bold text-purple-600">{review.overallRating.toFixed(1)}</span>
      </div>

      {/* Category Ratings - Compact Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        {categoryRatings.map((category) => (
          <div key={category.label} className="text-center">
            <div className="text-xs text-gray-600 mb-1">{category.label}</div>
            <div className="flex items-center justify-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-semibold">{category.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Comment */}
      {review.comment && (
        <p className="text-gray-700 mb-4 leading-relaxed">{review.comment}</p>
      )}

      {/* Photos */}
      {review.photoUrls && review.photoUrls.length > 0 && (
        <div className="mb-4">
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
            {(showAllPhotos ? review.photoUrls : review.photoUrls.slice(0, 3)).map((url, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                <img
                  src={url}
                  alt={`Review photo ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
          {review.photoUrls.length > 3 && !showAllPhotos && (
            <button
              onClick={() => setShowAllPhotos(true)}
              className="mt-2 text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
            >
              <ImageIcon className="w-4 h-4" />
              Show all {review.photoUrls.length} photos
            </button>
          )}
        </div>
      )}

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        {review.wouldRecommend && (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 text-sm font-medium rounded-full border border-green-200">
            <ThumbsUp className="w-3 h-3" />
            Would Recommend
          </span>
        )}
        {review.wouldJoinAgain && (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 text-sm font-medium rounded-full border border-purple-200">
            ✓ Would Join Again
          </span>
        )}
      </div>
    </div>
  );
};

export default ReviewCard;
