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

@Service
@RequiredArgsConstructor
@Slf4j
public class MemberService {
    
    private final MemberRepository memberRepository;
    
    @Transactional
    public Member promoteToOrganiser(Long memberId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Member not found"));
        
        if (Boolean.TRUE.equals(member.getIsOrganiser())) {
            throw new RuntimeException("Member is already an organiser");
        }
        
        member.setIsOrganiser(true);
        return memberRepository.save(member);
    }
    
    public Member getMemberById(Long memberId) {
        return memberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Member not found"));
    }
    
    /**
     * Get member details as DTO (for public display)
     */
    public MemberDTO getMemberDTOById(Long memberId) {
        Member member = getMemberById(memberId);
        return convertToDTO(member);
    }
    
    /**
     * Update member profile (display name, profile photo)
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
        
        Member updatedMember = memberRepository.save(member);
        log.info("Profile updated successfully for member: {}", memberId);
        
        return convertToDTO(updatedMember);
    }
    
    /**
     * Update profile photo only
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
    
    /**
     * Convert Member entity to DTO
     */
    private MemberDTO convertToDTO(Member member) {
        return MemberDTO.builder()
                .id(member.getId())
                .email(member.getEmail())
                .displayName(member.getDisplayName())
                .profilePhotoUrl(member.getProfilePhotoUrl())
                .isOrganiser(member.getIsOrganiser())
                .build();
    }
}
