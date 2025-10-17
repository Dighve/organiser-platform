# 📧 Resend Email Service Setup

## 🎯 Quick Setup (5 minutes)

### Step 1: Get Resend API Key

1. **Sign up for Resend:** https://resend.com/signup
2. **Verify your email** (check your inbox)
3. **Get API Key:**
   - Go to **API Keys** in dashboard
   - Click **Create API Key**
   - Name: `hikehub-production`
   - Copy the key (starts with `re_`)

---

### Step 2: Add to Render Environment Variables

1. **Go to Render Dashboard:** https://dashboard.render.com
2. **Click on:** `hikehub-backend` service
3. **Go to:** **Environment** tab
4. **Add new environment variable:**
   - **Key:** `RESEND_API_KEY`
   - **Value:** Paste your Resend API key
   - Click **Save Changes**

5. **Render will auto-redeploy** (takes 2-5 minutes)

---

### Step 3: Test It!

1. **Go to your frontend:** https://hikehub-poc.netlify.app
2. **Click "Login"**
3. **Enter your email address**
4. **Check your inbox** 📧
5. **Click the magic link** ✨
6. **You're logged in!** 🎉

---

## 🔧 How It Works

### Development Mode (No API Key)
- Logs magic link to console
- Check Render logs to get the link
- Perfect for testing

### Production Mode (With API Key)
- Sends real emails via Resend
- Users receive email with magic link
- Professional experience

---

## 📧 Email Configuration

### Current Settings

**From Address:** `onboarding@resend.dev`  
**Subject:** "Your Magic Link to Sign In - HikeHub"  
**Design:** Beautiful HTML email with HikeHub branding

### Optional: Use Custom Domain

Want emails from `noreply@yourdomain.com`?

1. **Add domain in Resend:**
   - Go to **Domains** in Resend dashboard
   - Click **Add Domain**
   - Enter your domain

2. **Add DNS records:**
   - Resend will show you DNS records
   - Add them to your domain provider
   - Wait for verification (few hours)

3. **Update Render environment variable:**
   - Add: `EMAIL_FROM=noreply@yourdomain.com`
   - Redeploy

---

## 💰 Pricing

### Resend Free Tier
- ✅ **100 emails per day**
- ✅ **3,000 emails per month**
- ✅ Perfect for your POC
- ✅ No credit card required

### When to Upgrade
- Need more than 100 emails/day
- Want custom domain (available on free tier)
- Need dedicated IP addresses

---

## ✅ Verification

### Check if Email Service is Working

**Look in Render logs for:**

```
✅ Development mode (no API key):
================================================================================
Magic Link for: user@example.com
Link: https://hikehub-poc.netlify.app/auth/verify?token=abc123...
================================================================================

✅ Production mode (with API key):
Email sent successfully to: user@example.com
```

---

## 🎨 Email Preview

The email users receive looks like this:

**Subject:** Your Magic Link to Sign In - HikeHub

```
┌─────────────────────────────────────┐
│           🥾 HikeHub                │
│     (Green gradient header)         │
└─────────────────────────────────────┘

Your Sign-In Link is Ready!

Click the button below to sign in to your HikeHub 
account. This link will expire in 15 minutes for 
security.

┌─────────────────────────┐
│  Sign In to HikeHub     │  ← Big green button
└─────────────────────────┘

Or copy and paste this link into your browser:
https://hikehub-poc.netlify.app/auth/verify?token=...

────────────────────────────────────────

🔒 This link is unique to you and can only be used once.
⏰ It will expire in 15 minutes for security reasons.
❓ If you didn't request this email, you can safely ignore it.

Happy hiking! 🏔️
```

---

## 🔍 Troubleshooting

### Email Not Received?

1. **Check spam/junk folder**
2. **Verify Resend API key is correct**
3. **Check Render logs** for errors:
   ```
   Failed to send email via Resend to: user@example.com
   ```
4. **Verify Resend dashboard** - check "Emails" tab for delivery status

### Email Blocked by Resend?

- Check if email address is valid
- Some providers (Gmail, Outlook) may delay first email
- Check Resend dashboard for bounce/complaint

### Still Not Working?

Fallback: Magic link is always logged to Render console!
1. Go to Render dashboard
2. Click on `hikehub-backend`
3. Go to Logs
4. Look for "FALLBACK - Magic Link for:"

---

## 📊 Monitoring

### Resend Dashboard

Monitor your emails in real-time:
- **Emails sent**
- **Delivery status**
- **Open rates** (optional)
- **Bounce/complaints**

https://resend.com/emails

---

## 🚀 Quick Commands Summary

```bash
# 1. Get Resend API Key
Visit: https://resend.com/signup

# 2. Add to Render
Dashboard → hikehub-backend → Environment → Add:
RESEND_API_KEY=re_your_key_here

# 3. Test
Visit: https://hikehub-poc.netlify.app
Request magic link
Check email!
```

---

## ✨ Features

### Email Includes:
- ✅ Beautiful HikeHub branding
- ✅ Big green "Sign In" button
- ✅ Copy-paste link as fallback
- ✅ Security warnings (15-min expiry)
- ✅ Mobile responsive design
- ✅ Professional styling

### Security:
- ✅ Links expire in 15 minutes
- ✅ One-time use only
- ✅ Unique tokens per request
- ✅ Secure HTTPS links

---

## 📝 Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `RESEND_API_KEY` | No | (empty) | Resend API key. If empty, logs to console |
| `EMAIL_FROM` | No | `onboarding@resend.dev` | Email sender address |
| `FRONTEND_URL` | No | `https://hikehub-poc.netlify.app` | Frontend URL for magic links |

---

## 🎉 Success!

Once set up:
- ✅ Users receive beautiful emails
- ✅ Magic links work seamlessly  
- ✅ Professional authentication experience
- ✅ No more checking logs manually!

**Your HikeHub platform is now production-ready!** 🚀
