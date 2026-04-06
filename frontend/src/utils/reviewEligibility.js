/**
 * Review Eligibility Utility
 * 
 * Handles client-side validation for review eligibility
 * Review window: 24 hours - 30 days after event ends
 */

const MIN_HOURS_AFTER_EVENT = 24;
const MAX_DAYS_AFTER_EVENT = 30;

/**
 * Check if a user is eligible to review an event
 * 
 * @param {Object} event - Event object with eventDate, endTime, hasJoined, hasReviewed
 * @returns {Object} - { canReview: boolean, reason: string, message: string, daysRemaining?: number }
 */
export const checkReviewEligibility = (event) => {
  // Must have joined the event
  if (!event.hasJoined) {
    return {
      canReview: false,
      reason: 'NOT_ATTENDED',
      message: 'You must have attended this event to write a review',
      severity: 'info'
    };
  }

  // Calculate event end time
  const eventEnd = new Date(event.endTime || event.eventDate);
  const now = new Date();

  // Event must be in the past
  if (eventEnd > now) {
    return {
      canReview: false,
      reason: 'NOT_YET_ENDED',
      message: 'You can review this event after it ends',
      severity: 'info'
    };
  }

  // Calculate time since event
  const hoursSinceEvent = (now - eventEnd) / (1000 * 60 * 60);
  const daysSinceEvent = hoursSinceEvent / 24;

  // Must wait 24 hours
  if (hoursSinceEvent < MIN_HOURS_AFTER_EVENT) {
    const hoursRemaining = Math.ceil(MIN_HOURS_AFTER_EVENT - hoursSinceEvent);
    return {
      canReview: false,
      reason: 'TOO_SOON',
      message: `You can review this event in ${hoursRemaining} ${hoursRemaining === 1 ? 'hour' : 'hours'}`,
      severity: 'warning',
      hoursRemaining
    };
  }

  // Must be within 30 days
  if (daysSinceEvent > MAX_DAYS_AFTER_EVENT) {
    return {
      canReview: false,
      reason: 'WINDOW_EXPIRED',
      message: 'Review window closed (30 days after event)',
      severity: 'error'
    };
  }

  // Already reviewed
  if (event.hasReviewed) {
    return {
      canReview: false,
      reason: 'ALREADY_REVIEWED',
      message: 'You have already reviewed this event',
      severity: 'info'
    };
  }

  // Eligible - calculate days remaining
  const daysRemaining = Math.floor(MAX_DAYS_AFTER_EVENT - daysSinceEvent);
  
  let message = 'Share your experience with this event';
  let severity = 'success';

  if (daysRemaining <= 3) {
    message = `Last chance! Review window closes in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}`;
    severity = 'warning';
  } else if (daysRemaining <= 7) {
    message = `Review window closes in ${daysRemaining} days`;
    severity = 'info';
  }

  return {
    canReview: true,
    reason: 'ELIGIBLE',
    message,
    severity,
    daysRemaining
  };
};

/**
 * Get a user-friendly message for review eligibility
 * 
 * @param {Object} eligibility - Result from checkReviewEligibility
 * @returns {string} - Formatted message
 */
export const getEligibilityMessage = (eligibility) => {
  return eligibility.message;
};

/**
 * Get the appropriate icon/emoji for eligibility status
 * 
 * @param {Object} eligibility - Result from checkReviewEligibility
 * @returns {string} - Emoji icon
 */
export const getEligibilityIcon = (eligibility) => {
  const iconMap = {
    'NOT_ATTENDED': '🚫',
    'NOT_YET_ENDED': '⏳',
    'TOO_SOON': '⏰',
    'WINDOW_EXPIRED': '⌛',
    'ALREADY_REVIEWED': '✅',
    'ELIGIBLE': '⭐'
  };
  
  return iconMap[eligibility.reason] || '📝';
};

/**
 * Get CSS classes for eligibility message styling
 * 
 * @param {Object} eligibility - Result from checkReviewEligibility
 * @returns {string} - Tailwind CSS classes
 */
export const getEligibilityClasses = (eligibility) => {
  const classMap = {
    'success': 'bg-green-50 border-green-200 text-green-800',
    'info': 'bg-blue-50 border-blue-200 text-blue-800',
    'warning': 'bg-orange-50 border-orange-200 text-orange-800',
    'error': 'bg-red-50 border-red-200 text-red-800'
  };
  
  return classMap[eligibility.severity] || classMap.info;
};
