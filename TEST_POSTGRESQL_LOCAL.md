# Testing PostgreSQL Migrations Locally

This guide will help you test the PostgreSQL migrations locally before deploying to Render.

## Prerequisites

### 1. Install PostgreSQL

**On macOS (using Homebrew):**
```bash
# Install PostgreSQL
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15

# Or start manually for this session only
pg_ctl -D /opt/homebrew/var/postgresql@15 start
```

**On Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**On Windows:**
Download and install from: https://www.postgresql.org/download/windows/

### 2. Verify PostgreSQL is Running

```bash
# Check if PostgreSQL is running
psql --version

# Check service status (macOS)
brew services list | grep postgresql

# Check service status (Linux)
sudo systemctl status postgresql
```

## Setup Test Database

### Step 1: Access PostgreSQL
```bash
# Connect to PostgreSQL as superuser
psql postgres

# Or on some systems:
sudo -u postgres psql
```

### Step 2: Create Test Database and User (Optional)
```sql
-- Create database
CREATE DATABASE hikehub_test;

-- Create user (optional, if you want separate user)
-- CREATE USER hikehub_user WITH PASSWORD 'hikehub_password';
-- GRANT ALL PRIVILEGES ON DATABASE hikehub_test TO hikehub_user;

-- List databases to verify
\l

-- Exit psql
\q
```

## Test the Migrations

### Option 1: Using Gradle with Profile (Recommended)

```bash
cd /Users/vikumar/Projects/CascadeProjects/windsurf-project/organiser-platform/backend

# Run with postgres-local profile
./gradlew bootRun --args='--spring.profiles.active=postgres-local'
```

### Option 2: Using Environment Variables

```bash
cd /Users/vikumar/Projects/CascadeProjects/windsurf-project/organiser-platform/backend

# Set environment variables and run
export SPRING_PROFILES_ACTIVE=postgres-local
./gradlew bootRun
```

### Option 3: Direct PostgreSQL Connection (Override Properties)

```bash
cd /Users/vikumar/Projects/CascadeProjects/windsurf-project/organiser-platform/backend

./gradlew bootRun \
  --args='--spring.datasource.url=jdbc:postgresql://localhost:5432/hikehub_test \
  --spring.datasource.username=postgres \
  --spring.datasource.password=postgres \
  --spring.datasource.driver-class-name=org.postgresql.Driver \
  --spring.flyway.locations=classpath:db/migration/postgresql \
  --jwt.secret=test-secret-for-local-only'
```

## What to Look For

### ✅ Successful Migration Output

You should see output like this:

```
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::                (v3.1.5)

2025-10-17T00:05:00.123  INFO --- [main] c.o.p.OrganiserPlatformApplication       : Starting OrganiserPlatformApplication
2025-10-17T00:05:01.234  INFO --- [main] o.f.c.i.database.base.BaseDatabaseType   : Database: jdbc:postgresql://localhost:5432/hikehub_test
2025-10-17T00:05:01.345  INFO --- [main] o.f.core.internal.command.DbValidate     : Successfully validated 4 migrations
2025-10-17T00:05:01.456  INFO --- [main] o.f.core.internal.command.DbMigrate      : Current version of schema "public": << Empty Schema >>
2025-10-17T00:05:01.567  INFO --- [main] o.f.core.internal.command.DbMigrate      : Migrating schema "public" to version "1.1 - Combined schema"
2025-10-17T00:05:02.678  INFO --- [main] o.f.core.internal.command.DbMigrate      : Migrating schema "public" to version "2 - Insert test data"
2025-10-17T00:05:02.789  INFO --- [main] o.f.core.internal.command.DbMigrate      : Migrating schema "public" to version "3 - Update event participants schema"
2025-10-17T00:05:02.890  INFO --- [main] o.f.core.internal.command.DbMigrate      : Migrating schema "public" to version "4 - Update member with is organiser schema"
2025-10-17T00:05:02.991  INFO --- [main] o.f.core.internal.command.DbMigrate      : Successfully applied 4 migrations to schema "public"
2025-10-17T00:05:03.102  INFO --- [main] o.hibernate.jpa.internal.util.LogHelper  : HHH000204: Processing PersistenceUnitInfo [name: default]
2025-10-17T00:05:03.213  INFO --- [main] com.zaxxer.hikari.HikariDataSource       : HikariPool-1 - Starting...
2025-10-17T00:05:03.324  INFO --- [main] com.zaxxer.hikari.HikariDataSource       : HikariPool-1 - Start completed.
2025-10-17T00:05:04.435  INFO --- [main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat started on port(s): 8080 (http)
2025-10-17T00:05:04.546  INFO --- [main] c.o.p.OrganiserPlatformApplication       : Started OrganiserPlatformApplication in 4.423 seconds
```

### ✅ Key Success Indicators

1. **Flyway validates migrations**: `Successfully validated 4 migrations`
2. **All migrations applied**: `Successfully applied 4 migrations to schema "public"`
3. **Database connection successful**: `HikariPool-1 - Start completed`
4. **Application starts**: `Started OrganiserPlatformApplication`
5. **No errors in logs**

## Verify Database Contents

