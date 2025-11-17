# Performance Optimization Guide for HikeHub

## Current Setup Analysis

### ✅ Already Implemented (Good!)
1. **Backend Caching**: Spring Cache with `@Cacheable` on EventService
2. **Frontend Caching**: React Query with 5-minute staleTime
3. **CDN Delivery**: Netlify provides global CDN for frontend
4. **Cloudinary CDN**: Images served via Cloudinary's global CDN

---

## 🌍 Making it Faster for London Users

### Problem
- Backend likely hosted in US (Railway/Render default regions)
- Database in US causes ~100-150ms latency for London users
- API calls from London → US → Database → London = ~200-300ms round trip

### Solutions (Ordered by Impact)

#### 1. **Deploy Backend Closer to London** ⭐⭐⭐⭐⭐
**Option A: Multi-Region Deployment (Best but $$$)**
```
Railway Pro Plan:
- Deploy replica in Europe (London or Frankfurt)
- Use geo-routing to send EU traffic to EU backend
- Cost: ~$20-30/month
```

**Option B: Single EU Region Deployment (Good compromise)**
```
Railway:
- Change deployment region to eu-west-1 (Ireland)
- Reduces latency for EU users from 150ms → 20ms
- US users go from 20ms → 150ms
- Cost: Same $13-15/month

Recommended if >50% of users are in Europe
```

#### 2. **Add Redis Caching Layer** ⭐⭐⭐⭐
```
Benefits:
- Cache API responses for 5-15 minutes
- Reduce database queries by 80-90%
- Store session data
- Cost: $3-5/month (Railway Redis)
```

**Implementation:**
```gradle
// build.gradle
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-data-redis'
    implementation 'org.springframework.boot:spring-boot-starter-cache'
}
```

```java
// application.properties
spring.cache.type=redis
spring.redis.host=${REDIS_HOST}
spring.redis.port=${REDIS_PORT}
spring.cache.redis.time-to-live=300000 # 5 minutes
```

#### 3. **HTTP Response Caching** ⭐⭐⭐⭐
Add cache headers to public endpoints:

```java
// EventController.java
@GetMapping
public ResponseEntity<Page<EventDTO>> getUpcomingEvents(
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "10") int size
) {
    Page<EventDTO> events = eventService.getUpcomingEvents(
        PageRequest.of(page, size, Sort.by("eventDate").ascending())
    );
    
    return ResponseEntity.ok()
        .cacheControl(CacheControl.maxAge(5, TimeUnit.MINUTES)
            .cachePublic())
        .body(events);
}
```

#### 4. **Database Optimization** ⭐⭐⭐
Add missing indexes:
```sql
-- Add indexes for common queries
CREATE INDEX idx_event_date ON events(event_date);
CREATE INDEX idx_event_group ON events(group_id);
CREATE INDEX idx_subscription_member ON subscriptions(member_id);
CREATE INDEX idx_subscription_group ON subscriptions(group_id);
```

#### 5. **CDN for API Responses** ⭐⭐
Use Cloudflare (free tier) in front of Railway:
- Caches GET requests globally
- Edge locations in London, US, Asia
- Free SSL, DDoS protection
- Setup time: 10 minutes

---

## 🚀 Caching Events for Faster Home Page Load

### Current State
✅ React Query caches for 5 minutes (staleTime)
✅ Backend has @Cacheable on getUpcomingEvents
❌ No HTTP caching headers
❌ No Redis for distributed cache
❌ Cache gets invalidated on every event update

### Optimization Strategy

#### 1. **Aggressive Frontend Caching** ⭐⭐⭐⭐⭐
```javascript
// src/pages/HomePage.jsx
const { data: allEventsData, isLoading: allEventsLoading } = useQuery({
  queryKey: ['allEvents'],
  queryFn: () => eventsAPI.getUpcomingEvents(0, 10),
  staleTime: 10 * 60 * 1000, // ⬆️ Increase to 10 minutes
  cacheTime: 30 * 60 * 1000, // ⬆️ Keep in cache for 30 minutes
  refetchOnMount: false,     // ⬆️ Don't refetch on component mount
  refetchOnWindowFocus: false, // Already set globally
})
```

**Impact**: First load still hits API, but navigation back to home is instant

#### 2. **Pre-fetch Events Data** ⭐⭐⭐⭐
```javascript
// src/App.jsx or Layout.jsx
import { useQueryClient } from '@tanstack/react-query'

function Layout() {
  const queryClient = useQueryClient()
  
  useEffect(() => {
    // Pre-fetch events in background on app load
    queryClient.prefetchQuery({
      queryKey: ['allEvents'],
      queryFn: () => eventsAPI.getUpcomingEvents(0, 10),
    })
  }, [])
  
  return <Outlet />
}
```

**Impact**: Events data loads in background while user sees hero screen

#### 3. **Smart Cache Invalidation** ⭐⭐⭐⭐
Current problem: Creating ONE event invalidates ALL cached events

```java
// EventService.java - BEFORE (invalidates everything)
@CacheEvict(value = "events", allEntries = true)
public EventDTO createEvent(...) { }

// AFTER (only invalidate specific queries)
@CacheEvict(value = "events", key = "'upcoming_' + 0") // Only page 0
public EventDTO createEvent(...) { }
```

#### 4. **Add HTTP Caching** ⭐⭐⭐⭐
```java
// Add CacheControl to EventController
@GetMapping
public ResponseEntity<Page<EventDTO>> getUpcomingEvents(...) {
    Page<EventDTO> events = eventService.getUpcomingEvents(...);
    
    return ResponseEntity.ok()
        .cacheControl(CacheControl
            .maxAge(5, TimeUnit.MINUTES)  // Browser cache: 5 min
            .sMaxAge(10, TimeUnit.MINUTES) // CDN cache: 10 min
            .cachePublic()
            .mustRevalidate())
        .body(events);
}
```

