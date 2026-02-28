package com.organiser.platform.service;

import com.organiser.platform.dto.FeatureFlagDTO;
import com.organiser.platform.entity.FeatureFlag;
import com.organiser.platform.repository.FeatureFlagRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service for managing feature flags
 * Provides caching for better performance since feature flags are checked frequently
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FeatureFlagService {
    
    private final FeatureFlagRepository featureFlagRepository;
    
    // Predefined feature flag keys
    public static final String GOOGLE_MAPS_ENABLED = "GOOGLE_MAPS_ENABLED";
    public static final String EVENT_LOCATION_ENABLED = "EVENT_LOCATION_ENABLED";
    public static final String GROUP_LOCATION_ENABLED = "GROUP_LOCATION_ENABLED";
    public static final String STATIC_MAPS_ENABLED = "STATIC_MAPS_ENABLED";
    
    /**
     * Check if a specific feature is enabled
     * Results are cached for performance
     */
    @Cacheable(value = "featureFlags", key = "#flagKey")
    public boolean isFeatureEnabled(String flagKey) {
        return featureFlagRepository.isFeatureEnabled(flagKey)
                .orElse(false); // Default to false if flag doesn't exist
    }
    
    /**
     * Get all feature flags for admin dashboard
     */
    public List<FeatureFlagDTO> getAllFeatureFlags() {
        log.info("Fetching all feature flags for admin dashboard");
        return featureFlagRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Get all feature flags as a map for frontend
     * This provides all flags in a single API call for better performance
     */
    @Cacheable(value = "featureFlagsMap")
    public Map<String, Boolean> getFeatureFlagsMap() {
        log.info("Fetching feature flags map for frontend");
        Map<String, Boolean> flagsMap = new HashMap<>();
        
        List<FeatureFlag> flags = featureFlagRepository.findAll();
        for (FeatureFlag flag : flags) {
            flagsMap.put(flag.getFlagKey(), flag.getIsEnabled());
        }
        
        return flagsMap;
    }
    
    /**
     * Update a feature flag (admin only)
     * Clears cache after update
     */
    @Transactional
    @CacheEvict(value = {"featureFlags", "featureFlagsMap"}, allEntries = true)
    public FeatureFlagDTO updateFeatureFlag(String flagKey, boolean isEnabled, String adminEmail) {
        log.info("Admin {} updating feature flag {} to {}", adminEmail, flagKey, isEnabled);
        
        FeatureFlag flag = featureFlagRepository.findByFlagKey(flagKey)
                .orElseThrow(() -> new RuntimeException("Feature flag not found: " + flagKey));
        
        flag.setIsEnabled(isEnabled);
        flag.setUpdatedBy(adminEmail);
        
        FeatureFlag savedFlag = featureFlagRepository.save(flag);
        
        log.info("Successfully updated feature flag {} to {}", flagKey, isEnabled);
        return convertToDTO(savedFlag);
    }
    
    /**
     * Get a specific feature flag by key
     */
    public FeatureFlagDTO getFeatureFlagByKey(String flagKey) {
        FeatureFlag flag = featureFlagRepository.findByFlagKey(flagKey)
                .orElseThrow(() -> new RuntimeException("Feature flag not found: " + flagKey));
        return convertToDTO(flag);
    }
    
    /**
     * Convenience methods for checking specific location-related features
     */
    public boolean isGoogleMapsEnabled() {
        return isFeatureEnabled(GOOGLE_MAPS_ENABLED);
    }
    
    public boolean isEventLocationEnabled() {
        return isFeatureEnabled(EVENT_LOCATION_ENABLED);
    }
    
    public boolean isGroupLocationEnabled() {
        return isFeatureEnabled(GROUP_LOCATION_ENABLED);
    }
    
    public boolean isStaticMapsEnabled() {
        return isFeatureEnabled(STATIC_MAPS_ENABLED);
    }
    
    /**
     * Check if any location-related features are enabled
     * Used to determine if Google Maps API key is needed
     */
    public boolean isAnyLocationFeatureEnabled() {
        return isGoogleMapsEnabled() || isEventLocationEnabled() || 
               isGroupLocationEnabled() || isStaticMapsEnabled();
    }
    
    /**
     * Convert FeatureFlag entity to DTO
     */
    private FeatureFlagDTO convertToDTO(FeatureFlag flag) {
        return FeatureFlagDTO.builder()
                .id(flag.getId())
                .flagKey(flag.getFlagKey())
                .flagName(flag.getFlagName())
                .description(flag.getDescription())
                .isEnabled(flag.getIsEnabled())
                .createdAt(flag.getCreatedAt())
                .updatedAt(flag.getUpdatedAt())
                .updatedByEmail(flag.getUpdatedBy())
                .build();
    }
}
