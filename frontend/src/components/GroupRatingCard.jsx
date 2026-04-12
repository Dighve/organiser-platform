import React from 'react';
import { Star } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import RatingStars from './RatingStars';
import RatingBar from './RatingBar';

const GroupRatingCard = ({ rating }) => {
  const navigate = useNavigate();
  const { id } = useParams();

  if (!rating || rating.totalReviews < 3) {
    return null;
  }

  const handleReviewClick = () => {
    navigate(`/groups/${id}/reviews`);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
        Group Rating
      </h3>
      
      {/* Large Rating Display */}
      <div className="text-center mb-6">
        <div className="text-6xl font-bold text-purple-600 mb-2">
          {rating.averageRating.toFixed(1)}
        </div>
        <div className="flex justify-center mb-2">
          <RatingStars rating={rating.averageRating} size="lg" />
        </div>
        <p className="text-gray-600">
          Based on{' '}
          <span 
            onClick={handleReviewClick}
            className="text-purple-600 font-semibold cursor-pointer hover:underline"
          >
            {rating.totalReviews} {rating.totalReviews === 1 ? 'review' : 'reviews'}
          </span>
        </p>
      </div>
      
      {/* Category Breakdown */}
      <div className="space-y-3 mb-6">
        <RatingBar label="Organization" value={rating.organizationAvg} />
        <RatingBar label="Route Quality" value={rating.routeAvg} />
        <RatingBar label="Group Atmosphere" value={rating.groupAvg} />
        <RatingBar label="Safety" value={rating.safetyAvg} />
        <RatingBar label="Value" value={rating.valueAvg} />
      </div>
      
      {/* Recommendation Percentage */}
      <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
        <p className="text-lg font-semibold text-purple-600">
          {rating.recommendationPercentage.toFixed(0)}% recommend this group
        </p>
      </div>
    </div>
  );
};

export default GroupRatingCard;
