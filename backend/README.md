# Organiser Platform - Backend

A Spring Boot application for managing events and community organization with magic link authentication.

## Tech Stack

- **Java 17**
- **Spring Boot 3.1.5**
- **MariaDB 11.0** (via Docker)
- **Flyway** for database migrations
- **JWT** for authentication
- **Gradle** for build management

## Prerequisites

- Java 17 or higher
- Docker Desktop (for MariaDB)
- Gradle 8.x (wrapper included)

## Getting Started

### 1. Start the Database

The application uses MariaDB running in Docker. Start it with:

```bash
docker-compose up -d
```

Verify the database is running:
```bash
docker-compose ps
```

You should see:
```
NAME                         STATUS              PORTS
organiser-platform-mariadb   running (healthy)   0.0.0.0:3307->3306/tcp
```

### 2. Run the Application

Start the application with the `dev` profile:

```bash
./gradlew bootRun --args='--spring.profiles.active=dev'
```

The application will:
- Connect to MariaDB on port 3307
- Run Flyway migrations to create/update the database schema
- Start the web server on port 8080

### 3. Verify the Application

Check the health endpoint:
```bash
curl http://localhost:8080/actuator/health
```

## Configuration Profiles

### Development Profile (`dev`)

- Database: MariaDB on localhost:3307
- Flyway migrations: Enabled
- Mail: Console logging (localhost:1025)
- Location: `src/main/resources/application-dev.properties`

### Test Profile (`test`)

- Database: H2 in-memory
- Flyway migrations: Disabled (uses JPA schema generation)
- Faster startup for integration tests
- Location: `src/test/resources/application-test.properties`

### Production Profile

- Uses environment variables:
  - `DATABASE_URL`
  - `DATABASE_USERNAME`
  - `DATABASE_PASSWORD`
  - `JWT_SECRET`
- Location: `src/main/resources/application.properties`

## Running Tests

Run all tests:
```bash
./gradlew test
```

Run specific test class:
```bash
./gradlew test --tests "com.organiser.platform.controller.AuthControllerIntegrationTest"
```

## Database Management

### Access MariaDB

Connect to the MariaDB container:
```bash
docker exec -it organiser-platform-mariadb mysql -u organiser_user -p
# Password: organiser_pass
```

### Flyway Commands

Run migrations manually:
```bash
./gradlew flywayMigrate
```

Clean database (⚠️ destructive):
```bash
./gradlew flywayClean
```

View migration info:
```bash
./gradlew flywayInfo
```

### Reset Database

To start fresh:
```bash
docker-compose down -v  # Remove container and volumes
docker-compose up -d    # Start fresh container
./gradlew bootRun --args='--spring.profiles.active=dev'  # Migrations run automatically
```

## API Endpoints

### Authentication

- `POST /api/v1/auth/magic-link` - Request magic link
- `GET /api/v1/auth/verify?token={token}` - Verify magic link

### Health & Monitoring

- `GET /actuator/health` - Application health status
- `GET /actuator/info` - Application information
- `GET /actuator/metrics` - Application metrics

## Project Structure

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/organiser/platform/
│   │   │   ├── config/          # Configuration classes
│   │   │   ├── controller/      # REST controllers
│   │   │   ├── dto/             # Data transfer objects
│   │   │   ├── model/           # JPA entities
│   │   │   ├── repository/      # Spring Data repositories
│   │   │   ├── security/        # Security & JWT
│   │   │   ├── service/         # Business logic
│   │   │   └── util/            # Utilities
│   │   └── resources/
│   │       ├── db/migration/    # Flyway SQL scripts
│   │       ├── application.properties
│   │       └── application-dev.properties
│   └── test/
│       ├── java/                # Integration & unit tests
│       └── resources/
│           └── application-test.properties
├── docker-compose.yml           # MariaDB container config
├── build.gradle                 # Build configuration
└── README.md                    # This file
```

## Database Schema

The database schema is managed by Flyway migrations in `src/main/resources/db/migration/`:

- `V1.1__Combined_schema.sql` - Initial schema with:
  - Members table
  - Events table
  - Magic links table
  - Roles and permissions
  - Event registrations
  - And more...

## Development Workflow

1. **Start Database**: `docker-compose up -d`
2. **Make Changes**: Edit code, add migrations, etc.
3. **Run Application**: `./gradlew bootRun --args='--spring.profiles.active=dev'`
4. **Run Tests**: `./gradlew test`
5. **Stop Database**: `docker-compose down`

## Troubleshooting

### Port 8080 Already in Use

Find and kill the process:
```bash
lsof -ti:8080 | xargs kill -9
```

### Port 3307 Already in Use

Change the port in `docker-compose.yml` and `application-dev.properties`:
```yaml
# docker-compose.yml
ports:
  - "3308:3306"  # Change 3307 to 3308
```

```properties
# application-dev.properties
spring.datasource.url=jdbc:mariadb://localhost:3308/organiser_platform
```

### Database Connection Refused

Ensure MariaDB container is running and healthy:
```bash
docker-compose ps
docker-compose logs mariadb
```

Restart if needed:
```bash
docker-compose restart
```

### Flyway Migration Errors

If migrations fail, you can clean and restart:
```bash
docker-compose down -v
docker-compose up -d
# Wait 10 seconds for database to initialize
./gradlew bootRun --args='--spring.profiles.active=dev'
```

## Building for Production

Build executable JAR:
```bash
./gradlew build
```

Run the JAR:
```bash
java -jar build/libs/organiser-platform-0.0.1-SNAPSHOT.jar \
  --spring.profiles.active=prod \
  --DATABASE_URL=jdbc:mariadb://your-db-host:3306/organiser_platform \
  --DATABASE_USERNAME=your_user \
  --DATABASE_PASSWORD=your_password \
  --JWT_SECRET=your_secure_secret_key
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Add tests
4. Ensure all tests pass: `./gradlew test`
5. Submit a pull request

## License

[Your License Here]
