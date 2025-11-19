# OutMeets Backend Startup Guide

## Quick Start

### 1. Ensure PostgreSQL is Running
```bash
# Check if PostgreSQL is running
psql --version

# Start PostgreSQL (if using Homebrew)
brew services start postgresql@14

# Or if using PostgreSQL.app, just launch the app

# Verify connection
psql -U organiser_user -d organiser_platform -c "SELECT version();"
```

### 2. Start the Backend Application
```bash
cd backend
./gradlew bootRun
```

The application will start on **http://localhost:8080**

## Verify Application is Running

### Check Health Status
```bash
curl http://localhost:8080/actuator/health
```

Expected response shows database status:
```json
{
  "status": "DOWN",
  "components": {
    "db": {"status": "UP"},
    "diskSpace": {"status": "UP"},
    "mail": {"status": "DOWN"},  // Expected - no mail server in dev
    "ping": {"status": "UP"}
  }
}
```

### Check Application Endpoints
```bash
# Health endpoint
curl http://localhost:8080/actuator/health

# API base
curl http://localhost:8080/api/

# Events endpoint (may require authentication)
curl http://localhost:8080/api/events
```

## Troubleshooting

### Port 8080 Already in Use
```bash
# Find and kill process using port 8080
lsof -ti:8080 | xargs kill -9

# Then restart the application
./gradlew bootRun
```

### Database Connection Issues
```bash
# Check PostgreSQL is running
brew services list | grep postgresql

# Restart PostgreSQL if needed
brew services restart postgresql@14

# Verify database exists
psql postgres -c "\l" | grep organiser_platform

# Recreate database if needed
psql postgres -c "DROP DATABASE IF EXISTS organiser_platform;"
psql postgres -c "CREATE DATABASE organiser_platform;"
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE organiser_platform TO organiser_user;"
```

### Check Running Processes
```bash
# Check if application is running
lsof -i:8080

# Check Java processes
ps aux | grep '[j]ava.*boot'
```

## Configuration

### Active Profile
The application uses the `dev` profile by default (configured in `application.properties`):
- Database: PostgreSQL on localhost:5432
- JWT Secret: Development key
- Server Port: 8080

### Database Credentials
- Database: `organiser_platform`
- User: `organiser_user`
- Password: `organiser_pass`
- Port: 5432

## API Documentation

### Base URL
```
http://localhost:8080/api
```

### Main Endpoints
- `/api/auth/*` - Authentication endpoints
- `/api/events/*` - Event management
- `/api/groups/*` - Group management
- `/api/members/*` - Member management
- `/api/activities/*` - Activity management
- `/actuator/*` - Application health and metrics

## Stopping the Application

### Stop Backend
Press `Ctrl+C` in the terminal running `./gradlew bootRun`

### Stop Database
```bash
# Stop PostgreSQL service (if using Homebrew)
brew services stop postgresql@14

# Or if using PostgreSQL.app, just quit the app
```

## What Was Fixed

1. ✅ Added default `dev` profile in `application.properties`
2. ✅ Added default values for environment variables (DATABASE_URL, JWT_SECRET)
3. ✅ Configured PostgreSQL for local development
4. ✅ Installed and started PostgreSQL database
5. ✅ Killed conflicting process on port 8080
6. ✅ Started application successfully

## Application Status

- ✅ **Database**: PostgreSQL running and connected
- ✅ **Backend**: Spring Boot application running on port 8080
- ✅ **Flyway**: All 4 migrations applied successfully
- ✅ **Hibernate**: JPA initialized
- ✅ **Security**: JWT authentication configured
- ✅ **Health Check**: Accessible at `/actuator/health`

Application is ready for development! 🚀
