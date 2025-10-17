# Spring Profile Guide

## 🎯 Available Profiles

### 1. **`local`** - MariaDB Development
```bash
./gradlew bootRun --args='--spring.profiles.active=local'
```
- **Database:** MariaDB on localhost:3307
- **Migrations:** `/db/migration/` (MariaDB-specific SQL)
- **Use Case:** Local development with MariaDB
- **⚠️ Current Issue:** Finds duplicate migrations (scans postgresql subfolder)

---

### 2. **`postgres-local`** - PostgreSQL Development ✅ **RECOMMENDED**
```bash
./gradlew bootRun --args='--spring.profiles.active=postgres-local'
```
- **Database:** PostgreSQL on localhost:5432
- **Migrations:** `/db/migration/postgresql/` (PostgreSQL-specific SQL)
- **Use Case:** Local development with PostgreSQL (matches production)
- **✅ Status:** **WORKING** - Use this for local development!

---

### 3. **`prod`** - Production (Render)
```bash
# Not for local use - activated automatically on Render
```
- **Database:** PostgreSQL on Render
- **Migrations:** `/db/migration/postgresql/`
- **Use Case:** Production deployment only
- **Environment:** Render.com

---

### 4. **`test`** - JUnit Tests Only ❌
```bash
# Don't use with bootRun!
./gradlew test  # This is how you use test profile
```
- **Database:** H2 in-memory
- **Migrations:** Disabled (uses JPA schema generation)
- **Use Case:** Running automated tests ONLY
- **⚠️ Note:** Cannot be used with `./gradlew bootRun`

---

## 📋 Quick Reference

| Profile | Command | Database | Status |
|---------|---------|----------|--------|
| `local` | `./gradlew bootRun --args='--spring.profiles.active=local'` | MariaDB | ⚠️ Has migration conflict |
| `postgres-local` | `./gradlew bootRun --args='--spring.profiles.active=postgres-local'` | PostgreSQL | ✅ **USE THIS** |
| `prod` | Auto-activated on Render | PostgreSQL | 🚀 Production only |
| `test` | `./gradlew test` | H2 (memory) | ✅ For tests only |

---

## 🔧 Why `test` Profile Fails with `bootRun`

The `test` profile configuration is located in:
```
src/test/resources/application-test.properties
```

This location is **only available during test execution**, not when running the main application with `bootRun`.

When you run `./gradlew bootRun --args='--spring.profiles.active=test'`:
- ❌ Can't find `src/test/resources/application-test.properties`
- ❌ Falls back to `src/main/resources/application.properties`
- ❌ Requires `JWT_SECRET` environment variable (not set)
- ❌ **Result: Application fails to start**

---

## 🚀 Recommended Local Development Setup

### Option 1: PostgreSQL (Recommended - matches production)

1. **Start PostgreSQL:**
   ```bash
   # If not already running from previous tests
   brew services start postgresql@15
   ```

2. **Ensure database exists:**
   ```bash
   export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"
   psql postgres -c "SELECT 1 FROM pg_database WHERE datname = 'hikehub_test'" | grep -q 1 || \
   psql postgres -c "CREATE DATABASE hikehub_test;"
   ```

3. **Run the application:**
   ```bash
   cd backend
   ./gradlew bootRun --args='--spring.profiles.active=postgres-local'
   ```

4. **Access the application:**
   - API: http://localhost:8080
   - Health: http://localhost:8080/actuator/health
   - API Docs: http://localhost:8080/swagger-ui.html

---

### Option 2: MariaDB (If you prefer)

1. **Fix the migration conflict** (see below)
2. **Run:**
   ```bash
   ./gradlew bootRun --args='--spring.profiles.active=local'
   ```

---

## 🛠️ Fixing the MariaDB `local` Profile

The `local` profile is finding duplicate migrations because Flyway is scanning subdirectories.

### Quick Fix:
Update `application-local.properties`:

```properties
# Current (finds both /db/migration/ AND /db/migration/postgresql/)
spring.flyway.locations=classpath:db/migration

# Fix Option 1: Reorganize to mariadb subfolder
spring.flyway.locations=classpath:db/migration/mariadb

# Fix Option 2: Use filesystem path to be explicit
spring.flyway.locations=filesystem:src/main/resources/db/migration
```

Then move MariaDB migrations to a `mariadb` subfolder to mirror the PostgreSQL structure.

---

## 🎯 Summary

**For Local Development:**
```bash
# ✅ Use this (PostgreSQL - matches production)
./gradlew bootRun --args='--spring.profiles.active=postgres-local'

# ❌ Don't use this (test profile is for JUnit tests only)
./gradlew bootRun --args='--spring.profiles.active=test'
```

**For Running Tests:**
```bash
# ✅ Correct way to use test profile
./gradlew test

# ❌ Wrong
./gradlew bootRun --args='--spring.profiles.active=test'
```

**For Production (Render):**
- Profile automatically set to `prod`
- No manual intervention needed
- Uses `DATABASE_URL` from environment

---

## 📚 Profile Configuration Files

```
backend/src/main/resources/
├── application.properties              # Base config
├── application-local.properties        # MariaDB local dev
├── application-postgres-local.properties  # PostgreSQL local dev ✅
├── application-prod.properties         # Production (Render)
└── application-test.properties         # ❌ NOT HERE!

backend/src/test/resources/
└── application-test.properties         # ✅ Test profile (JUnit only)
```

---

## 🎉 Quick Start for Development

```bash
# 1. Start PostgreSQL (if not running)
brew services start postgresql@15

# 2. Navigate to backend
cd /Users/vikumar/Projects/CascadeProjects/windsurf-project/organiser-platform/backend

# 3. Run with PostgreSQL profile
./gradlew bootRun --args='--spring.profiles.active=postgres-local'

# 4. In another terminal, access the API
curl http://localhost:8080/actuator/health
curl http://localhost:8080/api/v1/events/public?page=0&size=10
```

✅ **Your backend is now running locally with PostgreSQL!**
