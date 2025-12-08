package com.organiser.platform.service;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

/**
 * Service for rate limiting using Bucket4j
 * Implements token bucket algorithm for different API endpoints
 */
@Slf4j
@Service
public class RateLimitService {
    
    private final Cache<String, Bucket> cache;
    
    public RateLimitService() {
        this.cache = Caffeine.newBuilder()
            .expireAfterWrite(1, TimeUnit.HOURS)
            .maximumSize(100_000)
            .build();
        
        log.info("RateLimitService initialized with cache size: 100,000");
    }
    
    /**
     * Magic link rate limit: 5 requests per hour per IP+email
     * Prevents email bombing and brute force attacks
     */
    public Bucket resolveMagicLinkBucket(String key) {
        return cache.get(key, k -> {
            log.debug("Creating new magic link bucket for key: {}", k);
            return createMagicLinkBucket();
        });
    }
    
    private Bucket createMagicLinkBucket() {
        // 5 tokens, refill 5 tokens every 1 hour
        Bandwidth limit = Bandwidth.classic(5, Refill.intervally(15, Duration.ofHours(1)));
        return Bucket.builder()
            .addLimit(limit)
            .build();
    }
    
    /**
     * Google OAuth rate limit: 10 requests per minute per IP
     * Prevents OAuth abuse
     */
    public Bucket resolveOAuthBucket(String key) {
        return cache.get(key, k -> {
            log.debug("Creating new OAuth bucket for key: {}", k);
            return createOAuthBucket();
        });
    }
    
    private Bucket createOAuthBucket() {
        // 10 tokens, refill 10 tokens every 1 minute
        Bandwidth limit = Bandwidth.classic(10, Refill.intervally(10, Duration.ofMinutes(1)));
        return Bucket.builder()
            .addLimit(limit)
            .build();
    }
    
    /**
     * File upload rate limit: 20 requests per hour per user
     * Prevents storage abuse
     */
    public Bucket resolveFileUploadBucket(String key) {
        return cache.get(key, k -> {
            log.debug("Creating new file upload bucket for key: {}", k);
            return createFileUploadBucket();
        });
    }
    
    private Bucket createFileUploadBucket() {
        // 20 tokens, refill 20 tokens every 1 hour
        Bandwidth limit = Bandwidth.classic(20, Refill.intervally(20, Duration.ofHours(1)));
        return Bucket.builder()
            .addLimit(limit)
            .build();
    }
    
    /**
     * General API rate limit: 100 requests per minute per IP
     * Global protection against API abuse
     */
    public Bucket resolveGeneralApiBucket(String key) {
        return cache.get(key, k -> {
            log.debug("Creating new general API bucket for key: {}", k);
            return createGeneralApiBucket();
        });
    }
    
    private Bucket createGeneralApiBucket() {
        // 100 tokens, refill 100 tokens every 1 minute
        Bandwidth limit = Bandwidth.classic(100, Refill.intervally(100, Duration.ofMinutes(1)));
        return Bucket.builder()
            .addLimit(limit)
            .build();
    }
    
    /**
     * Try to consume a token from the bucket
     * @param bucket The bucket to consume from
     * @return true if token was consumed, false if rate limit exceeded
     */
    public boolean tryConsume(Bucket bucket) {
        return bucket.tryConsume(1);
    }
    
    /**
     * Get available tokens (for debugging/monitoring)
     * @param bucket The bucket to check
     * @return Number of available tokens
     */
    public long getAvailableTokens(Bucket bucket) {
        return bucket.getAvailableTokens();
    }
    
    /**
     * Clear cache for testing purposes
     */
    public void clearCache() {
        cache.invalidateAll();
        log.info("Rate limit cache cleared");
    }
}
