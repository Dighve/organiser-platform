# PostgreSQL Migration Fix for Render Deployment

## Problem
The PostgreSQL migration scripts were incomplete and didn't have parity with the MariaDB Flyway scripts, which would cause deployment failures on Render.com.

## What Was Fixed

### 1. Complete PostgreSQL Migration Scripts Created ✅

Created full parity with MariaDB migrations in `backend/src/main/resources/db/migration/postgresql/`:

#### **V1.1__Combined_schema.sql**
- ✅ All 12 tables with proper PostgreSQL syntax:
  - `members` - User accounts
  - `activities` - Activity types (Hiking, Cycling, etc.)
  - `groups` - Activity groups
  - `group_co_organisers` - Group co-organizers
  - `events` - Events organized by groups
  - `event_organisers` - Event organizers mapping
  - `event_participants` - Event registrations
  - `event_additional_images` - Event photo galleries
  - `event_requirements` - Event requirements list
  - `event_included_items` - What's included in events
  - `subscriptions` - Group memberships
  - `magic_links` - Passwordless authentication tokens

- ✅ PostgreSQL-specific features:
  - `BIGSERIAL` instead of `BIGINT AUTO_INCREMENT`
  - `DOUBLE PRECISION` instead of `DOUBLE`
  - Separate `CREATE INDEX` statements
  - Trigger functions for `updated_at` columns

#### **V2__Insert_test_data.sql**
- ✅ Test data with PostgreSQL syntax:
  - `CURRENT_TIMESTAMP` instead of `NOW()`
  - `INTERVAL` syntax for date arithmetic
  - Sample activities, members, groups, events, and participants

#### **V3__Update_event_participants_schema.sql**
- ✅ Schema updates:
  - Add `notes`, `registration_date`, `registered_at`, `cancelled_at`, `attended` columns
  - Remove `role` column
  - PostgreSQL `ALTER COLUMN` syntax

#### **V4__Update_member_with_is_organiser_schema.sql**
- ✅ Add `is_organiser` flag to members table

### 2. Fixed Database Configuration ✅

#### **application-prod.properties**
- **Before**: Tried to construct JDBC URL from individual env vars (`DATABASE_HOST`, `DATABASE_USER`, etc.)
- **After**: Uses `DATABASE_URL` directly as provided by Render
```properties
spring.datasource.url=${DATABASE_URL:jdbc:postgresql://localhost:5432/organiser_platform}
spring.datasource.driver-class-name=org.postgresql.Driver
```

#### **render.yaml**
- **Before**: Set multiple database env vars (`DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`)
- **After**: Simplified to only `DATABASE_URL` (Render's standard approach)
```yaml
- key: DATABASE_URL
  fromDatabase:
    name: hikehub-db
    property: connectionString
```

### 3. Fixed Build Configuration ✅

#### **build.gradle**
- **Before**: Excluded PostgreSQL migrations from build with `processResources`
- **After**: Includes all migrations, letting Spring profiles determine which to use
  - Local dev: Uses MariaDB migrations (from `application.properties`)
  - Production: Uses PostgreSQL migrations (from `application-prod.properties`)

## Database Schema Overview

The complete schema supports the HikeHub platform with:

### Core Features
- **Passwordless Authentication**: Magic link-based login
- **Activities**: Different outdoor activity types
- **Groups**: Activity-specific communities
- **Events**: Group-organized activities with:
  - Location and coordinates
  - Registration limits and deadlines
  - Pricing and difficulty levels
  - Distance, elevation, duration tracking
  - Ratings and reviews
  - Requirements and included items
- **Subscriptions**: Member-group relationships
- **Event Participation**: RSVP and attendance tracking

## How to Deploy to Render

### Option 1: Using Render Dashboard (Recommended)
1. Push your code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click "New +" → "Blueprint"
4. Connect your GitHub repo
5. Select the `backend/render.yaml` file
6. Click "Apply" - Render will create both the database and web service
7. Set environment variables if needed (JWT_SECRET is auto-generated)

### Option 2: Using Render CLI
```bash
cd backend
render-cli deploy
```

### Verify Deployment
1. Check service logs: `https://dashboard.render.com/web/<your-service>`
2. Test health endpoint: `https://your-app.onrender.com/actuator/health`
3. Check database migration: Look for Flyway logs showing successful migrations

## Migration Execution Order

Flyway will execute migrations in this order:
1. **V1.1__Combined_schema.sql** - Creates all tables
2. **V2__Insert_test_data.sql** - Inserts sample data
3. **V3__Update_event_participants_schema.sql** - Updates event participants schema
4. **V4__Update_member_with_is_organiser_schema.sql** - Adds organiser flag

## Testing PostgreSQL Migrations Locally (Optional)

If you want to test PostgreSQL migrations locally before deploying:

1. **Install PostgreSQL** locally
2. **Create a test database**:
   ```sql
   CREATE DATABASE organiser_platform_test;
   ```

3. **Update application.properties** temporarily:
   ```properties
   spring.profiles.active=prod
   spring.datasource.url=jdbc:postgresql://localhost:5432/organiser_platform_test
   spring.datasource.username=postgres
   spring.datasource.password=yourpassword
   ```

4. **Run the application**:
   ```bash
   ./gradlew bootRun
   ```

5. **Check the database**:
   ```sql
   \c organiser_platform_test
   \dt  -- List all tables
   SELECT * FROM flyway_schema_history;  -- Check migration history
   ```

## Rollback Plan

If deployment fails:
1. Render keeps the previous version running
2. Check logs: `https://dashboard.render.com/web/<service-id>/logs`
3. Common issues:
   - **JWT_SECRET not set**: Set manually in Render dashboard
   - **Database connection failed**: Check DATABASE_URL in environment
   - **Migration failed**: Check Flyway logs for specific SQL errors

## Summary

✅ **All PostgreSQL migrations created with full parity to MariaDB**  
✅ **Database configuration simplified for Render**  
✅ **Build process fixed to include PostgreSQL migrations**  
✅ **Ready for deployment to Render.com**

The deployment should now work smoothly on Render platform! 🚀