### Connect to Database
```bash
psql -d hikehub_test -U postgres
```

### Check Migration History
```sql
-- View migration history
SELECT installed_rank, version, description, type, script, checksum, installed_on, success 
FROM flyway_schema_history 
ORDER BY installed_rank;
```

Expected output:
```
 installed_rank | version | description                              | type | script                                      | checksum   | installed_on        | success
----------------+---------+------------------------------------------+------+---------------------------------------------+------------+---------------------+---------
              1 | 1.1     | Combined schema                          | SQL  | V1.1__Combined_schema.sql                   | 123456789  | 2025-10-17 00:05:01 | t
              2 | 2       | Insert test data                         | SQL  | V2__Insert_test_data.sql                    | 234567890  | 2025-10-17 00:05:02 | t
              3 | 3       | Update event participants schema         | SQL  | V3__Update_event_participants_schema.sql    | 345678901  | 2025-10-17 00:05:02 | t
              4 | 4       | Update member with is organiser schema   | SQL  | V4__Update_member_with_is_organiser_schema. | 456789012  | 2025-10-17 00:05:02 | t
```

### Check All Tables Created
```sql
-- List all tables
\dt

-- Or with details
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Expected tables (12 total):
```
 table_name
-----------------------
 activities
 event_additional_images
 event_included_items
 event_organisers
 event_participants
 event_requirements
 events
 flyway_schema_history
 group_co_organisers
 groups
 magic_links
 members
 subscriptions
```

### Check Sample Data
```sql
-- Check activities (should be 5)
SELECT id, name, description FROM activities;

-- Check members (should be 4)
SELECT id, email, display_name, verified FROM members;

-- Check groups (should be 3)
SELECT id, name, location, primary_organiser_id FROM groups;

-- Check events (should be 4)
SELECT id, title, status, event_date, location FROM events;

-- Check event participants (should be 6)
SELECT id, event_id, member_id, status FROM event_participants;

-- Check subscriptions (should be 4)
SELECT id, member_id, group_id, status FROM subscriptions;
```

### Check Table Schema
```sql
-- Check events table structure (verify all columns)
\d events

-- Check event_participants table structure
\d event_participants

-- Check members table (should have is_organiser column)
\d members
```

## Test API Endpoints

Once the application is running, test these endpoints:

### Health Check
```bash
curl http://localhost:8080/actuator/health
```

Expected response:
```json
{"status":"UP"}
```

### Get All Activities
```bash
curl http://localhost:8080/api/activities
```

Expected: List of 5 activities (Hiking, Cycling, Running, Swimming, Yoga)

### Get All Events
```bash
curl http://localhost:8080/api/events?page=0&size=10
```

Expected: List of 4 sample events

### Get Event by ID
```bash
curl http://localhost:8080/api/events/1
```

Expected: Mount Tamalpais Summit Hike details

### Get Events by Group
```bash
curl http://localhost:8080/api/events/group/1?page=0&size=10
```

Expected: Events for Mountain Hikers group

## Troubleshooting

### ❌ "Connection refused" Error
```
Connection to localhost:5432 refused
```

**Fix:**
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# Start PostgreSQL
brew services start postgresql@15
```

### ❌ "Authentication failed" Error
```
FATAL: password authentication failed for user "postgres"
```

**Fix:**
```bash
# Reset PostgreSQL password
psql postgres
ALTER USER postgres PASSWORD 'postgres';
\q
```

### ❌ "Database does not exist" Error
```
FATAL: database "hikehub_test" does not exist
```

**Fix:**
```bash
psql postgres
CREATE DATABASE hikehub_test;
\q
```

### ❌ "Migration checksum mismatch" Error
```
Migration checksum mismatch for migration version 1.1
```

**Fix:**
```bash
# Drop and recreate database
psql postgres
DROP DATABASE hikehub_test;
CREATE DATABASE hikehub_test;
\q

# Run application again
./gradlew bootRun --args='--spring.profiles.active=postgres-local'
```

### ❌ Port 8080 Already in Use
```
Port 8080 was already in use
```

**Fix:**
```bash
# Find and kill process using port 8080
lsof -ti:8080 | xargs kill -9

# Or use different port
./gradlew bootRun --args='--spring.profiles.active=postgres-local --server.port=8081'
```

## Clean Up After Testing

### Stop the Application
Press `Ctrl+C` in the terminal running the application

### Drop Test Database (Optional)
```bash
psql postgres
DROP DATABASE hikehub_test;
\q
```

### Stop PostgreSQL Service (Optional)
```bash
# macOS
brew services stop postgresql@15

# Linux
sudo systemctl stop postgresql
```

## Next Steps After Successful Test

If all migrations run successfully locally:

1. ✅ Commit your changes
2. ✅ Push to GitHub
3. ✅ Deploy to Render using the deployment guide
4. ✅ The exact same migrations will run on Render's PostgreSQL

## Quick Test Command

For quick testing, use this one-liner:

```bash
cd /Users/vikumar/Projects/CascadeProjects/windsurf-project/organiser-platform/backend && ./gradlew bootRun --args='--spring.profiles.active=postgres-local'
```

---

**Happy Testing! 🧪🐘**
