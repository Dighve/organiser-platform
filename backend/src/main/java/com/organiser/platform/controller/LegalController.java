package com.organiser.platform.controller;

import com.organiser.platform.dto.AcceptOrganiserAgreementRequest;
import com.organiser.platform.dto.AcceptUserAgreementRequest;
import com.organiser.platform.enums.AgreementType;
import com.organiser.platform.service.EnhancedLegalService;
import com.organiser.platform.service.LegalService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/legal")
@RequiredArgsConstructor
public class LegalController {

    private final LegalService legalService;
    private final EnhancedLegalService enhancedLegalService;

    @PostMapping("/accept-organiser-agreement")
    public ResponseEntity<Map<String, String>> acceptOrganiserAgreement(
            @RequestBody AcceptOrganiserAgreementRequest request,
            Authentication authentication,
            HttpServletRequest httpRequest) {

        System.out.println("🔄 Accept Organiser Agreement endpoint called");
        System.out.println("📝 Request body: " + request);
        System.out.println("👤 Authentication name: " + authentication.getName());
        
        if (authentication == null) {
            System.out.println("❌ No authentication found!");
            return ResponseEntity.status(403).body(Map.of("message", "Authentication required"));
        }
        
        // Extract userId from JWT claims (not from subject/name which is email)
        Long memberId = getUserIdFromAuth(authentication);
        System.out.println("✅ Member ID: " + memberId);
        
        // Get IP address
        String ipAddress = request.getIpAddress();
        if (ipAddress == null || ipAddress.isEmpty()) {
            ipAddress = getClientIpAddress(httpRequest);
        }
        System.out.println("📍 IP Address: " + ipAddress);
        
        // Get user agent
        String userAgent = request.getUserAgent();
        if (userAgent == null || userAgent.isEmpty()) {
            userAgent = httpRequest.getHeader("User-Agent");
        }
        System.out.println("🖥️ User Agent: " + userAgent);
        
        // Use enhanced service - always saves current active version from DB
        enhancedLegalService.acceptAgreement(
            AgreementType.ORGANISER, 
            memberId, 
            ipAddress, 
            userAgent, 
            null, // sessionId 
            null, // referrerUrl
            null  // browserFingerprint
        );
        System.out.println("✅ Agreement accepted successfully");
        
        return ResponseEntity.ok(Map.of("message", "Organiser Agreement accepted successfully"));
    }
    
    @GetMapping("/has-accepted-organiser-agreement")
    public ResponseEntity<Map<String, Boolean>> hasAcceptedOrganiserAgreement(
            Authentication authentication) {
        
        Long memberId = getUserIdFromAuth(authentication);
        // Use enhanced service - checks if member accepted CURRENT active version, not just any version
        boolean hasAccepted = enhancedLegalService.hasAcceptedOrganiserAgreement(memberId);
        System.out.println("✅ hasAcceptedOrganiserAgreement for member " + memberId + ": " + hasAccepted);
        
        return ResponseEntity.ok(Map.of("hasAccepted", hasAccepted));
    }
    
    @PostMapping("/accept-user-agreement")
    public ResponseEntity<Map<String, String>> acceptUserAgreement(
            @RequestBody AcceptUserAgreementRequest request,
            Authentication authentication,
            HttpServletRequest httpRequest) {
        
        System.out.println("🔄 Accept User Agreement endpoint called");
        
        if (authentication == null) {
            System.out.println("❌ No authentication found!");
            return ResponseEntity.status(403).body(Map.of("message", "Authentication required"));
        }
        
        Long memberId = getUserIdFromAuth(authentication);
        System.out.println("✅ Member ID: " + memberId);
        System.out.println("📝 Agreement text received (length: " + (request.getAgreementText() != null ? request.getAgreementText().length() : "null") + ")");
        
        String ipAddress = request.getIpAddress();
        if (ipAddress == null || ipAddress.isEmpty()) {
            ipAddress = getClientIpAddress(httpRequest);
        }
        
        String userAgent = request.getUserAgent();
        if (userAgent == null || userAgent.isEmpty()) {
            userAgent = httpRequest.getHeader("User-Agent");
        }
        
        // Use enhanced service - always saves current active version from DB
        enhancedLegalService.acceptAgreement(
            AgreementType.USER, 
            memberId, 
            ipAddress, 
            userAgent, 
            request.getSessionId(), 
            request.getReferrerUrl(), 
            request.getBrowserFingerprint()
        );
        
        System.out.println("✅ User Agreement accepted successfully");
        
        return ResponseEntity.ok(Map.of("message", "User Agreement accepted successfully"));
    }
    
    @GetMapping("/has-accepted-user-agreement")
    public ResponseEntity<Map<String, Boolean>> hasAcceptedUserAgreement(
            Authentication authentication) {
        
        Long memberId = getUserIdFromAuth(authentication);
        // Use enhanced service - checks if member accepted CURRENT active version, not just any version
        boolean hasAccepted = enhancedLegalService.hasAcceptedUserAgreement(memberId);
        System.out.println("✅ hasAcceptedUserAgreement for member " + memberId + ": " + hasAccepted);
        
        return ResponseEntity.ok(Map.of("hasAccepted", hasAccepted));
    }
    
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
    
    /**
     * Extract userId from JWT authentication
     * The JWT token stores email as subject and userId as a claim
     */
    private Long getUserIdFromAuth(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new RuntimeException("User not authenticated");
        }
        
        // Check if userId is stored in authentication details
        if (authentication.getDetails() instanceof Long) {
            return (Long) authentication.getDetails();
        }
        
        // Fallback: try to parse from name if it's a Long (shouldn't happen with email-based JWT)
        try {
            String name = authentication.getName();
            return Long.parseLong(name);
        } catch (NumberFormatException e) {
            // If name is email (expected), throw meaningful error
            throw new RuntimeException("Unable to extract userId from authentication. Name is: " + authentication.getName());
        }
    }
}
