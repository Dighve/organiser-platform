# Flyway Migration Naming Convention - OutMeets Platform

**CRITICAL: Always check the latest version number before creating a new migration!**

---

## 🚨 NAMING CONVENTION

### Format:
```
V{VERSION}__{DESCRIPTION}.sql
```

### Rules:
1. **V** - Uppercase V prefix (required by Flyway)
2. **{VERSION}** - Sequential integer (1, 2, 3, 4, etc.)
3. **__** - **DOUBLE UNDERSCORE** (two underscores, not one!)
4. **{DESCRIPTION}** - Snake_case description (lowercase with underscores)
5. **.sql** - SQL file extension

---

## ✅ CORRECT EXAMPLES

```
V1__create_members_table.sql
V2__add_email_to_members.sql
V19__add_notification_preferences.sql
V42__backfill_display_names.sql
```

---

## ❌ WRONG EXAMPLES

```
V1_create_members_table.sql           ❌ Single underscore
V01__create_members_table.sql         ❌ Leading zero
v1__create_members_table.sql          ❌ Lowercase v
V1__Create_Members_Table.sql          ❌ CamelCase description
V1__create-members-table.sql          ❌ Hyphens instead of underscores
create_members_table.sql              ❌ No version number
```

---

## 📋 STEP-BY-STEP PROCESS

### Before Creating a New Migration:

#### Step 1: Check Latest Version
```bash
cd backend/src/main/resources/db/migration/postgresql
ls -1 | sort -V | tail -5
```

**Example output:**
```
V38__add_welcome_screen_feature_flag.sql
V39__add_email_notifications_enabled_to_members.sql
V40__add_email_notifications_feature_flag.sql
V41__add_flyer_feature_flag.sql
V42__backfill_display_names.sql
```

**Latest version: V42**

#### Step 2: Use Next Sequential Number
```
Next version: V43
```

#### Step 3: Create Migration File
```
V43__your_description_here.sql
```

---

## 📊 CURRENT VERSION STATUS

**As of last check:**
- **Latest Version:** V42
- **Next Available:** V43
- **Location:** `backend/src/main/resources/db/migration/postgresql/`

**ALWAYS verify this before creating a new migration!**

---

## 🔍 HOW TO FIND LATEST VERSION

### Method 1: Command Line (Recommended)
```bash
cd organiser-platform/backend/src/main/resources/db/migration/postgresql
ls -1 V*.sql | sort -V | tail -1
```

**Output:** `V42__backfill_display_names.sql`

### Method 2: IDE File Explorer
1. Navigate to `backend/src/main/resources/db/migration/postgresql/`
2. Sort files by name
3. Scroll to bottom
4. Find highest V number

### Method 3: Grep Search
```bash
cd organiser-platform
find backend/src/main/resources/db/migration -name "V*.sql" | sort -V | tail -1
```

---

## 📝 MIGRATION CONTENT GUIDELINES

### File Structure:
```sql
-- Description: Add notification preferences to members table
-- Author: Your Name
-- Date: 2026-03-29

-- Add columns
ALTER TABLE members 
ADD COLUMN notification_preferences JSONB DEFAULT '{}';

-- Create index
CREATE INDEX idx_members_notification_preferences 
ON members USING GIN (notification_preferences);

-- Add comment
COMMENT ON COLUMN members.notification_preferences 
IS 'User notification preferences stored as JSON';
```

### Best Practices:

1. **Add Comments:**
   - Describe what the migration does
   - Include author and date
   - Explain complex logic

2. **Use Transactions:**
   ```sql
   BEGIN;
   
   -- Your changes here
   
   COMMIT;
   ```

3. **Make Idempotent (if possible):**
   ```sql
   -- Check if column exists before adding
   DO $$
   BEGIN
       IF NOT EXISTS (
           SELECT 1 FROM information_schema.columns 
           WHERE table_name = 'members' 
           AND column_name = 'new_column'
       ) THEN
           ALTER TABLE members ADD COLUMN new_column VARCHAR(255);
       END IF;
   END $$;
   ```

4. **Add Indexes:**
   ```sql
   CREATE INDEX IF NOT EXISTS idx_members_email 
   ON members(email);
   ```

5. **Provide Rollback Info:**
   ```sql
   -- Rollback: DROP COLUMN members.new_column;
   ```

---

## 🔄 MIGRATION TYPES

### 1. Schema Changes
```sql
-- V43__add_profile_photo_to_members.sql
ALTER TABLE members 
ADD COLUMN profile_photo_url VARCHAR(500);
```

### 2. Data Migration
```sql
-- V44__backfill_default_roles.sql
UPDATE members 
SET role = 'MEMBER' 
WHERE role IS NULL;
```

### 3. Index Creation
```sql
-- V45__add_performance_indexes.sql
CREATE INDEX idx_events_date 
ON events(event_date);

CREATE INDEX idx_subscriptions_member 
ON subscriptions(member_id);
```

### 4. New Table
```sql
-- V46__create_audit_log_table.sql
CREATE TABLE audit_log (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES members(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_log_user 
ON audit_log(user_id);

CREATE INDEX idx_audit_log_created 
ON audit_log(created_at);
```

