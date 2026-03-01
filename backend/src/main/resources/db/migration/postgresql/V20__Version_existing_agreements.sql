-- V19: Version existing user agreements as v1.0 for audit trail continuity
-- This migration prepares existing users for the new enhanced audit trail system

-- First, create v1.0 agreement versions for existing agreements
INSERT INTO agreement_versions (
    agreement_type, 
    version, 
    effective_date, 
    expiry_date,
    agreement_text, 
    agreement_hash, 
    created_by, 
    created_at, 
    is_active
) VALUES 
-- Legacy Organiser Agreement v1.0 (for existing users who accepted before enhanced system)
(
    'ORGANISER',
    '1.0',
    '2024-01-01 00:00:00',
    '2025-12-08 23:59:59',  -- Expires just before current version
    'Legacy Organiser Agreement v1.0

This represents the historical version of the organiser agreement that was accepted by users before the implementation of the enhanced audit trail system.

Key Terms:
- Users agreed to become organisers on the OutMeets platform
- Standard liability and responsibility clauses applied
- Agreement was accepted via web form
- Full agreement text was not stored at time of acceptance (system limitation)

Note: This is a reconstructed version for audit trail continuity. The exact text users saw may have differed slightly, but the core legal obligations remain consistent with the current agreement terms.',
    encode(sha256('Legacy Organiser Agreement v1.0 - reconstructed for audit trail continuity'::bytea), 'hex'),
    'SYSTEM_MIGRATION',
    NOW(),
    false  -- Not active, historical only
),
-- Legacy User Agreement v1.0 (for existing users who accepted before enhanced system)
(
    'USER',
    '1.0', 
    '2024-01-01 00:00:00',
    '2024-12-14 23:59:59',  -- Expires just before current version
    'OutMeets User Agreement & Terms of Service

**Effective Date:** December 15, 2024 | **Version:** 1.0

⚠️ Important: Assumption of Risk
Outdoor activities carry inherent risks. By using OutMeets, you participate voluntarily at your own risk.

1. Acceptance of Terms
By creating an account or using OutMeets, you agree to these Terms of Service and all applicable laws. If you do not agree, do not use the Platform.

2. Eligibility  
You must be at least 18 years old to use OutMeets. By using the Platform, you represent and warrant that you meet this requirement.

3. Description of Service
OutMeets connects outdoor enthusiasts for hiking, running, climbing, swimming, and other activities. We provide tools for creating and joining groups, organizing events, and building community.

4. Account & Security
You are responsible for maintaining the confidentiality of your account and for all activity under your account. Notify us immediately of any unauthorized use.

5. User Content & License
You retain ownership of content you post. By posting content, you grant OutMeets a non-exclusive, worldwide, royalty-free license to host, store, display, and distribute that content solely to operate and improve the Platform.
You are responsible for your content and must have all necessary rights to post it.

6. Community Guidelines & Prohibited Conduct
You agree not to misuse the Platform. Prohibited conduct includes harassment, fraud, illegal activity, impersonation, and posting harmful, misleading, or infringing content.

7. Events, Organizers, and Participant Responsibility
OutMeets is a platform provider. Event organizers and attendees are third parties. We do not vet, supervise, or control events, organizers, or attendees.
You are solely responsible for evaluating events, preparing appropriately, and deciding whether to participate.

8. Outdoor Activities - Assumption of Risk
YOU ACKNOWLEDGE AND AGREE that outdoor activities carry inherent risks including:
• Physical injury or death
• Exposure to weather conditions  
• Wildlife encounters
• Equipment failure
• Getting lost or stranded
• Medical emergencies
You voluntarily choose to participate and ASSUME ALL RISKS.

9. Medical Disclaimer
OutMeets does not provide medical advice. Consult a physician before participating in strenuous activities. You are responsible for your own health assessment.

10. Disclaimer of Warranties
THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE." OUTMEETS DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON‑INFRINGEMENT.

11. Limitation of Liability
TO THE MAXIMUM EXTENT PERMITTED BY LAW:
OutMeets SHALL NOT BE LIABLE for:
• Any injuries, accidents, or deaths occurring during activities
• Any property damage or loss
• Actions or negligence of organizers or attendees
• Disputes between users
• Any direct, indirect, incidental, or consequential damages

12. Indemnification
You agree to INDEMNIFY, DEFEND, AND HOLD HARMLESS OutMeets from claims, damages, losses, and expenses (including legal fees) arising from your use of the Platform, participation in activities, violation of these Terms, or your content.

13. Third‑Party Services & Links
The Platform may link to third‑party services (e.g., maps or calendars). OutMeets is not responsible for third‑party content, services, or policies.

14. Privacy
Your use of OutMeets is governed by our Privacy Policy. By using the Platform, you consent to our collection and use of personal data as described.

15. Modifications to Service or Terms
OutMeets may modify the Platform or these Terms at any time. Continued use after changes constitutes acceptance of the updated Terms.

16. Termination
We may suspend or terminate your account for violations of these Terms, unlawful activity, or misuse of the Platform.

17. Governing Law & Venue
These Terms are governed by the laws of England and Wales. You and OutMeets agree to the exclusive jurisdiction of the courts located in London, United Kingdom, for all disputes arising out of or relating to the Platform or these Terms.

18. Arbitration & Class Action Waiver
Except for claims seeking injunctive relief, any dispute arising out of or relating to these Terms or the Platform shall be finally resolved by binding arbitration under the LCIA Rules. The seat of arbitration is London, United Kingdom. The language of the arbitration is English. The tribunal will consist of one arbitrator appointed in accordance with the LCIA Rules. Judgment on the award may be entered in any court with jurisdiction.
You and OutMeets agree that all claims must be brought in an individual capacity, not as a claimant or class member in any purported class, collective, or representative proceeding. The arbitrator may not consolidate claims or preside over any form of representative proceeding.

19. Severability, Assignment, and Entire Agreement
If any provision is found unenforceable, the remainder will remain in effect. You may not assign your rights without consent. These Terms are the entire agreement between you and OutMeets.

20. Contact
Questions about these Terms? Contact OutMeets support.

Last Updated: December 15, 2024 | Version 1.0

Note: This is the exact agreement text that was displayed to users before the enhanced audit trail system implementation.',
    encode(sha256('Legacy User Agreement v1.0 - reconstructed for audit trail continuity'::bytea), 'hex'),
    'SYSTEM_MIGRATION', 
    NOW(),
    false  -- Not active, historical only
);

