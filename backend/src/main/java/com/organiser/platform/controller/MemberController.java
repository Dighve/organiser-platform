package com.organiser.platform.controller;

import com.organiser.platform.model.Member;
import com.organiser.platform.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

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
    public ResponseEntity<Member> getCurrentMember(Authentication authentication) {
        Long userId = getUserIdFromAuth(authentication);
        Member member = memberService.getMemberById(userId);
        return ResponseEntity.ok(member);
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
