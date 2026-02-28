package com.organiser.platform.repository;

import com.organiser.platform.entity.FeatureFlag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for managing feature flags
 * Provides methods to find feature flags by key and check if features are enabled
 */
@Repository
public interface FeatureFlagRepository extends JpaRepository<FeatureFlag, Long> {
    
    /**
     * Find a feature flag by its unique key
     * @param flagKey The unique key of the feature flag
     * @return Optional containing the feature flag if found
     */
    Optional<FeatureFlag> findByFlagKey(String flagKey);
    
    /**
     * Check if a feature flag is enabled by its key
     * @param flagKey The unique key of the feature flag
     * @return true if the feature flag exists and is enabled, false otherwise
     */
    @Query("SELECT f.isEnabled FROM FeatureFlag f WHERE f.flagKey = :flagKey")
    Optional<Boolean> isFeatureEnabled(@Param("flagKey") String flagKey);
    
    /**
     * Check if a feature flag exists by its key
     * @param flagKey The unique key of the feature flag
     * @return true if the feature flag exists, false otherwise
     */
    boolean existsByFlagKey(String flagKey);
}
