import React from 'react';
import { Star } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

const GroupRatingCardMobile = ({ rating }) => {
  const navigate = useNavigate();
  const { id } = useParams();

  if (!rating || rating.totalReviews < 3) {
    return null;
  }

  const handleReviewClick = (e) => {
    e.stopPropagation();
    navigate(`/groups/${id}/reviews`);
  };

  // Render star rating (5 stars)
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating.averageRating);
    const hasHalfStar = rating.averageRating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        // Full star
        stars.push(
          <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
        );
      } else if (i === fullStars && hasHalfStar) {
        // Half star
        stars.push(
          <div key={i} className="relative w-3 h-3">
            <Star className="w-3 h-3 text-yellow-400 absolute" />
            <div className="overflow-hidden absolute w-1/2">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
        );
      } else {
        // Empty star
        stars.push(
          <Star key={i} className="w-3 h-3 text-gray-300" />
        );
      }
    }
    return stars;
  };

  return (
    <div 
      onClick={handleReviewClick}
      className="flex items-center gap-1 cursor-pointer hover:opacity-90 transition-opacity"
    >
      <span className="text-sm font-bold text-white">{rating.averageRating.toFixed(1)}</span>
      <div className="flex items-center gap-0.5">
        {renderStars()}
      </div>
      <span className="text-xs text-white/80">
        ({rating.totalReviews})
      </span>
    </div>
  );
};

export default GroupRatingCardMobile;
