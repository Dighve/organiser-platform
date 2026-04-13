# Review UI Testing Guide

Complete guide for testing the review and rating system locally.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Testing Scenarios](#testing-scenarios)
4. [Mock Data Testing](#mock-data-testing)
5. [Component Testing](#component-testing)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Backend Requirements
- ✅ Java 17+ installed
- ✅ PostgreSQL database running
- ✅ Review tables created (V43 migration)
- ✅ Backend API endpoints implemented

### Frontend Requirements
- ✅ Node.js 18+ installed
- ✅ Dependencies installed (`npm install`)
- ✅ Environment variables configured

---

## Quick Start

### 1. Start the Backend

```bash
cd backend
./gradlew bootRun
```

**Expected output:**
```
Started OrganiserPlatformApplication in X.XXX seconds
Server running on http://localhost:8080
```

### 2. Start the Frontend

```bash
cd frontend
npm run dev
```

**Expected output:**
```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 3. Open Browser

Navigate to: `http://localhost:5173`

---

## Testing Scenarios

### Scenario 1: View Group Ratings on Event Cards

**Steps:**
1. Go to home page or events page
2. Look at event cards in the grid

**Expected Result:**
- Event cards show group rating if available
- Display: ⭐ 4.5 (12 reviews)
- Only shows if group has ≥3 reviews

**Screenshot Location:**
```
Desktop: Below location, above participants count
Mobile: Same position, smaller font
```

---

### Scenario 2: View Group Rating on Event Detail Page

**Steps:**
1. Click on any event card
2. Scroll to the group card section (below event banner)

**Expected Result:**
- Group card shows rating below group name
- Display: ⭐ 4.5 (12 reviews)
- Only visible if group has ≥3 reviews

---

### Scenario 3: View Group Rating Cards on Group Detail Page

**Steps:**
1. Navigate to `/groups/{groupId}`
2. Go to "About" tab

**Expected Result:**

**Desktop (Sidebar):**
- Large rating card in right sidebar
- Shows overall rating (large number)
- Category breakdown with progress bars
- Recommendation percentage
- Only visible if ≥3 reviews

**Mobile (Below Banner):**
- Compact rating card below group banner
- Shows overall rating + review count
- Key categories (Organization, Safety)
- Recommendation percentage
- Only visible if ≥3 reviews

---

### Scenario 4: Submit a Review

**Prerequisites:**
- Must be authenticated
- Must have joined the event
- Event must be in the past

**Steps:**

1. **Navigate to review page:**
   ```
   http://localhost:5173/events/{eventId}/review
   ```

2. **Fill out the form:**
   - Rate Organization (1-5 stars) ⭐
   - Rate Route Quality (1-5 stars) ⭐
   - Rate Group Atmosphere (1-5 stars) ⭐
   - Rate Safety (1-5 stars) ⭐
   - Rate Value (1-5 stars) ⭐
   - Add comment (optional, max 1000 chars)
   - Check "Would recommend" (optional)
   - Check "Would join again" (optional)

3. **Submit:**
   - Click "Submit Review" button

**Expected Result:**
- Form validates all ratings are provided
- Shows loading state during submission
- Success message appears: "Thank You! Your review has been submitted successfully."
- Redirects to event page after 3 seconds
- Review appears on event/group pages

**Validation Tests:**
- Try submitting without all ratings → Error: "Please fill in all required fields"
- Try comment >1000 chars → Error: "Comment must be 1000 characters or less"
- Cancel button → Returns to event page without saving

---

### Scenario 5: View Reviews on Event Page

**Steps:**
1. Navigate to event detail page
2. Scroll to reviews section (if implemented)

**Expected Result:**
- List of ReviewCard components
- Each shows:
  - Reviewer name and avatar
  - Overall rating
  - Category ratings (expandable)
  - Comment text
  - Recommendation badges
  - Timestamp ("X days ago")
  - Edit/Delete buttons (if own review)

---

## Mock Data Testing

If backend endpoints aren't ready, use mock data:

### Option 1: Browser Console Testing

Open browser console and paste:

```javascript
// Test GroupRatingCard component
const mockRating = {
  averageRating: 4.5,
  totalReviews: 12,
  categoryAverages: {
    organization: 4.7,
    route: 4.3,
    groupAtmosphere: 4.6,
    safety: 4.8,
    value: 4.2
  },
  recommendationPercentage: 92
};

// Inject into React DevTools
```

### Option 2: Temporary Code Modification

**In GroupDetailPage.jsx:**

```javascript
// Add at the top of the component
import { mockGroupRating } from '../mocks/reviewMockData';

// Temporarily override the rating
const displayRating = group?.rating || mockGroupRating;

// Use displayRating instead of group?.rating
<GroupRatingCard rating={displayRating} />
```

**In EventCard.jsx:**

```javascript
import { mockGroupRating } from '../mocks/reviewMockData';

// In the component
const displayRating = event.group?.rating || mockGroupRating;

// Use in the rating display
{displayRating && displayRating.totalReviews >= 3 && (
  // ... rating display code
)}
```

---

## Component Testing

### Test Individual Components

Create a test page to view components in isolation:

**Create: `frontend/src/pages/ReviewTestPage.jsx`**

```javascript
import React from 'react';
import RatingStars from '../components/RatingStars';
import RatingBar from '../components/RatingBar';
import ReviewCard from '../components/ReviewCard';
import GroupRatingCard from '../components/GroupRatingCard';
import GroupRatingCardMobile from '../components/GroupRatingCardMobile';
import ReviewForm from '../components/ReviewForm';
import { mockGroupRating, mockEventReviews } from '../mocks/reviewMockData';

const ReviewTestPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* RatingStars */}
        <section>
          <h2 className="text-2xl font-bold mb-4">RatingStars Component</h2>
          <div className="bg-white p-6 rounded-xl space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">Display mode (4.5 stars):</p>
              <RatingStars rating={4.5} />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Interactive mode:</p>
              <RatingStars rating={0} interactive={true} onChange={(val) => console.log(val)} />
            </div>
          </div>
        </section>

        {/* RatingBar */}
        <section>
          <h2 className="text-2xl font-bold mb-4">RatingBar Component</h2>
          <div className="bg-white p-6 rounded-xl space-y-3">
            <RatingBar label="Organization" value={4.7} />
            <RatingBar label="Route Quality" value={4.3} />
            <RatingBar label="Group Atmosphere" value={4.6} />
            <RatingBar label="Safety" value={4.8} />
            <RatingBar label="Value" value={4.2} />
          </div>
        </section>

        {/* GroupRatingCard */}
        <section>
          <h2 className="text-2xl font-bold mb-4">GroupRatingCard (Desktop)</h2>
          <div className="max-w-md">
            <GroupRatingCard rating={mockGroupRating} />
          </div>
        </section>

        {/* GroupRatingCardMobile */}
        <section>
          <h2 className="text-2xl font-bold mb-4">GroupRatingCardMobile</h2>
          <div className="max-w-md">
            <GroupRatingCardMobile rating={mockGroupRating} />
          </div>
        </section>

        {/* ReviewCard */}
        <section>
          <h2 className="text-2xl font-bold mb-4">ReviewCard Component</h2>
          <div className="space-y-4">
            {mockEventReviews.map(review => (
              <ReviewCard
                key={review.id}
                review={review}
                onEdit={() => console.log('Edit', review.id)}
                onDelete={() => console.log('Delete', review.id)}
                onFlag={() => console.log('Flag', review.id)}
              />
            ))}
          </div>
        </section>

        {/* ReviewForm */}
        <section>
          <h2 className="text-2xl font-bold mb-4">ReviewForm Component</h2>
          <div className="bg-white p-8 rounded-xl">
            <ReviewForm
              eventId="123"
              groupId="456"
              onSubmit={(data) => console.log('Submit:', data)}
              onCancel={() => console.log('Cancel')}
            />
          </div>
        </section>

      </div>
    </div>
  );
};

export default ReviewTestPage;
```

**Add route in App.jsx:**

```javascript
<Route path="test/reviews" element={<ReviewTestPage />} />
```

**Navigate to:**
```
http://localhost:5173/test/reviews
```

---

## Troubleshooting

### Issue: Rating cards not showing

**Possible causes:**
1. Group has <3 reviews
2. Rating data not in API response
3. Component not imported correctly

**Solution:**
- Check browser console for errors
- Verify API response includes `rating` object
- Use React DevTools to inspect props

---

### Issue: Review form validation errors

**Possible causes:**
1. Not all ratings selected
2. Comment too long (>1000 chars)

**Solution:**
- Ensure all 5 star ratings are clicked
- Check character count below comment field

---

### Issue: "Cannot read property 'rating' of undefined"

**Possible causes:**
1. Group data not loaded yet
2. Event doesn't have group association

**Solution:**
- Add optional chaining: `group?.rating`
- Check loading states
- Verify event has `group` object in API response

---

### Issue: Review submission fails

**Possible causes:**
1. Not authenticated
2. Haven't joined the event
3. Event not in the past
4. Backend endpoint not implemented

**Solution:**
- Check authentication status
- Verify event participation
- Check event date
- Verify backend endpoint exists

---

## API Endpoints Required

For full functionality, ensure these endpoints are implemented:

### Reviews
- `POST /api/v1/events/{eventId}/reviews` - Submit review
- `GET /api/v1/events/{eventId}/reviews` - Get event reviews
- `GET /api/v1/groups/{groupId}/reviews` - Get group reviews
- `GET /api/v1/groups/{groupId}/rating` - Get group rating summary
- `PUT /api/v1/reviews/{reviewId}` - Update review
- `DELETE /api/v1/reviews/{reviewId}` - Delete review
- `GET /api/v1/reviews/pending` - Get pending reviews
- `POST /api/v1/reviews/{reviewId}/flag` - Flag review

### Expected Response Formats

**Group Rating Summary:**
```json
{
  "averageRating": 4.5,
  "totalReviews": 12,
  "categoryAverages": {
    "organization": 4.7,
    "route": 4.3,
    "groupAtmosphere": 4.6,
    "safety": 4.8,
    "value": 4.2
  },
  "recommendationPercentage": 92
}
```

**Review Submission:**
```json
{
  "organizationRating": 5,
  "routeRating": 4,
  "groupRating": 5,
  "safetyRating": 5,
  "valueRating": 4,
  "comment": "Great experience!",
  "wouldRecommend": true,
  "wouldJoinAgain": true
}
```

---

## Testing Checklist

- [ ] Backend running on port 8080
- [ ] Frontend running on port 5173
- [ ] Database migrations applied
- [ ] Can view event cards with ratings
- [ ] Can view group rating on event detail page
- [ ] Can view group rating cards on group detail page (desktop)
- [ ] Can view group rating cards on group detail page (mobile)
- [ ] Can access review submission page
- [ ] Can submit a review with all fields
- [ ] Form validation works correctly
- [ ] Success message appears after submission
- [ ] Ratings update after new review submitted
- [ ] Minimum 3 reviews rule enforced
- [ ] Mobile responsive design works
- [ ] No console errors

---

## Next Steps

Once local testing is complete:

1. **Integration Testing** - Test with real backend data
2. **User Acceptance Testing** - Get feedback from real users
3. **Performance Testing** - Test with large numbers of reviews
4. **Accessibility Testing** - Test with screen readers
5. **Cross-browser Testing** - Test on Chrome, Firefox, Safari
6. **Mobile Testing** - Test on actual mobile devices

---

## Support

If you encounter issues:

1. Check browser console for errors
2. Check network tab for failed API calls
3. Verify backend logs
4. Use React DevTools to inspect component state
5. Review the implementation documentation

**Documentation:**
- `REVIEW_SYSTEM_IMPLEMENTATION.md` - Complete system specification
- `frontend/src/components/` - Component source code
- `frontend/src/lib/api.js` - API integration
