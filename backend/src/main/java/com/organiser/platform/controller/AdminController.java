package com.organiser.platform.controller;

import com.organiser.platform.dto.admin.RecentUserDTO;
import com.organiser.platform.dto.admin.UserStatsDTO;
import com.organiser.platform.dto.admin.UpdateAgreementRequest;
import com.organiser.platform.dto.admin.AgreementVersionDTO;
import com.organiser.platform.dto.FeatureFlagDTO;
import com.organiser.platform.enums.AgreementType;
import com.organiser.platform.service.AdminService;
import com.organiser.platform.service.FeatureFlagService;
import com.organiser.platform.service.LegalAgreementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller for admin dashboard operations
 * All endpoints require admin role
 */
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {
    
    private final AdminService adminService;
    private final FeatureFlagService featureFlagService;
    private final LegalAgreementService legalAgreementService;
    
    /**
     * Get comprehensive user statistics for dashboard
     * Requires admin role
     */
    @GetMapping("/stats/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserStatsDTO> getUserStats(Authentication authentication) {
        // Verify admin access
        Long memberId = getUserIdFromAuth(authentication);
        if (!adminService.isAdmin(memberId)) {
            return ResponseEntity.status(403).build();
        }
        
        UserStatsDTO stats = adminService.getUserStats();
        return ResponseEntity.ok(stats);
    }
    
    /**
     * Get recent user signups with activity metrics
     * Requires admin role
     */
    @GetMapping("/users/recent")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<RecentUserDTO>> getRecentUsers(
        @RequestParam(defaultValue = "50") int limit,
        Authentication authentication
    ) {
        // Verify admin access
        Long memberId = getUserIdFromAuth(authentication);
        if (!adminService.isAdmin(memberId)) {
            return ResponseEntity.status(403).build();
        }
        
        List<RecentUserDTO> recentUsers = adminService.getRecentUsers(limit);
        return ResponseEntity.ok(recentUsers);
    }
    
    /**
     * Check if current user is admin
     */
    @GetMapping("/check")
    public ResponseEntity<Boolean> checkAdminStatus(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.ok(false);
        }
        
        Long memberId = getUserIdFromAuth(authentication);
        boolean isAdmin = adminService.isAdmin(memberId);
        return ResponseEntity.ok(isAdmin);
    }
    
    /**
     * Get all feature flags for admin dashboard
     * Requires admin role
     */
    @GetMapping("/feature-flags")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<FeatureFlagDTO>> getAllFeatureFlags(Authentication authentication) {
        // Verify admin access
        Long memberId = getUserIdFromAuth(authentication);
        if (!adminService.isAdmin(memberId)) {
            return ResponseEntity.status(403).build();
        }
        
        List<FeatureFlagDTO> flags = featureFlagService.getAllFeatureFlags();
        return ResponseEntity.ok(flags);
    }
    
    /**
     * Get feature flags as a map for frontend consumption
     * Public endpoint - no authentication required
     */
    @GetMapping("/feature-flags/map")
    public ResponseEntity<Map<String, Boolean>> getFeatureFlagsMap() {
        Map<String, Boolean> flagsMap = featureFlagService.getFeatureFlagsMap();
        return ResponseEntity.ok(flagsMap);
    }
    
    /**
     * Update a specific feature flag
     * Requires admin role
     */
    @PutMapping("/feature-flags/{flagKey}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FeatureFlagDTO> updateFeatureFlag(
            @PathVariable String flagKey,
            @RequestBody Map<String, Boolean> request,
            Authentication authentication
    ) {
        // Verify admin access
        Long memberId = getUserIdFromAuth(authentication);
        if (!adminService.isAdmin(memberId)) {
            return ResponseEntity.status(403).build();
        }
        
        Boolean isEnabled = request.get("isEnabled");
        if (isEnabled == null) {
            return ResponseEntity.badRequest().build();
        }
        
        try {
            // Get admin email from authentication
            String adminEmail = authentication.getName(); // JWT contains email
            FeatureFlagDTO updatedFlag = featureFlagService.updateFeatureFlag(flagKey, isEnabled, adminEmail);
            return ResponseEntity.ok(updatedFlag);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Get a specific feature flag by key
     * Requires admin role
     */
    @GetMapping("/feature-flags/{flagKey}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FeatureFlagDTO> getFeatureFlagByKey(
            @PathVariable String flagKey,
            Authentication authentication
    ) {
        // Verify admin access
        Long memberId = getUserIdFromAuth(authentication);
        if (!adminService.isAdmin(memberId)) {
            return ResponseEntity.status(403).build();
        }
        
        try {
            FeatureFlagDTO flag = featureFlagService.getFeatureFlagByKey(flagKey);
            return ResponseEntity.ok(flag);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Get all agreement versions for admin dashboard
     * Requires admin role
     */
    @GetMapping("/agreements")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AgreementVersionDTO>> getAllAgreements(Authentication authentication) {
        Long memberId = getUserIdFromAuth(authentication);
        if (!adminService.isAdmin(memberId)) {
            return ResponseEntity.status(403).build();
        }
        
        List<AgreementVersionDTO> agreements = legalAgreementService.getAllAgreementVersions();
        return ResponseEntity.ok(agreements);
    }
    
    /**
     * Get current agreement version by type
     * Requires admin role
     */
    @GetMapping("/agreements/{agreementType}/current")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AgreementVersionDTO> getCurrentAgreement(
            @PathVariable AgreementType agreementType,
            Authentication authentication
    ) {
        Long memberId = getUserIdFromAuth(authentication);
        if (!adminService.isAdmin(memberId)) {
            return ResponseEntity.status(403).build();
        }
        
        try {
            AgreementVersionDTO agreement = legalAgreementService.getCurrentAgreement(agreementType);
            return ResponseEntity.ok(agreement);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Update agreement text and create new version
     * Requires admin role
     */
    @PutMapping("/agreements")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AgreementVersionDTO> updateAgreement(
            @RequestBody @jakarta.validation.Valid UpdateAgreementRequest request,
            Authentication authentication
    ) {
        Long memberId = getUserIdFromAuth(authentication);
        if (!adminService.isAdmin(memberId)) {
            return ResponseEntity.status(403).build();
        }
        
        try {
            String adminEmail = authentication.getName(); // JWT contains email
            AgreementVersionDTO updatedAgreement = legalAgreementService.updateAgreement(request, adminEmail);
            return ResponseEntity.ok(updatedAgreement);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Get agreement version history
     * Requires admin role
     */
    @GetMapping("/agreements/{agreementType}/history")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AgreementVersionDTO>> getAgreementHistory(
            @PathVariable AgreementType agreementType,
            @RequestParam(defaultValue = "10") int limit,
            Authentication authentication
    ) {
        Long memberId = getUserIdFromAuth(authentication);
        if (!adminService.isAdmin(memberId)) {
            return ResponseEntity.status(403).build();
        }
        
        List<AgreementVersionDTO> history = legalAgreementService.getAgreementHistory(agreementType, limit);
        return ResponseEntity.ok(history);
    }

    /**
     * Extract user ID from authentication
     */
    private Long getUserIdFromAuth(Authentication authentication) {
        // User ID is stored in authentication details by JwtAuthenticationFilter
        Object details = authentication.getDetails();
        if (details instanceof Long) {
            return (Long) details;
        }
        // Fallback: try to parse from name (for backward compatibility)
        try {
            return Long.parseLong(authentication.getName());
        } catch (NumberFormatException e) {
            throw new RuntimeException("Unable to extract user ID from authentication");
        }
    }
}
