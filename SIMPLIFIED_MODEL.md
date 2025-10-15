# Simplified Data Model

## Overview

The data model has been simplified to follow a clear hierarchy:
**Member → Organiser → Group → Event**

## Entity Relationships

```
Member (base class)
  └── Organiser (subclass)
        └── Group (created by Organiser)
              ├── Activity (ONE per group)
              └── Event (multiple per group)

Member ←→ Group (via Subscription)
Member ←→ Event (via EventParticipant)
```

## Entities

### 1. **Member** (Base Class)
- **Purpose**: Represents any user in the system
- **Table**: `members`
- **Key Fields**:
  - `id`, `email`, `displayName`, `profilePhotoUrl`
  - `verified`, `active`
  - `createdAt`, `updatedAt`
- **Relationships**:
  - Has many `Subscription` (groups they've joined)
  - Has many `EventParticipant` (events they're attending)
- **Inheritance**: Uses Single Table Inheritance with `member_type` discriminator

### 2. **Organiser** (Subclass of Member)
- **Purpose**: Members who can create and manage groups
- **Discriminator**: `ORGANISER`
- **Additional Fields**:
  - `bio`, `organizationName`, `websiteUrl`
- **Relationships**:
  - Has many `Group` (groups they created)
  - Belongs to ONE `Organiser` (primaryOrganiser) - optional, for team structure
  - Has many `Organiser` (teamOrganisers) - organisers working under them

### 3. **Activity**
- **Purpose**: Types of activities (e.g., Hiking, Cycling, Running)
- **Table**: `activities`
- **Key Fields**:
  - `id`, `name`, `description`, `iconUrl`
  - `active`
- **Relationships**:
  - Has many `Group`
- **Note**: Each group is linked to ONE activity

### 4. **Group**
- **Purpose**: Created by Organiser, organizes events for a specific activity
- **Table**: `groups`
- **Key Fields**:
  - `id`, `name`, `description`, `imageUrl`
  - `location`, `maxMembers`
  - `active`, `isPublic`
- **Relationships**:
  - Belongs to ONE `Organiser`
  - Belongs to ONE `Activity`
  - Has many `Subscription` (members subscribed)
  - Has many `Event`

### 5. **Subscription** (Join Table)
- **Purpose**: Represents Member's subscription to a Group
- **Table**: `subscriptions`
- **Key Fields**:
  - `id`, `status`, `notificationEnabled`
  - `subscribedAt`, `unsubscribedAt`
- **Relationships**:
  - Belongs to ONE `Member`
  - Belongs to ONE `Group`
- **Unique Constraint**: (member_id, group_id)
- **Status**: ACTIVE, INACTIVE, BANNED

### 6. **Event** (Simplified Event)
- **Purpose**: Events organized by a Group
- **Table**: `events`
- **Key Fields**:
  - `id`, `title`, `description`
  - `eventDate`, `endDate`, `registrationDeadline`
  - `location`, `latitude`, `longitude`
  - `maxParticipants`, `minParticipants`, `price`
  - `status`, `imageUrl`
- **Relationships**:
  - Belongs to ONE `Group`
  - Has many `eventOrganisers` (Members organizing this specific event)
  - Has many `EventParticipant` (members attending)
- **Status**: DRAFT, PUBLISHED, CANCELLED, COMPLETED, FULL

### 7. **EventParticipant** (Join Table)
- **Purpose**: Represents Member joining an Event
- **Table**: `event_participants`
- **Key Fields**:
  - `id`, `status`, `notes`
  - `registeredAt`, `cancelledAt`, `attended`
- **Relationships**:
  - Belongs to ONE `Member`
  - Belongs to ONE `EventNew`
- **Unique Constraint**: (member_id, event_id)
- **Status**: REGISTERED, CONFIRMED, CANCELLED, ATTENDED, NO_SHOW

## Key Design Decisions

### ✅ Simplified Structure
1. **User → Member**: Clearer terminology
2. **Inheritance**: Organiser extends Member (Single Table Inheritance)
3. **Group-Centric**: Events belong to Groups, not individual Organisers
4. **Explicit Relationships**: Subscription and EventParticipant as separate entities

### ✅ Benefits
- **Clearer Hierarchy**: Easy to understand Member → Organiser → Group → Event
- **Better Organization**: Groups organize events for specific activities
- **Flexible Subscriptions**: Members can subscribe to multiple groups
- **Event Participation**: Clear tracking of who's attending what
- **Scalability**: Organisers can manage multiple groups

### ✅ Removed Complexity
- ❌ Removed direct User-Event relationship
- ❌ Removed Review entity (can be added later if needed)
- ❌ Removed complex event fields (difficulty, distance, elevation)
- ❌ Removed UserRole enum (using inheritance instead)

## Usage Examples

### Example 1: Create a Hiking Group
```java
// 1. Member becomes Organiser
Organiser organiser = new Organiser();
organiser.setEmail("john@example.com");
organiser.setDisplayName("John Doe");
organiser.setBio("Experienced hiker");

// 2. Create Group for Hiking Activity
Group hikingGroup = Group.builder()
    .name("Weekend Hikers")
    .description("Casual weekend hiking group")
    .organiser(organiser)
    .activity(hikingActivity) // ONE activity
    .location("San Francisco Bay Area")
    .maxMembers(50)
    .build();
```

### Example 2: Member Subscribes to Group
```java
Subscription subscription = Subscription.builder()
    .member(member)
    .group(hikingGroup)
    .status(SubscriptionStatus.ACTIVE)
    .notificationEnabled(true)
    .build();
```

### Example 3: Create Event in Group
```java
EventNew event = EventNew.builder()
    .title("Mount Tamalpais Hike")
    .description("Beautiful morning hike")
    .group(hikingGroup) // Belongs to group
    .eventDate(LocalDateTime.now().plusDays(7))
    .location("Mount Tamalpais State Park")
    .maxParticipants(20)
    .price(BigDecimal.ZERO)
    .status(EventStatus.PUBLISHED)
    .build();
```

### Example 4: Member Joins Event
```java
EventParticipant participant = EventParticipant.builder()
    .member(member)
    .event(event)
    .status(ParticipationStatus.REGISTERED)
    .build();
```

## Migration Notes

### Old Model → New Model
- `User` → `Member` (base) + `Organiser` (subclass)
- `ActivityType` → `Activity`
- `Event.organiser` → `Event.group` (indirect via Group)
- `Event.participants` (ManyToMany) → `EventParticipant` (explicit join table)
- New: `Group` entity
- New: `Subscription` entity
- Removed: `Review` entity (can be added back if needed)

### Next Steps
1. ✅ Create new entities
2. ⏳ Update repositories
3. ⏳ Update services
4. ⏳ Update controllers
5. ⏳ Create database migration scripts
6. ⏳ Update frontend to use new model

## Database Schema

### Single Table Inheritance
The `members` table uses Single Table Inheritance:
- `member_type` column: 'MEMBER' or 'ORGANISER'
- All fields in one table
- Organiser-specific fields (bio, organizationName, websiteUrl) are NULL for regular Members

### Indexes
- `members`: email
- `groups`: organiser_id, activity_id
- `subscriptions`: member_id, group_id
- `events_new`: group_id, event_date, status
- `event_participants`: member_id, event_id

## API Endpoints (Suggested)

### Members
- `POST /api/v1/members/register` - Register as Member
- `POST /api/v1/members/upgrade-to-organiser` - Upgrade to Organiser

### Groups
- `POST /api/v1/groups` - Create group (Organiser only)
- `GET /api/v1/groups` - List all groups
- `GET /api/v1/groups/{id}` - Get group details
- `POST /api/v1/groups/{id}/subscribe` - Subscribe to group
- `DELETE /api/v1/groups/{id}/unsubscribe` - Unsubscribe from group

### Events
- `POST /api/v1/groups/{groupId}/events` - Create event in group
- `GET /api/v1/groups/{groupId}/events` - List group events
- `GET /api/v1/events/{id}` - Get event details
- `POST /api/v1/events/{id}/join` - Join event
- `DELETE /api/v1/events/{id}/leave` - Leave event

### Activities
- `GET /api/v1/activities` - List all activities
- `GET /api/v1/activities/{id}/groups` - List groups for activity
