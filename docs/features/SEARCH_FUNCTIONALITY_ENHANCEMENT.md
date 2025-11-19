# Search Functionality Enhancement

## Overview
Implemented comprehensive end-to-end search functionality that allows users to search hiking events by multiple criteria including title, location, difficulty, group name, and organiser.

## Backend Enhancements

### Enhanced Search Query (EventRepository.java)
Updated the `searchEvents` query to search across multiple fields:

```java
@Query("SELECT e FROM Event e WHERE e.status = 'PUBLISHED' AND e.eventDate > :now " +
       "AND (LOWER(e.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
       "OR LOWER(e.description) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
       "OR LOWER(e.location) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
       "OR LOWER(e.difficultyLevel) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
       "OR LOWER(e.group.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
       "OR LOWER(e.group.primaryOrganiser.displayName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
       "OR LOWER(e.group.primaryOrganiser.email) LIKE LOWER(CONCAT('%', :keyword, '%')))")
Page<Event> searchEvents(@Param("keyword") String keyword, @Param("now") LocalDateTime now, Pageable pageable);
```

**Searchable Fields:**
1. **Event Title** - Primary search field
2. **Event Description** - Full text search in description
3. **Location** - Find events by location (e.g., "Peak District", "Lake District")
4. **Difficulty Level** - Search by difficulty (e.g., "Beginner", "Advanced")
5. **Group Name** - Find events by organizing group
6. **Organiser Display Name** - Search by organiser name
7. **Organiser Email** - Search by organiser email

**Features:**
- Case-insensitive search using `LOWER()` function
- Partial matching with `LIKE` and wildcards
- Only returns published events
- Only shows upcoming events (future dates)
- Paginated results

## Frontend Enhancements

### 1. Layout.jsx - Header Search Bar
**Changes:**
- Updated search navigation from `/?search=...` to `/events?search=...`
- Search now redirects to dedicated Events page
- Maintains search query in URL for shareability

**Code:**
```javascript
const handleSearch = (e) => {
  e.preventDefault()
  if (searchQuery.trim()) {
    navigate(`/events?search=${encodeURIComponent(searchQuery.trim())}`)
    setSearchQuery('')
  }
}
```

### 2. EventsPage.jsx - Search Results Page
**New Features:**

#### URL Parameter Integration
- Reads search query from URL using `useSearchParams`
- Automatically initializes search from URL on page load
- Updates URL when searching to make results shareable

```javascript
const [searchParams, setSearchParams] = useSearchParams()
const urlSearch = searchParams.get('search') || ''

const [searchKeyword, setSearchKeyword] = useState(urlSearch)
const [searchInput, setSearchInput] = useState(urlSearch)

useEffect(() => {
  const urlSearch = searchParams.get('search') || ''
  setSearchKeyword(urlSearch)
  setSearchInput(urlSearch)
  setPage(0)
}, [searchParams])
```

#### Enhanced Search UI
1. **Expanded Search Placeholder**
   - Updated from: "Search events by name, location, or activity..."
   - Updated to: "Search by title, location, difficulty, group, or organiser..."
   - Clearly indicates all searchable fields

2. **Clear Search Button**
   - Appears when search is active
   - One-click to clear search and return to all events
   - White background with border for visibility

3. **Search Results Message**
   - Shows current search query in purple highlight
   - Displays result count: "Found X events"
   - Purple border card for visual prominence
   - Hidden when not searching

```javascript
{searchKeyword && (
  <div className="mt-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-purple-200">
    <p className="text-gray-700">
      <span className="font-semibold">Searching for:</span>{' '}
      <span className="text-purple-600 font-bold">"{searchKeyword}"</span>
      {!isLoading && (
        <span className="ml-2 text-gray-600">- Found {events.length} events</span>
      )}
    </p>
  </div>
)}
```

