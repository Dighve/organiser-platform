# Event Review System - Implementation Guide

## Overview

Complete event review and rating system for OutMeets platform with weighted multi-dimensional ratings displayed on event cards, group cards, and group detail pages.

## Rating Display Locations

### 1. Event Cards (HomePage, EventsPage)
- **Location**: Below group name
- **Format**: `⭐ 4.8 (127 reviews)`
- **Shows**: Group's average rating and total review count
- **Minimum**: Only display if group has ≥3 reviews

### 2. Group Card in EventDetailPage (Sidebar)
- **Location**: In "Hosted by" section
- **Format**: `⭐ 4.8 (127 reviews)`
- **Shows**: Group's average rating and total review count

### 3. GroupDetailPage Rating Card

**Desktop (Left Sidebar):**
- Large rating display with star visualization
- Category breakdown with progress bars
- Recommendation percentage
- Position: Above "About" section

**Mobile (Below banner, above tabs):**
- Compact horizontal layout
- Key metrics: Overall rating, top categories
- Recommendation percentage
- Position: Between banner and tab navigation

---

## Database Schema

### Tables Created (V19 Migration)

#### `event_reviews`
Stores individual reviews from event attendees.

| Column | Type | Description |
|--------|------|-------------|
| id | BIGSERIAL | Primary key |
| event_id | BIGINT | FK to events |
| member_id | BIGINT | FK to members (reviewer) |
| group_id | BIGINT | FK to groups |
| organization_rating | SMALLINT | 1-5 rating for organization |
| route_rating | SMALLINT | 1-5 rating for route quality |
| group_rating | SMALLINT | 1-5 rating for group atmosphere |
| safety_rating | SMALLINT | 1-5 rating for safety |
| value_rating | SMALLINT | 1-5 rating for value |
| overall_rating | DECIMAL(3,2) | Weighted average (auto-calculated) |
| comment | TEXT | Optional text feedback |
| would_recommend | BOOLEAN | Recommendation flag |
| would_join_again | BOOLEAN | Would join again flag |
| photo_urls | TEXT[] | Array of Cloudinary URLs |
| created_at | TIMESTAMP | Review creation time |
| updated_at | TIMESTAMP | Last update time |
| is_verified_attendee | BOOLEAN | Verification flag |
| is_flagged | BOOLEAN | Moderation flag |

**Constraints:**
- UNIQUE(event_id, member_id) - One review per attendee per event
- All ratings CHECK (rating BETWEEN 1 AND 5)

**Indexes:**
- idx_event_reviews_event (event_id)
- idx_event_reviews_group (group_id)
- idx_event_reviews_member (member_id)
- idx_event_reviews_rating (overall_rating DESC)
- idx_event_reviews_created (created_at DESC)

#### `group_rating_summary`
Aggregated ratings per group for fast display.

| Column | Type | Description |
|--------|------|-------------|
| group_id | BIGINT | Primary key, FK to groups |
| average_rating | DECIMAL(3,2) | Overall average rating |
| total_reviews | INTEGER | Total number of reviews |
| organization_avg | DECIMAL(3,2) | Average organization rating |
| route_avg | DECIMAL(3,2) | Average route rating |
| group_avg | DECIMAL(3,2) | Average group rating |
| safety_avg | DECIMAL(3,2) | Average safety rating |
| value_avg | DECIMAL(3,2) | Average value rating |
| recommendation_count | INTEGER | Number of recommendations |
| recommendation_percentage | DECIMAL(5,2) | % who recommend |
| last_updated | TIMESTAMP | Last update time |

**Automatic Updates:**
- Trigger `trigger_update_group_rating_summary` updates this table after any review INSERT/UPDATE/DELETE
- No manual updates needed - always in sync

---

## Weighted Rating Formula

```
Overall Rating = (organization × 0.25) + 
                 (route × 0.20) + 
                 (group × 0.20) + 
                 (safety × 0.20) + 
                 (value × 0.15)
```

**Rationale:**
- **Organization (25%)**: Most important - affects entire experience
- **Route Quality (20%)**: Core activity quality
- **Group Atmosphere (20%)**: Social experience
- **Safety (20%)**: Critical for outdoor activities
- **Value (15%)**: Least weighted - subjective

**Example:**
```
Organization: 5 stars × 0.25 = 1.25
Route: 4 stars × 0.20 = 0.80
Group: 5 stars × 0.20 = 1.00
Safety: 5 stars × 0.20 = 1.00
Value: 4 stars × 0.15 = 0.60
─────────────────────────────
Overall Rating = 4.65 ⭐
```

---

## Database Functions & Triggers

### `calculate_overall_rating()`
PostgreSQL function that calculates weighted average.

```sql
CREATE OR REPLACE FUNCTION calculate_overall_rating(
    org_rating SMALLINT,
    route_rating SMALLINT,
    grp_rating SMALLINT,
    safe_rating SMALLINT,
    val_rating SMALLINT
) RETURNS DECIMAL(3,2)
```

### `set_overall_rating()`
Trigger function that auto-calculates overall_rating before INSERT/UPDATE.

