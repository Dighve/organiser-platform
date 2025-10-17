# Email Service Setup for Production

## 🎯 Current Status

Currently, the backend **logs magic links to console** instead of sending emails. This is intentional for development/testing.

**To get magic links now:** Check the Render backend logs at https://dashboard.render.com

---

## 📧 Production Email Service Options

### Option 1: Resend (Recommended - Easiest) ⭐

**Why Resend:**
- ✅ 100 emails/day free tier
- ✅ Very simple API
- ✅ Great for transactional emails
- ✅ No credit card required for free tier
- ✅ Excellent deliverability

**Setup:**
1. Go to: https://resend.com
2. Sign up for free account
3. Get API key
4. Add domain or use resend.dev for testing

---

### Option 2: SendGrid (Popular)

**Why SendGrid:**
- ✅ 100 emails/day free tier
- ✅ Industry standard
- ✅ Good documentation

**Cons:**
- ⚠️ Requires credit card verification
- ⚠️ More complex setup

---

### Option 3: AWS SES (Most Scalable)

**Why AWS SES:**
- ✅ Very cheap ($0.10 per 1000 emails)
- ✅ Highly reliable
- ✅ Great for high volume

**Cons:**
- ⚠️ More complex setup
- ⚠️ Requires AWS account
- ⚠️ Email domain verification needed

---

## 🚀 Quick Setup: Resend (5 minutes)

### Step 1: Get Resend API Key

1. **Sign up:** Go to https://resend.com/signup
2. **Verify email:** Check your email and verify
3. **Get API key:**
   - Go to **API Keys** in dashboard
   - Click **Create API Key**
   - Name it: `hikehub-production`
   - Copy the key (starts with `re_`)

### Step 2: Update Backend Code

Update `EmailService.java`:

```java
package com.organiser.platform.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {
    
    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;
    
    @Value("${app.email.from:noreply@hikehub.com}")
    private String fromEmail;
    
    @Value("${resend.api-key:}")
    private String resendApiKey;
    
    private final RestTemplate restTemplate = new RestTemplate();
    
    public void sendMagicLink(String email, String token) {
        String magicLink = frontendUrl + "/auth/verify?token=" + token;
        
        // Log for debugging
        log.info("Sending magic link to: {}", email);
        
        if (resendApiKey.isEmpty()) {
            // Development mode - just log
            log.info("=".repeat(80));
            log.info("Magic Link for: {}", email);
            log.info("Link: {}", magicLink);
            log.info("=".repeat(80));
        } else {
            // Production mode - send via Resend
            sendEmailViaResend(email, magicLink);
        }
    }
    
    private void sendEmailViaResend(String toEmail, String magicLink) {
        try {
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
            
            log.info("Email sent successfully to: {}", toEmail);
            
        } catch (Exception e) {
            log.error("Failed to send email via Resend", e);
            // Fallback: log the magic link
            log.info("=".repeat(80));
            log.info("Magic Link for: {}", toEmail);
            log.info("Link: {}", magicLink);
            log.info("=".repeat(80));
        }
    }
    
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
                    <h2>🥾 Sign in to HikeHub</h2>
                    <p>Click the button below to sign in to your account. This link will expire in 15 minutes.</p>
                    <a href="%s" class="button">Sign In to HikeHub</a>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #666; font-size: 12px;">%s</p>
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
```

### Step 3: Add Resend Config to Production Properties

Update `application-prod.properties`:

```properties
# Email Configuration (Resend)
resend.api-key=${RESEND_API_KEY}
app.email.from=onboarding@resend.dev
app.frontend-url=https://hikehub-poc.netlify.app
```

### Step 4: Add Environment Variable to Render

1. **Go to Render Dashboard:** https://dashboard.render.com
2. **Click on:** `hikehub-backend` service
3. **Go to:** **Environment** tab
4. **Add new variable:**
   - **Key:** `RESEND_API_KEY`
   - **Value:** Your Resend API key (the one you copied)
   - Click **Save**

5. **Render will auto-redeploy** (2-5 minutes)

### Step 5: Test

1. Go to your frontend: https://hikehub-poc.netlify.app
2. Request a magic link
3. Check your email! 📧

---

## 📋 Email Domain Setup (Optional - For Custom Domain)

### Using resend.dev (Default)

Emails will come from: `onboarding@resend.dev`
- ✅ Works immediately
- ✅ No setup needed
- ⚠️ Generic sender address

### Using Your Own Domain (Recommended for Production)

1. **Add domain in Resend:**
   - Go to Resend dashboard → **Domains**
   - Click **Add Domain**
   - Enter your domain (e.g., `hikehub.com`)

2. **Add DNS records:**
   - Resend will show you DNS records to add
   - Add them to your domain provider (Namecheap, GoDaddy, etc.)
   - Wait for verification (can take a few hours)

3. **Update config:**
   ```properties
   app.email.from=noreply@yourdomain.com
   ```

---

## 🎯 Temporary Workaround (For POC)

If you don't want to set up email service right now, you can:

### Option 1: Show Magic Link in Response

Modify the `AuthService` to return the magic link in development:

```java
public Map<String, String> requestMagicLink(String email) {
    // ... existing code ...
    
    emailService.sendMagicLink(email, magicLink.getToken());
    
    Map<String, String> response = new HashMap<>();
    response.put("message", "Magic link sent to your email");
    
    // In development, also return the link
    if (!isProd()) {
        response.put("magicLink", frontendUrl + "/auth/verify?token=" + magicLink.getToken());
    }
    
    return response;
}
```

### Option 2: Use Test Email Service

Use a service like **Mailtrap** or **Mailhog** that captures emails for testing:
- Emails won't actually send
- You can view them in a web UI
- Perfect for development/staging

---

## ✅ Comparison

| Service | Free Tier | Setup Time | Best For |
|---------|-----------|------------|----------|
| **Resend** | 100/day | 5 min | ⭐ Quick POC/Production |
| SendGrid | 100/day | 15 min | Established projects |
| AWS SES | $0.10/1k | 30 min | High volume |
| Mailtrap | Unlimited | 5 min | Testing only |

---

## 🚀 Recommended Path for HikeHub POC

1. **Short term (Now):** Check Render logs for magic links
2. **Medium term (This week):** Set up Resend with resend.dev sender
3. **Long term (Before launch):** Add custom domain to Resend

---

## 📞 Current Workaround

**To get magic links right now:**

1. **Go to:** https://dashboard.render.com
2. **Click:** `hikehub-backend` service
3. **Click:** **Logs** tab
4. **Request a magic link** on your frontend
5. **Look for the log** with the magic link URL
6. **Copy and paste** the URL into your browser

**Example log:**
```
================================================================================
Magic Link for: your-email@example.com  
Link: https://hikehub-poc.netlify.app/auth/verify?token=abc123-def456-...
================================================================================
```

---

## 🎉 Summary

- ✅ **Current:** Magic links logged to Render console
- 🚀 **5-min fix:** Set up Resend with API key
- 📧 **Result:** Real emails delivered to users
- 💰 **Cost:** Free (100 emails/day)

Choose based on your timeline! For a POC, checking logs is fine. For real users, set up Resend. 🎯
