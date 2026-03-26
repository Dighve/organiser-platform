package com.organiser.platform.service;

import com.organiser.platform.model.Member;
import com.organiser.platform.model.RefreshToken;
import com.organiser.platform.repository.MemberRepository;
import com.organiser.platform.repository.RefreshTokenRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenService {
    
    private final RefreshTokenRepository refreshTokenRepository;
    private final MemberRepository memberRepository;
    
    @Value("${jwt.refresh-expiration}")
    private Long refreshTokenDurationMs;
    
    /**
     * Create a new refresh token for a user
     */
    @Transactional
    public RefreshToken createRefreshToken(Long memberId, HttpServletRequest request) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Member not found"));
        
        // Generate unique token
        String token = UUID.randomUUID().toString();
        
        // Calculate expiration (30 days from now)
        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(refreshTokenDurationMs / 1000);
        
        // Get device info and IP
        String deviceInfo = request.getHeader("User-Agent");
        String ipAddress = getClientIp(request);
        
        RefreshToken refreshToken = RefreshToken.builder()
                .token(token)
                .member(member)
                .expiresAt(expiresAt)
                .createdAt(LocalDateTime.now())
                .revoked(false)
                .deviceInfo(deviceInfo)
                .ipAddress(ipAddress)
                .build();
        
        return refreshTokenRepository.save(refreshToken);
    }
    
    /**
     * Verify and rotate refresh token
     * Returns the refresh token if valid, throws exception otherwise
     */
    @Transactional
    public RefreshToken verifyAndRotateToken(String token, HttpServletRequest request) {
        // Use pessimistic locking to prevent concurrent rotation
        RefreshToken refreshToken = refreshTokenRepository.findByTokenWithLock(token)
                .orElseThrow(() -> new RuntimeException("Invalid refresh token"));
        
        if (!refreshToken.isValid()) {
            throw new RuntimeException("Refresh token expired or revoked");
        }
        
        // Revoke old token
        refreshToken.revoke();
        
        // Create new refresh token
        RefreshToken newRefreshToken = createRefreshToken(refreshToken.getMember().getId(), request);
        
        // Link old token to new one for audit trail
        refreshToken.setReplacedByToken(newRefreshToken.getToken());
        refreshTokenRepository.save(refreshToken);
        
        log.info("Refresh token rotated for member: {}", refreshToken.getMember().getId());
        
        return newRefreshToken;
    }
    
    /**
     * Revoke all refresh tokens for a user (logout from all devices)
     */
    @Transactional
    public void revokeAllUserTokens(Long memberId) {
        refreshTokenRepository.revokeAllUserTokens(memberId, LocalDateTime.now());
        log.info("All refresh tokens revoked for member: {}", memberId);
    }
    
    /**
     * Revoke a specific refresh token
     */
    @Transactional
    public void revokeToken(String token) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Refresh token not found"));
        
        refreshToken.revoke();
        refreshTokenRepository.save(refreshToken);
        log.info("Refresh token revoked: {}", token);
    }
    
    /**
     * Cleanup expired tokens (runs daily at 3 AM)
     */
    @Scheduled(cron = "0 0 3 * * ?")
    @Transactional
    public void cleanupExpiredTokens() {
        LocalDateTime now = LocalDateTime.now();
        refreshTokenRepository.deleteExpiredTokens(now);
        log.info("Expired refresh tokens cleaned up");
    }
    
    /**
     * Get client IP address from request
     */
    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
