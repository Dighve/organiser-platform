# OutMeets Privacy Policy

**Last Updated:** December 9, 2025  
**Effective Date:** December 9, 2025

## 1. INTRODUCTION

OutMeets ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use our Platform.

**GDPR Compliance:** This policy complies with the UK General Data Protection Regulation (UK GDPR) and EU GDPR.

---

## 2. DATA CONTROLLER

**Company Name:** OutMeets Ltd (or your legal entity)  
**Address:** [Your Company Address]  
**Email:** privacy@outmeets.com  
**Data Protection Officer:** [Name/Contact if required]

---

## 3. INFORMATION WE COLLECT

### 3.1 Information You Provide Directly

#### Account Registration
- **Email address** (required for authentication)
- **Display name** (optional, defaults to email)
- **Profile photo** (optional)
- **Authentication method** (Google OAuth or Magic Link)

#### Group & Event Creation
- **Group details:** Name, description, location, cover photo
- **Event details:** Title, date, time, location, difficulty, distance, elevation, gear requirements, cost
- **Host information:** Name of event leader

#### Participation & Interaction
- **Event registrations:** Which events you join
- **Group memberships:** Which groups you subscribe to
- **Comments and replies:** Your posts on event pages
- **Profile updates:** Changes to your display name or photo

### 3.2 Information Collected Automatically

#### Technical Data
- **IP address** (for rate limiting and security)
- **Browser type and version**
- **Device information** (type, operating system)
- **Referring URL**
- **Pages visited and time spent**
- **Cookies and similar technologies** (see Cookie Policy)

#### Usage Data
- **Login times and frequency**
- **Features used**
- **Search queries**
- **Clicks and interactions**

### 3.3 Information from Third Parties

#### Google OAuth
When you sign in with Google, we receive:
- **Email address**
- **Name**
- **Profile picture**
- **Google user ID**
- **Email verification status**

We do NOT receive your Google password or access to other Google services.

#### Cloudinary (Image Hosting)
- **Uploaded images** are stored on Cloudinary's servers
- **Image URLs** are stored in our database
- See Cloudinary's privacy policy: https://cloudinary.com/privacy

---

## 4. HOW WE USE YOUR INFORMATION

### 4.1 Essential Platform Functions
- **Authentication:** Verify your identity and maintain your session
- **Account management:** Create, update, and manage your profile
- **Event participation:** Register you for events and manage attendance
- **Group membership:** Subscribe you to groups and manage memberships
- **Communication:** Send magic links, event notifications, and platform updates

**Legal Basis (GDPR):** Performance of contract, legitimate interests

### 4.2 Platform Improvement
- **Analytics:** Understand how users interact with the Platform
- **Bug fixes:** Identify and resolve technical issues
- **Feature development:** Build new features based on usage patterns

**Legal Basis (GDPR):** Legitimate interests

### 4.3 Safety & Security
- **Rate limiting:** Prevent abuse and spam (5 magic links/hour, 10 OAuth/minute)
- **Fraud prevention:** Detect and prevent fraudulent activity
- **Security monitoring:** Protect against unauthorized access

**Legal Basis (GDPR):** Legitimate interests, legal obligation

### 4.4 Legal Compliance
- **Respond to legal requests:** Court orders, subpoenas
- **Enforce Terms of Service:** Investigate violations
- **Protect rights:** Defend against legal claims

**Legal Basis (GDPR):** Legal obligation, legitimate interests

---

## 5. HOW WE SHARE YOUR INFORMATION

### 5.1 Public Information (Visible to All Users)

The following information is **PUBLIC** and visible to anyone on the Platform:
- **Display name** (or email if no display name set)
- **Profile photo** (if uploaded)
- **Member since date**
- **Groups you've joined** (visible on group member lists)
- **Events you're attending** (visible on event attendee lists)
- **Comments and replies** on events
- **Organiser badge** (if you create groups)

**Your email address is PRIVATE** and only visible to you on your profile page.

### 5.2 Within Groups & Events
- **Group members** can see other members' names and photos
- **Event participants** can see other attendees' names and photos
- **Organisers** can see participant lists for their events

### 5.3 Service Providers

We share data with trusted third parties who help us operate the Platform:

