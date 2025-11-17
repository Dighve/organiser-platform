package com.organiser.platform.controller;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/cache")
public class CacheController {
    
    /**
     * Clear all caches
     * Useful for development when data is modified directly in database
     */
    @PostMapping("/clear")
    @CacheEvict(value = {"events", "groups"}, allEntries = true)
    public String clearAllCaches() {
        return "All caches cleared successfully";
    }
    
    /**
     * Clear events cache only
     */
    @PostMapping("/clear/events")
    @CacheEvict(value = "events", allEntries = true)
    public String clearEventsCache() {
        return "Events cache cleared successfully";
    }
    
    /**
     * Clear groups cache only
     */
    @PostMapping("/clear/groups")
    @CacheEvict(value = "groups", allEntries = true)
    public String clearGroupsCache() {
        return "Groups cache cleared successfully";
    }
}
