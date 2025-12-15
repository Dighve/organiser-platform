package com.organiser.platform.repository;

import com.organiser.platform.model.LegalAgreement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LegalAgreementRepository extends JpaRepository<LegalAgreement, Long> {
    
    Optional<LegalAgreement> findByMemberIdAndAgreementType(Long memberId, String agreementType);
    
    List<LegalAgreement> findByMemberId(Long memberId);
    
    boolean existsByMemberIdAndAgreementType(Long memberId, String agreementType);
}
