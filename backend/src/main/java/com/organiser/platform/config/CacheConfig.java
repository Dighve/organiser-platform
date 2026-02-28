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
     * - 10 minute expiration after write (matches frontend cache)
     * - Automatic eviction of least recently used entries
     * - Thread-safe concurrent access
     * 
     * OPTIMIZED: Increased from 5 to 10 minutes for better production performance
     * Events don't change frequently, so longer cache is safe
     */
    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager(
            "upcomingEvents",
            "events",  // Generic events cache (for getEventById, getEventsByGroup, etc.)
            "groups",  // Generic groups cache (for getAllPublicGroups, getGroupById, etc.)
            "eventDetail", 
            "publicGroups",
            "groupDetail",
            "members",  // Member cache for profile photos
            "featureFlags",  // Feature flags cache
            "featureFlagsMap"  // Feature flags map cache for frontend
        );
        
        cacheManager.setCaffeine(Caffeine.newBuilder()
            .maximumSize(1000)  // Max 1000 entries per cache
            .expireAfterWrite(10, TimeUnit.MINUTES)  // 10 minute TTL (matches frontend)
            .recordStats());  // Enable statistics for monitoring
        
        return cacheManager;
    }
}
