package com.organiser.platform.controller;

import com.organiser.platform.dto.MemberDTO;
import com.organiser.platform.dto.UpdateMemberProfileRequest;
import com.organiser.platform.model.Member;
import com.organiser.platform.service.MemberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/members")
@RequiredArgsConstructor
public class MemberController {
    
    private final MemberService memberService;
    
    @PostMapping("/become-organiser")
    public ResponseEntity<Member> becomeOrganiser(Authentication authentication) {
        Long userId = getUserIdFromAuth(authentication);
        Member member = memberService.promoteToOrganiser(userId);
        return ResponseEntity.ok(member);
    }
    
    @GetMapping("/me")
    public ResponseEntity<MemberDTO> getCurrentMember(Authentication authentication) {
        Long userId = getUserIdFromAuth(authentication);
        MemberDTO member = memberService.getMemberDTOById(userId);
        return ResponseEntity.ok(member);
    }
    
    /**
     * Get member details by ID (for viewing other users' profiles)
     * PRIVACY: Only returns public-safe fields (id, displayName, profilePhotoUrl, imagePosition)
     * Does NOT expose: email, isAdmin, agreement info, notification preferences
     */
    @GetMapping("/{memberId}")
    public ResponseEntity<MemberDTO> getMemberById(@PathVariable Long memberId) {
        MemberDTO member = memberService.getPublicMemberProfile(memberId);
        return ResponseEntity.ok(member);
    }
    
    /**
     * Get all members for invitation/search purposes.
     * Returns list of all members with basic info (id, email, displayName, profilePhotoUrl).
     * Requires authentication.
     */
    @GetMapping
    public ResponseEntity<java.util.List<MemberDTO>> getAllMembers(Authentication authentication) {
        // Ensure user is authenticated
        if (authentication == null) {
            throw new RuntimeException("Authentication required");
        }
        return ResponseEntity.ok(memberService.getAllMembers());
    }

    /**
     * Delete current user's profile.
     * Guards: organisers/hosts of future events are blocked with 409.
     */
    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteCurrentMember(Authentication authentication) {
        Long userId = getUserIdFromAuth(authentication);
        memberService.deleteCurrentMember(userId);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Update current user's profile (display name, photo URL)
     */
    @PutMapping("/me")
    public ResponseEntity<MemberDTO> updateProfile(
            @Valid @RequestBody UpdateMemberProfileRequest request,
            Authentication authentication) {
        Long userId = getUserIdFromAuth(authentication);
        MemberDTO updatedMember = memberService.updateMemberProfile(userId, request);
        return ResponseEntity.ok(updatedMember);
    }
    
    /**
     * Update email notification preferences
     */
    @PutMapping("/me/email-notifications")
    public ResponseEntity<Void> updateEmailNotifications(
            @RequestBody java.util.Map<String, Boolean> request,
            Authentication authentication) {
        Long userId = getUserIdFromAuth(authentication);
        Boolean enabled = request.get("enabled");
        if (enabled == null) {
            throw new RuntimeException("'enabled' field is required");
        }
        memberService.updateEmailNotifications(userId, enabled);
        return ResponseEntity.ok().build();
    }
    
    private Long getUserIdFromAuth(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new RuntimeException("User not authenticated");
        }
        
        Object principal = authentication.getPrincipal();
        
        if (principal instanceof org.springframework.security.core.userdetails.UserDetails) {
            if (authentication.getDetails() instanceof Long) {
                return (Long) authentication.getDetails();
            }
        }
        
        try {
            String name = authentication.getName();
            return Long.parseLong(name);
        } catch (NumberFormatException e) {
            throw new RuntimeException("Unable to extract userId from authentication");
        }
    }
}