**Impact**: 
- Browser caches for 5 minutes (no network request at all!)
- CDN caches for 10 minutes (fast delivery from edge)
- London users get cached response from London edge in <50ms

#### 5. **Add Redis Cache** ⭐⭐⭐⭐⭐
```java
// RedisConfig.java
@Configuration
@EnableCaching
public class RedisConfig {
    
    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory factory) {
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(10))  // Cache for 10 minutes
            .serializeValuesWith(
                RedisSerializationContext.SerializationPair
                    .fromSerializer(new GenericJackson2JsonRedisSerializer())
            );
            
        return RedisCacheManager.builder(factory)
            .cacheDefaults(config)
            .build();
    }
}
```

**Benefits**:
- Distributed cache shared across multiple backend instances
- Survives backend restarts
- 10x faster than database queries (~1ms vs ~10-50ms)

---

## 📊 Performance Comparison

### Current Performance (London User)
```
Home Page Load:
1. DNS Resolution: 20ms
2. Connect to Netlify: 30ms
3. Download HTML/CSS/JS: 200ms
4. API Call to US Backend: 150ms
5. Database Query: 50ms
6. Response Travel: 150ms
Total: ~600ms
```

### With All Optimizations
```
Home Page Load (First Visit):
1. DNS (with Cloudflare): 10ms
2. Connect to Edge: 15ms
3. Download (cached by CDN): 50ms
4. API Call to EU Backend: 20ms
5. Redis Cache Hit: 1ms
6. Response: 20ms
Total: ~116ms (5x faster!)

Home Page Load (Return Visit):
1. Cached in Browser: 0ms
Total: <10ms (60x faster!)
```

---

## 🎯 Recommended Implementation Order

### Phase 1: Quick Wins (30 minutes, $0 cost)
1. ✅ Increase React Query staleTime to 10 minutes
2. ✅ Add pre-fetching in Layout component
3. ✅ Add database indexes
4. ✅ Smart cache invalidation (only invalidate changed data)

### Phase 2: HTTP Caching (1 hour, $0 cost)
1. ✅ Add CacheControl headers to public endpoints
2. ✅ Configure longer cache times for static data
3. ✅ Add ETag support for conditional requests

### Phase 3: Redis (2 hours, +$3-5/month)
1. ✅ Add Railway Redis addon
2. ✅ Configure Spring Redis
3. ✅ Update @Cacheable to use Redis

### Phase 4: Geographic Optimization (varies)
1. Option A: Move to EU region ($0 extra, 30 min)
2. Option B: Add Cloudflare CDN ($0, 30 min)
3. Option C: Multi-region deployment ($10-20/month, 2 hours)

---

## 🧪 Testing Performance

```bash
# Test from different locations
curl -w "@curl-format.txt" -o /dev/null -s https://api.hikehub.com/api/v1/events

# curl-format.txt content:
time_namelookup:  %{time_namelookup}\n
time_connect:     %{time_connect}\n
time_appconnect:  %{time_appconnect}\n
time_pretransfer: %{time_pretransfer}\n
time_starttransfer: %{time_starttransfer}\n
time_total:       %{time_total}\n
```

---

## 💡 Additional Optimizations

### Lazy Loading Images
```javascript
// HomePage.jsx
<img 
  src={event.imageUrl} 
  loading="lazy"  // ⬅️ Browser native lazy loading
  decoding="async"
/>
```

### Pagination with Infinite Scroll
Instead of loading 10 events, load 5 initially, then load more as user scrolls
```javascript
import { useInfiniteQuery } from '@tanstack/react-query'

const { data, fetchNextPage } = useInfiniteQuery({
  queryKey: ['events'],
  queryFn: ({ pageParam = 0 }) => eventsAPI.getUpcomingEvents(pageParam, 5),
  getNextPageParam: (lastPage, pages) => 
    lastPage.hasMore ? pages.length : undefined,
})
```

### Code Splitting
```javascript
// App.jsx - lazy load heavy pages
const GroupDetailPage = lazy(() => import('./pages/GroupDetailPage'))
const EventDetailPage = lazy(() => import('./pages/EventDetailPage'))
```

---

## 📈 Expected Results

| Metric | Before | After Phase 1 | After Phase 3 |
|--------|--------|---------------|---------------|
| Home page (first load) | 600ms | 300ms | 150ms |
| Home page (return) | 600ms | 50ms | <10ms |
| API latency (London) | 300ms | 150ms | 50ms |
| Database queries/min | 1000 | 200 | 50 |
| Monthly cost | $15 | $15 | $23 |

---

## 🚀 Quick Start: Implement Phase 1 Now

```javascript
// 1. Update src/main.jsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 10 * 60 * 1000, // ⬆️ Change from 5 to 10 minutes
      cacheTime: 30 * 60 * 1000, // ⬆️ Add this
    },
  },
})

// 2. Update src/pages/HomePage.jsx
const { data: allEventsData, isLoading: allEventsLoading } = useQuery({
  queryKey: ['allEvents'],
  queryFn: () => eventsAPI.getUpcomingEvents(0, 10),
  refetchOnMount: false, // ⬆️ Add this
})

// 3. Add to backend application.properties
spring.jpa.properties.hibernate.generate_statistics=true
spring.jpa.properties.hibernate.cache.use_second_level_cache=true
```

**Result**: Instant 2-3x performance improvement for returning users!
