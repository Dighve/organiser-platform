package com.organiser.platform.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.test.context.ActiveProfiles;

@Configuration
@ActiveProfiles("test")
public class TestJwtConfig {
    
    @Bean
    public String jwtSecret() {
        return "testSecretKey1234567890123456789012345678901234567890";
    }
    
    @Bean
    public Long jwtExpiration() {
        return 86400000L; // 24 hours in milliseconds
    }
}
