package com.organiser.platform.util;

import org.springframework.stereotype.Component;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * Utility class for generating avatar URLs
 * Uses DiceBear API for beautiful, consistent avatars
 */
@Component
public class AvatarGenerator {
    
    private static final String DICEBEAR_BASE_URL = "https://api.dicebear.com/7.x";
    private static final String DEFAULT_STYLE = "initials"; // initials, avataaars, bottts, identicon, etc.
    
    /**
     * Generate an avatar URL based on display name or email
     * 
     * @param displayName User's display name (optional)
     * @param email User's email
     * @return Avatar URL
     */
    public String generateAvatarUrl(String displayName, String email) {
        String seed = displayName != null && !displayName.trim().isEmpty() 
                ? displayName.trim() 
                : email.split("@")[0]; // Use email username if no display name
        
        try {
            String encodedSeed = URLEncoder.encode(seed, StandardCharsets.UTF_8.toString());
            return String.format("%s/%s/svg?seed=%s&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf", 
                    DICEBEAR_BASE_URL, DEFAULT_STYLE, encodedSeed);
        } catch (UnsupportedEncodingException e) {
            // Fallback to simple URL without encoding
            return String.format("%s/%s/svg?seed=%s", DICEBEAR_BASE_URL, DEFAULT_STYLE, seed);
        }
    }
    
    /**
     * Generate an avatar URL with initials style
     * Shows the first letters of the name
     * 
     * @param displayName User's display name
     * @param email User's email
     * @return Avatar URL with initials
     */
    public String generateInitialsAvatar(String displayName, String email) {
        String seed = displayName != null && !displayName.trim().isEmpty() 
                ? displayName.trim() 
                : email.split("@")[0];
        
        try {
            String encodedSeed = URLEncoder.encode(seed, StandardCharsets.UTF_8.toString());
            return String.format("%s/initials/svg?seed=%s&backgroundColor=random", 
                    DICEBEAR_BASE_URL, encodedSeed);
        } catch (UnsupportedEncodingException e) {
            return String.format("%s/initials/svg?seed=%s", DICEBEAR_BASE_URL, seed);
        }
    }
    
    /**
     * Generate a fun avatar URL with avataaars style (cartoon faces)
     * 
     * @param email User's email (used as seed for consistency)
     * @return Avatar URL
     */
    public String generateFunAvatar(String email) {
        try {
            String encodedSeed = URLEncoder.encode(email, StandardCharsets.UTF_8.toString());
            return String.format("%s/avataaars/svg?seed=%s", DICEBEAR_BASE_URL, encodedSeed);
        } catch (UnsupportedEncodingException e) {
            return String.format("%s/avataaars/svg?seed=%s", DICEBEAR_BASE_URL, email);
        }
    }
    
    /**
     * Generate a geometric pattern avatar
     * 
     * @param email User's email (used as seed for consistency)
     * @return Avatar URL
     */
    public String generateGeometricAvatar(String email) {
        try {
            String encodedSeed = URLEncoder.encode(email, StandardCharsets.UTF_8.toString());
            return String.format("%s/shapes/svg?seed=%s", DICEBEAR_BASE_URL, encodedSeed);
        } catch (UnsupportedEncodingException e) {
            return String.format("%s/shapes/svg?seed=%s", DICEBEAR_BASE_URL, email);
        }
    }
}
