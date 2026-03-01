package com.organiser.platform.repository;

import com.organiser.platform.model.LegalAgreement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LegalAgreementRepository extends JpaRepository<LegalAgreement, Long> {
    
    // Legacy methods for backward compatibility
    Optional<LegalAgreement> findByMemberIdAndAgreementType(Long memberId, String agreementType);
    List<LegalAgreement> findByMemberId(Long memberId);
    boolean existsByMemberIdAndAgreementType(Long memberId, String agreementType);
    
    // Enhanced methods for industry-standard audit trail
    Optional<LegalAgreement> findTopByMemberIdAndAgreementTypeAndAgreementVersionOrderByAcceptedAtDesc(
        Long memberId, String agreementType, String agreementVersion);
    
    Optional<LegalAgreement> findTopByMemberIdAndAgreementTypeAndIsWithdrawnOrderByAcceptedAtDesc(
        Long memberId, String agreementType, Boolean isWithdrawn);
    
    List<LegalAgreement> findByMemberIdOrderByAcceptedAtDesc(Long memberId);
    
    List<LegalAgreement> findByMemberIdAndAgreementTypeOrderByAcceptedAtDesc(
        Long memberId, String agreementType);
    
    List<LegalAgreement> findByAgreementHashAndIsWithdrawn(String agreementHash, Boolean isWithdrawn);
    
    // Audit and compliance queries
    List<LegalAgreement> findByAgreementTypeAndAcceptedAtBetween(
        String agreementType, java.time.LocalDateTime startDate, java.time.LocalDateTime endDate);
    
    Long countByAgreementTypeAndIsWithdrawn(String agreementType, Boolean isWithdrawn);
    
    // Tamper detection
    List<LegalAgreement> findByAgreementHashStartingWith(String hashPrefix);
}
