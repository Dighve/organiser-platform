# 🚀 Quick Start Guide

Get the Organiser Platform up and running in minutes!

## Option 1: Docker Compose (Recommended for Quick Start)

### Prerequisites
- Docker Desktop installed
- 4GB+ RAM available

### Steps

1. **Navigate to project directory**
```bash
cd organiser-platform
```

2. **Start all services**
```bash
docker-compose up -d
```

3. **Wait for services to start** (about 30-60 seconds)
```bash
docker-compose logs -f
```

4. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- API Health: http://localhost:8080/actuator/health
- H2 Console (dev): http://localhost:8080/h2-console

5. **Stop the application**
```bash
docker-compose down
```

## Option 2: Local Development (No Docker)

### Prerequisites
- Java 17+
- Node.js 18+
- PostgreSQL 15 (optional, can use H2)
- Redis 7 (optional)

### Backend Setup

1. **Navigate to backend**
```bash
cd backend
```

2. **Build the project**
```bash
./gradlew build
```

3. **Run with H2 database (no PostgreSQL needed)**
```bash
./gradlew bootRun --args='--spring.profiles.active=dev'
```

Backend will start on http://localhost:8080

### Frontend Setup

1. **Open new terminal and navigate to frontend**
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Create environment file**
```bash
cp .env.example .env
```

4. **Start development server**
```bash
npm run dev
```

Frontend will start on http://localhost:3000

## 🧪 Testing the Application

### 1. Register a New User
- Go to http://localhost:3000/register
- Fill in the registration form
- Click "Create account"

### 2. Login
- Go to http://localhost:3000/login
- Enter your credentials
- Click "Sign in"

### 3. Browse Events
- Click "Browse Events" in the navigation
- Search for events
- View event details

### 4. Create an Event (as Organiser)
- Click "Create Event" in the navigation
- Fill in event details
- Save as draft or publish

## 📊 Sample Data (Coming Soon)

To populate the database with sample data:

```bash
cd backend
./gradlew bootRun --args='--spring.profiles.active=dev --seed-data=true'
```

## 🔧 Common Issues

### Port Already in Use
If ports 3000, 8080, 5432, or 6379 are already in use:

**Docker Compose**: Edit `docker-compose.yml` and change the port mappings

**Local Development**: 
- Backend: Add `--server.port=8081` to bootRun args
- Frontend: Edit `vite.config.js` and change the port

### Database Connection Issues
If using PostgreSQL locally, ensure:
1. PostgreSQL is running
2. Database `organiser_db` exists
3. Credentials match in `application.yml`

Or simply use H2 (in-memory) for development:
```bash
./gradlew bootRun --args='--spring.profiles.active=dev'
```

### Redis Connection Issues
Redis is optional for development. The app will work without it, but caching will be disabled.

## 🎯 Next Steps

1. ✅ Application is running
2. ✅ Create your first user account
3. ⏳ Explore the features
4. ⏳ Create your first event
5. ⏳ Customize for your needs

## 📚 Additional Resources

- [Full README](README.md) - Complete documentation
- [Project Summary](PROJECT_SUMMARY.md) - Architecture and design decisions
- [Deployment Guide](README.md#-kubernetes-deployment-production) - Production deployment

## 🆘 Need Help?

- Check the logs: `docker-compose logs -f`
- Backend logs: `tail -f backend/logs/organiser-platform.log`
- Open an issue on GitHub

## 🎉 You're All Set!

The Organiser Platform is now running. Start creating events and building your outdoor community!
