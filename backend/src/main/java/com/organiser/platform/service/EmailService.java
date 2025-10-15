package com.organiser.platform.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {
    
    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;
    
    @Value("${app.email.from:noreply@organiserplatform.com}")
    private String fromEmail;
    
    /**
     * Send magic link email to user
     * In production, integrate with SendGrid, AWS SES, or similar service
     */
    public void sendMagicLink(String email, String token) {
        String magicLink = frontendUrl + "/auth/verify?token=" + token;
        
        // For development, just log the magic link
        log.info("=".repeat(80));
        log.info("Magic Link for: {}", email);
        log.info("Link: {}", magicLink);
        log.info("=".repeat(80));
        
        // TODO: In production, replace with actual email sending
        /*
        Example with SendGrid:
        
        Email email = new Email();
        email.setFrom(fromEmail);
        email.addTo(recipientEmail);
        email.setSubject("Your Magic Link to Sign In");
        email.setContent(buildEmailContent(magicLink), "text/html");
        
        SendGrid sg = new SendGrid(sendGridApiKey);
        Request request = new Request();
        request.setMethod(Method.POST);
        request.setEndpoint("mail/send");
        request.setBody(email.build());
        sg.api(request);
        */
    }
    
    /**
     * Build HTML email content for magic link
     */
    private String buildEmailContent(String magicLink) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .button { 
                        display: inline-block; 
                        padding: 12px 24px; 
                        background-color: #16a34a; 
                        color: white; 
                        text-decoration: none; 
                        border-radius: 8px;
                        margin: 20px 0;
                    }
                    .footer { margin-top: 30px; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2>Sign in to Organiser Platform</h2>
                    <p>Click the button below to sign in to your account. This link will expire in 15 minutes.</p>
                    <a href="%s" class="button">Sign In</a>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #666;">%s</p>
                    <div class="footer">
                        <p>If you didn't request this email, you can safely ignore it.</p>
                        <p>This link will expire in 15 minutes for security reasons.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(magicLink, magicLink);
    }
}
