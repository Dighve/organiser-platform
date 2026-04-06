import React, { useState } from 'react';
import { Loader, Star } from 'lucide-react';
import RatingStars from './RatingStars';
import toast from 'react-hot-toast';

const ReviewForm = ({ eventId, groupId, onSubmit, onCancel, initialData = null }) => {
  const [formData, setFormData] = useState({
    organizationRating: initialData?.organizationRating || 0,
    routeRating: initialData?.routeRating || 0,
    groupRating: initialData?.groupRating || 0,
    safetyRating: initialData?.safetyRating || 0,
    valueRating: initialData?.valueRating || 0,
    comment: initialData?.comment || '',
    wouldRecommend: initialData?.wouldRecommend ?? true,
    wouldJoinAgain: initialData?.wouldJoinAgain ?? true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const ratingCategories = [
    { 
      key: 'organizationRating', 
      label: 'Organization', 
      description: 'How well was the event organized?',
      icon: '📋'
    },
    { 
      key: 'routeRating', 
      label: 'Route Quality', 
      description: 'How was the hiking route?',
      icon: '🥾'
    },
    { 
      key: 'groupRating', 
      label: 'Group Atmosphere', 
      description: 'How welcoming was the group?',
      icon: '👥'
    },
    { 
      key: 'safetyRating', 
      label: 'Safety', 
      description: 'How safe did you feel?',
      icon: '🛡️'
    },
    { 
      key: 'valueRating', 
      label: 'Value', 
      description: 'Was it worth the cost/effort?',
      icon: '💰'
    }
  ];

  const validateForm = () => {
    const newErrors = {};
    
    ratingCategories.forEach(category => {
      if (formData[category.key] === 0) {
        newErrors[category.key] = 'Please provide a rating';
      }
    });

    if (formData.comment.length > 1000) {
      newErrors.comment = 'Comment must be 1000 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRatingChange = (category, value) => {
    setFormData(prev => ({ ...prev, [category]: value }));
    if (errors[category]) {
      setErrors(prev => ({ ...prev, [category]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        eventId,
        groupId,
        ...formData
      });
      toast.success(initialData ? 'Review updated successfully!' : 'Review submitted successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent mb-2">
          {initialData ? 'Edit Your Review' : 'Share Your Experience'}
        </h2>
        <p className="text-sm lg:text-base text-gray-600">Help others by sharing your honest feedback</p>
      </div>

      {/* Rating Categories */}
      <div className="space-y-4 lg:space-y-6">
        <h3 className="text-lg lg:text-xl font-bold text-gray-900 flex items-center gap-2">
          <Star className="w-5 h-5 lg:w-6 lg:h-6 text-yellow-400" />
          Rate Your Experience
        </h3>
        
        {ratingCategories.map((category) => (
          <div key={category.key} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 lg:p-6 border border-purple-100">
            {/* Mobile: Compact layout */}
            <div className="lg:hidden">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-base font-semibold text-gray-900 flex items-center gap-1.5">
                  <span className="text-lg">{category.icon}</span>
                  {category.label}
                </h4>
                {formData[category.key] > 0 && (
                  <span className="text-xl font-bold text-purple-600">
                    {formData[category.key]}.0
                  </span>
                )}
              </div>
              <RatingStars
                rating={formData[category.key]}
                interactive={true}
                onChange={(value) => handleRatingChange(category.key, value)}
                size="lg"
              />
            </div>
            
            {/* Desktop: Original layout */}
            <div className="hidden lg:block">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <span>{category.icon}</span>
                    {category.label}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <RatingStars
                  rating={formData[category.key]}
                  interactive={true}
                  onChange={(value) => handleRatingChange(category.key, value)}
                  size="xl"
                />
                {formData[category.key] > 0 && (
                  <span className="text-2xl font-bold text-purple-600">
                    {formData[category.key]}.0
                  </span>
                )}
              </div>
            </div>
            
            {errors[category.key] && (
              <p className="text-red-500 text-sm mt-2">{errors[category.key]}</p>
            )}
          </div>
        ))}
      </div>

      {/* Comment */}
      <div>
        <label className="block text-base lg:text-lg font-semibold text-gray-900 mb-2">
          💬 Tell us more (optional)
        </label>
        <textarea
          value={formData.comment}
          onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
          placeholder="Share details about your experience..."
          rows={4}
          maxLength={1000}
          className="w-full px-3 py-2 lg:px-4 lg:py-3 text-sm lg:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
        />
        <p className="text-xs lg:text-sm text-gray-500 mt-1">
          {formData.comment.length}/1000 characters
        </p>
        {errors.comment && (
          <p className="text-red-500 text-sm mt-1">{errors.comment}</p>
        )}
      </div>

      {/* Checkboxes */}
      <div className="space-y-2.5 lg:space-y-3">
        <label className="flex items-center gap-2.5 lg:gap-3 p-3 lg:p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 cursor-pointer hover:shadow-md transition-shadow">
          <input
            type="checkbox"
            checked={formData.wouldRecommend}
            onChange={(e) => setFormData(prev => ({ ...prev, wouldRecommend: e.target.checked }))}
            className="w-4 h-4 lg:w-5 lg:h-5 text-purple-600 rounded focus:ring-purple-500 flex-shrink-0"
          />
          <span className="text-sm lg:text-base text-gray-900 font-medium">👍 I would recommend this group to others</span>
        </label>

        <label className="flex items-center gap-2.5 lg:gap-3 p-3 lg:p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 cursor-pointer hover:shadow-md transition-shadow">
          <input
            type="checkbox"
            checked={formData.wouldJoinAgain}
            onChange={(e) => setFormData(prev => ({ ...prev, wouldJoinAgain: e.target.checked }))}
            className="w-4 h-4 lg:w-5 lg:h-5 text-purple-600 rounded focus:ring-purple-500 flex-shrink-0"
          />
          <span className="text-sm lg:text-base text-gray-900 font-medium">🔄 I would join another event from this group</span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-3 lg:gap-4 pt-2 lg:pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 px-4 py-3 lg:px-6 lg:py-4 text-sm lg:text-base bg-white border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:shadow-lg transition-all disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-3 lg:px-6 lg:py-4 text-sm lg:text-base bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white font-bold rounded-xl hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader className="w-4 h-4 lg:w-5 lg:h-5 animate-spin" />
              <span className="hidden sm:inline">Submitting...</span>
              <span className="sm:hidden">...</span>
            </>
          ) : (
            initialData ? 'Update Review' : 'Submit Review'
          )}
        </button>
      </div>
    </form>
  );
};

export default ReviewForm;