### `update_group_rating_summary()`
Trigger function that recalculates group summary after review changes.

**Recalculates:**
- Average rating across all categories
- Total review count
- Recommendation percentage
- Last updated timestamp

---

## Review Submission Flow

### Eligibility Requirements
1. Must have attended the event (EventParticipant record exists)
2. Event must be completed (eventDate + duration < now)
3. Can only review once per event
4. Review window: 24 hours - 30 days after event

### Review Prompt Triggers
1. **Automatic notification** 24 hours after event ends
2. **Manual access** via "Write a Review" button on past events
3. **Pending reviews** section on user profile

### Review Form Fields

**Required:**
- Organization rating (1-5 stars)
- Route quality rating (1-5 stars)
- Group atmosphere rating (1-5 stars)
- Safety rating (1-5 stars)
- Value rating (1-5 stars)

**Optional:**
- Comment (max 1000 characters)
- Photos (up to 5, via Cloudinary)
- Would recommend checkbox
- Would join again checkbox

---

## Frontend Components

### Event Card Rating Display
```jsx
{group.rating && group.rating.totalReviews >= 3 && (
  <div className="flex items-center gap-2 mt-2">
    <div className="flex items-center gap-1">
      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
      <span className="font-semibold">{group.rating.averageRating.toFixed(1)}</span>
    </div>
    <span className="text-sm text-gray-600">
      ({group.rating.totalReviews} {group.rating.totalReviews === 1 ? 'review' : 'reviews'})
    </span>
  </div>
)}
```

### Group Card in EventDetailPage
```jsx
<div className="bg-white rounded-xl p-6 shadow-lg">
  <h3 className="text-lg font-semibold mb-2">🏔️ Hosted by</h3>
  <p className="text-xl font-bold text-purple-600">{group.name}</p>
  
  {group.rating && group.rating.totalReviews >= 3 && (
    <div className="flex items-center gap-2 mt-2">
      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
      <span className="font-bold text-lg">{group.rating.averageRating.toFixed(1)}</span>
      <span className="text-gray-600">({group.rating.totalReviews} reviews)</span>
    </div>
  )}
</div>
```

### GroupDetailPage Rating Card (Desktop)
```jsx
<div className="bg-white rounded-xl p-6 shadow-lg">
  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
    <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
    Group Rating
  </h3>
  
  <div className="text-center mb-6">
    <div className="text-6xl font-bold text-purple-600 mb-2">
      {group.rating.averageRating.toFixed(1)}
    </div>
    <div className="flex justify-center gap-1 mb-2">
      {[1,2,3,4,5].map(star => (
        <Star key={star} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
      ))}
    </div>
    <p className="text-gray-600">Based on {group.rating.totalReviews} reviews</p>
  </div>
  
  <div className="space-y-3 mb-6">
    <RatingBar label="Organization" value={group.rating.organizationAvg} />
    <RatingBar label="Route Quality" value={group.rating.routeAvg} />
    <RatingBar label="Group Atmosphere" value={group.rating.groupAvg} />
    <RatingBar label="Safety" value={group.rating.safetyAvg} />
    <RatingBar label="Value" value={group.rating.valueAvg} />
  </div>
  
  <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
    <p className="text-lg font-semibold text-purple-600">
      {group.rating.recommendationPercentage.toFixed(0)}% recommend this group
    </p>
  </div>
</div>
```

### GroupDetailPage Rating Card (Mobile)
```jsx
<div className="bg-white rounded-xl p-4 shadow-lg mb-4">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
      <span className="text-2xl font-bold">{group.rating.averageRating.toFixed(1)}</span>
      <span className="text-gray-600">• {group.rating.totalReviews} reviews</span>
    </div>
  </div>
  <div className="flex gap-4 mt-2 text-sm">
    <span>Organization {group.rating.organizationAvg.toFixed(1)}</span>
    <span>Safety {group.rating.safetyAvg.toFixed(1)}</span>
  </div>
  <p className="text-sm text-purple-600 mt-2">
    {group.rating.recommendationPercentage.toFixed(0)}% would recommend
  </p>
</div>
```

---

## API Endpoints (To Be Implemented)

### Review Management
```
POST   /api/v1/events/{eventId}/reviews          - Submit review
GET    /api/v1/events/{eventId}/reviews          - Get event reviews
PUT    /api/v1/reviews/{reviewId}                - Update own review
DELETE /api/v1/reviews/{reviewId}                - Delete own review
GET    /api/v1/reviews/pending                   - Get pending reviews for user
```

### Rating Display
```
GET    /api/v1/groups/{groupId}/rating           - Get group rating summary
GET    /api/v1/groups/{groupId}/reviews          - Get group reviews (paginated)
```

### Photo Upload
```
POST   /api/v1/files/upload/review-photo         - Upload review photo
```

---

## Backend Implementation Checklist

