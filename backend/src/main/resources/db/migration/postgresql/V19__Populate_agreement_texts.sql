-- Populate Agreement Versions with actual text content and generate hashes
-- This migration reads the current agreement files and stores their content

-- First, update the placeholder data with actual content for Organiser Agreement
UPDATE agreement_versions 
SET 
    agreement_text = '# OutMeets Organiser Agreement

**Last Updated:** December 9, 2025  
**Effective Date:** December 9, 2025

## IMPORTANT NOTICE

By creating a group or event on OutMeets, you become an **ORGANISER** and accept significant legal responsibilities. This agreement is IN ADDITION to our Terms of Service.

**READ CAREFULLY BEFORE CREATING YOUR FIRST GROUP OR EVENT.**

## 1. ORGANISER RESPONSIBILITIES

### 1.1 Legal Compliance
As an Organiser, you are responsible for:
- Ensuring all events comply with local laws and regulations
- Obtaining necessary permits, licenses, or insurance
- Following health and safety requirements
- Complying with accessibility obligations

### 1.2 Event Management
You must:
- Provide accurate event information
- Communicate changes promptly to participants
- Maintain appropriate adult supervision ratios for events involving minors
- Have emergency contact procedures in place

### 1.3 Participant Safety
You are responsible for:
- Conducting reasonable risk assessments
- Ensuring safe venues and activities
- Managing participant behavior appropriately
- Having basic first aid knowledge for outdoor activities

## 2. LIABILITY AND INSURANCE

### 2.1 Organiser Liability
- You are primarily liable for incidents at your events
- OutMeets is not liable for accidents or injuries at organiser events
- You should have appropriate insurance coverage

### 2.2 Insurance Requirements
- Public liability insurance recommended (minimum £2 million)
- Required for high-risk activities or large events (50+ people)
- Venue insurance may be required by location owners

## 3. FINANCIAL RESPONSIBILITIES

### 3.1 Event Fees
- You may charge reasonable fees to cover event costs
- All financial arrangements are between you and participants
- OutMeets is not responsible for payment disputes

### 3.2 Refunds
- You must have a clear refund policy
- Handle refund requests fairly and promptly
- Communicate cancellation policies clearly

## 4. CONTENT AND COMMUNICATION

### 4.1 Event Descriptions
- Provide accurate, truthful event information
- Include all relevant safety information and requirements
- Update information promptly when changes occur

### 4.2 Communication Standards
- Maintain professional, respectful communication
- Respond to participant queries within 48 hours
- Use appropriate channels for different types of communication

## 5. PARTICIPANT MANAGEMENT

### 5.1 Acceptance and Rejection
- You may accept or reject participants at your discretion
- Rejections must not be discriminatory or illegal
- Provide clear reasons for rejections when requested

### 5.2 Behavior Management
- Establish clear behavior expectations
- Address inappropriate behavior promptly
- Remove participants if necessary for group safety

## 6. DATA PROTECTION AND PRIVACY

### 6.1 Participant Data
- Handle participant data in accordance with GDPR
- Only collect data necessary for event management
- Do not share participant data without consent

### 6.2 Photography and Media
- Obtain consent before taking photos/videos of participants
- Respect participants'' privacy preferences
- Follow OutMeets'' media guidelines

## 7. INTELLECTUAL PROPERTY

### 7.1 Event Content
- You retain ownership of your original event content
- Grant OutMeets license to display event information on platform
- Respect others'' intellectual property rights

### 7.2 Platform Use
- Use OutMeets platform in accordance with Terms of Service
- Do not attempt to bypass platform systems
- Report technical issues promptly

## 8. PROHIBITED ACTIVITIES

### 8.1 Illegal Activities
- No illegal activities or substances
- No gambling or betting activities
- No activities that violate local regulations

### 8.2 Discrimination and Harassment
- Zero tolerance for discrimination based on protected characteristics
- No harassment, bullying, or intimidation
- Maintain inclusive, welcoming environment

### 8.3 Commercial Restrictions
- No multi-level marketing or pyramid schemes
- No high-pressure sales activities
- Keep commercial activities secondary to social objectives

## 9. PLATFORM OBLIGATIONS

### 9.1 OutMeets Responsibilities
OutMeets will:
- Provide platform infrastructure and support
- Handle payment processing (where applicable)
- Maintain user verification systems
- Provide dispute resolution assistance

### 9.2 Platform Limitations
OutMeets does not:
- Verify organiser qualifications or credentials
- Monitor individual events or activities
- Provide insurance coverage for events
- Guarantee participant behavior or attendance

## 10. DISPUTE RESOLUTION

### 10.1 Internal Resolution
- Attempt to resolve disputes directly with participants first
- Use OutMeets'' support channels for assistance
- Document dispute resolution attempts

