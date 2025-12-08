package com.organiser.platform.controller;

import com.organiser.platform.dto.AuthResponse;
import com.organiser.platform.dto.GoogleAuthRequest;
import com.organiser.platform.dto.MagicLinkRequest;
import com.organiser.platform.exception.RateLimitExceededException;
import com.organiser.platform.service.AuthService;
import com.organiser.platform.service.GoogleOAuth2Service;
import com.organiser.platform.service.RateLimitService;
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
        
        log.info("Magic link request accepted - IP: {}, Email: {}", clientIp, request.getEmail());
        authService.requestMagicLink(request);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Magic link sent to your email");
        response.put("email", request.getEmail());
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Verify magic link token and authenticate
     */
    @GetMapping("/verify")
    public ResponseEntity<AuthResponse> verifyMagicLink(@RequestParam String token) {
        return ResponseEntity.ok(authService.verifyMagicLink(token));
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
        
        log.info("Google OAuth request accepted - IP: {}", clientIp);
        return ResponseEntity.ok(googleOAuth2Service.authenticateWithGoogle(request));
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
