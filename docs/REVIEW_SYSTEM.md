# Review System

Attendees can rate events after they end. Ratings aggregate per group and surface on event cards, group pages, and the home page.

---

## User Flow

```
Event ends
    │
    ▼ (24h later)
Daily scheduler (10 AM UTC)
    ├── Push notification → "How was [Event]?"
    └── Email → "Share your experience"
                        │
                        ▼
            /events/:id/review  (ReviewSubmissionPage)
                        │
            ┌───────────┴────────────┐
            │  5 rating categories   │
            │  Optional comment      │
            │  Would recommend?      │
            │  Would join again?     │
            └───────────┬────────────┘
                        │
                        ▼
            Rating saved → group_rating_summary updated (DB trigger)
                        │
            ┌───────────┴──────────────────────────┐
            │  EventCard (home/discover)            │
            │  GroupRatingCard (group detail page)  │
            │  EventReviewsPage                     │
            │  GroupReviewsPage                     │
            └──────────────────────────────────────┘
```

---

## Eligibility Rules

Both client and server enforce the same rules. The frontend prevents ineligible users from seeing the form; the server validates again on every submission.

| Rule | Detail |
|---|---|
| Must have attended | Participant status must be `REGISTERED`, `CONFIRMED`, or `ATTENDED`. `CANCELLED` and `NO_SHOW` are excluded. |
| Event must have ended | Uses `EventTimingUtils.effectiveEnd()` — checks `endDate`, then `eventDate + estimatedDurationHours`, then midnight of start day. |
| Minimum wait | 24 hours after event end |
| Window closes | 30 days after event end |
| One review per event | Enforced by DB unique constraint `(event_id, member_id)` |
| Organiser excluded | Group's `primaryOrganiser` cannot review their own events |
| Host excluded | Event's `hostMember` cannot review events they hosted |

### Client-side eligibility states (`reviewEligibility.js`)

| Reason | Shown when |
|---|---|
| `NOT_ATTENDED` | User was not a participant |
| `NOT_YET_ENDED` | Event hasn't ended yet |
| `TOO_SOON` | Less than 24h since event ended — shows hours remaining |
| `WINDOW_EXPIRED` | More than 30 days since event ended |
| `ALREADY_REVIEWED` | User already submitted a review |
| `ELIGIBLE` | All checks pass — shows days remaining in window |

### Server error responses

| HTTP | Meaning |
|---|---|
| 403 | Not an attendee |
| 409 | Already reviewed |
| 410 | 30-day window closed |
| 422 | Event not ended / 24h wait not elapsed (message includes hours remaining) |

---

## Rating Categories

Every review scores 5 dimensions on a 1–5 scale:

| Category | What it measures |
|---|---|
| Organisation | How well the event was planned and communicated |
| Route Quality | Quality and suitability of the hiking route |
| Group Atmosphere | How welcoming and social the group was |
| Safety | How safely the event was conducted |
| Value | Value for the cost (time, money, effort) |

**Overall rating** is calculated by a DB trigger using a weighted formula:

```
overall = (organisation × 0.25) + (route × 0.20) + (atmosphere × 0.20)
        + (safety × 0.20) + (value × 0.15)
```

---

## Database Schema

### `event_reviews`

| Column | Type | Notes |
|---|---|---|
| `id` | BIGSERIAL | PK |
| `event_id` | BIGINT | FK → events, CASCADE |
| `member_id` | BIGINT | FK → members, CASCADE |
| `group_id` | BIGINT | FK → groups, CASCADE |
| `organization_rating` | SMALLINT | 1–5 CHECK |
| `route_rating` | SMALLINT | 1–5 CHECK |
| `group_rating` | SMALLINT | 1–5 CHECK |
| `safety_rating` | SMALLINT | 1–5 CHECK |
| `value_rating` | SMALLINT | 1–5 CHECK |
| `overall_rating` | DECIMAL(3,2) | Set by DB trigger |
| `comment` | TEXT | Optional |
| `would_recommend` | BOOLEAN | Default false |
| `would_join_again` | BOOLEAN | Default false |
| `is_verified_attendee` | BOOLEAN | Default true |
| `is_flagged` | BOOLEAN | Default false |
| `created_at` | TIMESTAMP | Auto-set |
| `updated_at` | TIMESTAMP | Auto-updated |

Unique constraint: `(event_id, member_id)`

### `group_rating_summary`

Denormalised aggregate table — updated automatically by DB trigger on every review insert/update/delete.

| Column | Type | Notes |
|---|---|---|
| `group_id` | BIGINT | PK, FK → groups |
| `average_rating` | DECIMAL(3,2) | Weighted overall average |
| `total_reviews` | INTEGER | Count of all reviews |
| `organization_avg` | DECIMAL(3,2) | |
| `route_avg` | DECIMAL(3,2) | |
| `group_avg` | DECIMAL(3,2) | |
| `safety_avg` | DECIMAL(3,2) | |
| `value_avg` | DECIMAL(3,2) | |
| `recommendation_count` | INTEGER | Count where `would_recommend = true` |
| `recommendation_percentage` | DECIMAL(5,2) | 0–100 |
| `last_updated` | TIMESTAMP | Auto-set |

