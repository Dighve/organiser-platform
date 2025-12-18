package com.organiser.platform.service;

import com.organiser.platform.dto.admin.DailySignupDTO;
import com.organiser.platform.dto.admin.RecentUserDTO;
import com.organiser.platform.dto.admin.UserStatsDTO;
import com.organiser.platform.model.Member;
import com.organiser.platform.repository.EventRepository;
import com.organiser.platform.repository.GroupRepository;
import com.organiser.platform.repository.MemberRepository;
import com.organiser.platform.repository.SubscriptionRepository;
import com.organiser.platform.repository.EventParticipantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Date;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for admin dashboard operations
 */
@Service
@RequiredArgsConstructor
public class AdminService {
    
    private final MemberRepository memberRepository;
    private final EventRepository eventRepository;
    private final GroupRepository groupRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final EventParticipantRepository eventParticipantRepository;
    
    /**
     * Get comprehensive user statistics for admin dashboard
     */
    @Transactional(readOnly = true)
    public UserStatsDTO getUserStats() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfToday = now.toLocalDate().atStartOfDay();
        LocalDateTime startOfWeek = now.minusDays(7);
        LocalDateTime startOfMonth = now.minusDays(30);
        
        // Get counts
        Long totalUsers = memberRepository.count();
        Long newUsersToday = memberRepository.countNewUsersSince(startOfToday);
        Long newUsersThisWeek = memberRepository.countNewUsersSince(startOfWeek);
        Long newUsersThisMonth = memberRepository.countNewUsersSince(startOfMonth);
        Long totalOrganisers = memberRepository.countOrganisers();
        Long totalEvents = eventRepository.count();
        Long totalGroups = groupRepository.count();
        
        // Get daily signup data for chart (last 30 days)
        List<Object[]> dailyData = memberRepository.getDailySignupStats(startOfMonth);
        List<DailySignupDTO> dailySignups = dailyData.stream()
            .map(row -> DailySignupDTO.builder()
                .date(row[0].toString())
                .count(((Number) row[1]).longValue())
                .build())
            .collect(Collectors.toList());
        
        return UserStatsDTO.builder()
            .totalUsers(totalUsers)
            .newUsersToday(newUsersToday)
            .newUsersThisWeek(newUsersThisWeek)
            .newUsersThisMonth(newUsersThisMonth)
            .activeUsers(totalUsers) // TODO: Implement last login tracking
            .totalEvents(totalEvents)
            .totalGroups(totalGroups)
            .totalOrganisers(totalOrganisers)
            .dailySignups(dailySignups)
            .magicLinkUsers(0L) // TODO: Track auth method
            .googleOAuthUsers(0L) // TODO: Track auth method
            .build();
    }
    
    /**
     * Get recent user signups with activity metrics
     */
    @Transactional(readOnly = true)
    public List<RecentUserDTO> getRecentUsers(int limit) {
        List<Member> recentMembers = memberRepository.findRecentUsers(PageRequest.of(0, limit)).getContent();
        
        return recentMembers.stream()
            .map(this::convertToRecentUserDTO)
            .collect(Collectors.toList());
    }
    
    /**
     * Convert Member to RecentUserDTO with activity metrics
     */
    private RecentUserDTO convertToRecentUserDTO(Member member) {
        // Count user's activities
        Long groupsJoined = subscriptionRepository.countByMemberId(member.getId());
        Long eventsJoined = eventParticipantRepository.countByMemberId(member.getId());
        Long groupsCreated = groupRepository.countByPrimaryOrganiserId(member.getId());
        Long eventsCreated = eventRepository.countByOrganiserId(member.getId());
        
        return RecentUserDTO.builder()
            .id(member.getId())
            .email(member.getEmail())
            .displayName(member.getDisplayName())
            .profilePhotoUrl(member.getProfilePhotoUrl())
            .isOrganiser(member.getIsOrganiser())
            .verified(member.getVerified())
            .active(member.getActive())
            .createdAt(member.getCreatedAt())
            .authMethod("UNKNOWN") // TODO: Track auth method
            .groupsJoined(groupsJoined)
            .eventsJoined(eventsJoined)
            .groupsCreated(groupsCreated)
            .eventsCreated(eventsCreated)
            .build();
    }
    
    /**
     * Check if user is admin
     */
    public boolean isAdmin(Long memberId) {
        return memberRepository.findById(memberId)
            .map(Member::getIsAdmin)
            .orElse(false);
    }
}