- [x] Database migration V19 created
- [x] EventReview entity created
- [x] GroupRatingSummary entity created
- [ ] EventReviewRepository created
- [ ] GroupRatingSummaryRepository created
- [ ] ReviewService created
- [ ] ReviewController created
- [ ] DTOs created (ReviewDTO, CreateReviewRequest, etc.)
- [ ] Authorization checks (only attendees can review)
- [ ] Review eligibility validation
- [ ] Photo upload integration

---

## Frontend Implementation Checklist

### Components
- [ ] RatingStars component (interactive 5-star selector)
- [ ] RatingBar component (progress bar for category ratings)
- [ ] ReviewCard component (individual review display)
- [ ] ReviewForm component (review submission form)
- [ ] GroupRatingCard component (desktop sidebar)
- [ ] GroupRatingCardMobile component (mobile view)

### Pages
- [ ] ReviewSubmissionPage (/events/{id}/review)
- [ ] Update EventCard to show group rating
- [ ] Update EventDetailPage group card to show rating
- [ ] Update GroupDetailPage with rating card

### API Integration
- [ ] reviewsAPI in lib/api.js
- [ ] React Query hooks for reviews
- [ ] Cache invalidation strategy

---

## Design Specifications

### Colors
- **Star color**: `fill-yellow-400 text-yellow-400`
- **Rating text**: `text-purple-600` (high ratings), `text-orange-500` (medium), `text-gray-500` (low)
- **Progress bars**: Gradient from purple to pink
- **Cards**: White background with shadow-lg

### Typography
- **Large rating number**: `text-6xl font-bold` (desktop), `text-2xl font-bold` (mobile)
- **Category labels**: `text-base font-semibold`
- **Review count**: `text-sm text-gray-600`

### Spacing
- **Card padding**: `p-6` (desktop), `p-4` (mobile)
- **Section gaps**: `space-y-4` or `space-y-6`
- **Minimum reviews**: 3 (before displaying rating)

---

## Performance Considerations

### Database Optimization
- Indexes on frequently queried columns (group_id, event_id, rating)
- Materialized summary table (group_rating_summary) for fast lookups
- Automatic trigger updates (no manual recalculation needed)

### Frontend Optimization
- React Query caching (5 minutes staleTime for ratings)
- Lazy loading of review lists (paginated)
- Conditional rendering (only show if ≥3 reviews)

### Caching Strategy
```javascript
// Group rating summary - cache for 5 minutes
useQuery(['groupRating', groupId], () => getGroupRating(groupId), {
  staleTime: 5 * 60 * 1000,
  cacheTime: 10 * 60 * 1000
});

// Event reviews - cache for 2 minutes
useQuery(['eventReviews', eventId], () => getEventReviews(eventId), {
  staleTime: 2 * 60 * 1000
});
```

---

## Security & Validation

### Backend Validation
- User must be authenticated (JWT required)
- User must have attended event (EventParticipant check)
- Event must be completed (date validation)
- One review per user per event (unique constraint)
- All ratings must be 1-5 (CHECK constraint)
- Comment max length: 1000 characters
- Photo limit: 5 photos per review

### Authorization
- Users can only create/edit/delete their own reviews
- Admins can flag inappropriate reviews
- Group organisers can respond to reviews (future feature)

---

## Testing Checklist

### Database
- [ ] Migration runs successfully
- [ ] Triggers calculate ratings correctly
- [ ] Constraints prevent invalid data
- [ ] Indexes improve query performance

### Backend
- [ ] Review submission works
- [ ] Rating calculation is accurate
- [ ] Authorization prevents unauthorized access
- [ ] Validation rejects invalid data

### Frontend
- [ ] Ratings display on event cards
- [ ] Ratings display on group card in event page
- [ ] Rating card displays on group detail page (desktop)
- [ ] Rating card displays on group detail page (mobile)
- [ ] Review form validates input
- [ ] Photo upload works

---

## Future Enhancements

### Phase 2
- [ ] Organiser responses to reviews
- [ ] Review moderation dashboard (admin)
- [ ] Review sorting (most recent, highest rated, lowest rated)
- [ ] Review filtering (by rating, by date)
- [ ] Helpful/unhelpful voting on reviews

### Phase 3
- [ ] AI-powered review insights
- [ ] Sentiment analysis on comments
- [ ] Trending groups by rating
- [ ] Review rewards/badges
- [ ] Email digest of new reviews for organisers

---

## Deployment Notes

1. **Run migration**: V19 will create tables, functions, and triggers
2. **Backend restart**: Required for new entities and endpoints
3. **Frontend build**: Deploy updated components
4. **Monitor performance**: Check query times on group_rating_summary
5. **Seed data**: Consider adding sample reviews for testing

---

## Support & Documentation

- **Database schema**: See V19__create_event_reviews_table.sql
- **Entity models**: EventReview.java, GroupRatingSummary.java
- **API docs**: (To be created with Swagger/OpenAPI)
- **Component library**: (To be documented in Storybook)

---

**Status**: Database schema complete, backend entities created, frontend implementation pending.

**Next Steps**: 
1. Create repositories and services
2. Implement API endpoints
3. Build frontend components
4. Test end-to-end flow