### DB Triggers (V43 migration)

- `trigger_set_overall_rating` — calculates weighted `overall_rating` before INSERT/UPDATE on `event_reviews`
- `trigger_update_group_rating_summary` — recalculates all group aggregates after INSERT/UPDATE/DELETE on `event_reviews`

### `event_participants` (V44 migration)

Added `review_prompt_sent BOOLEAN DEFAULT FALSE` — prevents the daily scheduler from re-sending notifications.

---

## API Endpoints

Base: `/api/v1`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/reviews/pending` | Required | Events the user attended, within review window, not yet reviewed |
| `POST` | `/events/{eventId}/reviews` | Required | Submit a new review |
| `PUT` | `/reviews/{reviewId}` | Required | Update own review |
| `GET` | `/events/{eventId}/reviews` | Public | Paginated reviews for an event |
| `GET` | `/events/{eventId}/reviews/my-review` | Required | Current user's review for an event |
| `GET` | `/groups/{groupId}/reviews` | Public | Paginated reviews for a group |

### `GET /reviews/pending` response

```json
[
  {
    "eventId": 42,
    "eventTitle": "Snowdon Hike",
    "groupName": "London Hikers",
    "imageUrl": "https://...",
    "eventDate": "2026-04-01T09:00:00Z",
    "reviewWindowClosesAt": "2026-05-01T21:00:00Z"
  }
]
```

---

## Notification Channels

### Scheduler — `ReviewNotificationScheduler`

- **Schedule:** Daily at 10:00 AM UTC (`0 0 10 * * *`)
- **Window queried:** Events that started 1–31 days ago, refined in Java to 24h–30d after `effectiveEnd`
- **Deduplication:** `review_prompt_sent = true` set after sending — scheduler never re-notifies

**Eligible participants:**
- Status: `REGISTERED`, `CONFIRMED`, or `ATTENDED`
- Not the group's `primaryOrganiser`
- Not the event's `hostMember`
- No review already submitted

**Channels (both sent in same run):**

| Channel | Content | Condition |
|---|---|---|
| **Push notification** | "How was [Event]?" → links to `/events/:id/review` | Member has an active push subscription |
| **Email** | "How was [Event]? Share your experience" → ⭐ Write a Review button | `member.emailNotificationsEnabled = true` |

---

## Frontend

### Pages

| Page | Route | Description |
|---|---|---|
| `ReviewSubmissionPage` | `/events/:eventId/review` | Submit or edit a review |
| `EventReviewsPage` | `/events/:id/reviews` | All reviews for one event |
| `GroupReviewsPage` | `/groups/:id/reviews` | All reviews across a group's events |

### Components

| Component | Used in | Shows |
|---|---|---|
| `ReviewForm` | ReviewSubmissionPage | 5 star-rating inputs, comment, checkboxes |
| `RatingStars` | GroupRatingCard, ReviewCard | Read-only star display |
| `RatingBar` | GroupRatingCard | Horizontal bar per rating category |
| `ReviewCard` | EventReviewsPage, GroupReviewsPage | Individual review with all fields |
| `GroupRatingCard` | GroupDetailPage (desktop sidebar) | Summary: score, category bars, recommendation % |
| `GroupRatingCardMobile` | GroupDetailPage (mobile top-right) | Compact summary for mobile |

### Rating display surfaces

| Surface | Condition | What's shown |
|---|---|---|
| **EventCard** (home / discover) | `totalReviews >= 3` | ⭐ 4.5 · (23 reviews) |
| **GroupRatingCard** (group detail) | `totalReviews >= 3` | Large score, all category bars, recommendation % |
| **Home page pending card** | User has un-reviewed past events | List of events with "Review" button and days remaining; dismissible per event |

### Home page pending reviews card

Shows for authenticated users who have events awaiting review. Each row:
- Event title + group name + days remaining in window
- **Review** button → `/events/:id/review`
- **×** button → dismisses that event (stored in `localStorage` key `dismissed-review-prompts`)

The card disappears naturally when:
- All items are individually dismissed
- All events are reviewed (backend stops returning them)
- The 30-day window closes (backend filters them out)

---

## Key Design Decisions

**Why `group_rating_summary` instead of querying at runtime?**
Aggregating ratings across all reviews on every page load would be expensive. The DB trigger keeps the summary table always up-to-date with zero application-layer overhead.

**Why show ratings only at `totalReviews >= 3`?**
A single 5-star review from one person is misleading. Three reviews provides a meaningful signal and reduces gaming.

**Why both push and email?**
Push is instant and high-visibility but requires the app to be installed and permissions granted. Email reaches members who haven't installed the PWA or have push disabled.

**Why `review_prompt_sent` on `event_participants` instead of a separate table?**
Simpler schema — the eligibility and notification state live on the same row. The flag covers both push and email; one flag prevents both channels from re-firing.
