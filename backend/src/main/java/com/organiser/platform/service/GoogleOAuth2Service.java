package com.organiser.platform.service;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.organiser.platform.dto.AuthResponse;
import com.organiser.platform.dto.GoogleAuthRequest;
import com.organiser.platform.model.Member;
import com.organiser.platform.repository.MemberRepository;
import com.organiser.platform.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

/**
 * Service for handling Google OAuth2 authentication.
 * Verifies Google ID tokens and creates/updates user accounts.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GoogleOAuth2Service {
    
    private final MemberRepository memberRepository;
    private final JwtUtil jwtUtil;
    
    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String googleClientId;
    
    /**
     * Authenticate user with Google access token.
     * Creates user if doesn't exist, updates if exists.
     */
    @Transactional
    public AuthResponse authenticateWithGoogle(GoogleAuthRequest request) {
        try {
            // Verify access token by calling Google's userinfo endpoint
            String accessToken = request.getIdToken(); // Frontend sends access_token in idToken field
            
            // Call Google's userinfo API to verify token and get user data
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create("https://www.googleapis.com/oauth2/v3/userinfo"))
                    .header("Authorization", "Bearer " + accessToken)
                    .GET()
                    .build();
            
            HttpResponse<String> httpResponse = client.send(httpRequest, 
                    HttpResponse.BodyHandlers.ofString());
            
            if (httpResponse.statusCode() != 200) {
                throw new RuntimeException("Invalid Google access token");
            }
            
            // Parse user info from Google
            JsonObject userInfo = JsonParser.parseString(httpResponse.body()).getAsJsonObject();
            
            // Extract user information
            String email = userInfo.get("email").getAsString();
            String name = userInfo.has("name") ? userInfo.get("name").getAsString() : email;
            String pictureUrl = userInfo.has("picture") ? userInfo.get("picture").getAsString() : null;
            Boolean emailVerified = userInfo.has("email_verified") ? userInfo.get("email_verified").getAsBoolean() : true;
            
            if (!emailVerified) {
                throw new RuntimeException("Email not verified by Google");
            }
            
            log.info("Google OAuth: Authenticated user: {}", email);
            
            // Find or create member
            Member member = memberRepository.findByEmail(email)
                    .orElseGet(() -> createMemberFromGoogle(email, name, pictureUrl));
            
            // Update profile photo if Google has one and user doesn't
            if (pictureUrl != null && !pictureUrl.isEmpty() && 
                (member.getProfilePhotoUrl() == null || member.getProfilePhotoUrl().contains("ui-avatars.com"))) {
                member.setProfilePhotoUrl(pictureUrl);
                memberRepository.save(member);
            }
            
            // Mark as verified
            if (!member.getVerified()) {
                member.setVerified(true);
                memberRepository.save(member);
            }
            
            // Generate JWT token
            String jwtToken = jwtUtil.generateToken(member.getEmail(), member.getId(), "MEMBER");
            
            return AuthResponse.builder()
                    .token(jwtToken)
                    .userId(member.getId())
                    .email(member.getEmail())
                    .role("MEMBER")
                    .isOrganiser(member.getIsOrganiser())
                    .build();
                    
        } catch (Exception e) {
            log.error("Google OAuth authentication failed", e);
            throw new RuntimeException("Google authentication failed: " + e.getMessage());
        }
    }
    
    /**
     * Create a new member from Google OAuth data.
     */
    private Member createMemberFromGoogle(String email, String name, String pictureUrl) {
        log.info("Creating new member from Google OAuth: {}", email);
        
        // Use Google profile picture if available, otherwise use default
        String profilePhoto = (pictureUrl != null && !pictureUrl.isEmpty()) 
                ? pictureUrl 
                : null;
        
        Member newMember = Member.builder()
                .email(email)
                .displayName(name)
                .profilePhotoUrl(profilePhoto)
                .verified(true)  // Google already verified the email
                .active(true)
                .build();
        
        return memberRepository.save(newMember);
    }
}
