package com.organiser.platform.service;

// ============================================================
// IMPORTS
// ============================================================
import com.organiser.platform.dto.CreateEventRequest;
import com.organiser.platform.dto.CreateGroupRequest;
import com.organiser.platform.dto.EventDTO;
import com.organiser.platform.dto.GroupDTO;
import com.organiser.platform.model.Activity;
import com.organiser.platform.model.Event;
import com.organiser.platform.model.EventParticipant;
import com.organiser.platform.model.Group;
import com.organiser.platform.model.Member;
import com.organiser.platform.repository.EventRepository;
import com.organiser.platform.repository.EventParticipantRepository;
import com.organiser.platform.repository.GroupRepository;
import com.organiser.platform.repository.MemberRepository;
import com.organiser.platform.repository.SubscriptionRepository;
import com.organiser.platform.repository.BannedMemberRepository;
import com.organiser.platform.model.Subscription;
import com.organiser.platform.model.BannedMember;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// ============================================================
// SERVICE CLASS
// ============================================================
/**
 * Service for managing groups and group memberships.
 * Handles group CRUD, subscriptions, and member management.
 * 
 * @author OutMeets Platform Team
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GroupService {
    
    // ============================================================
    // DEPENDENCIES
    // ============================================================
    private final GroupRepository groupRepository;
    private final MemberRepository memberRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final com.organiser.platform.repository.ActivityRepository activityRepository;
    private final EventRepository eventRepository;
    private final EventParticipantRepository eventParticipantRepository;
    private final BannedMemberRepository bannedMemberRepository;
    private final NotificationService notificationService;
    
    // ============================================================
    // PUBLIC METHODS - Group CRUD Operations
    // ============================================================
    
    /**
     * Create a new group.
     * Automatically subscribes the organiser to the group.
     */
    @Transactional
    @CacheEvict(value = "groups", allEntries = true)
    public GroupDTO createGroup(CreateGroupRequest request, Long organiserId) {
        // Find the member (organiser)
        Member organiser = memberRepository.findById(organiserId)
                .orElseThrow(() -> new RuntimeException("Organiser not found"));
        
        // Find the activity
        Activity activity = activityRepository.findById(request.getActivityId())
                .orElseThrow(() -> new RuntimeException("Activity not found"));

        Group group = Group.builder()
                .name(request.getName())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .primaryOrganiser(organiser)
                .activity(activity)
                .location(request.getLocation())
                .maxMembers(request.getMaxMembers())
                .isPublic(request.getIsPublic() != null ? request.getIsPublic() : true)
                .groupGuidelines(request.getGroupGuidelines())
                .active(true)
                .build();
        
        group = groupRepository.save(group);
        
        // Automatically subscribe the organiser to the group
        Subscription subscription = Subscription.builder()
                .member(organiser)
                .group(group)
                .status(Subscription.SubscriptionStatus.ACTIVE)
                .notificationEnabled(true)
                .subscribedAt(LocalDateTime.now())
                .build();
        subscriptionRepository.save(subscription);
        
        long memberCount = subscriptionRepository.countByGroupIdAndStatus(group.getId(), Subscription.SubscriptionStatus.ACTIVE);
        return GroupDTO.fromEntity(group, (int) memberCount);
    }
    
    /**
     * Update an existing group.
     * Only the group organiser can update the group.
     */
    @Transactional
    @CacheEvict(value = "groups", allEntries = true)
    public GroupDTO updateGroup(Long groupId, CreateGroupRequest request, Long userId) {
        // Find the group
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        
        // Check if user is the organiser
        if (!group.getPrimaryOrganiser().getId().equals(userId)) {
            throw new RuntimeException("Only the group organiser can update the group");
        }
        
        // Update fields
        if (request.getName() != null) {
            group.setName(request.getName());
        }
        if (request.getDescription() != null) {
            group.setDescription(request.getDescription());
        }
        if (request.getImageUrl() != null) {
            group.setImageUrl(request.getImageUrl());
        }
        if (request.getLocation() != null) {
            group.setLocation(request.getLocation());
        }
        if (request.getMaxMembers() != null) {
            group.setMaxMembers(request.getMaxMembers());
        }
        if (request.getIsPublic() != null) {
            group.setIsPublic(request.getIsPublic());
        }
        if (request.getGroupGuidelines() != null) {
            group.setGroupGuidelines(request.getGroupGuidelines());
        }
        
        // Update activity if changed
        if (request.getActivityId() != null && !group.getActivity().getId().equals(request.getActivityId())) {
            Activity activity = activityRepository.findById(request.getActivityId())
                    .orElseThrow(() -> new RuntimeException("Activity not found"));
            group.setActivity(activity);
        }
        
        // Save - updatedAt will be set automatically by @LastModifiedDate
        group = groupRepository.save(group);
        
        int memberCount = (int) subscriptionRepository.countByGroupIdAndStatus(
                group.getId(), 
                Subscription.SubscriptionStatus.ACTIVE
        );
        
        return GroupDTO.fromEntity(group, memberCount);
    }
    
    // ============================================================
    // PUBLIC METHODS - Group Queries
    // ============================================================
    
    /**
     * Get all groups a user is subscribed to.
     */
    @Cacheable(value = "groups", key = "'user_' + #memberId")
    public List<GroupDTO> getUserSubscribedGroups(Long memberId) {
        List<Subscription> subscriptions = subscriptionRepository.findByMemberId(memberId);
        
        return subscriptions.stream()
                .filter(sub -> sub.getStatus() == Subscription.SubscriptionStatus.ACTIVE)
                .map(sub -> {
                    Group group = sub.getGroup();
                    int memberCount = (int) subscriptionRepository.countByGroupIdAndStatus(
                            group.getId(), 
                            Subscription.SubscriptionStatus.ACTIVE
                    );
                    return GroupDTO.fromEntity(group, memberCount);
                })
                .collect(Collectors.toList());
    }
    
    /**
     * Get all groups organised by a specific user.
     */
    @Cacheable(value = "groups", key = "'organiser_' + #memberId")
    public List<GroupDTO> getUserOrganisedGroups(Long memberId) {
        List<Group> groups = groupRepository.findByPrimaryOrganiserId(memberId);
        
        return groups.stream()
                .map(group -> {
                    int memberCount = (int) subscriptionRepository.countByGroupIdAndStatus(
                            group.getId(), 
                            Subscription.SubscriptionStatus.ACTIVE
                    );
                    return GroupDTO.fromEntity(group, memberCount);
                })
                .collect(Collectors.toList());
    }
    
    /**
     * Get all public and active groups.
     */
    @Cacheable(value = "groups", key = "'public'")
    public List<GroupDTO> getAllPublicGroups() {
        List<Group> groups = groupRepository.findByIsPublicTrueAndActiveTrue();
        
        return groups.stream()
                .map(group -> {
                    int memberCount = (int) subscriptionRepository.countByGroupIdAndStatus(
                            group.getId(), 
                            Subscription.SubscriptionStatus.ACTIVE
                    );
                    return GroupDTO.fromEntity(group, memberCount);
                })
                .collect(Collectors.toList());
    }
    
    /**
     * Get group by ID with member count.
     */
    @Cacheable(value = "groups", key = "'group_' + #groupId")
    public GroupDTO getGroupById(Long groupId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        
        int memberCount = (int) subscriptionRepository.countByGroupIdAndStatus(
                group.getId(), 
                Subscription.SubscriptionStatus.ACTIVE
        );
        
        return GroupDTO.fromEntity(group, memberCount);
    }
    
    // ============================================================
    // PUBLIC METHODS - Subscription Management
    // ============================================================
    
    /**
     * Subscribe a member to a group.
     * Creates new subscription or reactivates existing one.
     */
    @Transactional
    @CacheEvict(value = {"groups", "events"}, allEntries = true)
    public void subscribeToGroup(Long groupId, Long memberId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Member not found"));
        
        // Check if already subscribed
        Optional<Subscription> existing = subscriptionRepository.findByMemberIdAndGroupId(memberId, groupId);
        if (existing.isPresent()) {
            Subscription sub = existing.get();
            if (sub.getStatus() == Subscription.SubscriptionStatus.ACTIVE) {
                throw new RuntimeException("Already subscribed to this group");
            }
            // Reactivate subscription
            sub.setStatus(Subscription.SubscriptionStatus.ACTIVE);
            sub.setUnsubscribedAt(null);
            subscriptionRepository.save(sub);
        } else {
            // Create new subscription
            Subscription subscription = Subscription.builder()
                    .member(member)
                    .group(group)
                    .status(Subscription.SubscriptionStatus.ACTIVE)
                    .notificationEnabled(true)
                    .subscribedAt(LocalDateTime.now())
                    .build();
            subscriptionRepository.save(subscription);
        }
    }
    
    /**
     * Unsubscribe a member from a group.
     * Sets subscription status to INACTIVE.
     * MEETUP.COM PATTERN: Also removes member from all group events.
     */
    @Transactional
    @CacheEvict(value = {"groups", "events"}, allEntries = true)
    public void unsubscribeFromGroup(Long groupId, Long memberId) {
        Subscription subscription = subscriptionRepository.findByMemberIdAndGroupId(memberId, groupId)
                .orElseThrow(() -> new RuntimeException("Subscription not found"));
        
        // Set subscription to inactive
        subscription.setStatus(Subscription.SubscriptionStatus.INACTIVE);
        subscription.setUnsubscribedAt(LocalDateTime.now());
        subscriptionRepository.save(subscription);
        
        // MEETUP.COM PATTERN: Remove member from all events in this group
        // When you leave a group, you're automatically removed from all its events
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        
        // Find all events in this group
        List<Event> groupEvents = eventRepository.findAllByGroupId(groupId);
        
        // Remove member from each event they're registered for
        for (Event event : groupEvents) {
            Optional<EventParticipant> participant = eventParticipantRepository
                    .findByEventIdAndMemberId(event.getId(), memberId);
            
            if (participant.isPresent()) {
                // Remove participant from event
                event.getParticipants().remove(participant.get());
                eventParticipantRepository.delete(participant.get());
                
                // If event was full, change status back to PUBLISHED
                if (event.getStatus() == Event.EventStatus.FULL) {
                    event.setStatus(Event.EventStatus.PUBLISHED);
                }
                
                eventRepository.save(event);
            }
        }
    }
    
    // ============================================================
    // PUBLIC METHODS - Access Control
    // ============================================================
    
    /**
     * Check if a member has access to a group.
     * Returns true if member is the organiser OR has active subscription.
     */
    public boolean isMemberOfGroup(Long memberId, Long groupId) {
        if (memberId == null || groupId == null) {
            return false;
        }
        
        // Check if user is the group organiser
        Optional<Group> group = groupRepository.findById(groupId);
        if (group.isPresent() && group.get().getPrimaryOrganiser().getId().equals(memberId)) {
            return true;
        }
        
        // Check if user has an active subscription
        Optional<Subscription> subscription = subscriptionRepository.findByMemberIdAndGroupId(memberId, groupId);
        return subscription.isPresent() && subscription.get().getStatus() == Subscription.SubscriptionStatus.ACTIVE;
    }

    public boolean isOrganiserOfAnyGroup(Long memberId) {
        return groupRepository.countByPrimaryOrganiserId(memberId) > 0
                || groupRepository.existsByCoOrganisers_Id(memberId);
    }

    @Transactional
    public void removeAllSubscriptionsForMember(Long memberId) {
        subscriptionRepository.deleteByMemberId(memberId);
    }
    
    // ============================================================
    // PUBLIC METHODS - Group Members
    // ============================================================
    
    /**
     * Get all active members of a group.
     * Organiser is marked and sorted first.
     */
    @Transactional(readOnly = true)
    public java.util.List<com.organiser.platform.dto.MemberDTO> getGroupMembers(Long groupId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        
        Long primaryOrganiserId = group.getPrimaryOrganiser().getId();
        
        // Query subscriptions directly from repository (avoids lazy loading issues)
        List<Subscription> subscriptions = subscriptionRepository.findByGroupId(groupId);
        
        // Get all active subscriptions (including the organiser who should also have a subscription)
        // Mark the primary organiser and sort them to appear first
        return subscriptions.stream()
                .filter(sub -> sub.getStatus() == Subscription.SubscriptionStatus.ACTIVE)
                .map(subscription -> com.organiser.platform.dto.MemberDTO.builder()
                        .id(subscription.getMember().getId())
                        .email(subscription.getMember().getEmail())
                        .displayName(subscription.getMember().getDisplayName())
                        .profilePhotoUrl(subscription.getMember().getProfilePhotoUrl())
                        // Mark if this member is the primary organiser
                        .isOrganiser(subscription.getMember().getId().equals(primaryOrganiserId))
                        .joinedAt(subscription.getSubscribedAt())
                        .build())
                // Sort so organiser appears first, then by join date
                .sorted((a, b) -> {
                    if (Boolean.TRUE.equals(a.getIsOrganiser()) && !Boolean.TRUE.equals(b.getIsOrganiser())) return -1;
                    if (!Boolean.TRUE.equals(a.getIsOrganiser()) && Boolean.TRUE.equals(b.getIsOrganiser())) return 1;
                    return a.getJoinedAt().compareTo(b.getJoinedAt());
                })
                .collect(java.util.stream.Collectors.toList());
    }
    
    // ============================================================
    // BAN MANAGEMENT METHODS
    // ============================================================
    
    /**
     * Ban a member from a group (organiser only).
     * Removes their subscription and all future event participations.
     */
    @Transactional
    @CacheEvict(value = {"groups", "events"}, allEntries = true)
    public void banMemberFromGroup(Long groupId, Long memberIdToBan, Long organiserId, String reason) {
        // Verify group exists
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        
        // Verify requester is the organiser
        if (!group.getPrimaryOrganiser().getId().equals(organiserId)) {
            throw new RuntimeException("Only the group organiser can ban members");
        }
        
        // Cannot ban yourself
        if (memberIdToBan.equals(organiserId)) {
            throw new RuntimeException("Cannot ban yourself from the group");
        }
        
        // Verify member exists
        Member memberToBan = memberRepository.findById(memberIdToBan)
                .orElseThrow(() -> new RuntimeException("Member not found"));
        
        // Check if already banned
        if (bannedMemberRepository.existsByGroupIdAndMemberId(groupId, memberIdToBan)) {
            throw new RuntimeException("Member is already banned from this group");
        }
        
        // Create ban record
        BannedMember ban = BannedMember.builder()
                .group(group)
                .member(memberToBan)
                .bannedBy(group.getPrimaryOrganiser())
                .bannedAt(LocalDateTime.now())
                .reason(reason)
                .build();
        bannedMemberRepository.save(ban);
        
        // Remove their subscription
        subscriptionRepository.findByMemberIdAndGroupId(memberIdToBan, groupId)
                .ifPresent(subscriptionRepository::delete);
        
        // Remove from all future events in this group
        List<Event> futureEvents = eventRepository.findByGroupId(groupId, Pageable.unpaged())
                .getContent()
                .stream()
                .filter(event -> event.getEventDate().isAfter(java.time.Instant.now()))
                .collect(Collectors.toList());
        
        for (Event event : futureEvents) {
            eventParticipantRepository.findByEventIdAndMemberId(event.getId(), memberIdToBan)
                    .ifPresent(eventParticipantRepository::delete);
        }
        
        // Send notification to banned member
        notificationService.createBanNotification(memberToBan, group, reason);
    }
    
    /**
     * Unban a member from a group (organiser only).
     */
    @Transactional
    @CacheEvict(value = {"groups", "events"}, allEntries = true)
    public void unbanMemberFromGroup(Long groupId, Long memberIdToUnban, Long organiserId) {
        // Verify group exists
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        
        // Verify requester is the organiser
        if (!group.getPrimaryOrganiser().getId().equals(organiserId)) {
            throw new RuntimeException("Only the group organiser can unban members");
        }
        
        // Find and delete ban record
        BannedMember ban = bannedMemberRepository.findByGroupIdAndMemberId(groupId, memberIdToUnban)
                .orElseThrow(() -> new RuntimeException("Member is not banned from this group"));
        
        bannedMemberRepository.delete(ban);
    }
    
    /**
     * Check if a member is banned from a group.
     */
    public boolean isMemberBanned(Long groupId, Long memberId) {
        return bannedMemberRepository.existsByGroupIdAndMemberId(groupId, memberId);
    }
    
    /**
     * Get list of group IDs a member is banned from (for filtering).
     */
    public List<Long> getBannedGroupIds(Long memberId) {
        return bannedMemberRepository.findBannedGroupIdsByMemberId(memberId);
    }
    
    /**
     * Get all banned members for a group (organiser only).
     */
    public List<com.organiser.platform.dto.MemberDTO> getBannedMembers(Long groupId, Long organiserId) {
        // Verify group exists
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        
        // Verify requester is the organiser
        if (!group.getPrimaryOrganiser().getId().equals(organiserId)) {
            throw new RuntimeException("Only the group organiser can view banned members");
        }
        
        // Get all banned members for this group
        List<BannedMember> bannedMembers = bannedMemberRepository.findByGroupIdOrderByBannedAtDesc(groupId);
        
        // Convert to DTOs with ban information
        return bannedMembers.stream()
                .map(ban -> com.organiser.platform.dto.MemberDTO.builder()
                        .id(ban.getMember().getId())
                        .email(ban.getMember().getEmail())
                        .displayName(ban.getMember().getDisplayName())
                        .profilePhotoUrl(ban.getMember().getProfilePhotoUrl())
                        .bannedAt(ban.getBannedAt())
                        .bannedBy(ban.getBannedBy().getDisplayName())
                        .banReason(ban.getReason())
                        .build())
                .collect(Collectors.toList());
    }
    
    /**
     * Remove a member from a group without banning (organiser only).
     * Member can rejoin the group later.
     */
    @Transactional
    @CacheEvict(value = {"groups", "events"}, allEntries = true)
    public void removeMemberFromGroup(Long groupId, Long memberIdToRemove, Long organiserId) {
        // Verify group exists
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        
        // Verify requester is the organiser
        if (!group.getPrimaryOrganiser().getId().equals(organiserId)) {
            throw new RuntimeException("Only the group organiser can remove members");
        }
        
        // Cannot remove yourself
        if (memberIdToRemove.equals(organiserId)) {
            throw new RuntimeException("Cannot remove yourself from the group");
        }
        
        // Verify member exists
        Member memberToRemove = memberRepository.findById(memberIdToRemove)
                .orElseThrow(() -> new RuntimeException("Member not found"));
        
        // Remove their subscription (if exists)
        subscriptionRepository.findByMemberIdAndGroupId(memberIdToRemove, groupId)
                .ifPresent(subscriptionRepository::delete);
        
        // Remove from all future events in this group
        List<Event> futureEvents = eventRepository.findByGroupId(groupId, Pageable.unpaged())
                .getContent()
                .stream()
                .filter(event -> event.getEventDate().isAfter(java.time.Instant.now()))
                .collect(Collectors.toList());
        
        for (Event event : futureEvents) {
            eventParticipantRepository.findByEventIdAndMemberId(event.getId(), memberIdToRemove)
                    .ifPresent(eventParticipantRepository::delete);
        }
    }
    
    // ============================================================
    // PUBLIC METHODS - Group Deletion
    // ============================================================
    
    /**
     * Check if a group has no history and can be permanently deleted.
     * A group has "no history" when:
     * 1. No events have been created
     * 2. Only the organizer is a member (only one active subscription)
     * 3. No banned members exist
     */
    public boolean canGroupBeDeleted(Long groupId) {
        // Check if any events exist for this group
        long eventCount = eventRepository.countByGroupId(groupId);
        if (eventCount > 0) {
            return false;
        }
        
        // Check if only organizer is a member (should have exactly 1 active subscription)
        long activeSubscriptionCount = subscriptionRepository.countByGroupIdAndStatus(
                groupId, Subscription.SubscriptionStatus.ACTIVE);
        if (activeSubscriptionCount != 1) {
            return false;
        }
        
        // Check if any banned members exist
        boolean hasBannedMembers = bannedMemberRepository.existsByGroupId(groupId);
        if (hasBannedMembers) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Transfer ownership of a group to another member (current organiser only).
     * The new organiser must be an active member of the group.
     * All existing events will remain unchanged with the same organiser.
     */
    @Transactional
    @CacheEvict(value = {"groups", "events"}, allEntries = true)
    public GroupDTO transferOwnership(Long groupId, Long newOrganiserId, Long currentOrganiserId) {
        // Verify group exists
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        
        // Verify requester is the current organiser
        if (!group.getPrimaryOrganiser().getId().equals(currentOrganiserId)) {
            throw new RuntimeException("Only the current group organiser can transfer ownership");
        }
        
        // Cannot transfer to yourself
        if (newOrganiserId.equals(currentOrganiserId)) {
            throw new RuntimeException("Cannot transfer ownership to yourself");
        }
        
        // Verify new organiser exists and is a member of the group
        Member newOrganiser = memberRepository.findById(newOrganiserId)
                .orElseThrow(() -> new RuntimeException("New organiser not found"));
        
        // Check if new organiser is an active member of the group
        Optional<Subscription> subscription = subscriptionRepository.findByMemberIdAndGroupId(newOrganiserId, groupId);
        if (subscription.isEmpty() || subscription.get().getStatus() != Subscription.SubscriptionStatus.ACTIVE) {
            throw new RuntimeException("New organiser must be an active member of the group");
        }
        
        // Check if new organiser is banned (extra safety check)
        if (isMemberBanned(groupId, newOrganiserId)) {
            throw new RuntimeException("Cannot transfer ownership to a banned member");
        }
        
        // SANITY CHECK: Verify events will not have side effects
        // Events created by the current organiser will remain with the current organiser
        // This is intentional - we only transfer group ownership, not event ownership
        List<Event> groupEvents = eventRepository.findAllByGroupId(groupId);
        
        // Log information about existing events (for transparency)
        int eventsCount = groupEvents.size();
        // Events don't have a single organiser - they have event organisers and host members
        // For this sanity check, we just log the count - actual event ownership remains unchanged
        log.info("Group {} has {} existing events - these will remain unchanged during ownership transfer", 
                groupId, eventsCount);
        
        // Transfer group ownership
        group.setPrimaryOrganiser(newOrganiser);
        group = groupRepository.save(group);
        
        // Log the ownership transfer (notification can be added later if needed)
        log.info("Group {} ownership transferred from member {} to member {}", 
                groupId, currentOrganiserId, newOrganiserId);
        
        // Return updated GroupDTO
        int memberCount = (int) subscriptionRepository.countByGroupIdAndStatus(
                group.getId(), 
                Subscription.SubscriptionStatus.ACTIVE
        );
        
        return GroupDTO.fromEntity(group, memberCount);
    }
    
    /**
     * Permanently delete a group that has no history.
     * This is irreversible and completely removes the group from the database.
     * Only allowed for groups with no events, no additional members, and no banned members.
     */
    @Transactional
    @CacheEvict(value = {"groups", "events"}, allEntries = true)
    public void permanentlyDeleteGroup(Long groupId, Long organiserId) {
        // Verify group exists
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        
        // Verify requester is the organiser
        if (!group.getPrimaryOrganiser().getId().equals(organiserId)) {
            throw new RuntimeException("Only the group organiser can delete the group");
        }
        
        // Verify group can be deleted (has no history)
        if (!canGroupBeDeleted(groupId)) {
            throw new RuntimeException("Group cannot be deleted. It has history (events, members, or banned members)");
        }
        
        log.info("Starting permanent deletion of group {} by organiser {}", groupId, organiserId);
        
        // CRITICAL FIX: Manual deletion in correct order to avoid StackOverflowError
        // Step 1: Delete notifications first (no foreign key dependencies)
        notificationService.deleteNotificationsByGroup(groupId);
        log.info("Deleted notifications for group {}", groupId);
        
        // Step 2: Get and delete all group events manually (should be 0 based on canGroupBeDeleted check)
        List<Event> groupEvents = eventRepository.findAllByGroupId(groupId);
        for (Event event : groupEvents) {
            // Delete event participants first
            eventParticipantRepository.deleteByEventId(event.getId());
            // Delete event comments
            eventCommentRepository.deleteByEventId(event.getId());
            // Delete the event itself (without cascade to avoid recursion)
            eventRepository.deleteById(event.getId());
        }
        log.info("Deleted {} events for group {}", groupEvents.size(), groupId);
        
        // Step 3: Delete all subscriptions (should be only 1 organiser based on canGroupBeDeleted check)
        subscriptionRepository.deleteByGroupId(groupId);
        log.info("Deleted subscriptions for group {}", groupId);
        
        // Step 4: Delete banned members if any exist
        bannedMemberRepository.deleteByGroupId(groupId);
        log.info("Deleted banned members for group {}", groupId);
        
        // Step 5: Finally delete the group itself (now safe, no cascading)
        groupRepository.deleteById(groupId);
        log.info("Successfully deleted group {}", groupId);
    }
}