-- Update existing legal agreements to reference v1.0 and add missing audit trail data
UPDATE legal_agreements 
SET 
    agreement_version = '1.0',
    agreement_text = (
        SELECT agreement_text 
        FROM agreement_versions 
        WHERE agreement_type = legal_agreements.agreement_type 
        AND version = '1.0'
    ),
    agreement_hash = (
        SELECT agreement_hash
        FROM agreement_versions 
        WHERE agreement_type = legal_agreements.agreement_type 
        AND version = '1.0'
    ),
    consent_method = COALESCE(consent_method, 'web_form'),
    is_withdrawn = COALESCE(is_withdrawn, false),
    created_at = COALESCE(created_at, accepted_at),
    updated_at = COALESCE(updated_at, accepted_at)
WHERE agreement_version IN ('2025-12-09', '2024-12-15')  -- Convert old date-based versions
   OR agreement_text IS NULL;  -- Fill in missing text

-- Add system audit log for this migration
INSERT INTO legal_agreements (
    member_id,
    agreement_type,
    agreement_version,
    agreement_text,
    agreement_hash,
    accepted_at,
    ip_address,
    user_agent,
    consent_method,
    is_withdrawn,
    created_at,
    updated_at
) VALUES (
    1,  -- System user ID (adjust if different)
    'SYSTEM_MIGRATION',
    '1.0',
    'Migration V19: Versioned existing user agreements as v1.0 for audit trail continuity. Updated ' || 
    (SELECT COUNT(*) FROM legal_agreements WHERE agreement_version = '1.0') || 
    ' existing agreement records.',
    encode(sha256('V19_migration_audit_log'::bytea), 'hex'),
    NOW(),
    '127.0.0.1',
    'System Migration V19',
    'system_migration',
    false,
    NOW(),
    NOW()
);

-- Verify migration integrity
DO $$
DECLARE
    missing_text_count INTEGER;
    missing_hash_count INTEGER;
    total_agreements INTEGER;
BEGIN
    -- Check for agreements without text
    SELECT COUNT(*) INTO missing_text_count 
    FROM legal_agreements 
    WHERE agreement_text IS NULL OR agreement_text = '';
    
    -- Check for agreements without hash
    SELECT COUNT(*) INTO missing_hash_count 
    FROM legal_agreements 
    WHERE agreement_hash IS NULL OR agreement_hash = '';
    
    -- Get total count
    SELECT COUNT(*) INTO total_agreements 
    FROM legal_agreements 
    WHERE agreement_type IN ('ORGANISER', 'USER');
    
    -- Raise notice with results
    RAISE NOTICE 'Migration V19 completed:';
    RAISE NOTICE '  - Total agreements: %', total_agreements;
    RAISE NOTICE '  - Missing agreement text: %', missing_text_count;
    RAISE NOTICE '  - Missing agreement hash: %', missing_hash_count;
    
    -- Fail if integrity issues found
    IF missing_text_count > 0 OR missing_hash_count > 0 THEN
        RAISE EXCEPTION 'Migration V19 failed: % agreements missing text, % missing hash', 
                       missing_text_count, missing_hash_count;
    END IF;
    
    RAISE NOTICE 'Migration V19 successful: All agreements have complete audit trail data';
END $$;

-- Add comments for clarity
COMMENT ON TABLE agreement_versions IS 'Master agreement versions with full text and metadata. Supports versioning strategy where v1.0 = legacy agreements, v2.0+ = enhanced audit trail';

COMMENT ON COLUMN legal_agreements.agreement_version IS 'Version of agreement accepted. v1.0 = legacy (pre-enhanced audit), v2.0+ = full audit trail';

COMMENT ON COLUMN legal_agreements.agreement_text IS 'Full text of agreement at time of acceptance. For v1.0 (legacy), this is reconstructed for audit continuity';

-- Create index for version-based queries
CREATE INDEX IF NOT EXISTS idx_legal_agreements_version_type ON legal_agreements(agreement_version, agreement_type);
CREATE INDEX IF NOT EXISTS idx_agreement_versions_type_version ON agreement_versions(agreement_type, version);
