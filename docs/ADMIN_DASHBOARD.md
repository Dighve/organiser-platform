# Admin Dashboard - OutMeets Platform

## Overview

The Admin Dashboard provides comprehensive analytics and user management capabilities for platform administrators. It displays real-time statistics, user growth trends, and detailed user activity metrics.

## Features

### 📊 Dashboard Metrics

**Key Statistics Cards:**
- **Total Users**: Overall platform user count with monthly growth
- **New Today**: Users who joined today with weekly comparison
- **Total Events**: All events created on the platform
- **Total Groups**: Active groups count
- **Organisers**: Number of users creating events
- **Active Users**: Users active in the last 30 days

### 📈 Data Visualizations

**1. Daily Signups Chart (Line Chart)**
- Shows user signup trends over the last 30 days
- Interactive tooltips with exact counts
- Beautiful purple-pink-orange gradient styling
- Helps identify growth patterns and spikes

**2. Platform Overview Chart (Bar Chart)**
- Compares total users, events, groups, and organisers
- Quick visual comparison of platform metrics
- Purple-pink gradient bars

### 👥 Recent Users Table

Displays the 20 most recent user signups with:
- User profile photo and name
- Email address
- Join date
- Role (Member/Organiser)
- Activity metrics:
  - 🏔️ Groups Joined
  - 📅 Events Joined
  - 🎯 Groups Created (organisers only)
  - ✨ Events Created (organisers only)

## Backend Implementation

### Database Schema

**Migration: V12__Add_is_admin_to_members.sql**
```sql
ALTER TABLE members ADD COLUMN is_admin BOOLEAN DEFAULT FALSE NOT NULL;
CREATE INDEX idx_member_is_admin ON members(is_admin) WHERE is_admin = TRUE;
```

### DTOs

**UserStatsDTO.java**
```java
{
  totalUsers: Long,
  newUsersToday: Long,
  newUsersThisWeek: Long,
  newUsersThisMonth: Long,
  activeUsers: Long,
  totalEvents: Long,
  totalGroups: Long,
  totalOrganisers: Long,
  dailySignups: List<DailySignupDTO>,
  magicLinkUsers: Long,
  googleOAuthUsers: Long
}
```

**DailySignupDTO.java**
```java
{
  date: String,  // Format: "2025-12-15"
  count: Long
}
```

**RecentUserDTO.java**
```java
{
  id: Long,
  email: String,
  displayName: String,
  profilePhotoUrl: String,
  isOrganiser: Boolean,
  verified: Boolean,
  active: Boolean,
  createdAt: LocalDateTime,
  authMethod: String,
  groupsJoined: Long,
  eventsJoined: Long,
  groupsCreated: Long,
  eventsCreated: Long
}
```

### API Endpoints

**AdminController.java**

All endpoints require admin role (`@PreAuthorize("hasRole('ADMIN')")`):

1. **GET /api/v1/admin/stats/users**
   - Returns comprehensive user statistics
   - Response: `UserStatsDTO`

2. **GET /api/v1/admin/users/recent?limit=50**
   - Returns recent user signups with activity metrics
   - Query param: `limit` (default: 50)
   - Response: `List<RecentUserDTO>`

3. **GET /api/v1/admin/check**
   - Checks if current user is admin
   - Response: `Boolean`

### Security

**SecurityConfig.java** (Line 110):
```java
.requestMatchers(new AntPathRequestMatcher("/api/v1/admin/**")).hasRole("ADMIN")
```

- All `/api/v1/admin/**` endpoints require `ADMIN` role
- Double authorization check in controller methods
- Returns 403 Forbidden for non-admin users

### Repository Queries

