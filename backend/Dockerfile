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
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8080}/actuator/health || exit 1

# Expose port (Render will provide PORT env var)
EXPOSE 8080

# Use shell form to allow environment variable substitution
ENTRYPOINT java ${JAVA_TOOL_OPTIONS} -Dserver.port=${PORT:-8080} -jar app.jar
