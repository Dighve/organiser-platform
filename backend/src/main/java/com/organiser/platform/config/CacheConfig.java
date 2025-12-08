package com.organiser.platform.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/**
 * Cache configuration using Caffeine for high-performance in-memory caching.
 * 
 * Caches:
 * - upcomingEvents: List of upcoming events (5 min TTL)
 * - eventDetail: Individual event details (5 min TTL)
 * - publicGroups: List of public groups (5 min TTL)
 * - groupDetail: Individual group details (5 min TTL)
 */
@Configuration
@EnableCaching
public class CacheConfig {

    /**
     * Configure Caffeine cache manager with custom settings.
     * 
     * Performance characteristics:
     * - Maximum 1000 entries per cache
     * - 5 minute expiration after write
     * - Automatic eviction of least recently used entries
     * - Thread-safe concurrent access
     */
    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager(
            "upcomingEvents",
            "events",  // Generic events cache (for getEventById, getEventsByGroup, etc.)
            "groups",  // Generic groups cache (for getAllPublicGroups, getGroupById, etc.)
            "eventDetail", 
            "publicGroups",
            "groupDetail"
        );
        
        cacheManager.setCaffeine(Caffeine.newBuilder()
            .maximumSize(1000)  // Max 1000 entries per cache
            .expireAfterWrite(5, TimeUnit.MINUTES)  // 5 minute TTL
            .recordStats());  // Enable statistics for monitoring
        
        return cacheManager;
    }
}
