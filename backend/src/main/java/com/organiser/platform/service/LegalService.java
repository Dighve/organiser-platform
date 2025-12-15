package com.organiser.platform.service;

import com.organiser.platform.model.LegalAgreement;
import com.organiser.platform.model.Member;
import com.organiser.platform.repository.LegalAgreementRepository;
import com.organiser.platform.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class LegalService {
    
    private final LegalAgreementRepository legalAgreementRepository;
    private final MemberRepository memberRepository;
    
    private static final String CURRENT_ORGANISER_AGREEMENT_VERSION = "2025-12-09";
    
    @Transactional
    public void acceptOrganiserAgreement(Long memberId, String ipAddress, String userAgent) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Member not found"));
        
        // Check if already accepted
        if (legalAgreementRepository.existsByMemberIdAndAgreementType(memberId, "ORGANISER")) {
            return; // Already accepted
        }
        
        // Create legal agreement record
        LegalAgreement agreement = new LegalAgreement();
        agreement.setMember(member);
        agreement.setAgreementType("ORGANISER");
        agreement.setAgreementVersion(CURRENT_ORGANISER_AGREEMENT_VERSION);
        agreement.setAcceptedAt(LocalDateTime.now());
        agreement.setIpAddress(ipAddress);
        agreement.setUserAgent(userAgent);
        
        legalAgreementRepository.save(agreement);
        
        // Update member flags - IMPORTANT: Set both flags!
        member.setHasAcceptedOrganiserAgreement(true);
        member.setOrganiserAgreementAcceptedAt(LocalDateTime.now());
        member.setIsOrganiser(true); // THIS IS CRITICAL - Makes user an actual organiser!
        memberRepository.save(member);
        
        System.out.println("✅ Member " + memberId + " is now an ORGANISER!");
    }
    
    public boolean hasAcceptedOrganiserAgreement(Long memberId) {
        return legalAgreementRepository.existsByMemberIdAndAgreementType(memberId, "ORGANISER");
    }
    
    @Transactional
    public void acceptUserAgreement(Long memberId, String ipAddress, String userAgent) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Member not found"));
        
        // Check if already accepted
        if (legalAgreementRepository.existsByMemberIdAndAgreementType(memberId, "USER")) {
            return; // Already accepted
        }
        
        // Create legal agreement record
        LegalAgreement agreement = new LegalAgreement();
        agreement.setMember(member);
        agreement.setAgreementType("USER");
        agreement.setAgreementVersion("2024-12-15");
        agreement.setAcceptedAt(LocalDateTime.now());
        agreement.setIpAddress(ipAddress);
        agreement.setUserAgent(userAgent);
        
        legalAgreementRepository.save(agreement);
        
        // Update member flags
        member.setHasAcceptedUserAgreement(true);
        member.setUserAgreementAcceptedAt(LocalDateTime.now());
        memberRepository.save(member);
        
        System.out.println("✅ Member " + memberId + " accepted User Agreement!");
    }
    
    public boolean hasAcceptedUserAgreement(Long memberId) {
        return legalAgreementRepository.existsByMemberIdAndAgreementType(memberId, "USER");
    }
}
