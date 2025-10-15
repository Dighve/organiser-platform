# Simplified Model - Visual Diagram

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        MEMBER (Base Class)                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ id, email, displayName, profilePhotoUrl                  │  │
│  │ verified, active, createdAt, updatedAt                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              △                                   │
│                              │                                   │
│                              │ extends                           │
│                              │                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              ORGANISER (Subclass)                        │  │
│  │  + bio, organizationName, websiteUrl                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ creates
                              ▼
                    ┌──────────────────┐
                    │      GROUP       │
                    ├──────────────────┤
                    │ id, name         │
                    │ description      │
                    │ location         │
                    │ maxMembers       │
                    │ active, isPublic │
                    └──────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
         linked to ONE    organizes    subscribed by
                │             │             │
                ▼             ▼             ▼
        ┌──────────┐   ┌──────────┐  ┌──────────────┐
        │ ACTIVITY │   │  EVENT   │  │ SUBSCRIPTION │
        ├──────────┤   ├──────────┤  ├──────────────┤
        │ id       │   │ id       │  │ id           │
        │ name     │   │ title    │  │ member_id    │
        │ iconUrl  │   │ date     │  │ group_id     │
        │ active   │   │ location │  │ status       │
        └──────────┘   │ price    │  └──────────────┘
                       │ status   │         │
                       └──────────┘         │
                              │             │
                              │ joined by   │ subscribes
                              ▼             ▼
                    ┌────────────────────────────┐
                    │    EVENT_PARTICIPANT       │
                    ├────────────────────────────┤
                    │ id, member_id, event_id    │
                    │ status, registeredAt       │
                    │ attended                   │
                    └────────────────────────────┘
```

## Relationship Flow

### 1. Member → Organiser → Group
```
Member
  └─ upgrades to ─→ Organiser
                      └─ creates ─→ Group
```

### 2. Group Relationships
```
Group
  ├─ belongs to ─→ ONE Activity
  ├─ has many ─→ Events
  └─ has many ─→ Subscriptions (Members)
```

### 3. Member Participation
```
Member
  ├─ subscribes to Groups ─→ Subscription
  └─ joins Events ─→ EventParticipant
```

## Data Flow Examples

### Example 1: Creating a Hiking Group
```
1. Member (john@example.com)
   └─→ Upgrades to Organiser
       └─→ Creates Group "Weekend Hikers"
           ├─→ Links to Activity "Hiking"
           └─→ Sets location "San Francisco"
```

### Example 2: Member Joins Group and Event
```
1. Member (alice@example.com)
   └─→ Subscribes to Group "Weekend Hikers"
       └─→ Creates Subscription record
           └─→ status: ACTIVE

2. Group "Weekend Hikers"
   └─→ Creates Event "Mount Tam Hike"
       └─→ Member alice@example.com joins
           └─→ Creates EventParticipant record
               └─→ status: REGISTERED
```

### Example 3: Complete Workflow
```
┌─────────────┐
│   Member    │ (Regular user)
└──────┬──────┘
       │ upgrade
       ▼
┌─────────────┐
│  Organiser  │ (Can create groups)
└──────┬──────┘
       │ creates
       ▼
┌─────────────┐
│    Group    │ (e.g., "Weekend Hikers")
└──────┬──────┘
       │ linked to
       ▼
┌─────────────┐
│  Activity   │ (e.g., "Hiking")
└─────────────┘

       Group
       │ organizes
       ▼
┌─────────────┐
│    Event    │ (e.g., "Mount Tam Hike")
└──────┬──────┘
       │
       │ Members join via
       ▼
┌─────────────────┐
│ EventParticipant│
└─────────────────┘
```

## Table Relationships (SQL)

```sql
-- Member table (Single Table Inheritance)
members
  ├─ id (PK)
  ├─ member_type ('MEMBER' or 'ORGANISER')
  ├─ email (UNIQUE)
  └─ ... other fields

-- Group table
groups
  ├─ id (PK)
  ├─ organiser_id (FK → members.id)
  ├─ activity_id (FK → activities.id)
  └─ ... other fields

-- Subscription (Join table)
subscriptions
  ├─ id (PK)
  ├─ member_id (FK → members.id)
  ├─ group_id (FK → groups.id)
  └─ UNIQUE(member_id, group_id)

-- Event table
events_new
  ├─ id (PK)
  ├─ group_id (FK → groups.id)
  └─ ... other fields

-- EventParticipant (Join table)
event_participants
  ├─ id (PK)
  ├─ member_id (FK → members.id)
  ├─ event_id (FK → events_new.id)
  └─ UNIQUE(member_id, event_id)

-- Activity table
activities
  ├─ id (PK)
  └─ ... other fields
```

## Cardinality

```
Member (1) ──< (N) Subscription (N) >── (1) Group
Member (1) ──< (N) EventParticipant (N) >── (1) Event
Organiser (1) ──< (N) Group
Group (N) >── (1) Activity
Group (1) ──< (N) Event
```

## Key Constraints

1. **One Activity per Group**: Each group focuses on ONE activity type
2. **Unique Subscriptions**: A member can only subscribe once to a group
3. **Unique Event Participation**: A member can only join an event once
4. **Organiser is Member**: Organiser inherits from Member (IS-A relationship)
5. **Events belong to Groups**: Not to individual Organisers

## Status Enums

### Subscription Status
- `ACTIVE` - Member is actively subscribed
- `INACTIVE` - Member has unsubscribed
- `BANNED` - Member is banned from the group

### Event Status
- `DRAFT` - Event is being created
- `PUBLISHED` - Event is live and accepting registrations
- `CANCELLED` - Event has been cancelled
- `COMPLETED` - Event has finished
- `FULL` - Event has reached max participants

### Participation Status
- `REGISTERED` - Member has signed up
- `CONFIRMED` - Member has confirmed attendance
- `CANCELLED` - Member cancelled their registration
- `ATTENDED` - Member attended the event
- `NO_SHOW` - Member didn't show up
```