**MemberRepository.java**
```java
@Query("SELECT COUNT(m) FROM Member m WHERE m.createdAt >= :startDate")
Long countNewUsersSince(@Param("startDate") LocalDateTime startDate);

@Query("SELECT COUNT(m) FROM Member m WHERE m.isOrganiser = true")
Long countOrganisers();

@Query("SELECT m FROM Member m ORDER BY m.createdAt DESC")
Page<Member> findRecentUsers(Pageable pageable);

@Query("SELECT DATE(m.createdAt) as date, COUNT(m) as count " +
       "FROM Member m WHERE m.createdAt >= :startDate " +
       "GROUP BY DATE(m.createdAt) ORDER BY DATE(m.createdAt)")
List<Object[]> getDailySignupStats(@Param("startDate") LocalDateTime startDate);
```

**GroupRepository.java**
```java
Long countByPrimaryOrganiserId(Long organiserId);
```

**EventRepository.java**
```java
@Query("SELECT COUNT(e) FROM Event e WHERE e.group.primaryOrganiser.id = :organiserId")
Long countByOrganiserId(@Param("organiserId") Long organiserId);
```

**SubscriptionRepository.java**
```java
Long countByMemberId(Long memberId);
```

**EventParticipantRepository.java**
```java
Long countByMemberId(Long memberId);
```

## Frontend Implementation

### Components

**AdminDashboardPage.jsx**
- Main dashboard component
- Uses React Query for data fetching
- Recharts for data visualization
- Responsive grid layout

### Dependencies

```json
{
  "recharts": "^2.x.x",
  "date-fns": "^2.x.x",
  "@tanstack/react-query": "^4.x.x",
  "lucide-react": "^0.x.x"
}
```

### API Integration

**api.js**
```javascript
export const adminAPI = {
  getUserStats: () => api.get('/admin/stats/users'),
  getRecentUsers: (limit = 50) => api.get('/admin/users/recent', { params: { limit } }),
  checkAdminStatus: () => api.get('/admin/check'),
}
```

### Routing

**App.jsx**
```javascript
<Route
  path="admin"
  element={
    <PrivateRoute>
      <Suspense fallback={<PageLoader />}>
        <AdminDashboardPage />
      </Suspense>
    </PrivateRoute>
  }
/>
```

### Navigation

**Layout.jsx**
- Admin dashboard link appears in user dropdown menu
- Only visible to admin users
- Purple shield icon for visual distinction
- Checks `isAdmin` status from API

## Design System

### Color Palette

**Stat Card Gradients:**
- Total Users: `from-purple-500 to-pink-500`
- New Today: `from-pink-500 to-orange-500`
- Total Events: `from-orange-500 to-amber-500`
- Total Groups: `from-emerald-500 to-teal-500`
- Organisers: `from-blue-500 to-indigo-500`
- Active Users: `from-indigo-500 to-purple-500`

**Chart Colors:**
- Line Chart: Purple → Pink → Orange gradient
- Bar Chart: Purple → Pink gradient

**Background:**
- Page: `from-purple-50 via-pink-50 to-orange-50`

### Typography

- Page Title: 4xl, gradient text
- Section Headers: xl, bold
- Stat Values: 3xl, bold
- Table Headers: xs, uppercase, medium
- Body Text: sm/base

## Access Control

### Setting Admin Users

**Option 1: Database Update (Recommended for first admin)**
```sql
UPDATE members SET is_admin = TRUE WHERE email = 'admin@outmeets.com';
```

**Option 2: Migration Script**
Uncomment line in `V12__Add_is_admin_to_members.sql`:
```sql
UPDATE members SET is_admin = TRUE WHERE email = 'admin@outmeets.com';
```

### Admin Privileges

Admins can:
- ✅ View all user statistics
- ✅ Monitor platform growth
- ✅ See recent user signups
- ✅ Track user activity metrics
- ✅ Access daily signup trends

Admins cannot (future features):
- ❌ Delete users
- ❌ Modify user data
- ❌ Ban users
- ❌ Send notifications
- ❌ Manage content

## Performance Considerations

### Caching Strategy

- User stats cached for 5 minutes
- Recent users cached for 2 minutes
- Admin status cached for 10 minutes

### Query Optimization

