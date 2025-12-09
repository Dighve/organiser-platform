# Build stage
FROM gradle:8.5-jdk17 AS build
WORKDIR /app

# Copy gradle wrapper and dependency files first for better caching
COPY gradle ./gradle
COPY gradlew gradlew.bat build.gradle settings.gradle ./

# Download dependencies (cached layer)
RUN gradle dependencies --no-daemon || true

# Copy source code
COPY src ./src

# Build the application
RUN gradle build -x test --no-daemon

# Run stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar

# Install curl for health check
RUN apk add --no-cache curl

# Add health check (uses PORT env var, defaults to 8080)
# Increased start-period to 120s to allow for database connection and Flyway migrations
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8080}/api/v1/actuator/health || exit 1

# Expose port (Render will provide PORT env var)
EXPOSE 8080

# Use exec form with shell to properly expand environment variables
# Bind to 0.0.0.0 to accept connections from outside the container
ENTRYPOINT ["sh", "-c", "java ${JAVA_TOOL_OPTIONS} -Dserver.port=${PORT:-8080} -Dserver.address=0.0.0.0 -jar app.jar"]