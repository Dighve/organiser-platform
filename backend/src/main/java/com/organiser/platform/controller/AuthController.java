package com.organiser.platform.controller;

import com.organiser.platform.dto.AuthResponse;
import com.organiser.platform.dto.MagicLinkRequest;
import com.organiser.platform.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {
    
    private final AuthService authService;
    
    /**
     * Request a magic link to be sent to email
     */
    @PostMapping("/magic-link")
    public ResponseEntity<Map<String, String>> requestMagicLink(
            @Valid @RequestBody MagicLinkRequest request) {
        
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
