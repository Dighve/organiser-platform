import React from 'react';
import { Star } from 'lucide-react';

const RatingStars = ({ 
  rating, 
  maxRating = 5, 
  size = 'md', 
  interactive = false, 
  onChange = null,
  showValue = false 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  };

  const handleClick = (value) => {
    if (interactive && onChange) {
      onChange(value);
    }
  };

  const renderStar = (index) => {
    const value = index + 1;
    const isFilled = value <= rating;
    const isPartiallyFilled = value > rating && value - 1 < rating;
    const fillPercentage = isPartiallyFilled ? ((rating - (value - 1)) * 100) : 0;

    return (
      <div
        key={index}
        className={`relative ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
        onClick={() => handleClick(value)}
      >
        {isPartiallyFilled ? (
          <div className="relative">
            <Star className={`${sizeClasses[size]} text-gray-300`} />
            <div 
              className="absolute top-0 left-0 overflow-hidden"
              style={{ width: `${fillPercentage}%` }}
            >
              <Star className={`${sizeClasses[size]} fill-yellow-400 text-yellow-400`} />
            </div>
          </div>
        ) : (
          <Star 
            className={`${sizeClasses[size]} ${
              isFilled 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            }`} 
          />
        )}
      </div>
    );
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-1">
        {[...Array(maxRating)].map((_, index) => renderStar(index))}
      </div>
      {showValue && (
        <span className="ml-2 text-sm font-semibold text-gray-700">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default RatingStars;