### 10.2 Escalation Process
- Unresolved disputes may be escalated to OutMeets
- Serious safety concerns reported immediately
- Legal disputes handled through appropriate legal channels

## 11. TERMINATION AND SUSPENSION

### 11.1 Voluntary Termination
- You may stop being an organiser at any time
- Complete obligations for existing events before terminating
- Provide adequate notice to confirmed participants

### 11.2 Platform Enforcement
OutMeets may suspend or terminate organiser status for:
- Violation of this agreement or Terms of Service
- Safety concerns or participant complaints
- Illegal activities or policy violations

## 12. AMENDMENTS AND UPDATES

### 12.1 Agreement Changes
- This agreement may be updated periodically
- Significant changes will be communicated to organisers
- Continued use constitutes acceptance of changes

### 12.2 Legal Requirements
- Agreement interpretation governed by English law
- Disputes subject to English court jurisdiction
- Severability clause applies if any terms are invalid

## 13. ACKNOWLEDGMENT

By accepting this Organiser Agreement, you acknowledge that you have:
- Read and understood all terms and responsibilities
- Confirmed you meet the legal requirements to be an organiser
- Agreed to act in accordance with all stated obligations
- Understood the liability and insurance implications

**IMPORTANT:** This agreement creates legal obligations. If you are unsure about any aspect, consult with a legal advisor before accepting.

---

For questions about this agreement, contact: legal@outmeets.com

*This agreement is effective from December 9, 2025*',
    agreement_hash = encode(sha256('ORGANISER_AGREEMENT_2025-12-09'::bytea), 'hex')
WHERE agreement_type = 'ORGANISER' AND version = '2025-12-09';

-- Update User Agreement with the EXACT comprehensive text provided by user for legal protection
UPDATE agreement_versions 
SET 
    agreement_text = '# OutMeets User Agreement & Terms of Service

**Effective Date:** December 15, 2024 | **Version:** 1.0

## 1. ACCEPTANCE OF TERMS

By creating an account or using OutMeets, you agree to these Terms of Service and all applicable laws. If you do not agree, do not use the Platform.

## 2. ELIGIBILITY

You must be at least 18 years old to use OutMeets. By using the Platform, you represent and warrant that you meet this requirement.

## 3. DESCRIPTION OF SERVICE

OutMeets connects outdoor enthusiasts for hiking, running, climbing, swimming, and other activities. We provide tools for creating and joining groups, organizing events, and building community.

## 4. ACCOUNT & SECURITY

You are responsible for maintaining the confidentiality of your account and for all activity under your account. Notify us immediately of any unauthorized use.

## 5. USER CONTENT & LICENSE

You retain ownership of content you post. By posting content, you grant OutMeets a non-exclusive, worldwide, royalty-free license to host, store, display, and distribute that content solely to operate and improve the Platform. You must have all necessary rights to post your content.

## 6. COMMUNITY GUIDELINES & PROHIBITED CONDUCT

You agree not to misuse the Platform. Prohibited conduct includes harassment, fraud, illegal activity, impersonation, and posting harmful, misleading, or infringing content.

## 7. EVENTS, ORGANIZERS, AND PARTICIPANT RESPONSIBILITY

OutMeets is a platform provider; organizers and attendees are third parties. We do not vet, supervise, or control events, organizers, or attendees. You are solely responsible for evaluating events, preparing appropriately, and deciding whether to participate.

## 8. OUTDOOR ACTIVITIES - ASSUMPTION OF RISK

Outdoor activities carry inherent risks (injury or death, weather, wildlife, equipment failure, getting lost, medical emergencies). You voluntarily participate and assume all risks.

## 9. MEDICAL DISCLAIMER

OutMeets does not provide medical advice. Consult a physician before participating in strenuous activities. You are responsible for your own health assessment.

## 10. DISCLAIMER OF WARRANTIES

The Platform is provided "as is" and "as available." OutMeets disclaims all warranties, express or implied, including merchantability, fitness for a particular purpose, and non-infringement.

## 11. LIMITATION OF LIABILITY

To the maximum extent permitted by law, OutMeets is not liable for injuries, deaths, property damage, actions or negligence of organizers or attendees, disputes between users, or any direct, indirect, incidental, or consequential damages.

## 12. INDEMNIFICATION

You agree to indemnify, defend, and hold harmless OutMeets from claims, damages, losses, and expenses (including legal fees) arising from your use of the Platform, participation in activities, violation of these Terms, or your content.

## 13. THIRD-PARTY SERVICES & LINKS

The Platform may link to third-party services (e.g., maps or calendars). OutMeets is not responsible for third-party content, services, or policies.

## 14. PRIVACY

Your use of OutMeets is governed by our Privacy Policy. By using the Platform, you consent to our collection and use of personal data as described there.

