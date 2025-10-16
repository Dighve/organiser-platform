package com.organiser.platform.config;

import org.springframework.boot.autoconfigure.flyway.FlywayDataSource;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;

import javax.sql.DataSource;
import java.net.URI;
import java.net.URISyntaxException;

/**
 * Database configuration for production environment.
 * Handles conversion of Render's DATABASE_URL format (postgresql://)
 * to JDBC format (jdbc:postgresql://)
 */
@Configuration
@Profile("prod")
public class DatabaseConfig {

    @Bean
    @Primary
    @FlywayDataSource
    public DataSource dataSource() {
        String databaseUrl = System.getenv("DATABASE_URL");
        
        if (databaseUrl != null && databaseUrl.startsWith("postgresql://")) {
            try {
                // Parse the URL to extract components
                URI dbUri = new URI(databaseUrl);
                
                String username = null;
                String password = null;
                
                // Extract username and password from userInfo
                if (dbUri.getUserInfo() != null) {
                    String[] credentials = dbUri.getUserInfo().split(":");
                    username = credentials[0];
                    password = credentials.length > 1 ? credentials[1] : null;
                }
                
                // Get host and port (default to 5432 if not specified)
                String host = dbUri.getHost();
                int port = dbUri.getPort();
                if (port == -1) {
                    port = 5432; // Default PostgreSQL port
                }
                
                // Get database name from path
                String database = dbUri.getPath();
                if (database != null && database.startsWith("/")) {
                    database = database.substring(1);
                }
                
                // Construct proper JDBC URL
                databaseUrl = String.format("jdbc:postgresql://%s:%d/%s", host, port, database);
                
                // Create DataSource with credentials
                return DataSourceBuilder
                        .create()
                        .url(databaseUrl)
                        .username(username)
                        .password(password)
                        .driverClassName("org.postgresql.Driver")
                        .build();
                        
            } catch (URISyntaxException e) {
                throw new RuntimeException("Failed to parse DATABASE_URL", e);
            }
        }
        
        // Fallback for other formats
        return DataSourceBuilder
                .create()
                .url(databaseUrl)
                .driverClassName("org.postgresql.Driver")
                .build();
    }
}
