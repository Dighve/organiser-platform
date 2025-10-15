# Organiser Platform

A modern web-based event management platform for outdoor activities, with a primary focus on hiking and other outdoor adventures. Built with React and Spring Boot, designed to support 100,000+ members with minimal infrastructure costs.

## 🚀 Features

- **Event Management**: Create, publish, and manage outdoor activity events
- **Activity Types**: Support for hiking, cycling, and extensible to other activities
- **User Authentication**: Secure JWT-based authentication
- **Organiser Tools**: Comprehensive tools for event organizers
- **Participant Management**: Easy event registration and participant tracking
- **Scalable Architecture**: Designed to handle 100,000+ users
- **Cost-Effective**: Optimized for minimal infrastructure costs

## 🏗️ Architecture

### Backend (Spring Boot)
- **Framework**: Spring Boot 3.2.0
- **Build Tool**: Gradle
- **Database**: PostgreSQL (production), H2 (development)
- **Cache**: Redis
- **Security**: JWT authentication
- **API**: RESTful API with proper pagination

### Frontend (React)
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + Stylus
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Routing**: React Router v6

## 📋 Prerequisites

- Java 17 or higher
- Node.js 18 or higher
- Docker & Docker Compose (for containerized deployment)
- PostgreSQL 15 (for local development without Docker)
- Redis 7 (for local development without Docker)

## 🛠️ Local Development Setup

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Build the project:
```bash
./gradlew build
```

3. Run the application:
```bash
./gradlew bootRun
```

The backend will start on `http://localhost:8080`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will start on `http://localhost:3000`

## 🐳 Docker Deployment

### Using Docker Compose (Recommended for Development)

1. Build and start all services:
```bash
docker-compose up -d
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379
- Backend API on port 8080
- Frontend on port 3000

2. Stop all services:
```bash
docker-compose down
```

## ☸️ Kubernetes Deployment (Production)

### Prerequisites
- Kubernetes cluster (GKE, EKS, or AKS)
- kubectl configured
- Docker images built and pushed to a registry

### Build and Push Docker Images

1. Build backend image:
```bash
cd backend
docker build -t your-registry/organiser-platform-backend:latest .
docker push your-registry/organiser-platform-backend:latest
```

2. Build frontend image:
```bash
cd frontend
docker build -t your-registry/organiser-platform-frontend:latest .
docker push your-registry/organiser-platform-frontend:latest
```

### Deploy to Kubernetes

1. Create namespace:
```bash
kubectl apply -f k8s/namespace.yaml
```

2. Deploy PostgreSQL:
```bash
kubectl apply -f k8s/postgres-deployment.yaml
```

3. Deploy Redis:
```bash
kubectl apply -f k8s/redis-deployment.yaml
```

4. Deploy Backend:
```bash
kubectl apply -f k8s/backend-deployment.yaml
```

5. Deploy Frontend:
```bash
kubectl apply -f k8s/frontend-deployment.yaml
```

### Scaling

The platform is configured with Horizontal Pod Autoscalers (HPA):
- Backend: 2-10 replicas based on CPU/Memory usage
- Frontend: 2-10 replicas based on CPU usage

## 💰 Cost Optimization Strategies

### 1. Database
- Use managed PostgreSQL (AWS RDS, Google Cloud SQL, Azure Database)
- Start with smallest instance and scale as needed
- Enable connection pooling (HikariCP configured)
- Use read replicas for read-heavy operations

### 2. Caching
- Redis for session management and frequently accessed data
- Reduces database load significantly
- Use managed Redis (ElastiCache, MemoryStore, Azure Cache)

### 3. Compute
- Start with 2 backend pods, scale to 10 based on demand
- Use spot/preemptible instances for cost savings (up to 70% cheaper)
- Implement auto-scaling based on metrics

### 4. Storage
- Use object storage (S3, GCS, Azure Blob) for images
- Implement CDN for static assets
- Compress images before upload

### 5. Monitoring
- Use Prometheus + Grafana (free, open-source)
- Spring Boot Actuator for health checks
- Set up alerts for cost anomalies

## 📊 Estimated Monthly Costs (100K Users)

### AWS Example (US East)
- **RDS PostgreSQL** (db.t3.medium): ~$60/month
- **ElastiCache Redis** (cache.t3.micro): ~$15/month
- **EKS Cluster**: ~$73/month
- **EC2 Instances** (2x t3.medium spot): ~$30/month
- **S3 Storage** (100GB): ~$2/month
- **Data Transfer**: ~$20/month
- **Total**: ~$200/month

### Google Cloud Example
- **Cloud SQL PostgreSQL** (db-f1-micro): ~$25/month
- **Memorystore Redis** (1GB): ~$30/month
- **GKE Cluster**: ~$75/month
- **Compute Engine** (2x e2-medium preemptible): ~$25/month
- **Cloud Storage** (100GB): ~$2/month
- **Total**: ~$157/month

## 🔒 Security Considerations

1. **Environment Variables**: Never commit secrets to version control
2. **JWT Secret**: Use strong, randomly generated secrets in production
3. **Database**: Use strong passwords and enable SSL connections
4. **HTTPS**: Always use HTTPS in production
5. **CORS**: Configure allowed origins properly
6. **Rate Limiting**: Implement rate limiting to prevent abuse

## 📝 Environment Variables

### Backend
```bash
SPRING_PROFILE=prod
DATABASE_URL=jdbc:postgresql://localhost:5432/organiser_db
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your-password
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket
AWS_ACCESS_KEY=your-access-key
AWS_SECRET_KEY=your-secret-key
```

### Frontend
```bash
VITE_API_URL=https://api.yourplatform.com/api/v1
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
./gradlew test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📈 Monitoring & Observability

- **Health Checks**: `/actuator/health`
- **Metrics**: `/actuator/metrics`
- **Prometheus**: `/actuator/prometheus`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions, please open an issue on GitHub.

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Payment integration (Stripe)
- [ ] Email notifications
- [ ] Social media integration
- [ ] Advanced search and filters
- [ ] Event recommendations
- [ ] Group chat functionality
- [ ] Weather integration
- [ ] Route mapping (Google Maps/Mapbox)
- [ ] Activity tracking integration

## 👥 Team

Built with ❤️ for outdoor enthusiasts
