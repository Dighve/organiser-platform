# Migration Scripts Comparison: MariaDB vs PostgreSQL

## Tables Coverage Comparison

| Table Name | MariaDB ✅ | PostgreSQL (Before) ❌ | PostgreSQL (After) ✅ |
|------------|-----------|----------------------|---------------------|
| `members` | ✅ | ✅ | ✅ |
| `activities` | ✅ | ✅ | ✅ |
| `groups` | ✅ | ✅ | ✅ |
| `group_co_organisers` | ✅ | ✅ | ✅ |
| `events` | ✅ | ⚠️ Different schema | ✅ |
| `event_organisers` | ✅ | ❌ Missing | ✅ |
| `event_participants` | ✅ | ⚠️ Different schema | ✅ |
| `event_additional_images` | ✅ | ❌ Missing | ✅ |
| `event_requirements` | ✅ | ❌ Missing | ✅ |
| `event_included_items` | ✅ | ❌ Missing | ✅ |
| `subscriptions` | ✅ | ❌ Missing | ✅ |
| `magic_links` | ✅ | ❌ Missing | ✅ |

## Schema Differences Fixed

### Events Table
**MariaDB Schema:**
```sql
- event_date TIMESTAMP NOT NULL
- end_date TIMESTAMP
- registration_deadline TIMESTAMP
- latitude DECIMAL(10, 7)
- longitude DECIMAL(10, 7)
- price DECIMAL(10, 2)
- difficulty_level VARCHAR(20)
- distance_km DECIMAL(10, 2)
- elevation_gain_m INT
- estimated_duration_hours DECIMAL(4, 2)
- average_rating DOUBLE
- total_reviews INT
- cancellation_policy TEXT
```

**PostgreSQL (Before):**
```sql
- start_time TIMESTAMP NOT NULL  ❌ Wrong column name
- end_time TIMESTAMP             ❌ Wrong column name
- organiser_id BIGINT            ❌ Wrong relationship
- meeting_point VARCHAR(500)     ❌ Extra column
❌ Missing: latitude, longitude, price, distance_km, 
            elevation_gain_m, estimated_duration_hours,
            average_rating, total_reviews, cancellation_policy,
            registration_deadline
```

**PostgreSQL (After):**
```sql
✅ All columns match MariaDB schema
✅ Uses DOUBLE PRECISION instead of DOUBLE
✅ Proper foreign key to groups table
```

### Event Participants Table
**MariaDB Schema:**
```sql
- id BIGINT AUTO_INCREMENT PRIMARY KEY
- event_id BIGINT NOT NULL
- member_id BIGINT NOT NULL
- role VARCHAR(20) NOT NULL DEFAULT 'ATTENDEE'
- status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
- created_at TIMESTAMP
- updated_at TIMESTAMP
```

**PostgreSQL (Before):**
```sql
- No id column (composite primary key) ❌
- rsvp_status instead of status        ❌
- response_notes VARCHAR(500)          ❌
- rsvp_at TIMESTAMP                    ❌
- checked_in BOOLEAN                   ❌
```

**PostgreSQL (After):**
```sql
✅ Matches MariaDB schema exactly
✅ id BIGSERIAL PRIMARY KEY
✅ status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
✅ Uses BIGSERIAL instead of AUTO_INCREMENT
```

## Missing Tables (Now Added)

### 1. event_organisers
```sql
CREATE TABLE event_organisers (
    event_id BIGINT NOT NULL,
    member_id BIGINT NOT NULL,
    PRIMARY KEY (event_id, member_id),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);
```

### 2. event_additional_images
```sql
CREATE TABLE event_additional_images (
    event_id BIGINT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);
```

### 3. event_requirements
```sql
CREATE TABLE event_requirements (
    event_id BIGINT NOT NULL,
    requirement VARCHAR(500) NOT NULL,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);
```

### 4. event_included_items
```sql
CREATE TABLE event_included_items (
    event_id BIGINT NOT NULL,
    item VARCHAR(500) NOT NULL,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);
```

### 5. subscriptions
```sql
CREATE TABLE subscriptions (
    id BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL,
    group_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    notification_enabled BOOLEAN DEFAULT TRUE,
    subscribed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    unsubscribed_at TIMESTAMP NULL,
    CONSTRAINT unique_member_group UNIQUE (member_id, group_id),
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);
```

### 6. magic_links
```sql
CREATE TABLE magic_links (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL,
    member_id BIGINT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);
```

## PostgreSQL-Specific Syntax Used

| Feature | MariaDB | PostgreSQL |
|---------|---------|------------|
| Auto-increment | `BIGINT AUTO_INCREMENT` | `BIGSERIAL` |
| Double precision | `DOUBLE` | `DOUBLE PRECISION` |
| Current time | `NOW()` | `CURRENT_TIMESTAMP` |
| Date arithmetic | `DATE_ADD(NOW(), INTERVAL 7 DAY)` | `CURRENT_TIMESTAMP + INTERVAL '7 days'` |
| Index creation | Inline in `CREATE TABLE` | Separate `CREATE INDEX` statements |
| Update triggers | `ON UPDATE CURRENT_TIMESTAMP` | Trigger functions |
| Engine clause | `ENGINE=InnoDB` | Not needed (PostgreSQL uses its own engine) |
| Charset clause | `CHARSET=utf8mb4` | Not needed (PostgreSQL uses UTF-8 by default) |

## Migration File Versions

| Version | MariaDB | PostgreSQL | Status |
|---------|---------|------------|--------|
| V1.1 | Combined schema (12 tables) | Combined schema (12 tables) | ✅ Parity achieved |
| V2 | Insert test data | Insert test data | ✅ Parity achieved |
| V3 | Update event_participants | Update event_participants | ✅ Parity achieved |
| V4 | Add is_organiser to members | Add is_organiser to members | ✅ Parity achieved |

## Summary

### Before Fix
- ❌ 6 out of 12 tables missing in PostgreSQL
- ❌ Events table had wrong schema
- ❌ Event participants table had wrong structure
- ❌ Missing critical features: subscriptions, magic links, event requirements
- ❌ Would fail on Render deployment

### After Fix
- ✅ All 12 tables present
- ✅ Complete schema parity with MariaDB
- ✅ All features supported
- ✅ PostgreSQL-specific syntax used correctly
- ✅ Ready for Render deployment

**Result**: The PostgreSQL migrations now have 100% feature parity with MariaDB migrations! 🎉
