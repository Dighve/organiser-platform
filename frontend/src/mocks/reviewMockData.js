// Mock data for testing review UI components locally

export const mockGroupRating = {
  averageRating: 4.5,
  totalReviews: 12,
  organizationAvg: 4.7,
  routeAvg: 4.3,
  groupAvg: 4.6,
  safetyAvg: 4.8,
  valueAvg: 4.2,
  recommendationPercentage: 92
};

export const mockEventReviews = [
  {
    id: 1,
    eventId: 1,
    eventTitle: 'Peak District Sunrise Hike',
    reviewerName: 'John Smith',
    reviewerAvatarUrl: null,
    overallRating: 5.0,
    organizationRating: 5,
    routeRating: 5,
    groupRating: 5,
    safetyRating: 5,
    valueRating: 5,
    comment: 'Amazing hike! The route was well-planned and the group was very welcoming. Would definitely join again!',
    wouldRecommend: true,
    wouldJoinAgain: true,
    createdAt: '2026-03-15T10:30:00Z',
    isOwnReview: false
  },
  {
    id: 2,
    eventId: 2,
    eventTitle: 'Lake District Trail Adventure',
    reviewerName: 'Sarah Johnson',
    reviewerAvatarUrl: null,
    overallRating: 4.2,
    organizationRating: 4,
    routeRating: 4,
    groupRating: 5,
    safetyRating: 4,
    valueRating: 4,
    comment: 'Great experience overall. The organizer was very professional and safety-conscious.',
    wouldRecommend: true,
    wouldJoinAgain: true,
    createdAt: '2026-03-16T14:20:00Z',
    isOwnReview: false
  },
  {
    id: 3,
    eventId: 1,
    eventTitle: 'Peak District Sunrise Hike',
    reviewerName: 'Mike Davis',
    reviewerAvatarUrl: null,
    overallRating: 4.8,
    organizationRating: 5,
    routeRating: 5,
    groupRating: 4,
    safetyRating: 5,
    valueRating: 5,
    comment: 'Excellent organization and beautiful route. Highly recommend!',
    wouldRecommend: true,
    wouldJoinAgain: true,
    createdAt: '2026-03-17T09:15:00Z',
    isOwnReview: false
  }
];

// Helper function to add mock rating to group data
export const addMockRatingToGroup = (group) => {
  return {
    ...group,
    rating: mockGroupRating
  };
};

// Helper function to add mock rating to event's group
export const addMockRatingToEvent = (event) => {
  return {
    ...event,
    group: {
      ...event.group,
      rating: mockGroupRating
    }
  };
};

// Mock event data for EventReviewsPage
export const mockEventForReviews = {
  id: 1,
  title: 'Peak District Sunrise Hike',
  eventDate: '2024-03-15T06:00:00Z',
  location: 'Mam Tor, Peak District',
  groupId: 1,
  groupName: 'Peak District Hikers',
  group: {
    id: 1,
    name: 'Peak District Hikers'
  }
};
