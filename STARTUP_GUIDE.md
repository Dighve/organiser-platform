# HikeHub Backend Startup Guide

## Quick Start

### 1. Start Docker and Database
```bash
# Open Docker Desktop (or run this command)
open -a Docker

# Start MariaDB database
docker-compose up -d

# Verify database is running
docker ps
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
# Stop and recreate database with fresh credentials
docker-compose down -v
docker-compose up -d

# Wait for database to be healthy
sleep 10 && docker ps
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
- Database: MariaDB on localhost:3307
- JWT Secret: Development key
- Server Port: 8080

### Database Credentials
- Database: `organiser_platform`
- User: `organiser_user`
- Password: `organiser_pass`
- Port: 3307 (mapped from container's 3306)

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
docker-compose down
```

### Stop Everything (including volumes)
```bash
docker-compose down -v
```

## What Was Fixed

1. ✅ Added default `dev` profile in `application.properties`
2. ✅ Added default values for environment variables (DATABASE_URL, JWT_SECRET)
3. ✅ Removed duplicate PostgreSQL migration files
4. ✅ Started Docker and MariaDB database
5. ✅ Killed conflicting process on port 8080
6. ✅ Started application successfully

## Application Status

- ✅ **Database**: MariaDB running and connected
- ✅ **Backend**: Spring Boot application running on port 8080
- ✅ **Flyway**: All 4 migrations applied successfully
- ✅ **Hibernate**: JPA initialized
- ✅ **Security**: JWT authentication configured
- ✅ **Health Check**: Accessible at `/actuator/health`

Application is ready for development! 🚀
