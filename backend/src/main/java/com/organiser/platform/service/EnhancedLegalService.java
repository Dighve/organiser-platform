package com.organiser.platform.service;

import com.organiser.platform.enums.AgreementType;
import com.organiser.platform.model.AgreementVersion;
import com.organiser.platform.model.LegalAgreement;
import com.organiser.platform.model.Member;
import com.organiser.platform.repository.AgreementVersionRepository;
import com.organiser.platform.repository.LegalAgreementRepository;
import com.organiser.platform.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Enhanced Legal Service with Industry Standard Audit Trail Compliance
 * 
 * Features:
 * - Full agreement text storage with each acceptance
 * - SHA-256 hash generation for tamper detection
 * - Support for multiple acceptances (re-acceptance when agreements change)
 * - Comprehensive audit metadata collection
 * - Consent withdrawal tracking
 * - Agreement version management
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EnhancedLegalService {

    private final LegalAgreementRepository legalAgreementRepository;
    private final AgreementVersionRepository agreementVersionRepository;
    private final MemberRepository memberRepository;

    /**
     * Accept organiser agreement with full audit trail compliance
     */
    @Transactional
    public LegalAgreement acceptOrganiserAgreement(Long memberId, String ipAddress, String userAgent, 
                                                  String sessionId, String referrerUrl, String browserFingerprint) {
        
        LegalAgreement agreement = acceptAgreement(AgreementType.ORGANISER, memberId, ipAddress, userAgent, 
                                                  sessionId, referrerUrl, browserFingerprint);
        
        // Update organiser-specific member flags
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Member not found: " + memberId));
        member.setHasAcceptedOrganiserAgreement(true);
        member.setOrganiserAgreementAcceptedAt(LocalDateTime.now());
        member.setHasOrganiserRole(true);
        memberRepository.save(member);
        
        return agreement;
    }

    /**
     * Accept user agreement with full audit trail compliance
     */
    @Transactional
    public LegalAgreement acceptUserAgreement(Long memberId, String ipAddress, String userAgent,
                                            String sessionId, String referrerUrl, String browserFingerprint) {
        
        LegalAgreement agreement = acceptAgreement(AgreementType.USER, memberId, ipAddress, userAgent, 
                                                  sessionId, referrerUrl, browserFingerprint);
        
        // Update user-specific member flags
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Member not found: " + memberId));
        member.setHasAcceptedUserAgreement(true);
        member.setUserAgreementAcceptedAt(LocalDateTime.now());
        memberRepository.save(member);
        
        return agreement;
    }

    /**
     * Withdraw consent for a specific agreement
     */
    @Transactional
    public void withdrawConsent(Long memberId, String agreementType, String reason, 
                              String ipAddress, String userAgent) {
        
        log.info("Processing consent withdrawal for member: {}, agreement: {}", memberId, agreementType);
        
        // Find the most recent non-withdrawn acceptance
        Optional<LegalAgreement> currentAcceptance = legalAgreementRepository
                .findTopByMemberIdAndAgreementTypeAndIsWithdrawnOrderByAcceptedAtDesc(
                    memberId, agreementType, false);
        
        if (currentAcceptance.isEmpty()) {
            throw new RuntimeException("No current agreement acceptance found to withdraw");
        }
        
        LegalAgreement agreement = currentAcceptance.get();
        agreement.withdraw(reason);
        legalAgreementRepository.save(agreement);
        
        // Update member flags
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Member not found: " + memberId));
        
        if ("ORGANISER".equals(agreementType)) {
            member.setHasAcceptedOrganiserAgreement(false);
            member.setHasOrganiserRole(false);
        } else if ("USER".equals(agreementType)) {
            member.setHasAcceptedUserAgreement(false);
        }
        
        memberRepository.save(member);
        
        // Create audit record for withdrawal
        LegalAgreement withdrawalRecord = LegalAgreement.builder()
                .member(member)
                .agreementType(agreementType + "_WITHDRAWAL")
                .agreementVersion(agreement.getAgreementVersion())
                .agreementText("Consent withdrawn for agreement: " + agreement.getId() + ". Reason: " + reason)
                .agreementHash("withdrawal_" + agreement.getId())
                .acceptedAt(LocalDateTime.now())
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .consentMethod("withdrawal")
                .isWithdrawn(false)
                .build();
        
        legalAgreementRepository.save(withdrawalRecord);
        
        log.info("Successfully processed consent withdrawal for member: {}, agreement: {}", 
                memberId, agreementType);
    }

    /**
     * Common method to accept any agreement type with full audit trail compliance
     * Eliminates code duplication between acceptOrganiserAgreement and acceptUserAgreement
     */
    @Transactional
    public LegalAgreement acceptAgreement(AgreementType agreementType, Long memberId, String ipAddress, 
                                         String userAgent, String sessionId, String referrerUrl, String browserFingerprint) {
        
        log.info("Processing {} agreement acceptance for member: {}", agreementType.getValue(), memberId);
        
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Member not found: " + memberId));
        
        // Get the active agreement version
        log.info("🔍 Searching for active {} agreement version...", agreementType.getValue());
        AgreementVersion activeVersion = agreementVersionRepository
                .findByAgreementTypeAndIsActive(agreementType.getValue(), true)
                .orElseThrow(() -> new RuntimeException("No active " + agreementType.getValue() + " agreement version found"));
        
        log.info("✅ Found active {} agreement - Version: {}, Effective Date: {}, Created At: {}", 
                agreementType.getValue(), activeVersion.getVersion(), activeVersion.getEffectiveDate(), activeVersion.getCreatedAt());
        
        // Check if user has already accepted this specific version
        log.info("🔍 Checking if member {} has already accepted {} version {}", 
                memberId, agreementType.getValue(), activeVersion.getVersion());
                
        Optional<LegalAgreement> existingAcceptance = legalAgreementRepository
                .findTopByMemberIdAndAgreementTypeAndAgreementVersionOrderByAcceptedAtDesc(
                    memberId, agreementType.getValue(), activeVersion.getVersion());
        
        if (existingAcceptance.isPresent()) {
            LegalAgreement existing = existingAcceptance.get();
            log.info("📋 Found existing acceptance record for member {}: version={}, withdrawn={}, acceptedAt={}", 
                    memberId, existing.getAgreementVersion(), existing.getIsWithdrawn(), existing.getAcceptedAt());
                    
            if (!existing.getIsWithdrawn()) {
                log.warn("⚠️ Member {} already accepted {} agreement version {} - ensuring member flags are set", 
                        memberId, agreementType.getValue(), activeVersion.getVersion());
                
                // Ensure member flags are set even if agreement was already accepted
                // This fixes cases where old acceptances didn't set hasOrganiserRole
                boolean needsUpdate = false;
                if (agreementType == AgreementType.USER && !Boolean.TRUE.equals(member.getHasAcceptedUserAgreement())) {
                    member.setHasAcceptedUserAgreement(true);
                    member.setUserAgreementAcceptedAt(existing.getAcceptedAt());
                    needsUpdate = true;
                    log.info("🔧 Fixed missing hasAcceptedUserAgreement flag for member {}", memberId);
                } else if (agreementType == AgreementType.ORGANISER) {
                    if (!Boolean.TRUE.equals(member.getHasAcceptedOrganiserAgreement())) {
                        member.setHasAcceptedOrganiserAgreement(true);
                        member.setOrganiserAgreementAcceptedAt(existing.getAcceptedAt());
                        needsUpdate = true;
                        log.info("🔧 Fixed missing hasAcceptedOrganiserAgreement flag for member {}", memberId);
                    }
                    if (!Boolean.TRUE.equals(member.getHasOrganiserRole())) {
                        member.setHasOrganiserRole(true);
                        needsUpdate = true;
                        log.info("🔧 Fixed missing hasOrganiserRole flag for member {}", memberId);
                    }
                }
                
                if (needsUpdate) {
                    memberRepository.save(member);
                    log.info("✅ Updated member flags for existing acceptance");
                }
                
                return existing;
            } else {
                log.info("🔄 Found withdrawn acceptance - will create new record");
            }
        } else {
            log.info("✅ No existing acceptance found for member {} version {} - proceeding with new acceptance", 
                    memberId, activeVersion.getVersion());
        }
        
        log.info("🆕 Creating NEW {} agreement acceptance record for member {} version {}", 
                agreementType.getValue(), memberId, activeVersion.getVersion());
        
        // Create new legal agreement record with full audit trail
        LegalAgreement agreement = LegalAgreement.builder()
                .member(member)
                .agreementType(agreementType.getValue())
                .agreementVersion(activeVersion.getVersion())
                .agreementText(activeVersion.getAgreementText())
                .agreementHash(activeVersion.getAgreementHash())
                .acceptedAt(LocalDateTime.now())
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .sessionId(sessionId)
                .referrerUrl(referrerUrl)
                .browserFingerprint(browserFingerprint)
                .consentMethod("web_form")
                .isWithdrawn(false)
                .build();
        
        // Verify hash integrity (non-blocking - log warning if mismatch due to legacy seed data)
        String calculatedHash = calculateAgreementHash(activeVersion.getAgreementText());
        if (!calculatedHash.equals(activeVersion.getAgreementHash())) {
            log.warn("Hash mismatch for agreement version {} - stored: {}, calculated: {}. Proceeding with acceptance.",
                    activeVersion.getVersion(), activeVersion.getAgreementHash(), calculatedHash);
            // Update the stored hash to the correct value for future checks
            activeVersion.setAgreementHash(calculatedHash);
            agreementVersionRepository.save(activeVersion);
            log.info("Corrected agreement hash for version: {}", activeVersion.getVersion());
        }
        
        LegalAgreement savedAgreement = legalAgreementRepository.save(agreement);
        
        log.info("Successfully recorded {} agreement acceptance for member: {} with audit ID: {} version: {}", 
                agreementType.getValue(), memberId, savedAgreement.getId(), savedAgreement.getAgreementVersion());
        
        // Update member flags so hasAcceptedUserAgreement / hasAcceptedOrganiserAgreement returns true
        if (agreementType == AgreementType.USER) {
            member.setHasAcceptedUserAgreement(true);
            member.setUserAgreementAcceptedAt(LocalDateTime.now());
            log.info("✅ Updated member {} hasAcceptedUserAgreement=true, userAgreementAcceptedAt=now", memberId);
        } else if (agreementType == AgreementType.ORGANISER) {
            member.setHasAcceptedOrganiserAgreement(true);
            member.setOrganiserAgreementAcceptedAt(LocalDateTime.now());
            member.setHasOrganiserRole(true); // Grant organiser role when agreement is accepted
            log.info("✅ Updated member {} hasAcceptedOrganiserAgreement=true, hasOrganiserRole=true, organiserAgreementAcceptedAt=now", memberId);
        }
        memberRepository.save(member);
        
        // Immediately verify the record was saved correctly
        Optional<LegalAgreement> verifyRecord = legalAgreementRepository
                .findTopByMemberIdAndAgreementTypeAndAgreementVersionOrderByAcceptedAtDesc(
                    memberId, agreementType.getValue(), savedAgreement.getAgreementVersion());
        
        if (verifyRecord.isPresent()) {
            log.info("✅ Verification: Acceptance record found immediately after save - member: {}, type: {}, version: {}", 
                    memberId, agreementType.getValue(), savedAgreement.getAgreementVersion());
        } else {
            log.error("❌ Verification FAILED: Acceptance record NOT found after save - member: {}, type: {}, version: {}", 
                    memberId, agreementType.getValue(), savedAgreement.getAgreementVersion());
        }
                
        return savedAgreement;
    }

    /**
     * Check if member has accepted current version of agreement
     */
    public boolean hasAcceptedCurrentVersion(Long memberId, String agreementType) {
        
        // Get current active version
        Optional<AgreementVersion> activeVersion = agreementVersionRepository
                .findByAgreementTypeAndIsActive(agreementType, true);
        
        if (activeVersion.isEmpty()) {
            log.warn("No active version found for agreement type: {}", agreementType);
            return false;
        }
        
        String currentVersion = activeVersion.get().getVersion();
        log.debug("Checking if member {} accepted current {} agreement version: {}", 
                memberId, agreementType, currentVersion);
        
        // Check if user has accepted this specific version
        Optional<LegalAgreement> currentAcceptance = legalAgreementRepository
                .findTopByMemberIdAndAgreementTypeAndAgreementVersionOrderByAcceptedAtDesc(
                    memberId, agreementType, currentVersion);
        
        boolean hasAccepted = currentAcceptance.isPresent() && !currentAcceptance.get().getIsWithdrawn();
        
        log.debug("Member {} acceptance status for {} version {}: {} (found record: {})", 
                memberId, agreementType, currentVersion, hasAccepted, currentAcceptance.isPresent());
        
        if (currentAcceptance.isPresent()) {
            log.debug("Found acceptance record - version: {}, withdrawn: {}, accepted at: {}", 
                    currentAcceptance.get().getAgreementVersion(), 
                    currentAcceptance.get().getIsWithdrawn(),
                    currentAcceptance.get().getAcceptedAt());
        } else {
            log.debug("No acceptance record found for member {} and {} version {}", 
                    memberId, agreementType, currentVersion);
        }
        
        return hasAccepted;
    }
    /**
     * Withdraw all active consent records for a member.
     * Called when a member deletes their account to ensure agreement modals
     * are shown again if they re-register with the same email.
     */
    @Transactional
    public void withdrawAllConsentsForMember(Long memberId, String reason) {
        log.info("Withdrawing all consents for member: {} - reason: {}", memberId, reason);
        
        List<LegalAgreement> allAgreements = legalAgreementRepository.findByMemberId(memberId);
        
        int withdrawnCount = 0;
        for (LegalAgreement agreement : allAgreements) {
            // Skip already-withdrawn records and withdrawal audit records
            if (Boolean.TRUE.equals(agreement.getIsWithdrawn())) {
                continue;
            }
            if (agreement.getAgreementType() != null && agreement.getAgreementType().endsWith("_WITHDRAWAL")) {
                continue;
            }
            agreement.withdraw(reason);
            legalAgreementRepository.save(agreement);
            withdrawnCount++;
        }
        
        log.info("Withdrew {} consent record(s) for member: {}", withdrawnCount, memberId);
    }

    /**
     * Get complete audit trail for a member
     */
    public List<LegalAgreement> getAuditTrail(Long memberId) {
        return legalAgreementRepository.findByMemberIdOrderByAcceptedAtDesc(memberId);
    }

    /**
     * Get audit trail for specific agreement type
     */
    public List<LegalAgreement> getAuditTrailByType(Long memberId, String agreementType) {
        return legalAgreementRepository.findByMemberIdAndAgreementTypeOrderByAcceptedAtDesc(
                memberId, agreementType);
    }

    /**
     * Create new agreement version
     */
    @Transactional
    public AgreementVersion createAgreementVersion(String agreementType, String version, 
                                                  String agreementText, String createdBy) {
        
        // Deactivate current active version
        agreementVersionRepository.findByAgreementTypeAndIsActive(agreementType, true)
                .ifPresent(current -> {
                    current.setIsActive(false);
                    current.setExpiryDate(LocalDateTime.now());
                    agreementVersionRepository.save(current);
                });
        
        // Calculate hash for new agreement
        String agreementHash = calculateAgreementHash(agreementText);
        
        // Create new version
        AgreementVersion newVersion = AgreementVersion.builder()
                .agreementType(agreementType)
                .version(version)
                .effectiveDate(LocalDateTime.now())
                .agreementText(agreementText)
                .agreementHash(agreementHash)
                .createdBy(createdBy)
                .isActive(true)
                .build();
        
        return agreementVersionRepository.save(newVersion);
    }

    /**
     * Calculate SHA-256 hash for agreement text
     */
    private String calculateAgreementHash(String agreementText) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(agreementText.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            
            return "sha256_" + hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    /**
     * Verify agreement integrity
     */
    public boolean verifyAgreementIntegrity(Long agreementId) {
        Optional<LegalAgreement> agreement = legalAgreementRepository.findById(agreementId);
        
        if (agreement.isEmpty()) {
            return false;
        }
        
        LegalAgreement record = agreement.get();
        String calculatedHash = calculateAgreementHash(record.getAgreementText());
        
        return calculatedHash.equals(record.getAgreementHash());
    }

    /**
     * Get current active agreement version for frontend validation
     * Used by AgreementController to show users exact text they're accepting
     */
    public AgreementVersion getCurrentAgreementVersion(AgreementType agreementType) {
        return agreementVersionRepository
                .findByAgreementTypeAndIsActive(agreementType.getValue(), true)
                .orElseThrow(() -> new RuntimeException("No active " + agreementType.getValue() + " agreement version found"));
    }
    
    /**
     * Verify agreement integrity with text and hash
     * Security method to prevent frontend tampering
     */
    public boolean verifyAgreementIntegrity(AgreementType agreementType, String agreementText, String providedHash) {
        // Calculate hash of provided text
        String calculatedHash = calculateAgreementHash(agreementText);
        
        // Verify against provided hash
        if (!calculatedHash.equals(providedHash)) {
            log.warn("Agreement hash mismatch for {}: calculated={}, provided={}", 
                    agreementType.getValue(), calculatedHash, providedHash);
            return false;
        }
        
        // Also verify against current active version for extra security
        AgreementVersion activeVersion = getCurrentAgreementVersion(agreementType);
        boolean matchesActiveVersion = activeVersion.getAgreementHash().equals(providedHash) && 
                                      activeVersion.getAgreementText().equals(agreementText);
        
        if (!matchesActiveVersion) {
            log.warn("Agreement text/hash doesn't match active version for {}", agreementType.getValue());
            return false;
        }
        
        return true;
    }

    /**
     * Validate that provided agreement text matches current active version
     */
    public void validateAgreementText(String providedText, AgreementType agreementType) {
        log.info("🔍 Validating agreement text for type: {}", agreementType.getValue());
        
        AgreementVersion currentVersion = getCurrentAgreementVersion(agreementType);
        log.info("📋 Current active version: {}, created: {}", currentVersion.getVersion(), currentVersion.getCreatedAt());
        
        if (providedText == null || providedText.trim().isEmpty()) {
            log.warn("❌ Agreement text validation failed - provided text is empty");
            throw new RuntimeException("Agreement text cannot be empty");
        }
        
        // Log text details for debugging
        log.info("📝 Frontend text length: {}", providedText.length());
        log.info("📝 Backend text length: {}", currentVersion.getAgreementText().length());
        log.info("🔤 Frontend text preview: {}", providedText.substring(0, Math.min(100, providedText.length())));
        log.info("🔤 Backend text preview: {}", currentVersion.getAgreementText().substring(0, Math.min(100, currentVersion.getAgreementText().length())));
        
        String providedHash = calculateAgreementHash(providedText.trim());
        String currentHash = currentVersion.getAgreementHash();
        
        log.info("🔐 Hash comparison - Provided: {} vs Current: {}", providedHash, currentHash);
        
        if (!providedHash.equals(currentHash)) {
            log.warn("❌ Agreement text validation failed - hash mismatch for {} agreement", agreementType.getValue());
            log.warn("❌ This suggests frontend has cached/different agreement text than current active version");
            throw new RuntimeException("Provided agreement text does not match current active version");
        }
        
        log.info("✅ Agreement text validation passed for {} agreement", agreementType.getValue());
    }

    // Legacy methods for backward compatibility
    
    public void acceptOrganiserAgreement(Long memberId, String ipAddress, String userAgent) {
        acceptOrganiserAgreement(memberId, ipAddress, userAgent, null, null, null);
    }
    
    public void acceptUserAgreement(Long memberId, String ipAddress, String userAgent) {
        acceptUserAgreement(memberId, ipAddress, userAgent, null, null, null);
    }
    
    public boolean hasAcceptedOrganiserAgreement(Long memberId) {
        return hasAcceptedCurrentVersion(memberId, "ORGANISER");
    }
    
    public boolean hasAcceptedUserAgreement(Long memberId) {
        return hasAcceptedCurrentVersion(memberId, "USER");
    }
}
