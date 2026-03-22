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
        
        log.debug("Sending magic link to: {} (with redirect: {})", email, redirectUrl != null);
        
        if (resendApiKey == null || resendApiKey.isEmpty()) {
            // Development mode - just log the magic link
            log.debug("=".repeat(80));
            log.debug("Magic Link for: {}", email);
            log.debug("Link: {}", magicLink);
            log.debug("=".repeat(80));
        } else {
            // Production mode - send via Resend
            try {
                sendEmailViaResend(email, magicLink);
                log.debug("Email sent successfully to: {}", email);
            } catch (Exception e) {
                log.error("Failed to send email via Resend to: {}", email, e);
                // Fallback: log the magic link
                log.debug("=".repeat(80));
                log.debug("FALLBACK - Magic Link for: {}", email);
                log.debug("Link: {}", magicLink);
                log.debug("=".repeat(80));
            }
        }
    }
    
    /**
     * Send a 6-digit passcode email to the user.
     * Used when PASSCODE_AUTH_ENABLED feature flag is true.
     */
    public void sendPasscode(String email, String code) {
        log.debug("Sending passcode to: {}", email);

        if (resendApiKey == null || resendApiKey.isEmpty()) {
            log.debug("=".repeat(80));
            log.debug("Passcode for: {}", email);
            log.debug("Code: {}", code);
            log.debug("=".repeat(80));
        } else {
            try {
                sendPasscodeViaResend(email, code);
                log.debug("Passcode email sent successfully to: {}", email);
            } catch (Exception e) {
                log.error("Failed to send passcode email via Resend to: {}", email, e);
                log.debug("=".repeat(80));
                log.debug("FALLBACK - Passcode for: {}", email);
                log.debug("Code: {}", code);
                log.debug("=".repeat(80));
            }
        }
    }

    // ============================================================
    // PRIVATE METHODS - API Integration
    // ============================================================

    /**
     * Send passcode email via Resend API.
     */
    private void sendPasscodeViaResend(String toEmail, String code) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(resendApiKey);

        Map<String, Object> emailData = new HashMap<>();
        emailData.put("from", fromEmail);
        emailData.put("to", new String[]{toEmail});
        emailData.put("subject", "Your Sign-In Code - OutMeets");
        emailData.put("html", buildPasscodeEmailContent(code));

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(emailData, headers);

        restTemplate.postForObject(
            "https://api.resend.com/emails",
            request,
            String.class
        );
    }

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
        emailData.put("subject", "Your Magic Link to Sign In - OutMeets");
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
                        background: linear-gradient(135deg, #fdf2f8 0%%, #fef3f2 50%%, #fff7ed 100%%);
                    }
                    .container { 
                        max-width: 600px; 
                        margin: 40px auto; 
                        padding: 0;
                        background-color: white;
                        border-radius: 16px;
                        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                        overflow: hidden;
                    }
                    .header {
                        background: linear-gradient(135deg, #9333ea 0%%, #ec4899 50%%, #f97316 100%%);
                        padding: 40px 30px;
                        text-align: center;
                        position: relative;
                    }
                    .header::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: linear-gradient(135deg, rgba(147, 51, 234, 0.1), rgba(236, 72, 153, 0.1), rgba(249, 115, 22, 0.1));
                        backdrop-filter: blur(10px);
                    }
                    .header-content {
                        position: relative;
                        z-index: 1;
                    }
                    .header h1 {
                        color: white;
                        margin: 0;
                        font-size: 32px;
                        font-weight: 700;
                        text-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    }
                    .content {
                        padding: 40px 30px;
                        background: linear-gradient(to bottom, white 0%%, #fafafa 100%%);
                    }
                    .button { 
                        display: inline-block; 
                        padding: 16px 40px; 
                        background: linear-gradient(135deg, #9333ea 0%%, #ec4899 50%%, #f97316 100%%);
                        color: white !important; 
                        text-decoration: none; 
                        border-radius: 12px;
                        margin: 25px 0;
                        font-weight: 700;
                        font-size: 16px;
                        box-shadow: 0 8px 25px rgba(147, 51, 234, 0.3);
                        transition: all 0.3s ease;
                    }
                    .button:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 12px 30px rgba(147, 51, 234, 0.4);
                    }
                    .link-text {
                        word-break: break-all; 
                        color: #666;
                        font-size: 12px;
                        background: linear-gradient(135deg, #f8fafc 0%%, #f1f5f9 100%%);
                        padding: 16px;
                        border-radius: 8px;
                        margin: 15px 0;
                        border: 1px solid #e2e8f0;
                    }
                    .footer { 
                        margin-top: 30px;
                        padding-top: 25px;
                        border-top: 2px solid;
                        border-image: linear-gradient(90deg, #9333ea, #ec4899, #f97316) 1;
                        font-size: 13px;
                        color: #666;
                    }
                    .emoji {
                        font-size: 40px;
                        margin-bottom: 15px;
                        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
                    }
                    .title-gradient {
                        background: linear-gradient(135deg, #9333ea 0%%, #ec4899 50%%, #f97316 100%%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="header-content">
                            <div class="emoji">🏔️</div>
                            <h1>OutMeets</h1>
                        </div>
                    </div>
                    <div class="content">
                        <h2 class="title-gradient" style="margin-top: 0; font-size: 24px; font-weight: 700;">Your Sign-In Link is Ready!</h2>
                        <p style="font-size: 16px; color: #4b5563;">Click the button below to sign in to your OutMeets account. This link will expire in <strong>15 minutes</strong> for security.</p>
                        <div style="text-align: center; margin: 35px 0;">
                            <a href="%s" class="button">Sign In to OutMeets</a>
                        </div>
                        <p style="color: #6b7280; font-size: 14px; font-weight: 500;">Or copy and paste this link into your browser:</p>
                        <div class="link-text">%s</div>
                        <div class="footer">
                            <p style="margin: 8px 0; font-weight: 500;">🔒 This link is unique to you and can only be used once.</p>
                            <p style="margin: 8px 0; font-weight: 500;">⏰ It will expire in 15 minutes for security reasons.</p>
                            <p style="margin: 8px 0; font-weight: 500;">❓ If you didn't request this email, you can safely ignore it.</p>
                            <p style="margin-top: 25px; color: #9ca3af; font-style: italic; font-weight: 600;"> Discover day hikes from London! �</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(magicLink, magicLink);
    }

    /**
     * Build HTML email content for passcode (OTP).
     */
    private String buildPasscodeEmailContent(String code) {
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
                        background: linear-gradient(135deg, #fdf2f8 0%%, #fef3f2 50%%, #fff7ed 100%%);
                    }
                    .container {
                        max-width: 600px;
                        margin: 40px auto;
                        padding: 0;
                        background-color: white;
                        border-radius: 16px;
                        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                        overflow: hidden;
                    }
                    .header {
                        background: linear-gradient(135deg, #9333ea 0%%, #ec4899 50%%, #f97316 100%%);
                        padding: 40px 30px;
                        text-align: center;
                    }
                    .header h1 {
                        color: white;
                        margin: 0;
                        font-size: 32px;
                        font-weight: 700;
                        text-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    }
                    .content {
                        padding: 40px 30px;
                        background: linear-gradient(to bottom, white 0%%, #fafafa 100%%);
                    }
                    .code-box {
                        background: linear-gradient(135deg, #f3e8ff 0%%, #fce7f3 100%%);
                        border: 2px solid #e9d5ff;
                        border-radius: 16px;
                        padding: 30px;
                        text-align: center;
                        margin: 30px 0;
                    }
                    .code {
                        font-size: 48px;
                        font-weight: 800;
                        letter-spacing: 12px;
                        background: linear-gradient(135deg, #9333ea 0%%, #ec4899 50%%, #f97316 100%%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                        display: block;
                        margin: 10px 0;
                    }
                    .footer {
                        margin-top: 30px;
                        padding-top: 25px;
                        border-top: 2px solid;
                        border-image: linear-gradient(90deg, #9333ea, #ec4899, #f97316) 1;
                        font-size: 13px;
                        color: #666;
                    }
                    .emoji {
                        font-size: 40px;
                        margin-bottom: 15px;
                    }
                    .title-gradient {
                        background: linear-gradient(135deg, #9333ea 0%%, #ec4899 50%%, #f97316 100%%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="emoji">🏔️</div>
                        <h1>OutMeets</h1>
                    </div>
                    <div class="content">
                        <h2 class="title-gradient" style="margin-top: 0; font-size: 24px; font-weight: 700;">Your Sign-In Code</h2>
                        <p style="font-size: 16px; color: #4b5563;">Enter this code in the app to sign in to your OutMeets account. It expires in <strong>10 minutes</strong>.</p>
                        <div class="code-box">
                            <p style="margin: 0; font-size: 14px; color: #6b7280; font-weight: 600;">YOUR PASSCODE</p>
                            <span class="code">%s</span>
                            <p style="margin: 0; font-size: 13px; color: #9ca3af;">Valid for 10 minutes</p>
                        </div>
                        <div class="footer">
                            <p style="margin: 8px 0; font-weight: 500;">🔒 This code is unique to you and can only be used once.</p>
                            <p style="margin: 8px 0; font-weight: 500;">⏰ It will expire in 10 minutes for security reasons.</p>
                            <p style="margin: 8px 0; font-weight: 500;">❓ If you didn't request this code, you can safely ignore it.</p>
                            <p style="margin-top: 25px; color: #9ca3af; font-style: italic; font-weight: 600;"> Discover day hikes from London! </p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(code);
    }
}
