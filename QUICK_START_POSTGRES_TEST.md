# Quick Start: Test PostgreSQL Migrations Locally

## 🚀 One-Command Setup (Easiest)

```bash
cd /Users/vikumar/Projects/CascadeProjects/windsurf-project/organiser-platform
./test-postgres-local.sh
```

This script will:
- ✅ Check if PostgreSQL is installed and running
- ✅ Create `hikehub_test` database
- ✅ Run the application with PostgreSQL
- ✅ Execute all 4 migrations
- ✅ Load sample data

## 📝 Manual Setup (Step by Step)

### Prerequisites
```bash
# Install PostgreSQL (macOS)
brew install postgresql@15
brew services start postgresql@15

# Verify installation
psql --version
pg_isready
```

### Create Database
```bash
# Connect to PostgreSQL
psql postgres

# Create test database
CREATE DATABASE hikehub_test;

# Exit
\q
```

### Run Application
```bash
cd /Users/vikumar/Projects/CascadeProjects/windsurf-project/organiser-platform/backend

# Run with PostgreSQL profile
./gradlew bootRun --args='--spring.profiles.active=postgres-local'
```

## ✅ What to Look For

### In Application Logs:
```
✅ Successfully validated 4 migrations
✅ Successfully applied 4 migrations to schema "public"
✅ HikariPool-1 - Start completed
✅ Started OrganiserPlatformApplication in X.XXX seconds
```

### Test API:
```bash
# Health check
curl http://localhost:8080/actuator/health

# Get activities
curl http://localhost:8080/api/activities

# Get events
curl http://localhost:8080/api/events?page=0&size=10
```

## 🔍 Verify Database

```bash
# Connect to database
psql -d hikehub_test -U postgres

# Check migration history
SELECT version, description, success FROM flyway_schema_history;

# Check tables (should see 12 tables)
\dt

# Check sample data
SELECT COUNT(*) FROM activities;  -- Should be 5
SELECT COUNT(*) FROM members;     -- Should be 4
SELECT COUNT(*) FROM groups;      -- Should be 3
SELECT COUNT(*) FROM events;      -- Should be 4

# Exit
\q
```

## 🛠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| **PostgreSQL not installed** | `brew install postgresql@15` |
| **PostgreSQL not running** | `brew services start postgresql@15` |
| **Database doesn't exist** | `psql postgres -c "CREATE DATABASE hikehub_test;"` |
| **Port 8080 in use** | `lsof -ti:8080 \| xargs kill -9` |
| **Connection refused** | Check PostgreSQL status: `pg_isready` |

## 🧹 Clean Up

```bash
# Stop application: Ctrl+C

# Drop test database (optional)
psql postgres -c "DROP DATABASE hikehub_test;"

# Stop PostgreSQL (optional)
brew services stop postgresql@15
```

## 📊 Expected Results

After successful run:

- ✅ **4 migrations executed**: V1.1, V2, V3, V4
- ✅ **12 tables created**: activities, members, groups, events, subscriptions, magic_links, etc.
- ✅ **Sample data inserted**: 5 activities, 4 members, 3 groups, 4 events
- ✅ **Application running**: http://localhost:8080
- ✅ **API responding**: All endpoints return data

## 🎯 Success Criteria

Your PostgreSQL setup is working when:

1. All migrations execute without errors
2. All 12 tables are created
3. Sample data is present
4. API endpoints return expected data
5. No errors in application logs

---

**Ready to test? Run: `./test-postgres-local.sh` 🚀**