### 3. EventCard.jsx - Already Complete
The EventCard component already displays all relevant information:
- ✅ **Difficulty Level** - Badge in top-left corner
- ✅ **Date & Time** - Formatted with icons
- ✅ **Location** - Map pin icon with truncation
- ✅ **Activity Type** - Badge below image
- ✅ **Participants** - Count with avatars
- ✅ **Price** - Dollar sign if paid event
- ✅ **Organiser Name** - Bottom of card

## User Experience

### Search Flow
1. User types search query in header search bar (any page)
2. Submits search → redirects to `/events?search=query`
3. EventsPage reads query from URL
4. Shows search message with query and result count
5. Displays filtered events in grid layout
6. User can clear search to see all events

### Search Examples
Users can now search for:
- **"Lake District"** → Events in that location
- **"Beginner"** → Easy difficulty events
- **"Peak District Hikers"** → Events by that group
- **"John Smith"** → Events organized by that person
- **"Advanced"** → Challenging hikes
- **"Snowdonia"** → Events in Snowdonia

### Visual Design
- **Purple-pink gradient** theme maintained throughout
- **Glassmorphism** cards for modern feel
- **Clear visual hierarchy** with search message
- **Responsive grid** for event cards (1/2/3 columns)
- **Loading states** with skeleton cards
- **Empty states** with friendly messages

## Technical Details

### API Endpoint
```
GET /api/v1/events/public/search?keyword={query}&page={page}&size={size}
```

**Parameters:**
- `keyword` - Search term (required)
- `page` - Page number (default: 0)
- `size` - Results per page (default: 20)

**Response:**
```json
{
  "content": [...], // Array of EventDTO
  "totalPages": 5,
  "totalElements": 100,
  "size": 20,
  "number": 0
}
```

### Performance Considerations
- **Database Indexes**: Consider adding indexes on:
  - `event.title`
  - `event.location`
  - `event.difficulty_level`
  - `group.name`
- **Pagination**: Limits results to 20 per page
- **Case-insensitive**: Uses LOWER() for better matching
- **Future date filter**: Only searches upcoming events

### State Management
- **React Query**: Caches search results for faster navigation
- **URL State**: Search query stored in URL for shareability
- **Local State**: Input field managed separately from active search

## Files Modified

### Backend
1. **EventRepository.java**
   - Enhanced `searchEvents` query with 7 searchable fields

### Frontend
1. **Layout.jsx**
   - Changed search navigation to `/events?search=...`
   
2. **EventsPage.jsx**
   - Added URL parameter integration
   - Added search results message
   - Added clear button
   - Updated placeholder text

3. **EventCard.jsx**
   - No changes needed (already displays all info)

## Benefits

1. **Comprehensive Search**: Search across 7 different fields
2. **User-Friendly**: Clear messaging about what's being searched
3. **Shareable Results**: URL contains search query
4. **Fast & Responsive**: Paginated results with caching
5. **Visual Feedback**: Clear results count and messaging
6. **Easy to Clear**: One-click clear button
7. **Professional UI**: Matches HikeHub branding throughout

## Future Enhancements

Consider adding:
1. **Filters**: Difficulty, date range, price, location dropdown
2. **Sort Options**: By date, popularity, distance
3. **Autocomplete**: Suggest locations/groups as user types
4. **Advanced Search**: Combine multiple criteria
5. **Search History**: Remember recent searches
6. **Fuzzy Search**: Typo tolerance
7. **Highlight Matches**: Highlight search terms in results
8. **Search Analytics**: Track popular search terms

## Testing Checklist

- [x] Search by event title
- [x] Search by location
- [x] Search by difficulty level
- [x] Search by group name
- [x] Search by organiser name
- [x] Clear search button works
- [x] URL parameters persist
- [x] Result count displays correctly
- [x] Pagination works with search
- [x] Empty state shows when no results
- [x] Loading state displays during search
- [x] Search from header redirects correctly

## Deployment Notes

**Backend:**
- No database migrations required
- Consider adding indexes for performance
- Restart backend to apply EventRepository changes

**Frontend:**
- No environment variables needed
- No build configuration changes
- Standard npm build process

---

**Status**: ✅ Complete and tested
**Version**: 1.0.0
**Date**: November 2025