| Provider | Purpose | Data Shared | Privacy Policy |
|----------|---------|-------------|----------------|
| **Cloudinary** | Image hosting | Uploaded photos, image URLs | [Link](https://cloudinary.com/privacy) |
| **Google OAuth** | Authentication | Email, name, profile photo | [Link](https://policies.google.com/privacy) |
| **Railway/Render** | Hosting | All platform data | [Railway](https://railway.app/legal/privacy) / [Render](https://render.com/privacy) |
| **PostgreSQL** | Database | All platform data | Managed by hosting provider |

**Data Processing Agreements:** We have agreements with service providers to protect your data.

### 5.4 Legal Requirements
We may disclose your information if required by law:
- Court orders or subpoenas
- Government investigations
- Protection of our rights or safety of users
- Prevention of fraud or illegal activity

### 5.5 Business Transfers
If OutMeets is acquired or merged, your data may be transferred to the new owner.

### 5.6 With Your Consent
We may share your information for other purposes with your explicit consent.

---

## 6. DATA RETENTION

### 6.1 Active Accounts
We retain your data as long as your account is active.

### 6.2 Deleted Accounts
When you delete your account:
- **Personal data** is deleted within **30 days**
- **Comments and posts** may be anonymized (name replaced with "Deleted User")
- **Backup copies** are deleted within **90 days**

### 6.3 Legal Obligations
We may retain data longer if required by law or to resolve disputes.

### 6.4 Specific Retention Periods
- **Login logs:** 90 days
- **Rate limiting data:** 24 hours
- **Email verification tokens:** 15 minutes
- **JWT tokens:** 24 hours (7 days for refresh tokens)

---

## 7. YOUR RIGHTS (GDPR)

### 7.1 Right to Access
You can request a copy of your personal data.

**How:** Email privacy@outmeets.com with subject "Data Access Request"

### 7.2 Right to Rectification
You can correct inaccurate or incomplete data.

**How:** Update your profile on the Platform or email us

### 7.3 Right to Erasure ("Right to be Forgotten")
You can request deletion of your data.

**How:** Delete your account or email privacy@outmeets.com

**Exceptions:** We may retain data if required by law or to defend legal claims.

### 7.4 Right to Restriction
You can request we limit processing of your data.

**How:** Email privacy@outmeets.com

### 7.5 Right to Data Portability
You can request your data in a machine-readable format.

**How:** Email privacy@outmeets.com with subject "Data Portability Request"

### 7.6 Right to Object
You can object to processing based on legitimate interests.

**How:** Email privacy@outmeets.com

### 7.7 Right to Withdraw Consent
You can withdraw consent at any time (does not affect prior processing).

**How:** Update your settings or email us

### 7.8 Right to Lodge a Complaint
You can complain to a supervisory authority.

**UK:** Information Commissioner's Office (ICO) - https://ico.org.uk  
**EU:** Your local data protection authority

---

## 8. DATA SECURITY

### 8.1 Technical Measures
- **Encryption:** HTTPS/TLS for data in transit
- **JWT tokens:** Secure authentication with HS256 signing
- **Rate limiting:** Prevents brute force attacks
- **Strong secrets:** 64-character random JWT secret (512 bits entropy)
- **Security headers:** CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- **Input validation:** Prevents SQL injection and XSS attacks

### 8.2 Organizational Measures
- **Access controls:** Limited employee access to data
- **Regular audits:** Security reviews and updates
- **Incident response:** Plan for data breaches

### 8.3 Your Responsibilities
- **Keep credentials secure:** Don't share your login link
- **Use strong passwords:** If using password authentication (future)
- **Report breaches:** Notify us of unauthorized access

### 8.4 Data Breach Notification
If a breach occurs, we will:
- Notify affected users within **72 hours**
- Report to supervisory authorities as required
- Provide information on steps taken

---

## 9. INTERNATIONAL DATA TRANSFERS

### 9.1 Data Location
Your data is stored on servers in:
- **Primary:** [Your hosting region, e.g., EU/UK/US]
- **Backups:** [Backup region if different]

### 9.2 Transfers Outside UK/EU
If we transfer data outside the UK/EU, we ensure adequate protection through:
- **Standard Contractual Clauses (SCCs)**
- **Adequacy decisions** by UK/EU authorities
- **Other approved mechanisms**

### 9.3 Third-Party Transfers
Service providers may store data in different regions (see Section 5.3).

---

## 10. CHILDREN'S PRIVACY

### 10.1 Age Restriction
OutMeets is NOT intended for users under **18 years old**.

### 10.2 No Knowingly Collected Data
We do not knowingly collect data from children under 18.

### 10.3 Parental Notification
If we discover we have collected data from a child, we will delete it immediately.

**Parents:** If you believe your child has provided data, contact privacy@outmeets.com

---

## 11. COOKIES & TRACKING

See our separate **Cookie Policy** for details on:
- Types of cookies we use
- How to manage cookie preferences
- Third-party cookies

**Essential Cookies:**
- Authentication tokens (JWT)
- Session management
- Security features

**Analytics Cookies (if implemented):**
- Google Analytics (opt-out available)
- Usage tracking

---

## 12. CHANGES TO THIS POLICY

### 12.1 Updates
We may update this Privacy Policy from time to time.

### 12.2 Notification
- **Material changes:** Email notification + Platform notice
- **Minor changes:** Updated "Last Updated" date

### 12.3 Continued Use
Continued use after changes constitutes acceptance.

---

## 13. CONTACT US

For privacy questions or to exercise your rights:

**Email:** privacy@outmeets.com  
**Address:** [Your Company Address]  
**Response Time:** Within 30 days

---

## 14. LEGAL BASIS SUMMARY (GDPR)

| Processing Activity | Legal Basis |
|---------------------|-------------|
| Account creation & authentication | Performance of contract |
| Event registration & participation | Performance of contract |
| Group membership management | Performance of contract |
| Platform improvement & analytics | Legitimate interests |
| Security & fraud prevention | Legitimate interests |
| Legal compliance | Legal obligation |
| Marketing (if implemented) | Consent |

---

**Last Updated:** December 9, 2025

By using OutMeets, you acknowledge that you have read and understood this Privacy Policy.
