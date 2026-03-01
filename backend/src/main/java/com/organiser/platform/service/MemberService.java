// ============================================================
// IMPORTS
// ============================================================
package com.organiser.platform.service;

import com.organiser.platform.dto.MemberDTO;
import com.organiser.platform.dto.UpdateMemberProfileRequest;
import com.organiser.platform.model.Member;
import com.organiser.platform.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// ============================================================
// SERVICE CLASS
// ============================================================

@Service
@RequiredArgsConstructor
@Slf4j
public class MemberService {
    
    // ============================================================
    // DEPENDENCIES
    // ============================================================
    
    private final MemberRepository memberRepository;
    private final EnhancedLegalService enhancedLegalService;
    
    // ============================================================
    // PUBLIC MEMBER OPERATIONS
    // ============================================================
    
    /**
     * Promote a member to organiser status.
     *
     * @param memberId The ID of the member to promote
     * @return The updated Member entity
     * @throws RuntimeException if member not found or already an organiser
     */
    @Transactional
    public Member promoteToOrganiser(Long memberId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Member not found"));
        
        if (Boolean.TRUE.equals(member.getHasOrganiserRole())) {
            throw new RuntimeException("Member is already an organiser");
        }
        
        member.setHasOrganiserRole(true);
        return memberRepository.save(member);
    }
    
    /**
     * Get member by ID.
     *
     * @param memberId The ID of the member to retrieve
     * @return The Member entity
     * @throws RuntimeException if member not found
     */
    public Member getMemberById(Long memberId) {
        return memberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Member not found"));
    }
    
    /**
     * Get member details as DTO (for public display).
     *
     * @param memberId The ID of the member to retrieve
     * @return MemberDTO containing public member information
     * @throws RuntimeException if member not found
     */
    public MemberDTO getMemberDTOById(Long memberId) {
        Member member = getMemberById(memberId);
        return convertToDTO(member);
    }
    
    // ============================================================
    // PUBLIC PROFILE UPDATE OPERATIONS
    // ============================================================
    
    /**
     * Update member profile (display name, profile photo).
     *
     * @param memberId The ID of the member to update
     * @param request The update request containing new profile data
     * @return MemberDTO containing updated member information
     * @throws RuntimeException if member not found
     */
    @Transactional
    @CacheEvict(value = {"members", "groups", "events"}, allEntries = true)
    public MemberDTO updateMemberProfile(Long memberId, UpdateMemberProfileRequest request) {
        log.info("Updating profile for member: {}", memberId);
        
        Member member = getMemberById(memberId);
        
        // Update display name if provided
        if (request.getDisplayName() != null) {
            member.setDisplayName(request.getDisplayName());
            log.info("Updated display name to: {}", request.getDisplayName());
        }
        
        // Update profile photo URL if provided
        if (request.getProfilePhotoUrl() != null) {
            member.setProfilePhotoUrl(request.getProfilePhotoUrl());
            log.info("Updated profile photo URL");
        }
        
        // Update image position if provided
        if (request.getImagePosition() != null) {
            member.setImagePosition(request.getImagePosition());
            log.info("Updated image position");
        }
        
        Member updatedMember = memberRepository.save(member);
        log.info("Profile updated successfully for member: {}", memberId);
        
        return convertToDTO(updatedMember);
    }
    
    /**
     * Update profile photo only.
     *
     * @param memberId The ID of the member to update
     * @param photoUrl The new profile photo URL
     * @return MemberDTO containing updated member information
     * @throws RuntimeException if member not found
     */
    @Transactional
    @CacheEvict(value = {"members", "groups", "events"}, allEntries = true)
    public MemberDTO updateProfilePhoto(Long memberId, String photoUrl) {
        log.info("Updating profile photo for member: {}", memberId);
        
        Member member = getMemberById(memberId);
        member.setProfilePhotoUrl(photoUrl);
        
        Member updatedMember = memberRepository.save(member);
        log.info("Profile photo updated successfully for member: {}", memberId);
        
        return convertToDTO(updatedMember);
    }
    
    // ============================================================
    // PRIVATE DATA CONVERSION METHODS
    // ============================================================
    
    /**
     * Convert Member entity to DTO.
     * Now properly checks current active agreement versions instead of outdated flags.
     *
     * @param member The Member entity to convert
     * @return MemberDTO containing member information
     */
    private MemberDTO convertToDTO(Member member) {
        // Check if member has accepted CURRENT active versions
        boolean hasAcceptedCurrentUserAgreement = enhancedLegalService
                .hasAcceptedCurrentVersion(member.getId(), "USER");
        boolean hasAcceptedCurrentOrganiserAgreement = enhancedLegalService
                .hasAcceptedCurrentVersion(member.getId(), "ORGANISER");
        
        log.info("🔍 Member {} - Current User Agreement: {}, Current Organiser Agreement: {} (convertToDTO called)", 
                member.getId(), hasAcceptedCurrentUserAgreement, hasAcceptedCurrentOrganiserAgreement);
        
        return MemberDTO.builder()
                .id(member.getId())
                .email(member.getEmail())
                .displayName(member.getDisplayName())
                .profilePhotoUrl(member.getProfilePhotoUrl())
                .imagePosition(member.getImagePosition())
                .hasOrganiserRole(member.getHasOrganiserRole())
                .isAdmin(member.getIsAdmin())
                // Use current version checking instead of outdated boolean flags
                .hasAcceptedOrganiserAgreement(hasAcceptedCurrentOrganiserAgreement)
                .organiserAgreementAcceptedAt(member.getOrganiserAgreementAcceptedAt())
                .hasAcceptedUserAgreement(hasAcceptedCurrentUserAgreement)
                .userAgreementAcceptedAt(member.getUserAgreementAcceptedAt())
                .build();
    }
}
