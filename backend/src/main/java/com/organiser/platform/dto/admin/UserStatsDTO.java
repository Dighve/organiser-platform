package com.organiser.platform.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for admin dashboard user statistics
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserStatsDTO {
    
    private Long totalUsers;
    private Long newUsersToday;
    private Long newUsersThisWeek;
    private Long newUsersThisMonth;
    private Long activeUsers; // Users who logged in last 30 days
    private Long totalEvents;
    private Long totalGroups;
    private Long totalOrganisers;
    
    // Daily signup data for chart (last 30 days)
    private List<DailySignupDTO> dailySignups;
    
    // Authentication method breakdown
    private Long magicLinkUsers;
    private Long googleOAuthUsers;
}
