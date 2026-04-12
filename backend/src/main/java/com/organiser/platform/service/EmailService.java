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
     * 
     * SECURITY NOTE: OTP codes are NOT logged to prevent account takeover.
     * In development mode (no Resend API key), codes are logged for testing only.
     */
    public void sendPasscode(String email, String code) {
        log.info("Sending passcode to: {}", email);

        if (resendApiKey == null || resendApiKey.isEmpty()) {
            // Development mode only - log code for testing
            log.warn("=".repeat(80));
            log.warn("DEV MODE - Passcode for: {}", email);
            log.warn("Code: {}", code);
            log.warn("=".repeat(80));
        } else {
            try {
                sendPasscodeViaResend(email, code);
                log.info("Passcode email sent successfully to: {}", email);
            } catch (Exception e) {
                log.error("Failed to send passcode email via Resend to: {} - Error: {}", email, e.getMessage());
                // SECURITY: Do NOT log the code in production fallback
                // User must retry or contact support
                throw new RuntimeException("Failed to send passcode email. Please try again.", e);
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
    
    /**
     * Send a "How was your event?" review prompt email to an attendee.
     * Respects the member's emailNotificationsEnabled preference.
     */
    public void sendReviewPromptEmail(
            com.organiser.platform.model.Member member,
            String eventTitle,
            String groupName,
            Long eventId) {

        if (!Boolean.TRUE.equals(member.getEmailNotificationsEnabled())) {
            log.info("Email notifications disabled for {}, skipping review prompt", member.getEmail());
            return;
        }

        String reviewUrl = frontendUrl + "/events/" + eventId + "/review";
        String subject = "How was " + eventTitle + "? Share your experience";
        String html = buildReviewPromptEmailHtml(eventTitle, groupName, reviewUrl);

        if (resendApiKey == null || resendApiKey.isEmpty()) {
            log.info("=".repeat(80));
            log.info("Review Prompt Email for: {}", member.getEmail());
            log.info("Event: {} ({})", eventTitle, groupName);
            log.info("URL: {}", reviewUrl);
            log.info("=".repeat(80));
            return;
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(resendApiKey);

            Map<String, Object> emailData = new HashMap<>();
            emailData.put("from", fromEmail);
            emailData.put("to", new String[]{member.getEmail()});
            emailData.put("subject", subject);
            emailData.put("html", html);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(emailData, headers);
            restTemplate.postForObject("https://api.resend.com/emails", request, String.class);
            log.info("Review prompt email sent to {}", member.getEmail());
        } catch (Exception e) {
            log.error("Failed to send review prompt email to {}: {}", member.getEmail(), e.getMessage());
        }
    }

    private String buildReviewPromptEmailHtml(String eventTitle, String groupName, String reviewUrl) {
        String escapedTitle = escapeHtml(eventTitle);
        String escapedGroup = escapeHtml(groupName);
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background:#fdf2f8;">
                <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
                    <div style="text-align:center;margin-bottom:24px;">
                        <div style="font-size:40px;margin-bottom:12px;">🏔️</div>
                        <h1 style="margin:0;background:linear-gradient(135deg,#9333ea 0%%,#ec4899 50%%,#f97316 100%%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;font-size:28px;font-weight:700;">OutMeets</h1>
                    </div>
                    <div style="background:white;border-radius:16px;padding:32px;box-shadow:0 4px 6px rgba(0,0,0,0.08);">
                        <h2 style="margin-top:0;font-size:22px;color:#1f2937;">How was <span style="color:#9333ea;">%s</span>?</h2>
                        <p style="font-size:15px;color:#4b5563;line-height:1.6;">
                            You attended an event with <strong>%s</strong>. Your review helps others discover great events and gives organisers valuable feedback.
                        </p>
                        <div style="text-align:center;margin:32px 0;">
                            <a href="%s" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#9333ea,#ec4899);color:white;text-decoration:none;border-radius:12px;font-weight:700;font-size:16px;">
                                ⭐ Write a Review
                            </a>
                        </div>
                        <p style="color:#6b7280;font-size:13px;margin-bottom:0;">
                            The review window is open for 30 days after the event. You can disable these emails in your account settings.
                        </p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(escapedTitle, escapedGroup, reviewUrl);
    }

    /**
     * Send invitation email to a member.
     * Notifies member they've been invited to an event or group.
     */
    public void sendInvitationEmail(
            com.organiser.platform.model.Member recipient,
            com.organiser.platform.model.Member sender,
            String itemType,
            String itemName,
            String personalMessage,
            String url) {
        
        if (!recipient.getEmailNotificationsEnabled()) {
            log.info("Email notifications disabled for {}, skipping invitation email", recipient.getEmail());
            return;
        }
        
        String senderName = sender.getDisplayName() != null ? sender.getDisplayName() : sender.getEmail().split("@")[0];
        String subject = senderName + " invited you to " + itemName;
        
        String htmlBody = buildInvitationEmailHtml(senderName, itemType, itemName, personalMessage, url);
        
        if (resendApiKey == null || resendApiKey.isEmpty()) {
            log.info("=".repeat(80));
            log.info("Invitation Email for: {}", recipient.getEmail());
            log.info("From: {}", senderName);
            log.info("Item: {} ({})", itemName, itemType);
            log.info("URL: {}", url);
            log.info("=".repeat(80));
        } else {
            try {
                // Send invitation email using Resend API
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                headers.setBearerAuth(resendApiKey);
                
                Map<String, Object> emailData = new HashMap<>();
                emailData.put("from", fromEmail);
                emailData.put("to", new String[]{recipient.getEmail()});
                emailData.put("subject", subject);
                emailData.put("html", htmlBody);
                
                HttpEntity<Map<String, Object>> request = new HttpEntity<>(emailData, headers);
                restTemplate.postForObject("https://api.resend.com/emails", request, String.class);
                
                log.info("Invitation email sent to {}", recipient.getEmail());
            } catch (Exception e) {
                log.error("Failed to send invitation email to {}: {}", recipient.getEmail(), e.getMessage());
            }
        }
    }
    
    private String buildInvitationEmailHtml(String senderName, String itemType, String itemName, String personalMessage, String itemUrl) {
        // HTML-escape all user-supplied content to prevent HTML injection
        String escapedSenderName = escapeHtml(senderName);
        String escapedItemName = escapeHtml(itemName);
        
        String messageSection = "";
        if (personalMessage != null && !personalMessage.isEmpty()) {
            String escapedMessage = escapeHtml(personalMessage);
            messageSection = String.format(
                "<div style=\"background: #f3f4f6; padding: 20px; border-radius: 12px; margin: 20px 0;\">" +
                "<p style=\"margin: 0; font-style: italic; color: #4b5563;\">\"" + escapedMessage + "\"</p>" +
                "</div>"
            );
        }
        
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <div style="font-size: 40px; margin-bottom: 15px;">🏔️</div>
                        <h1 style="margin: 0; background: linear-gradient(135deg, #9333ea 0%%, #ec4899 50%%, #f97316 100%%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-size: 28px; font-weight: 700;">OutMeets</h1>
                    </div>
                    <div style="background: white; border-radius: 16px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                        <h2 style="margin-top: 0; font-size: 24px; color: #1f2937;">You've been invited!</h2>
                        <p style="font-size: 16px; color: #4b5563; line-height: 1.6;"><strong>%s</strong> has invited you to join:</p>
                        <h3 style="font-size: 20px; color: #9333ea; margin: 20px 0;">%s</h3>
                        %s
                        <a href="%s" style="display: inline-block; padding: 14px 28px; background: linear-gradient(to right, #9333ea, #ec4899); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 20px 0;">View %s</a>
                        <p style="color: #6b7280; font-size: 13px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">If you don't want to receive these emails, you can disable email notifications in your settings.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(escapedSenderName, escapedItemName, messageSection, itemUrl, itemType.substring(0, 1).toUpperCase() + itemType.substring(1));
    }
    
    /**
     * Escape HTML special characters to prevent HTML injection
     */
    private String escapeHtml(String input) {
        if (input == null) {
            return "";
        }
        return input
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&#x27;")
            .replace("/", "&#x2F;");
    }
}
