package com.organiser.platform.service;

// ============================================================
// IMPORTS
// ============================================================
import com.organiser.platform.dto.AuthResponse;
import com.organiser.platform.dto.MagicLinkRequest;
import com.organiser.platform.model.MagicLink;
import com.organiser.platform.model.Member;
import com.organiser.platform.repository.MagicLinkRepository;
import com.organiser.platform.repository.MemberRepository;
import com.organiser.platform.security.JwtUtil;
import com.organiser.platform.util.AvatarGenerator;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.util.StringUtils;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

// ============================================================
// SERVICE CLASS
// ============================================================
/**
 * Service for handling passwordless authentication via magic links.
 * 
 * @author OutMeets Platform Team
 */
@Service
@RequiredArgsConstructor
public class AuthService {
    
    // ============================================================
    // LOGGER
    // ============================================================
    private static final org.slf4j.Logger log = LoggerFactory.getLogger(AuthService.class);
    
    // ============================================================
    // DEPENDENCIES
    // ============================================================
    private final MemberRepository memberRepository;
    private final MagicLinkRepository magicLinkRepository;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;
    private final AvatarGenerator avatarGenerator;
    private final OrganiserInviteService organiserInviteService;
    
    // ============================================================
    // CONSTANTS
    // ============================================================
    private static final int MAGIC_LINK_EXPIRY_MINUTES = 15;
    
    // ============================================================
    // PUBLIC METHODS - Authentication
    // ============================================================
    
    /**
     * Request a magic link to be sent to the email.
     * Creates user if doesn't exist.
     */
    @Transactional
    public void requestMagicLink(MagicLinkRequest request) {
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Email cannot be null or empty");
        }
        String email = request.getEmail().toLowerCase().trim();
        
        // Create member if doesn't exist
        Member member = memberRepository.findByEmail(email)
                .orElseGet(() -> createNewMember(email, request));
        
        // Delete any existing unused magic links for this email
        magicLinkRepository.deleteUnusedLinksByEmail(email);
        
        // Generate new magic link
        String token = UUID.randomUUID().toString();
        MagicLink magicLink = MagicLink.builder()
                .token(token)
                .email(email)
                .expiresAt(LocalDateTime.now().plusMinutes(MAGIC_LINK_EXPIRY_MINUTES))
                .user(member)
                .used(false)
                .build();
        
        magicLinkRepository.save(magicLink);
        
        // Send magic link via email (include redirect URL for cross-browser support)
        emailService.sendMagicLink(email, token, request.getRedirectUrl());
    }
    
    /**
     * Verify magic link token and authenticate user.
     */
    @Transactional
    public AuthResponse verifyMagicLink(String token, String inviteToken) {
        MagicLink magicLink = magicLinkRepository.findByTokenAndUsedFalse(token)
                .orElseThrow(() -> new RuntimeException("Invalid or expired magic link"));
        
        if (!magicLink.isValid()) {
            throw new RuntimeException("Magic link has expired or been used");
        }
        
        // Mark magic link as used
        magicLink.setUsed(true);
        magicLink.setUsedAt(LocalDateTime.now());
        magicLinkRepository.save(magicLink);
        
        // Get user
        Member member = magicLink.getUser();

        // Reactivate soft-deleted accounts on successful login
        if (Boolean.FALSE.equals(member.getActive())) {
            member.setActive(true);
            // If the display name was scrubbed, set a sensible default from email
            if (member.getDisplayName() == null || "Deleted user".equalsIgnoreCase(member.getDisplayName().trim())) {
                String localPart = member.getEmail() != null ? member.getEmail().split("@")[0] : "User";
                member.setDisplayName(localPart);
            }
            memberRepository.save(member);
        }
        
        // Mark user as verified
        if (!member.getVerified()) {
            member.setVerified(true);
            memberRepository.save(member);
        }
        
        // Process organiser invite token if present
        boolean becameOrganiser = false;
        log.info("🔍 AuthService.verifyMagicLink - inviteToken received: {}", inviteToken);
        if (StringUtils.hasText(inviteToken)) {
            log.info("🔄 AuthService.verifyMagicLink - Processing invite token for member {}", member.getId());
            becameOrganiser = organiserInviteService.consumeInviteAndGrantRole(inviteToken, member.getId());
            log.info("✅ AuthService.verifyMagicLink - Invite consumption result: {}", becameOrganiser);
            if (becameOrganiser) {
                // Refresh member to get updated role
                member = memberRepository.findById(member.getId()).orElse(member);
                log.info("🔄 AuthService.verifyMagicLink - Member refreshed, hasOrganiserRole: {}", member.getHasOrganiserRole());
            }
        } else {
            log.info("ℹ️ AuthService.verifyMagicLink - No invite token provided");
        }

        // Determine role based on admin status
        String role = member.getIsAdmin() ? "ADMIN" : (member.getHasOrganiserRole() ? "ORGANISER" : "MEMBER");
        
        // Generate JWT token
        String jwtToken = jwtUtil.generateToken(member.getEmail(), member.getId(), role);
        
        return AuthResponse.builder()
                .token(jwtToken)
                .userId(member.getId())
                .email(member.getEmail())
                .role(role)
                .hasOrganiserRole(member.getHasOrganiserRole())
                .isNewOrganiser(becameOrganiser)
                .build();
    }
    
    // ============================================================
    // PRIVATE METHODS - Member Creation
    // ============================================================
    
    /**
     * Create a new member with auto-generated avatar.
     */
    private Member createNewMember(String email, MagicLinkRequest request) {
        String displayName = request.getDisplayName();
        
        // Generate avatar URL based on display name or email
        String avatarUrl = avatarGenerator.generateAvatarUrl(displayName, email);
        
        Member newMember = Member.builder()
                .email(email)
                .displayName(displayName)
                .profilePhotoUrl(avatarUrl)  // Auto-generated avatar
                .verified(false)
                .active(true)
                .build();
        
        return memberRepository.save(newMember);
    }
    
    // ============================================================
    // SCHEDULED TASKS - Cleanup
    // ============================================================
    
    /**
     * Cleanup expired and used magic links every hour.
     */
    @Scheduled(fixedRate = 3600000, initialDelay = 60000) // Run every hour, start after 1 minute
    @Transactional
    public void cleanupExpiredLinks() {
        magicLinkRepository.deleteExpiredAndUsedLinks(LocalDateTime.now());
    }
}
