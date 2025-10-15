package com.organiser.platform.service;

import com.organiser.platform.dto.AuthResponse;
import com.organiser.platform.dto.MagicLinkRequest;
import com.organiser.platform.model.MagicLink;
import com.organiser.platform.model.User;
import com.organiser.platform.model.UserRole;
import com.organiser.platform.repository.MagicLinkRepository;
import com.organiser.platform.repository.UserRepository;
import com.organiser.platform.security.JwtUtil;
import com.organiser.platform.util.AvatarGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {
    
    private final UserRepository userRepository;
    private final MagicLinkRepository magicLinkRepository;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;
    private final AvatarGenerator avatarGenerator;
    
    private static final int MAGIC_LINK_EXPIRY_MINUTES = 15;
    
    /**
     * Request a magic link to be sent to the email
     * Creates user if doesn't exist
     */
    @Transactional
    public void requestMagicLink(MagicLinkRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        
        // Create user if doesn't exist
        User user = userRepository.findByEmail(email)
                .orElseGet(() -> createNewUser(email, request));
        
        // Delete any existing unused magic links for this email
        magicLinkRepository.deleteUnusedLinksByEmail(email);
        
        // Generate new magic link
        String token = UUID.randomUUID().toString();
        MagicLink magicLink = MagicLink.builder()
                .token(token)
                .email(email)
                .expiresAt(LocalDateTime.now().plusMinutes(MAGIC_LINK_EXPIRY_MINUTES))
                .used(false)
                .build();
        
        magicLinkRepository.save(magicLink);
        
        // Send magic link via email
        emailService.sendMagicLink(email, token);
    }
    
    /**
     * Verify magic link token and authenticate user
     */
    @Transactional
    public AuthResponse verifyMagicLink(String token) {
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
        User user = userRepository.findByEmail(magicLink.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Mark user as verified
        if (!user.getVerified()) {
            user.setVerified(true);
            userRepository.save(user);
        }
        
        // Generate JWT token
        String jwtToken = jwtUtil.generateToken(user.getEmail(), user.getId(), user.getRole().name());
        
        return AuthResponse.builder()
                .token(jwtToken)
                .userId(user.getId())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }
    
    /**
     * Create a new user with auto-generated avatar
     */
    private User createNewUser(String email, MagicLinkRequest request) {
        String displayName = request.getDisplayName();
        
        // Generate avatar URL based on display name or email
        String avatarUrl = avatarGenerator.generateAvatarUrl(displayName, email);
        
        User newUser = User.builder()
                .email(email)
                .displayName(displayName)
                .profilePhotoUrl(avatarUrl)  // Auto-generated avatar
                .role(UserRole.MEMBER)
                .verified(false)
                .active(true)
                .build();
        
        return userRepository.save(newUser);
    }
    
    /**
     * Cleanup expired and used magic links every hour
     */
    @Scheduled(fixedRate = 3600000) // 1 hour
    @Transactional
    public void cleanupExpiredLinks() {
        magicLinkRepository.deleteExpiredAndUsedLinks(LocalDateTime.now());
    }
}