## 15. MODIFICATIONS TO SERVICE OR TERMS

OutMeets may modify the Platform or these Terms at any time. Continued use after changes constitutes acceptance of the updated Terms.

## 16. TERMINATION

We may suspend or terminate your account for violations of these Terms, unlawful activity, or misuse of the Platform.

## 17. GOVERNING LAW & VENUE

These Terms are governed by the laws of England and Wales. You and OutMeets agree to the exclusive jurisdiction of the courts located in London, United Kingdom, for all disputes arising out of or relating to the Platform or these Terms.

## 18. ARBITRATION & CLASS ACTION WAIVER

Except for claims seeking injunctive relief, any dispute arising out of or relating to these Terms or the Platform shall be finally resolved by binding arbitration under the LCIA Rules. The seat of arbitration is London, United Kingdom. The language is English. One arbitrator appointed per LCIA Rules. Judgment on the award may be entered in any court with jurisdiction. You and OutMeets agree all claims must be brought individually, not as a class or representative action. The arbitrator may not consolidate claims or preside over representative proceedings.

## 19. SEVERABILITY, ASSIGNMENT, AND ENTIRE AGREEMENT

If any provision is unenforceable, the remainder stays in effect. You may not assign your rights without consent. These Terms are the entire agreement between you and OutMeets.

## 20. CONTACT

Questions about these Terms? Contact OutMeets support.

---

*Last Updated: December 15, 2024 | Version 1.0*',
    agreement_hash = encode(sha256('USER_AGREEMENT_2024-12-15'::bytea), 'hex')
WHERE agreement_type = 'USER' AND version = '2024-12-15';

-- Migrate existing legal_agreements to include full text and hash
UPDATE legal_agreements 
SET 
    agreement_text = CASE 
        WHEN agreement_type = 'ORGANISER' AND agreement_version = '2025-12-09' THEN 
            (SELECT agreement_text FROM agreement_versions WHERE agreement_type = 'ORGANISER' AND version = '2025-12-09')
        WHEN agreement_type = 'USER' AND agreement_version = '2024-12-15' THEN 
            (SELECT agreement_text FROM agreement_versions WHERE agreement_type = 'USER' AND version = '2024-12-15')
        ELSE 'HISTORICAL_AGREEMENT_TEXT_UNAVAILABLE'
    END,
    agreement_hash = CASE 
        WHEN agreement_type = 'ORGANISER' AND agreement_version = '2025-12-09' THEN 
            (SELECT agreement_hash FROM agreement_versions WHERE agreement_type = 'ORGANISER' AND version = '2025-12-09')
        WHEN agreement_type = 'USER' AND agreement_version = '2024-12-15' THEN 
            (SELECT agreement_hash FROM agreement_versions WHERE agreement_type = 'USER' AND version = '2024-12-15')
        ELSE 'historical_hash_unavailable'
    END,
    created_at = COALESCE(accepted_at, CURRENT_TIMESTAMP),
    updated_at = COALESCE(accepted_at, CURRENT_TIMESTAMP)
WHERE agreement_text IS NULL;

-- Add audit log entry for migration
INSERT INTO legal_agreements (member_id, agreement_type, agreement_version, agreement_text, agreement_hash, accepted_at, ip_address, user_agent, consent_method, created_at, updated_at)
SELECT 
    1 as member_id, -- System user
    'SYSTEM_MIGRATION' as agreement_type,
    'V18_MIGRATION' as agreement_version,
    'Legal agreement audit trail migration completed. Historical agreements migrated with available data.' as agreement_text,
    'migration_audit_log' as agreement_hash,
    CURRENT_TIMESTAMP as accepted_at,
    '127.0.0.1' as ip_address,
    'Database Migration Script V18' as user_agent,
    'system_migration' as consent_method,
    CURRENT_TIMESTAMP as created_at,
    CURRENT_TIMESTAMP as updated_at
WHERE NOT EXISTS (SELECT 1 FROM legal_agreements WHERE agreement_type = 'SYSTEM_MIGRATION' AND agreement_version = 'V18_MIGRATION');

-- Verify migration integrity
DO $$
DECLARE
    missing_text_count INTEGER;
    missing_hash_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO missing_text_count FROM legal_agreements WHERE agreement_text IS NULL AND agreement_type != 'SYSTEM_MIGRATION';
    SELECT COUNT(*) INTO missing_hash_count FROM legal_agreements WHERE agreement_hash IS NULL AND agreement_type != 'SYSTEM_MIGRATION';
    
    IF missing_text_count > 0 OR missing_hash_count > 0 THEN
        RAISE EXCEPTION 'Migration incomplete: % records missing text, % records missing hash', missing_text_count, missing_hash_count;
    END IF;
    
    RAISE NOTICE 'Legal agreement audit trail migration completed successfully';
END $$;
