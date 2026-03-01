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
        AgreementVersion activeVersion = agreementVersionRepository
                .findByAgreementTypeAndIsActive(agreementType.getValue(), true)
                .orElseThrow(() -> new RuntimeException("No active " + agreementType.getValue() + " agreement version found"));
        
        // Check if user has already accepted this specific version
        Optional<LegalAgreement> existingAcceptance = legalAgreementRepository
                .findTopByMemberIdAndAgreementTypeAndAgreementVersionOrderByAcceptedAtDesc(
                    memberId, agreementType.getValue(), activeVersion.getVersion());
                    
        if (existingAcceptance.isPresent() && !existingAcceptance.get().getIsWithdrawn()) {
            log.info("Member {} already accepted {} agreement version {}", 
                    memberId, agreementType.getValue(), activeVersion.getVersion());
            return existingAcceptance.get();
        }
        
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
        
        // Verify hash integrity
        String calculatedHash = calculateAgreementHash(activeVersion.getAgreementText());
        if (!calculatedHash.equals(activeVersion.getAgreementHash())) {
            log.error("Hash mismatch detected for agreement version: {}", activeVersion.getVersion());
            throw new RuntimeException("Agreement integrity check failed");
        }
        
        LegalAgreement savedAgreement = legalAgreementRepository.save(agreement);
        
        log.info("Successfully recorded {} agreement acceptance for member: {} with audit ID: {}", 
                agreementType.getValue(), memberId, savedAgreement.getId());
                
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
        
        // Check if user has accepted this specific version
        Optional<LegalAgreement> currentAcceptance = legalAgreementRepository
                .findTopByMemberIdAndAgreementTypeAndAgreementVersionOrderByAcceptedAtDesc(
                    memberId, agreementType, activeVersion.get().getVersion());
        
        return currentAcceptance.isPresent() && !currentAcceptance.get().getIsWithdrawn();
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