### 5. Feature Flag
```sql
-- V47__add_new_feature_flag.sql
INSERT INTO feature_flags (
    flag_key, 
    flag_name, 
    description, 
    is_enabled, 
    created_by
) VALUES (
    'new_feature', 
    'New Feature', 
    'Description of new feature', 
    false, 
    'system'
);
```

---

## ⚠️ COMMON MISTAKES

### Mistake 1: Using Existing Version Number
```sql
-- ❌ WRONG: V10__add_new_feature.sql (V10 already exists)
-- ✅ CORRECT: V43__add_new_feature.sql (next available)
```

### Mistake 2: Single Underscore
```sql
-- ❌ WRONG: V43_add_new_feature.sql
-- ✅ CORRECT: V43__add_new_feature.sql
```

### Mistake 3: Leading Zeros
```sql
-- ❌ WRONG: V043__add_new_feature.sql
-- ✅ CORRECT: V43__add_new_feature.sql
```

### Mistake 4: Spaces in Description
```sql
-- ❌ WRONG: V43__add new feature.sql
-- ✅ CORRECT: V43__add_new_feature.sql
```

### Mistake 5: Not Checking Latest Version
```sql
-- ❌ WRONG: Guessing V20 when V42 exists
-- ✅ CORRECT: Always check first!
```

---

## 🧪 TESTING MIGRATIONS

### Local Testing:
```bash
# 1. Start backend
cd backend
./gradlew bootRun

# 2. Check Flyway logs
# Look for: "Successfully applied X migrations"

# 3. Verify in database
psql -d your_database
\dt  # List tables
\d table_name  # Describe table
```

### Rollback (if needed):
```bash
# Flyway doesn't support automatic rollback
# You must create a new migration to undo changes

# Example: V44__rollback_feature.sql
DROP TABLE IF EXISTS new_table;
ALTER TABLE members DROP COLUMN IF EXISTS new_column;
```

---

## 📚 MIGRATION HISTORY

### Current Migrations (V1-V42):

| Version | Description |
|---------|-------------|
| V1.1 | Combined schema |
| V2 | Insert test data |
| V3 | Update event participants schema |
| V4 | Update member with is_organiser schema |
| V5 | Add comment tables |
| V6 | Add subscriptions for group organisers |
| V7 | Add performance indexes |
| V8 | Add image position to members |
| V9 | Add legal agreements |
| V10 | Add user agreement fields |
| V11 | Add group terms and conditions |
| V12 | Add is_admin to members |
| V13 | Add host_member_id to events |
| V14 | Remove organiser from participants |
| V15 | Rename is_organiser to has_organiser_role |
| V16 | Create notifications table |
| V17 | Create feature flags table |
| V18 | Enhanced legal audit trail |
| V19 | Populate agreement texts |
| V20 | Version existing agreements |
| V21 | Fix agreement hash column size |
| V22 | Increase created_by field size |
| V23 | Fix agreement version hashes |
| V24 | Fix feature flags updated_by column |
| V25 | Add disable_become_organiser flag |
| V26 | Create feedback table |
| V27 | Add guest_count to event_participants |
| V28 | Create web_push_subscriptions table |
| V29 | Create banned_members table |
| V30 | Add join_question to events |
| V31 | Add group_guidelines column |
| V32 | Create organiser_invites table |
| V33 | Make event location nullable |
| V34 | Add email OTP passcode auth |
| V35 | Add group guidelines data |
| V36 | Add user agreement feature flag |
| V37 | Create refresh_tokens table |
| V38 | Add welcome screen feature flag |
| V39 | Add email_notifications_enabled to members |
| V40 | Add email notifications feature flag |
| V41 | Add flyer feature flag |
| V42 | Backfill display names |

**Next Available: V43**

---

## ✅ CHECKLIST BEFORE CREATING MIGRATION

- [ ] Checked latest version number
- [ ] Using next sequential number (V43, V44, etc.)
- [ ] Used double underscore `__`
- [ ] Description in snake_case
- [ ] File in correct location: `backend/src/main/resources/db/migration/postgresql/`
- [ ] Added comments explaining changes
- [ ] Tested locally
- [ ] Considered rollback scenario
- [ ] Updated this guide if needed

---

## 🚀 QUICK REFERENCE

```bash
# Find latest version
cd organiser-platform/backend/src/main/resources/db/migration/postgresql
ls -1 V*.sql | sort -V | tail -1

# Create new migration (replace 43 with next number)
touch V43__your_description_here.sql

# Edit migration
nano V43__your_description_here.sql

# Test migration
cd ../../../../../../..
./gradlew bootRun
```

---

## 📞 TROUBLESHOOTING

### Error: "Migration checksum mismatch"
**Cause:** Modified existing migration file  
**Solution:** Never modify existing migrations. Create a new one to fix issues.

### Error: "Migration version X already exists"
**Cause:** Used wrong version number  
**Solution:** Check latest version and use next sequential number.

### Error: "Invalid migration filename"
**Cause:** Wrong naming format  
**Solution:** Follow `V{N}__{description}.sql` format exactly.

---

**Remember: ALWAYS check the latest version before creating a new migration!**

**Current Latest: V42**  
**Next Available: V43**
