package com.organiser.platform.controller;

import com.organiser.platform.dto.AuthResponse;
import com.organiser.platform.dto.GoogleAuthRequest;
import com.organiser.platform.dto.MagicLinkRequest;
import com.organiser.platform.dto.PasscodeRequest;
import com.organiser.platform.exception.RateLimitExceededException;
import com.organiser.platform.model.Member;
import com.organiser.platform.security.JwtUtil;
import com.organiser.platform.service.AuthService;
import com.organiser.platform.service.FeatureFlagService;
import com.organiser.platform.service.GoogleOAuth2Service;
import com.organiser.platform.service.RateLimitService;
import com.organiser.platform.service.RefreshTokenService;
import io.github.bucket4j.Bucket;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {
    
    private final AuthService authService;
    private final GoogleOAuth2Service googleOAuth2Service;
    private final RateLimitService rateLimitService;
    private final FeatureFlagService featureFlagService;
    private final RefreshTokenService refreshTokenService;
    private final JwtUtil jwtUtil;
    
    /**
     * Request a magic link to be sent to email
     * Rate limited: 5 requests per hour per IP+email combination
     */
    @PostMapping("/magic-link")
    public ResponseEntity<Map<String, String>> requestMagicLink(
            @Valid @RequestBody MagicLinkRequest request,
            HttpServletRequest httpRequest) {
        
        // Rate limiting: 5 requests per hour per IP+email
        String clientIp = getClientIp(httpRequest);
        String rateLimitKey = clientIp + ":" + request.getEmail();
        Bucket bucket = rateLimitService.resolveMagicLinkBucket(rateLimitKey);
        
        if (!rateLimitService.tryConsume(bucket)) {
            long availableTokens = rateLimitService.getAvailableTokens(bucket);
            log.warn("Rate limit exceeded for magic link request - IP: {}, Email: {}, Available tokens: {}", 
                clientIp, request.getEmail(), availableTokens);
            throw new RateLimitExceededException(
                "Too many magic link requests. Please try again in 1 hour. " +
                "This helps us prevent spam and keep your account secure."
            );
        }
        
        log.debug("Magic link request accepted - IP: {}, Email: {}", clientIp, request.getEmail());
        authService.requestMagicLink(request);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Magic link sent to your email");
        response.put("email", request.getEmail());
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Verify magic link token and authenticate.
     * Optional inviteToken grants organiser role on successful auth.
     */
    @GetMapping("/verify")
    public ResponseEntity<AuthResponse> verifyMagicLink(
            @RequestParam String token,
            @RequestParam(required = false) String inviteToken,
            HttpServletRequest request) {
        return ResponseEntity.ok(authService.verifyMagicLink(token, inviteToken, request));
    }
    
    /**
     * Request a 6-digit passcode to be sent to email.
     * Only available when PASSCODE_AUTH_ENABLED feature flag is true.
     * Rate limited: 5 requests per hour per IP+email combination
     */
    @PostMapping("/passcode")
    public ResponseEntity<Map<String, String>> requestPasscode(
            @Valid @RequestBody PasscodeRequest request,
            HttpServletRequest httpRequest) {

        if (!featureFlagService.isFeatureEnabled(FeatureFlagService.PASSCODE_AUTH_ENABLED)) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Passcode authentication is not enabled");
            return ResponseEntity.status(403).body(response);
        }

        String clientIp = getClientIp(httpRequest);
        String rateLimitKey = clientIp + ":passcode:" + request.getEmail();
        io.github.bucket4j.Bucket bucket = rateLimitService.resolveMagicLinkBucket(rateLimitKey);

        if (!rateLimitService.tryConsume(bucket)) {
            log.warn("Rate limit exceeded for passcode request - IP: {}, Email: {}", clientIp, request.getEmail());
            throw new RateLimitExceededException(
                "Too many passcode requests. Please try again in 1 hour."
            );
        }

        log.debug("Passcode request accepted - IP: {}, Email: {}", clientIp, request.getEmail());
        authService.requestPasscode(request);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Passcode sent to your email");
        response.put("email", request.getEmail());
        return ResponseEntity.ok(response);
    }

    /**
     * Verify a 6-digit passcode and authenticate.
     * Only available when PASSCODE_AUTH_ENABLED feature flag is true.
     * Rate limited: 10 attempts per 15 minutes per IP+email to prevent brute-force
     */
    @PostMapping("/passcode/verify")
    public ResponseEntity<AuthResponse> verifyPasscode(
            @RequestBody Map<String, String> body,
            HttpServletRequest httpRequest) {

        if (!featureFlagService.isFeatureEnabled(FeatureFlagService.PASSCODE_AUTH_ENABLED)) {
            return ResponseEntity.status(403).build();
        }

        String email = body.get("email");
        String code = body.get("code");
        String inviteToken = body.get("inviteToken");

        // Validate input
        if (email == null || email.trim().isEmpty() || code == null || code.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        // Trim and validate code format (exactly 6 digits)
        String trimmedCode = code.trim();
        if (!trimmedCode.matches("^\\d{6}$")) {
            log.warn("Invalid passcode format from IP: {} for email: {}", getClientIp(httpRequest), email);
            return ResponseEntity.badRequest().build();
        }

        // Rate limiting: 10 attempts per 15 minutes per IP+email (prevents brute-force)
        String clientIp = getClientIp(httpRequest);
        String rateLimitKey = clientIp + ":passcode-verify:" + email.trim().toLowerCase();
        Bucket bucket = rateLimitService.resolvePasscodeVerifyBucket(rateLimitKey);

        if (!rateLimitService.tryConsume(bucket)) {
            log.warn("Rate limit exceeded for passcode verification - IP: {}, Email: {}", clientIp, email);
            throw new RateLimitExceededException(
                "Too many verification attempts. Please try again in 15 minutes."
            );
        }

        return ResponseEntity.ok(authService.verifyPasscode(email.trim(), trimmedCode, inviteToken, httpRequest));
    }

    /**
     * Authenticate with Google OAuth2
     * Primary authentication method - instant, no email required
     * Rate limited: 10 requests per minute per IP
     */
    @PostMapping("/google")
    public ResponseEntity<AuthResponse> authenticateWithGoogle(
            @Valid @RequestBody GoogleAuthRequest request,
            HttpServletRequest httpRequest) {
        
        // Rate limiting: 10 requests per minute per IP
        String clientIp = getClientIp(httpRequest);
        Bucket bucket = rateLimitService.resolveOAuthBucket(clientIp);
        
        if (!rateLimitService.tryConsume(bucket)) {
            long availableTokens = rateLimitService.getAvailableTokens(bucket);
            log.warn("Rate limit exceeded for Google OAuth - IP: {}, Available tokens: {}", 
                clientIp, availableTokens);
            throw new RateLimitExceededException(
                "Too many authentication attempts. Please try again in 1 minute."
            );
        }
        
        log.debug("Google OAuth request accepted - IP: {}", clientIp);
        return ResponseEntity.ok(googleOAuth2Service.authenticateWithGoogle(request, httpRequest));
    }
    
    /**
     * Refresh access token using refresh token
     * Returns new access token and new refresh token (rotation)
     */
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(
            @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {
        
        String refreshToken = request.get("refreshToken");
        if (refreshToken == null || refreshToken.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        try {
            // Verify and rotate refresh token
            com.organiser.platform.model.RefreshToken newRefreshToken = 
                refreshTokenService.verifyAndRotateToken(refreshToken, httpRequest);
            
            // Get member details
            Member member = newRefreshToken.getMember();
            
            // Determine role
            String role = member.getIsAdmin() ? "ADMIN" : 
                         (member.getHasOrganiserRole() ? "ORGANISER" : "MEMBER");
            
            // Generate new access token (15 minutes)
            String newAccessToken = jwtUtil.generateToken(member.getEmail(), member.getId(), role);
            
            // Return new tokens
            return ResponseEntity.ok(AuthResponse.builder()
                    .token(newAccessToken)
                    .refreshToken(newRefreshToken.getToken())
                    .userId(member.getId())
                    .email(member.getEmail())
                    .role(role)
                    .hasOrganiserRole(member.getHasOrganiserRole())
                    .build());
                    
        } catch (RuntimeException e) {
            log.error("Refresh token error: {}", e.getMessage());
            return ResponseEntity.status(401).build();
        }
    }
    
    /**
     * Logout - revoke refresh token
     */
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(
            @RequestBody Map<String, String> request) {
        
        String refreshToken = request.get("refreshToken");
        if (refreshToken != null && !refreshToken.trim().isEmpty()) {
            try {
                refreshTokenService.revokeToken(refreshToken);
            } catch (Exception e) {
                log.warn("Failed to revoke refresh token: {}", e.getMessage());
            }
        }
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Logged out successfully");
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get client IP address
     */
    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
