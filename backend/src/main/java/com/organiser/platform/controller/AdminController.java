package com.organiser.platform.controller;

import com.organiser.platform.dto.admin.RecentUserDTO;
import com.organiser.platform.dto.admin.UserStatsDTO;
import com.organiser.platform.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for admin dashboard operations
 * All endpoints require admin role
 */
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {
    
    private final AdminService adminService;
    
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
