package com.organiser.platform.util;

import org.springframework.stereotype.Component;

/**
 * Utility class for generating privacy-focused display names from email addresses
 * Used when users don't provide a display name during signup
 * 
 * Privacy-first approach: Extracts only the likely first name to protect user privacy
 */
@Component
public class DisplayNameGenerator {
    
    /**
     * Generate a privacy-focused display name from an email address
     * Extracts only the first name portion to prevent email reconstruction
     * 
     * Examples:
     * - john.doe@example.com → John
     * - sarah_smith123@gmail.com → Sarah
     * - mike-jones@company.com → Mike
     * - alice@example.com → Alice
     * - user123@test.com → User123
     * - j@example.com → J
     * 
     * @param email User's email address
     * @return Privacy-focused display name (first name only)
     */
    public String generateFromEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "User";
        }
        
        String localPart = email.split("@")[0];
        
        // Extract first name by splitting on common separators
        String firstName = extractFirstName(localPart);
        
        // Remove trailing numbers for cleaner look
        firstName = firstName.replaceAll("\\d+$", "");
        
        // If result is empty after removing numbers, keep original with numbers
        if (firstName.trim().isEmpty()) {
            firstName = extractFirstName(localPart);
        }
        
        // Capitalize first letter
        if (firstName.length() > 0) {
            return Character.toUpperCase(firstName.charAt(0)) + 
                   (firstName.length() > 1 ? firstName.substring(1).toLowerCase() : "");
        }
        
        return "User";
    }
    
    /**
     * Extract the first name portion from email local part
     * Splits on dots, underscores, hyphens, and takes the first segment
     * 
     * @param localPart Email local part (before @)
     * @return First name segment
     */
    private String extractFirstName(String localPart) {
        // Split on common separators: dot, underscore, hyphen
        String[] parts = localPart.split("[._-]");
        
        // Return the first non-empty part
        for (String part : parts) {
            if (!part.trim().isEmpty()) {
                return part.trim();
            }
        }
        
        // Fallback to entire local part if no separators
        return localPart;
    }
    
    /**
     * Simple version: just capitalize first letter of email local part
     * 
     * @param email User's email address
     * @return Capitalized local part
     */
    public String generateSimple(String email) {
        if (email == null || !email.contains("@")) {
            return "User";
        }
        
        String localPart = email.split("@")[0];
        
        if (localPart.length() > 0) {
            return Character.toUpperCase(localPart.charAt(0)) + localPart.substring(1);
        }
        
        return "User";
    }
}
