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
        log.info("member-details {}", member.toString());
        return ResponseEntity.ok(member);
    }
    
    /**
     * Get member details by ID (for member detail page)
     * Returns DTO with email, display name, and profile photo
     */
    @GetMapping("/{memberId}")
    public ResponseEntity<MemberDTO> getMemberById(@PathVariable Long memberId) {
        MemberDTO member = memberService.getMemberDTOById(memberId);
        return ResponseEntity.ok(member);
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
