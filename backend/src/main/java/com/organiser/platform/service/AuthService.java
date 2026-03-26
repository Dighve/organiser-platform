package com.organiser.platform.service;

// ============================================================
// IMPORTS
// ============================================================
import com.organiser.platform.dto.AuthResponse;
import com.organiser.platform.dto.MagicLinkRequest;
import com.organiser.platform.dto.PasscodeRequest;
import com.organiser.platform.model.EmailOtp;
import com.organiser.platform.model.MagicLink;
import com.organiser.platform.model.Member;
import com.organiser.platform.repository.EmailOtpRepository;
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

import java.security.SecureRandom;
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
    private final EmailOtpRepository emailOtpRepository;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;
    private final AvatarGenerator avatarGenerator;
    private final OrganiserInviteService organiserInviteService;
    private final RefreshTokenService refreshTokenService;
    
    // ============================================================
    // CONSTANTS
    // ============================================================
    private static final int MAGIC_LINK_EXPIRY_MINUTES = 15;
    private static final int PASSCODE_EXPIRY_MINUTES = 10;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    
    // ============================================================
    // PUBLIC METHODS - Authentication
    // ============================================================
    
    /**
     * Request a magic link to be sent to the email.
     * Creates user if doesn't exist, or reactivates soft-deleted account.
     */
    @Transactional
    public void requestMagicLink(MagicLinkRequest request) {
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Email cannot be null or empty");
        }
        String email = request.getEmail().toLowerCase().trim();
        
        // Create member if doesn't exist, or reactivate if soft-deleted
        Member member = memberRepository.findByEmail(email)
                .map(existingMember -> reactivateMemberIfDeleted(existingMember, request))
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
    public AuthResponse verifyMagicLink(String token, String inviteToken, jakarta.servlet.http.HttpServletRequest request) {
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

        // Note: Member reactivation is now handled in requestMagicLink() → reactivateMemberIfDeleted()
        // This ensures legal agreement flags are properly reset during reactivation
        
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
        
        // Generate JWT access token (15 minutes)
        String jwtToken = jwtUtil.generateToken(member.getEmail(), member.getId(), role);
        
        // Generate refresh token (30 days)
        com.organiser.platform.model.RefreshToken refreshToken = refreshTokenService.createRefreshToken(member.getId(), request);
        
        return AuthResponse.builder()
                .token(jwtToken)
                .refreshToken(refreshToken.getToken())
                .userId(member.getId())
                .email(member.getEmail())
                .role(role)
                .hasOrganiserRole(member.getHasOrganiserRole())
                .isNewOrganiser(becameOrganiser)
                .build();
    }
    
    // ============================================================
    // PUBLIC METHODS - Passcode (OTP) Authentication
    // ============================================================

    /**
     * Request a 6-digit passcode to be sent to the email.
     * Same member creation/reactivation logic as magic link.
     */
    @Transactional
    public void requestPasscode(PasscodeRequest request) {
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Email cannot be null or empty");
        }
        String email = request.getEmail().toLowerCase().trim();

        MagicLinkRequest mlRequest = new MagicLinkRequest();
        mlRequest.setEmail(email);
        mlRequest.setDisplayName(request.getDisplayName());
        mlRequest.setRedirectUrl(request.getRedirectUrl());
        mlRequest.setInviteToken(request.getInviteToken());

        Member member = memberRepository.findByEmail(email)
                .map(existingMember -> reactivateMemberIfDeleted(existingMember, mlRequest))
                .orElseGet(() -> createNewMember(email, mlRequest));

        emailOtpRepository.deleteUnusedOtpsByEmail(email);

        String code = String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
        EmailOtp otp = EmailOtp.builder()
                .code(code)
                .email(email)
                .member(member)
                .expiresAt(LocalDateTime.now().plusMinutes(PASSCODE_EXPIRY_MINUTES))
                .used(false)
                .build();

        emailOtpRepository.save(otp);
        emailService.sendPasscode(email, code);
    }

    /**
     * Verify a 6-digit passcode and authenticate the user.
     * Input is trimmed and validated before DB lookup for better UX.
     */
    @Transactional
    public AuthResponse verifyPasscode(String email, String code, String inviteToken) {
        String normalizedEmail = email.toLowerCase().trim();
        String trimmedCode = code.trim(); // Trim whitespace for better UX (e.g., pasted codes)

        EmailOtp otp = emailOtpRepository
                .findTopByEmailAndCodeAndUsedFalseOrderByCreatedAtDesc(normalizedEmail, trimmedCode)
                .orElseThrow(() -> new RuntimeException("Invalid or expired passcode"));

        if (!otp.isValid()) {
            throw new RuntimeException("Passcode has expired or been used");
        }

        otp.setUsed(true);
        otp.setUsedAt(LocalDateTime.now());
        emailOtpRepository.save(otp);

        Member member = otp.getMember();

        if (!member.getVerified()) {
            member.setVerified(true);
            memberRepository.save(member);
        }

        boolean becameOrganiser = false;
        if (log.isDebugEnabled()) {
            boolean hasInviteToken = StringUtils.hasText(inviteToken);
            int inviteTokenLength = inviteToken != null ? inviteToken.length() : 0;
            log.debug("🔍 AuthService.verifyPasscode - inviteToken metadata: hasInviteToken={}, length={}", hasInviteToken, inviteTokenLength);
        }
        if (StringUtils.hasText(inviteToken)) {
            becameOrganiser = organiserInviteService.consumeInviteAndGrantRole(inviteToken, member.getId());
            if (becameOrganiser) {
                member = memberRepository.findById(member.getId()).orElse(member);
            }
        }

        String role = member.getIsAdmin() ? "ADMIN" : (member.getHasOrganiserRole() ? "ORGANISER" : "MEMBER");
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
    
    /**
     * Reactivate a soft-deleted member and reset legal agreement flags.
     * This ensures user/organiser agreements are shown again on reactivation.
     */
    private Member reactivateMemberIfDeleted(Member existingMember, MagicLinkRequest request) {
        // If member is active, return as-is
        if (Boolean.TRUE.equals(existingMember.getActive())) {
            return existingMember;
        }
        
        log.info("🔄 Reactivating soft-deleted member: {}", existingMember.getEmail());
        
        // Reactivate member and reset legal agreement flags
        existingMember.setActive(true);
        existingMember.setHasAcceptedUserAgreement(false); // CRITICAL: Reset user agreement
        existingMember.setUserAgreementAcceptedAt(null);
        existingMember.setHasAcceptedOrganiserAgreement(false); // CRITICAL: Reset organiser agreement  
        existingMember.setOrganiserAgreementAcceptedAt(null);
        existingMember.setHasOrganiserRole(false); // Reset organiser role
        
        // Update display name - reset from "Deleted user" or use provided name
        if (request.getDisplayName() != null && !request.getDisplayName().trim().isEmpty()) {
            existingMember.setDisplayName(request.getDisplayName().trim());
        } else if (existingMember.getDisplayName() == null || "Deleted user".equalsIgnoreCase(existingMember.getDisplayName().trim())) {
            // Reset display name from email if it was scrubbed during deletion
            String localPart = existingMember.getEmail() != null ? existingMember.getEmail().split("@")[0] : "User";
            existingMember.setDisplayName(localPart);
        }
        
        // Generate new avatar if display name changed or if no profile photo
        if (existingMember.getProfilePhotoUrl() == null || 
            existingMember.getProfilePhotoUrl().contains("ui-avatars.com")) {
            String avatarUrl = avatarGenerator.generateAvatarUrl(
                existingMember.getDisplayName(), 
                existingMember.getEmail()
            );
            existingMember.setProfilePhotoUrl(avatarUrl);
        }
        
        log.info("✅ Member reactivated - agreements reset, will show user agreement modal");
        return memberRepository.save(existingMember);
    }
    
    // ============================================================
    // SCHEDULED TASKS - Cleanup
    // ============================================================
    
    /**
     * Cleanup expired and used magic links and OTPs every hour.
     */
    @Scheduled(fixedRate = 3600000, initialDelay = 60000) // Run every hour, start after 1 minute
    @Transactional
    public void cleanupExpiredLinks() {
        magicLinkRepository.deleteExpiredAndUsedLinks(LocalDateTime.now());
        emailOtpRepository.deleteExpiredAndUsedOtps(LocalDateTime.now());
    }
}
