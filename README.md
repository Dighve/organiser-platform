# 🏔️ HikeHub

**A modern, vibrant event management platform for outdoor activities and community building.**

HikeHub is a beautiful web application designed for organizing and discovering outdoor activities like hiking, cycling, and group adventures. Built with modern technologies and a stunning Meetup-inspired UI.

## ✨ Features

### 🎯 Core Features
- **Event Management**: Create, browse, and join outdoor events
- **Group Management**: Build and manage activity groups and communities
- **Magic Link Authentication**: Passwordless login via email
- **Activity Types**: Support for hiking, cycling, and more
- **Modern UI**: Vibrant purple-pink-orange gradient design
- **Responsive**: Works beautifully on desktop and mobile

### 🔐 Security
- Magic link authentication (no passwords to remember)
- JWT-based session management
- Email verification
- Secure password-free authentication

## 🎨 Design

**Color Palette:**
- Primary: Purple-600, Pink-600, Orange-500/600
- Gradients: Purple → Pink → Orange
- Modern glassmorphism effects
- Smooth animations and transitions

## 🚀 Tech Stack

### Backend
- **Spring Boot** 3.1.5
- **Java** 17
- **PostgreSQL** (Production)
- **MariaDB** (Local Development)
- **Gradle** build tool
- **Flyway** database migrations

### Frontend
- **React** 18
- **Vite** (fast builds)
- **Tailwind CSS** (styling)
- **React Router** v6
- **Axios** for API calls

### Deployment
- **Backend**: Render.com (free tier)
- **Frontend**: Netlify (free tier)
- **Database**: PostgreSQL on Render
- **Email**: Resend.com for magic links

## 🛠️ Local Development

### Prerequisites
- Java 17+
- Node.js 18+
- MariaDB or PostgreSQL

### Backend Setup

1. **Start the database** (using Docker):
```bash
cd backend
docker-compose up -d mariadb
```

2. **Run the backend**:
```bash
cd backend
./gradlew bootRun
```

The API will be available at `http://localhost:8080`

### Frontend Setup

1. **Install dependencies**:
```bash
cd frontend
npm install
```

2. **Configure environment** (create `.env`):
```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

3. **Start the dev server**:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 📁 Project Structure

```
hikehub/
├── backend/                 # Spring Boot API
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/.../
│   │   │   │   ├── config/      # Security, database config
│   │   │   │   ├── controller/  # REST endpoints
│   │   │   │   ├── dto/         # Data transfer objects
│   │   │   │   ├── model/       # JPA entities
│   │   │   │   ├── repository/  # Data access
│   │   │   │   └── service/     # Business logic
│   │   │   └── resources/
│   │   │       ├── application.properties
│   │   │       ├── application-dev.properties
│   │   │       ├── application-prod.properties
│   │   │       └── db/migration/  # Flyway SQL scripts
│   │   └── test/
│   ├── build.gradle
│   └── gradlew
│
├── frontend/                # React app
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── lib/             # API client, utilities
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── netlify.toml         # Netlify config
│
├── DEPLOYMENT.md            # Deployment guide
└── README.md                # This file
```

## 🗄️ Database Schema

### Core Entities
- **Member**: User profiles and authentication
- **Group**: Activity groups and communities
- **Event**: Outdoor events and activities
- **EventParticipant**: Event registrations
- **Subscription**: Group memberships
- **Activity**: Activity types (hiking, cycling, etc.)
- **MagicLink**: Temporary authentication tokens

## 🚀 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy

**Backend (Render.com)**:
1. Connect your GitHub repository
2. Select "Web Service"
3. Set environment variables (DATABASE_URL, JWT_SECRET, etc.)
4. Deploy!

**Frontend (Netlify)**:
1. Connect your GitHub repository
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Set `VITE_API_BASE_URL` environment variable
5. Deploy!

**Cost**: $0/month on free tier (perfect for POC and small communities)

## 🧪 API Endpoints

### Authentication
- `POST /api/v1/auth/magic-link` - Request magic link
- `GET /api/v1/auth/verify` - Verify magic link token

### Events
- `GET /api/v1/events` - List all events
- `GET /api/v1/events/{id}` - Get event details
- `POST /api/v1/events` - Create event
- `POST /api/v1/events/{id}/join` - Join event
- `DELETE /api/v1/events/{id}/leave` - Leave event

### Groups
- `GET /api/v1/groups` - List all groups
- `GET /api/v1/groups/{id}` - Get group details
- `POST /api/v1/groups` - Create group
- `POST /api/v1/groups/{id}/join` - Join group

### Activities
- `GET /api/v1/activities` - List activity types

## 🔧 Configuration

### Backend Environment Variables
```bash
# Database
DATABASE_URL=jdbc:postgresql://host:5432/dbname
DATABASE_USERNAME=your_username
DATABASE_PASSWORD=your_password

# JWT
JWT_SECRET=your-secret-key-minimum-32-chars

# Email (Resend.com)
RESEND_API_KEY=re_your_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

### Frontend Environment Variables
```bash
VITE_API_BASE_URL=https://your-backend.onrender.com/api/v1
```

## 📝 Development Notes

### Database Migrations
- Migrations are in `backend/src/main/resources/db/migration/`
- Flyway automatically runs migrations on startup
- Use PostgreSQL-compatible SQL syntax

### Code Style
- Backend: Follow Spring Boot best practices
- Frontend: React functional components with hooks
- Use Tailwind CSS utility classes
- Keep components small and focused

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - feel free to use this project for your own communities!

## 🙏 Acknowledgments

- Design inspired by Meetup.com
- Built with modern web technologies
- Made with ❤️ for outdoor enthusiasts

---

**Happy Hiking! 🥾🏔️**