- Indexed `is_admin` column for fast lookups
- Partial index (WHERE is_admin = TRUE) for efficiency
- Paginated recent users query
- Aggregated daily signup stats

### Frontend Optimization

- Lazy-loaded admin page
- React Query automatic caching
- Suspense loading states
- Responsive charts with ResponsiveContainer

## Testing

### Manual Testing Checklist

**Access Control:**
- [ ] Non-admin users cannot access `/admin`
- [ ] Admin link only shows for admin users
- [ ] API returns 403 for non-admin requests

**Data Display:**
- [ ] All stat cards show correct values
- [ ] Daily signups chart renders properly
- [ ] Platform overview chart displays correctly
- [ ] Recent users table shows accurate data

**Responsive Design:**
- [ ] Dashboard works on mobile (320px+)
- [ ] Charts resize properly
- [ ] Table scrolls horizontally on small screens
- [ ] Stat cards stack correctly

**Loading States:**
- [ ] Loading spinner shows while fetching data
- [ ] Error state displays for failed requests
- [ ] Access denied message for non-admins

### API Testing

**Get User Stats:**
```bash
curl -H "Authorization: Bearer <admin-token>" \
  http://localhost:8080/api/v1/admin/stats/users
```

**Get Recent Users:**
```bash
curl -H "Authorization: Bearer <admin-token>" \
  http://localhost:8080/api/v1/admin/users/recent?limit=20
```

**Check Admin Status:**
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/v1/admin/check
```

## Future Enhancements

### Phase 2 Features

1. **User Management**
   - Ban/unban users
   - Delete accounts
   - Reset passwords
   - Verify emails manually

2. **Content Moderation**
   - Review flagged events
   - Approve/reject groups
   - Moderate comments
   - Handle reports

3. **Advanced Analytics**
   - Retention metrics
   - Engagement rates
   - Geographic distribution
   - Device/browser stats

4. **Communication Tools**
   - Send platform announcements
   - Email newsletters
   - Push notifications
   - In-app messages

5. **Export Capabilities**
   - CSV export of user data
   - PDF reports
   - Analytics dashboards
   - Scheduled reports

### Phase 3 Features

1. **Role Management**
   - Create custom roles
   - Assign permissions
   - Role-based access control
   - Audit logs

2. **System Health**
   - Server metrics
   - Database performance
   - API response times
   - Error tracking

3. **Financial Metrics**
   - Revenue tracking
   - Payment analytics
   - Subscription metrics
   - Refund management

## Troubleshooting

### Common Issues

**Issue: Admin link not showing**
- Check if user has `is_admin = TRUE` in database
- Verify JWT token is valid
- Check browser console for API errors

**Issue: 403 Forbidden error**
- Ensure user is logged in
- Verify `is_admin` field is set
- Check SecurityConfig has admin endpoints configured

**Issue: Charts not rendering**
- Verify Recharts is installed: `npm list recharts`
- Check browser console for errors
- Ensure data format matches chart expectations

**Issue: Slow dashboard loading**
- Check database query performance
- Verify indexes are created
- Consider adding caching layer
- Optimize daily signup query

## Deployment Notes

### Environment Variables

No additional environment variables required.

### Database Migration

Run Flyway migration:
```bash
./gradlew flywayMigrate
```

Or manually apply:
```sql
-- See: V12__Add_is_admin_to_members.sql
```

### Build & Deploy

**Backend:**
```bash
cd backend
./gradlew clean build
```

**Frontend:**
```bash
cd frontend
npm install
npm run build
```

### Post-Deployment

1. Set first admin user in database
2. Test admin login and dashboard access
3. Verify all metrics display correctly
4. Check chart rendering on production

## Support

For issues or questions:
- Check this documentation
- Review code comments in AdminController.java
- Test API endpoints with curl/Postman
- Check browser console for frontend errors

---

**Status**: ✅ Complete and ready for production
**Version**: 1.0.0
**Last Updated**: December 15, 2025
