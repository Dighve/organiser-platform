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
    
    @Transactional(readOnly = true)
    public java.util.List<com.organiser.platform.dto.MemberDTO> getGroupMembers(Long groupId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        
        return group.getSubscriptions().stream()
                .filter(sub -> sub.getStatus() == Subscription.SubscriptionStatus.ACTIVE)
                .map(subscription -> com.organiser.platform.dto.MemberDTO.builder()
                        .id(subscription.getMember().getId())
                        .email(subscription.getMember().getEmail())
                        .displayName(subscription.getMember().getDisplayName())
                        .profilePhotoUrl(subscription.getMember().getProfilePhotoUrl())
                        .isOrganiser(subscription.getMember().getIsOrganiser())
                        .joinedAt(subscription.getSubscribedAt())
                        .build())
                .collect(java.util.stream.Collectors.toList());
    }
}
