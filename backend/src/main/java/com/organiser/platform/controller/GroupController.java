package com.organiser.platform.controller;

import com.organiser.platform.dto.CreateEventRequest;
import com.organiser.platform.dto.CreateGroupRequest;
import com.organiser.platform.dto.EventDTO;
import com.organiser.platform.dto.GroupDTO;
import com.organiser.platform.model.Group;
import com.organiser.platform.service.EventService;
import com.organiser.platform.service.GroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/groups")
@RequiredArgsConstructor
public class GroupController {
    
    private final GroupService groupService;

    @PostMapping
    public ResponseEntity<Group> createGroup(
            @Valid @RequestBody CreateGroupRequest request,
            Authentication authentication
                                            ) {
        Long userId = getUserIdFromAuth(authentication);
        return ResponseEntity.ok(groupService.createGroup(request, userId));
    }
    
    @PutMapping("/{groupId}")
    public ResponseEntity<GroupDTO> updateGroup(
            @PathVariable Long groupId,
            @Valid @RequestBody CreateGroupRequest request,
            Authentication authentication
    ) {
        Long userId = getUserIdFromAuth(authentication);
        return ResponseEntity.ok(groupService.updateGroup(groupId, request, userId));
    }

    @GetMapping("/my-groups")
    public ResponseEntity<List<GroupDTO>> getMyGroups(Authentication authentication) {
        Long userId = getUserIdFromAuth(authentication);
        return ResponseEntity.ok(groupService.getUserSubscribedGroups(userId));
    }
    
    @GetMapping("/my-organised-groups")
    public ResponseEntity<List<GroupDTO>> getMyOrganisedGroups(Authentication authentication) {
        Long userId = getUserIdFromAuth(authentication);
        return ResponseEntity.ok(groupService.getUserOrganisedGroups(userId));
    }
    
    @GetMapping("/public")
    public ResponseEntity<List<GroupDTO>> getAllPublicGroups() {
        return ResponseEntity.ok(groupService.getAllPublicGroups());
    }
    
    @GetMapping("/{groupId}")
    public ResponseEntity<GroupDTO> getGroupById(@PathVariable Long groupId) {
        return ResponseEntity.ok(groupService.getGroupById(groupId));
    }
    
    @GetMapping("/{groupId}/members")
    public ResponseEntity<?> getGroupMembers(@PathVariable Long groupId) {
        return ResponseEntity.ok(groupService.getGroupMembers(groupId));
    }
    
    @PostMapping("/{groupId}/subscribe")
    public ResponseEntity<Void> subscribeToGroup(
            @PathVariable Long groupId,
            Authentication authentication
    ) {
        Long userId = getUserIdFromAuth(authentication);
        groupService.subscribeToGroup(groupId, userId);
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/{groupId}/unsubscribe")
    public ResponseEntity<Void> unsubscribeFromGroup(
            @PathVariable Long groupId,
            Authentication authentication
    ) {
        Long userId = getUserIdFromAuth(authentication);
        groupService.unsubscribeFromGroup(groupId, userId);
        return ResponseEntity.ok().build();
    }

    private Long getUserIdFromAuth(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new RuntimeException("User not authenticated");
        }
        
        // The principal should be a User object from Spring Security
        // When JWT is parsed, userId is stored in the authorities or can be extracted from token
        Object principal = authentication.getPrincipal();
        
        if (principal instanceof org.springframework.security.core.userdetails.UserDetails) {
            // If we have UserDetails, we need to extract userId from the authentication
            // It should be set as a detail by the JwtAuthenticationFilter
            if (authentication.getDetails() instanceof Long) {
                return (Long) authentication.getDetails();
            }
        }
        
        // Fallback: try to parse from name if it's a Long
        try {
            String name = authentication.getName();
            return Long.parseLong(name);
        } catch (NumberFormatException e) {
            throw new RuntimeException("Unable to extract userId from authentication");
        }
    }
    
    /**
     * Ban a member from a group (organiser only).
     */
    @PostMapping("/{groupId}/ban/{memberId}")
    public ResponseEntity<Void> banMember(
            @PathVariable Long groupId,
            @PathVariable Long memberId,
            @RequestParam(required = false) String reason,
            Authentication authentication
    ) {
        Long organiserId = getUserIdFromAuth(authentication);
        groupService.banMemberFromGroup(groupId, memberId, organiserId, reason);
        return ResponseEntity.ok().build();
    }
    
    /**
     * Unban a member from a group (organiser only).
     */
    @PostMapping("/{groupId}/unban/{memberId}")
    public ResponseEntity<Void> unbanMember(
            @PathVariable Long groupId,
            @PathVariable Long memberId,
            Authentication authentication
    ) {
        Long organiserId = getUserIdFromAuth(authentication);
        groupService.unbanMemberFromGroup(groupId, memberId, organiserId);
        return ResponseEntity.ok().build();
    }
    
    /**
     * Get all banned members for a group (organiser only).
     */
    @GetMapping("/{groupId}/banned-members")
    public ResponseEntity<?> getBannedMembers(
            @PathVariable Long groupId,
            Authentication authentication
    ) {
        Long organiserId = getUserIdFromAuth(authentication);
        return ResponseEntity.ok(groupService.getBannedMembers(groupId, organiserId));
    }
    
    /**
     * Remove a member from a group without banning (organiser only).
     * Member can rejoin the group later.
     */
    @PostMapping("/{groupId}/remove/{memberId}")
    public ResponseEntity<Void> removeMember(
            @PathVariable Long groupId,
            @PathVariable Long memberId,
            Authentication authentication
    ) {
        Long organiserId = getUserIdFromAuth(authentication);
        groupService.removeMemberFromGroup(groupId, memberId, organiserId);
        return ResponseEntity.ok().build();
    }
    
    /**
     * Transfer ownership of a group to another member (current organiser only).
     * The new organiser must be an active member of the group.
     */
    @PostMapping("/{groupId}/transfer-ownership/{newOrganiserId}")
    public ResponseEntity<GroupDTO> transferOwnership(
            @PathVariable Long groupId,
            @PathVariable Long newOrganiserId,
            Authentication authentication
    ) {
        Long currentOrganiserId = getUserIdFromAuth(authentication);
        GroupDTO updatedGroup = groupService.transferOwnership(groupId, newOrganiserId, currentOrganiserId);
        return ResponseEntity.ok(updatedGroup);
    }
    
    /**
     * Permanently delete a group that has no history (organiser only).
     * This is irreversible and completely removes the group from the database.
     * Only allowed for groups with no events, no additional members, and no banned members.
     */
    @DeleteMapping("/{groupId}/permanent")
    public ResponseEntity<Void> permanentlyDeleteGroup(
            @PathVariable Long groupId,
            Authentication authentication
    ) {
        Long organiserId = getUserIdFromAuth(authentication);
        groupService.permanentlyDeleteGroup(groupId, organiserId);
        return ResponseEntity.ok().build();
    }
}
