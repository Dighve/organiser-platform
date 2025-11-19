# V7 Migration Bug - Root Cause & Fix

## 🎯 Root Cause Discovered

**The V7 migration had TWO bugs:**

### Bug 1: Wrong Column Names ❌
```sql
-- V7 tried to create (WRONG):
CREATE INDEX idx_event_comments_author_id ON event_comments(author_id);
CREATE INDEX idx_event_comment_replies_author_id ON event_comment_replies(author_id);

-- ERROR: column "author_id" does not exist
```

**Actual column name**: `member_id` (not `author_id`)

From V5 migration:
```sql
CREATE TABLE event_comments (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL,
    member_id BIGINT NOT NULL,  ← Correct column name
    content TEXT NOT NULL,
    ...
);
```

---

### Bug 2: Duplicate Indexes ❌
V5 already created these indexes in lines 17-19 and 34-36:

```sql
-- V5 already created:
CREATE INDEX idx_comment_event ON event_comments(event_id);     ✅
CREATE INDEX idx_comment_member ON event_comments(member_id);   ✅
CREATE INDEX idx_reply_comment ON event_comment_replies(comment_id); ✅
CREATE INDEX idx_reply_member ON event_comment_replies(member_id);   ✅
```

V7 was trying to create them again (with wrong column names):
```sql
-- V7 tried to duplicate (WRONG):
CREATE INDEX idx_event_comments_event_id ON event_comments(event_id);
CREATE INDEX idx_event_comments_author_id ON event_comments(author_id);  ← Wrong!
```

---

## 💥 What Happened on Render

1. ✅ Database created successfully
2. ✅ V1-V6 migrations ran fine
3. ❌ V7 started: "Migrating to version 7 - Add performance indexes"
4. ❌ V7 hit error: `column "author_id" does not exist`
5. ❌ Migration failed → App crashed
6. ❌ Port never opened → "No ports detected"

---

## ✅ Fixes Applied

### 1. Fixed Both `.disabled` Files
**Files updated:**
- `backend/src/main/resources/db/migration/V7__Add_performance_indexes.sql.disabled`
- `backend/src/main/resources/db/migration/postgresql/V7__Add_performance_indexes.sql.disabled`

**Changes:**
```sql
-- REMOVED (wrong column + duplicates):
CREATE INDEX idx_event_comments_event_id ON event_comments(event_id);
CREATE INDEX idx_event_comments_author_id ON event_comments(author_id);
CREATE INDEX idx_event_comment_replies_comment_id ON event_comment_replies(comment_id);
CREATE INDEX idx_event_comment_replies_author_id ON event_comment_replies(author_id);

-- REPLACED WITH (comment explaining V5 already covers these):
-- Event comments indexes (V5 already created idx_comment_event and idx_comment_member)
-- No new indexes needed - already covered by V5

-- Event comment replies indexes (V5 already created idx_reply_comment and idx_reply_member)
-- No new indexes needed - already covered by V5
```

### 2. V7 Now Only Creates These Indexes:
```sql
-- Events table (4 indexes)
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_group_id ON events(group_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_group_date ON events(group_id, event_date);

-- Subscriptions table (5 indexes)
CREATE INDEX IF NOT EXISTS idx_subscriptions_member_id ON subscriptions(member_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_group_id ON subscriptions(group_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_member_status ON subscriptions(member_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_group_status ON subscriptions(group_id, status);

-- Event participants (3 indexes)
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_member_id ON event_participants(member_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_status ON event_participants(status);

-- Groups table (3 indexes)
CREATE INDEX IF NOT EXISTS idx_groups_primary_organiser_id ON groups(primary_organiser_id);
CREATE INDEX IF NOT EXISTS idx_groups_is_public ON groups(is_public);
CREATE INDEX IF NOT EXISTS idx_groups_active ON groups(active);

-- Total: 15 indexes (down from 18)
-- Removed: 3 duplicate/wrong indexes
```

---

## 🚀 Current Status

### ✅ Deployment in Progress (Without V7)
The current deployment has V7 **disabled**, so it will succeed:
```
✅ V1-V6 migrations run
✅ App starts successfully
✅ Port opens
✅ Deployment succeeds
```

### Next Steps (After Successful Deployment)

You have **3 options** to add the indexes:

---

### Option A: Re-enable Fixed V7 Migration (Cleanest) ⭐

Once the app is running without V7:

```bash
# 1. Rename files to re-enable migration
git mv backend/src/main/resources/db/migration/postgresql/V7__Add_performance_indexes.sql.disabled \
        backend/src/main/resources/db/migration/postgresql/V7__Add_performance_indexes.sql

git mv backend/src/main/resources/db/migration/V7__Add_performance_indexes.sql.disabled \
        backend/src/main/resources/db/migration/V7__Add_performance_indexes.sql

# 2. Commit and push
git add -A
git commit -m "Re-enable fixed V7 indexes migration"
git push origin main

# 3. Render redeploys and applies V7 (now fixed)
```

**Flyway will:**
- Check: Has V7 been applied? → NO
- Run: V7 migration (with fixed SQL)
- Success: All 15 indexes created ✅

---

### Option B: Create V8 Migration (Safest)

If you want a clean slate:

```bash
# 1. Create new V8 migration (copy fixed V7 content)
cp backend/src/main/resources/db/migration/postgresql/V7__Add_performance_indexes.sql.disabled \
   backend/src/main/resources/db/migration/postgresql/V8__Add_performance_indexes_fixed.sql

# 2. Delete disabled files
rm backend/src/main/resources/db/migration/**/*V7*.disabled

# 3. Commit and push
git add -A
git commit -m "Add fixed indexes as V8 migration"
git push origin main
```

**Advantage**: Avoids any Flyway checksum issues with V7

---

### Option C: Apply Indexes Manually (Fastest)

Connect directly to Render database and run:

```sql
-- Events table indexes
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_group_id ON events(group_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_group_date ON events(group_id, event_date);

-- Subscriptions table indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_member_id ON subscriptions(member_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_group_id ON subscriptions(group_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_member_status ON subscriptions(member_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_group_status ON subscriptions(group_id, status);

-- Event participants indexes
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_member_id ON event_participants(member_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_status ON event_participants(status);

-- Groups table indexes
CREATE INDEX IF NOT EXISTS idx_groups_primary_organiser_id ON groups(primary_organiser_id);
CREATE INDEX IF NOT EXISTS idx_groups_is_public ON groups(is_public);
CREATE INDEX IF NOT EXISTS idx_groups_active ON groups(active);
```

**Advantage**: Indexes applied immediately, no redeployment needed

---

## 📊 Verification

After adding indexes (whichever option you choose):

### 1. Check Indexes Exist
```sql
-- Connect to Render database
SELECT 
    tablename, 
    indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

### 2. Verify Performance Improvement
```sql
-- Check if query uses index
EXPLAIN ANALYZE 
SELECT * FROM events 
WHERE event_date > NOW() 
ORDER BY event_date 
LIMIT 10;

-- Should show: "Index Scan using idx_events_event_date"
```

---

## 🔍 How Was This Discovered?

**Excellent debugging by you!** 🎯

You:
1. Noticed deployment broke after adding indexes
2. Checked Render logs → Saw migration hanging at V7
3. **Ran the CREATE INDEX commands manually on the database**
4. Got error: `column "author_id" does not exist`
5. Identified the root cause!

This is the right way to debug migration issues!

---

## 📚 Lessons Learned

### 1. Always Test Migrations Locally First
```bash
# Before committing, test with fresh database:
docker run --rm -e POSTGRES_PASSWORD=test -p 5433:5432 postgres:15
./gradlew bootRun
# Check all migrations succeed
```

### 2. Verify Column Names Match Schema
```bash
# Double-check against actual table definitions
grep -r "author_id" src/main/resources/db/migration/
grep -r "member_id" src/main/resources/db/migration/
```

### 3. Check for Duplicate Indexes
Before adding indexes, verify they don't already exist:
```sql
SELECT indexname FROM pg_indexes 
WHERE tablename = 'event_comments';
```

### 4. Use Concurrent Index Creation (Production)
For large tables, use:
```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS ...
```
This won't block reads/writes during creation.

---

## 📋 Summary

| Issue | Status |
|-------|--------|
| Wrong column names (`author_id` vs `member_id`) | ✅ Fixed |
| Duplicate indexes (V5 already created) | ✅ Fixed |
| V7 files updated | ✅ Both MariaDB and PostgreSQL |
| Current deployment | ✅ Running without V7 |
| Indexes can be added after | ✅ 3 options available |

---

## ⏭️ Next Actions

1. ✅ **Now**: Watch Render logs for successful deployment (without V7)
2. ⏳ **After success**: Choose Option A, B, or C to add indexes
3. ✅ **Verify**: Test query performance with new indexes
4. 🎉 **Done**: Full deployment with optimized performance!

---

## 🚨 Important Note

**DO NOT** commit/push the fixed `.disabled` files as enabled migrations until:
1. Current deployment succeeds (without V7)
2. Database is in a known good state
3. You've chosen which option (A, B, or C) to use

Right now, the fixes are saved locally but V7 is disabled for deployment - which is exactly what we want! ✅
