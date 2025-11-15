package com.organiser.platform.service;

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
import com.organiser.platform.repository.GroupRepository;
import com.organiser.platform.repository.MemberRepository;
import com.organiser.platform.repository.SubscriptionRepository;
import com.organiser.platform.model.Subscription;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GroupService {
    
    private final GroupRepository groupRepository;
    private final MemberRepository memberRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final com.organiser.platform.repository.ActivityRepository activityRepository;
    
    @Transactional
    @CacheEvict(value = "groups", allEntries = true)
    public Group createGroup(CreateGroupRequest request, Long organiserId) {
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
        
        return group;
    }
    
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
    
    @Transactional
    @CacheEvict(value = "groups", allEntries = true)
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
    
    @Transactional
    @CacheEvict(value = "groups", allEntries = true)
    public void unsubscribeFromGroup(Long groupId, Long memberId) {
        Subscription subscription = subscriptionRepository.findByMemberIdAndGroupId(memberId, groupId)
                .orElseThrow(() -> new RuntimeException("Subscription not found"));
        
        subscription.setStatus(Subscription.SubscriptionStatus.INACTIVE);
        subscription.setUnsubscribedAt(LocalDateTime.now());
        subscriptionRepository.save(subscription);
    }
    
    /**
     * Check if a member is subscribed to a group (for access control)
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
}
