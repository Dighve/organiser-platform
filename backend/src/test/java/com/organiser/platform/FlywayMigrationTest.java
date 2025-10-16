package com.organiser.platform;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationInfo;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.SingleConnectionDataSource;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.containers.output.Slf4jLogConsumer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@Testcontainers
public class FlywayMigrationTest {

    private static final Logger log = LoggerFactory.getLogger(FlywayMigrationTest.class);
    private static final String MYSQL_IMAGE = "mysql:8.0.33";
    private static final String DATABASE_NAME = "testdb";
    private static final String USERNAME = "test";
    private static final String PASSWORD = "test";

    @Container
    private static final MySQLContainer<?> mysql = new MySQLContainer<>(DockerImageName.parse(MYSQL_IMAGE))
            .withDatabaseName(DATABASE_NAME)
            .withUsername(USERNAME)
            .withPassword(PASSWORD)
            .withLogConsumer(new Slf4jLogConsumer(log).withPrefix("MYSQL"))
            .withReuse(true);

    private DataSource dataSource;
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void setUp() {
        try {
            // Create a simple DataSource for our test
            String jdbcUrl = mysql.getJdbcUrl() + "?useSSL=false&allowPublicKeyRetrieval=true&useLegacyDatetimeCode=false&serverTimezone=UTC";
            log.info("Connecting to database with URL: {}", jdbcUrl);
            
            dataSource = new SingleConnectionDataSource(jdbcUrl, USERNAME, PASSWORD, true);
            jdbcTemplate = new JdbcTemplate(dataSource);
            
            // Test the connection
            String dbVersion = jdbcTemplate.queryForObject("SELECT VERSION()", String.class);
            log.info("Successfully connected to MySQL version: {}", dbVersion);
            
        } catch (Exception e) {
            log.error("Error setting up test database connection", e);
            throw e;
        }
    }

    @Test
    void testFlywayMigrations() throws SQLException {
        log.info("=== Starting Flyway migration test ===");
        
        // Test database connection
        testDatabaseConnection();
        
        // Configure Flyway with detailed logging
        log.info("Configuring Flyway...");
        Flyway flyway = Flyway.configure()
                .dataSource(dataSource)
                .locations("classpath:db/migration")
                .loggers("slf4j")
                .load();

        // Show pending migrations
        MigrationInfo[] pendingMigrations = flyway.info().pending();
        log.info("Found {} pending migrations", pendingMigrations.length);
        for (MigrationInfo migration : pendingMigrations) {
            log.info("Pending migration: {} : {}", migration.getVersion(), migration.getDescription());
        }

        // Run migrations
        log.info("Running migrations...");
        org.flywaydb.core.api.output.MigrateResult result = flyway.migrate();
        log.info("Applied {} migrations", result.migrationsExecuted);

        // Verify migrations were applied
        MigrationInfo current = flyway.info().current();
        assertNotNull(current, "A Flyway migration must be applied for this test");
        log.info("Current migration: {} : {} from file: {}", 
                current.getVersion(), 
                current.getDescription(), 
                current.getScript());

        // Verify all expected tables exist
        log.info("Verifying database schema...");
        List<String> tables = jdbcTemplate.queryForList(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()", 
            String.class
        );
        
        log.info("Found {} tables in the database: {}", tables.size(), tables);
        
        // Convert to lowercase for case-insensitive comparison
        List<String> tablesLower = new ArrayList<>();
        for (String table : tables) {
            tablesLower.add(table.toLowerCase());
        }
        
        log.info("Verifying required tables exist...");
        // Verify all expected tables exist
        assertAll(
            () -> verifyTableExists("members", tablesLower),
            () -> verifyTableExists("events", tablesLower),
            () -> verifyTableExists("activities", tablesLower),
            () -> verifyTableExists("event_participants", tablesLower),
            () -> verifyTableExists("groups", tablesLower),
            () -> verifyTableExists("magic_links", tablesLower),
            () -> verifyTableExists("subscriptions", tablesLower)
        );

        // Verify indexes
        log.info("Verifying indexes...");
        verifyIndexes();
        
        log.info("=== Flyway migration test completed successfully ===");
    }
    
    private void testDatabaseConnection() throws SQLException {
        log.info("Testing database connection...");
        try (Connection conn = dataSource.getConnection()) {
            String url = conn.getMetaData().getURL();
            String dbName = conn.getCatalog();
            log.info("Successfully connected to database: {} (URL: {})", dbName, url);
            
            // List all databases to verify connectivity
            List<String> databases = jdbcTemplate.queryForList("SHOW DATABASES", String.class);
            log.info("Available databases: {}", databases);
            
            // Create the test database if it doesn't exist
            if (!databases.contains(DATABASE_NAME)) {
                log.info("Creating database: {}", DATABASE_NAME);
                jdbcTemplate.execute("CREATE DATABASE IF NOT EXISTS " + DATABASE_NAME);
            }
            
            // Use the test database
            log.info("Using database: {}", DATABASE_NAME);
            jdbcTemplate.execute("USE " + DATABASE_NAME);
            
            // Verify we can execute a simple query
            String dbVersion = jdbcTemplate.queryForObject("SELECT VERSION()", String.class);
            log.info("Database version: {}", dbVersion);
            
        } catch (SQLException e) {
            log.error("Database connection test failed", e);
            throw e;
        }
    }
    
    private void verifyTableExists(String tableName, List<String> tablesLower) {
        boolean exists = tablesLower.contains(tableName.toLowerCase());
        log.info("Table '{}' {} in the database", tableName, exists ? "exists" : "does not exist");
        assertTrue(exists, "Table '" + tableName + "' should exist");
    }
    
    private void verifyIndexes() {
        verifyIndexExists("members", "email");
//        verifyIndexExists("events", "created_by");
//        verifyIndexExists("activities", "event_id");
//        verifyIndexExists("event_participants", "event_id");
//        verifyIndexExists("event_participants", "member_id");
//        verifyIndexExists("magic_links", "token");
//        verifyIndexExists("magic_links", "email");
//        verifyIndexExists("subscriptions", "member_id");
    }

    private void verifyIndexExists(String tableName, String columnName) {
        String query = "SELECT COUNT(1) as index_count " +
                "FROM information_schema.statistics " +
                "WHERE table_schema = DATABASE() " +
                "AND table_name = ? " +
                "AND column_name = ?";

        int count = jdbcTemplate.queryForObject(
            query, 
            Integer.class, 
            tableName, 
            columnName
        );
        
        assertTrue(count > 0, 
            String.format("Index on %s.%s should exist", tableName, columnName));
    }
    
    @AfterEach
    void tearDown() {
        if (dataSource instanceof AutoCloseable) {
            try {
                ((AutoCloseable) dataSource).close();
            } catch (Exception e) {
                log.warn("Error closing data source", e);
            }
        }
    }
}
