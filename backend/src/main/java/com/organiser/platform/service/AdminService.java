package com.organiser.platform.service;

import com.organiser.platform.dto.admin.DailySignupDTO;
import com.organiser.platform.dto.admin.RecentUserDTO;
import com.organiser.platform.dto.admin.UserStatsDTO;
import com.organiser.platform.model.Group;
import com.organiser.platform.model.Member;
import com.organiser.platform.model.Notification;
import com.organiser.platform.repository.EventRepository;
import com.organiser.platform.repository.GroupRepository;
import com.organiser.platform.repository.MemberRepository;
import com.organiser.platform.repository.NotificationRepository;
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
    private final NotificationRepository notificationRepository;
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
            .hasOrganiserRole(member.getHasOrganiserRole())
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
    
    /**
     * Send organiser invitation notification to a user
     */
    @Transactional
    public void sendOrganiserInvitation(Long adminId, Long targetMemberId) {
        // Verify admin exists
        Member admin = memberRepository.findById(adminId)
            .orElseThrow(() -> new RuntimeException("Admin not found"));
        
        // Verify target member exists
        Member targetMember = memberRepository.findById(targetMemberId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Check if user is already an organiser
        if (Boolean.TRUE.equals(targetMember.getHasOrganiserRole())) {
            throw new RuntimeException("User is already an organiser");
        }
        
        // Create invitation notification
        Notification invitation = Notification.builder()
            .member(targetMember)
            .notificationType(Notification.NotificationType.ORGANISER_INVITATION)
            .title("You've been invited to become an Organiser!")
            .message("An admin has invited you to become an organiser on OutMeets. Review and accept the organiser agreement to get started.")
            .isRead(false)
            .build();
        
        notificationRepository.save(invitation);
    }
    
    /**
     * Revoke organiser role from a user
     * Their groups and events remain but they can't create new ones
     */
    @Transactional
    public void revokeOrganiserRole(Long memberId) {
        Member member = memberRepository.findById(memberId)
            .orElseThrow(() -> new RuntimeException("Member not found"));
        
        if (!Boolean.TRUE.equals(member.getHasOrganiserRole())) {
            throw new RuntimeException("User is not an organiser");
        }
        
        member.setHasOrganiserRole(false);
        member.setHasAcceptedOrganiserAgreement(false);
        member.setOrganiserAgreementAcceptedAt(null);
        memberRepository.save(member);
    }
    
    /**
     * Transfer all groups from one organiser to another and revoke old organiser's role
     */
    @Transactional
    public void transferGroupsAndRevokeRole(Long oldOrganiserId, Long newOrganiserId) {
        Member oldOrganiser = memberRepository.findById(oldOrganiserId)
            .orElseThrow(() -> new RuntimeException("Old organiser not found"));
        Member newOrganiser = memberRepository.findById(newOrganiserId)
            .orElseThrow(() -> new RuntimeException("New organiser not found"));
        
        // Verify old organiser has the role
        if (!Boolean.TRUE.equals(oldOrganiser.getHasOrganiserRole())) {
            throw new RuntimeException("User is not an organiser");
        }
        
        // Ensure new organiser has the role
        if (!Boolean.TRUE.equals(newOrganiser.getHasOrganiserRole())) {
            throw new RuntimeException("New organiser must have organiser role");
        }
        
        // Transfer all groups
        List<Group> groups = groupRepository.findByPrimaryOrganiserId(oldOrganiserId);
        for (Group group : groups) {
            group.setPrimaryOrganiser(newOrganiser);
            groupRepository.save(group);
        }
        
        // Revoke old organiser's role
        oldOrganiser.setHasOrganiserRole(false);
        oldOrganiser.setHasAcceptedOrganiserAgreement(false);
        oldOrganiser.setOrganiserAgreementAcceptedAt(null);
        memberRepository.save(oldOrganiser);
    }
    
    /**
     * Get statistics about an organiser's groups and events
     */
    @Transactional(readOnly = true)
    public OrganiserStats getOrganiserStats(Long memberId) {
        Member member = memberRepository.findById(memberId)
            .orElseThrow(() -> new RuntimeException("Member not found"));
        
        if (!Boolean.TRUE.equals(member.getHasOrganiserRole())) {
            throw new RuntimeException("User is not an organiser");
        }
        
        long groupCount = groupRepository.countByPrimaryOrganiserId(memberId);
        long eventCount = eventRepository.countByGroupPrimaryOrganiserId(memberId);
        
        return new OrganiserStats(groupCount, eventCount);
    }
    
    /**
     * Delete a member from the platform
     * This will cascade delete all related data (subscriptions, event participants, notifications)
     * Groups owned by the member will need to be transferred first if they are an organiser
     */
    @Transactional
    public void deleteMember(Long memberId) {
        Member member = memberRepository.findById(memberId)
            .orElseThrow(() -> new RuntimeException("Member not found"));
        
        // Check if member is an organiser with groups
        if (Boolean.TRUE.equals(member.getHasOrganiserRole())) {
            long groupCount = groupRepository.countByPrimaryOrganiserId(memberId);
            if (groupCount > 0) {
                throw new RuntimeException("Cannot delete organiser with groups. Transfer groups first.");
            }
        }
        
        // Delete member (cascading will handle related entities)
        memberRepository.delete(member);
    }
    
    /**
     * Inner class for organiser statistics
     */
    public static class OrganiserStats {
        public final long groupCount;
        public final long eventCount;
        
        public OrganiserStats(long groupCount, long eventCount) {
            this.groupCount = groupCount;
            this.eventCount = eventCount;
        }
    }
}
