package com.organiser.platform.service;

// ============================================================
// IMPORTS
// ============================================================
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

// ============================================================
// SERVICE CLASS
// ============================================================
/**
 * Service for sending transactional emails via Resend API.
 * 
 * @author OutMeets Platform Team
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {
    
    // ============================================================
    // CONFIGURATION PROPERTIES
    // ============================================================
    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;
    
    @Value("${app.email.from:onboarding@resend.dev}")
    private String fromEmail;
    
    @Value("${resend.api-key:}")
    private String resendApiKey;
    
    // ============================================================
    // DEPENDENCIES
    // ============================================================
    private final RestTemplate restTemplate = new RestTemplate();
    
    // ============================================================
    // PUBLIC METHODS - Email Sending
    // ============================================================
    
    /**
     * Send magic link email to user.
     * Uses Resend API if configured, otherwise logs to console.
     * Includes optional redirect URL for cross-browser support.
     */
    public void sendMagicLink(String email, String token, String redirectUrl) {
        // Build magic link with optional redirect parameter
        String magicLink = frontendUrl + "/auth/verify?token=" + token;
        if (redirectUrl != null && !redirectUrl.isEmpty()) {
            // URL-encode the redirect parameter to handle special characters
            try {
                String encodedRedirect = java.net.URLEncoder.encode(redirectUrl, "UTF-8");
                magicLink += "&redirect=" + encodedRedirect;
            } catch (Exception e) {
                log.warn("Failed to encode redirect URL: {}", redirectUrl, e);
                // Continue without redirect parameter
            }
        }
        
        log.info("Sending magic link to: {} (with redirect: {})", email, redirectUrl != null);
        
        if (resendApiKey == null || resendApiKey.isEmpty()) {
            // Development mode - just log the magic link
            log.info("=".repeat(80));
            log.info("Magic Link for: {}", email);
            log.info("Link: {}", magicLink);
            log.info("=".repeat(80));
        } else {
            // Production mode - send via Resend
            try {
                sendEmailViaResend(email, magicLink);
                log.info("Email sent successfully to: {}", email);
            } catch (Exception e) {
                log.error("Failed to send email via Resend to: {}", email, e);
                // Fallback: log the magic link
                log.info("=".repeat(80));
                log.info("FALLBACK - Magic Link for: {}", email);
                log.info("Link: {}", magicLink);
                log.info("=".repeat(80));
            }
        }
    }
    
    // ============================================================
    // PRIVATE METHODS - API Integration
    // ============================================================
    
    /**
     * Send email via Resend API.
     */
    private void sendEmailViaResend(String toEmail, String magicLink) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(resendApiKey);
        
        Map<String, Object> emailData = new HashMap<>();
        emailData.put("from", fromEmail);
        emailData.put("to", new String[]{toEmail});
        emailData.put("subject", "Your Magic Link to Sign In - HikeHub");
        emailData.put("html", buildEmailContent(magicLink));
        
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(emailData, headers);
        
        restTemplate.postForObject(
            "https://api.resend.com/emails",
            request,
            String.class
        );
    }
    
    // ============================================================
    // PRIVATE METHODS - Email Content
    // ============================================================
    
    /**
     * Build HTML email content for magic link.
     */
    private String buildEmailContent(String magicLink) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                        line-height: 1.6; 
                        color: #333;
                        margin: 0;
                        padding: 0;
                        background-color: #f5f5f5;
                    }
                    .container { 
                        max-width: 600px; 
                        margin: 40px auto; 
                        padding: 0;
                        background-color: white;
                        border-radius: 12px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    }
                    .header {
                        background: linear-gradient(135deg, #16a34a 0%%, #15803d 100%%);
                        padding: 30px;
                        border-radius: 12px 12px 0 0;
                        text-align: center;
                    }
                    .header h1 {
                        color: white;
                        margin: 0;
                        font-size: 28px;
                    }
                    .content {
                        padding: 40px 30px;
                    }
                    .button { 
                        display: inline-block; 
                        padding: 14px 32px; 
                        background-color: #16a34a; 
                        color: white !important; 
                        text-decoration: none; 
                        border-radius: 8px;
                        margin: 20px 0;
                        font-weight: 600;
                        box-shadow: 0 4px 6px rgba(22, 163, 74, 0.3);
                    }
                    .button:hover {
                        background-color: #15803d;
                    }
                    .link-text {
                        word-break: break-all; 
                        color: #666;
                        font-size: 12px;
                        background-color: #f9fafb;
                        padding: 12px;
                        border-radius: 6px;
                        margin: 10px 0;
                    }
                    .footer { 
                        margin-top: 30px;
                        padding-top: 20px;
                        border-top: 1px solid #e5e7eb;
                        font-size: 12px;
                        color: #666;
                    }
                    .emoji {
                        font-size: 32px;
                        margin-bottom: 10px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="emoji">🥾</div>
                        <h1>HikeHub</h1>
                    </div>
                    <div class="content">
                        <h2 style="color: #16a34a; margin-top: 0;">Your Sign-In Link is Ready!</h2>
                        <p style="font-size: 16px;">Click the button below to sign in to your HikeHub account. This link will expire in <strong>15 minutes</strong> for security.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="%s" class="button">Sign In to HikeHub</a>
                        </div>
                        <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
                        <div class="link-text">%s</div>
                        <div class="footer">
                            <p style="margin: 5px 0;">🔒 This link is unique to you and can only be used once.</p>
                            <p style="margin: 5px 0;">⏰ It will expire in 15 minutes for security reasons.</p>
                            <p style="margin: 5px 0;">❓ If you didn't request this email, you can safely ignore it.</p>
                            <p style="margin-top: 20px; color: #999;">Happy hiking! 🏔️</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(magicLink, magicLink);
    }
}
