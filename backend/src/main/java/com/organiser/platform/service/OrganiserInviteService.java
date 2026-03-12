package com.organiser.platform.service;

import com.organiser.platform.dto.OrganiserInviteDTO;
import com.organiser.platform.model.Member;
import com.organiser.platform.model.OrganiserInvite;
import com.organiser.platform.repository.MemberRepository;
import com.organiser.platform.repository.OrganiserInviteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrganiserInviteService {

    private final OrganiserInviteRepository inviteRepository;
    private final MemberRepository memberRepository;
    private final LegalService legalService;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    private static final int DEFAULT_EXPIRY_HOURS = 72;

    /**
     * Generate a new single-use organiser invite link.
     * Called by admins from the dashboard.
     */
    @Transactional
    public OrganiserInviteDTO generateInvite(Long adminId, String note, Integer expiryHours) {
        Member admin = memberRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        int hours = (expiryHours != null && expiryHours > 0) ? expiryHours : DEFAULT_EXPIRY_HOURS;

        OrganiserInvite invite = OrganiserInvite.builder()
                .token(UUID.randomUUID().toString())
                .createdByAdmin(admin)
                .note(note)
                .expiresAt(LocalDateTime.now().plusHours(hours))
                .createdAt(LocalDateTime.now())
                .isUsed(false)
                .build();

        invite = inviteRepository.save(invite);
        log.info("Generated organiser invite {} by admin {}", invite.getToken(), admin.getEmail());
        return toDTO(invite);
    }

    /**
     * Validate an invite token — called by the public landing page to show invite details.
     * Does NOT consume the token.
     */
    @Transactional(readOnly = true)
    public OrganiserInviteDTO validateInvite(String token) {
        OrganiserInvite invite = inviteRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invite not found"));
        return toDTO(invite);
    }

    /**
     * Consume an invite token and grant the member organiser role.
     * Called automatically after successful authentication when an inviteToken is present.
     */
    @Transactional
    public boolean consumeInviteAndGrantRole(String token, Long memberId) {
        OrganiserInvite invite = inviteRepository.findByToken(token)
                .orElse(null);

        if (invite == null) {
            log.warn("Invite token not found: {}", token);
            return false;
        }

        if (!invite.isValid()) {
            log.warn("Invite token {} is invalid (used={}, expired={})",
                    token, invite.getIsUsed(), LocalDateTime.now().isAfter(invite.getExpiresAt()));
            return false;
        }

        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Member not found"));

        // Mark invite as consumed
        invite.setIsUsed(true);
        invite.setUsedByMember(member);
        invite.setUsedAt(LocalDateTime.now());
        inviteRepository.save(invite);

        // Grant organiser role but require agreement acceptance via modal
        member.setHasOrganiserRole(true);
        // DO NOT auto-accept organiser agreement - let the modal flow handle it
        // member.setHasAcceptedOrganiserAgreement(true);  // REMOVED - must show modal
        // member.setOrganiserAgreementAcceptedAt(LocalDateTime.now());  // REMOVED
        memberRepository.save(member);

        log.info("Organiser invite {} consumed by member {} — role granted", token, member.getEmail());
        return true;
    }

    /**
     * List all invite links (admin use).
     */
    @Transactional(readOnly = true)
    public List<OrganiserInviteDTO> listAllInvites() {
        return inviteRepository.findAllOrderByCreatedAtDesc()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // ---- Private helpers ----

    private OrganiserInviteDTO toDTO(OrganiserInvite invite) {
        boolean expired = LocalDateTime.now().isAfter(invite.getExpiresAt());
        boolean valid = invite.isValid();
        String inviteUrl = frontendUrl + "/invite/" + invite.getToken();

        return OrganiserInviteDTO.builder()
                .id(invite.getId())
                .token(invite.getToken())
                .inviteUrl(inviteUrl)
                .note(invite.getNote())
                .createdByAdminEmail(invite.getCreatedByAdmin() != null
                        ? invite.getCreatedByAdmin().getEmail() : null)
                .usedByMemberEmail(invite.getUsedByMember() != null
                        ? invite.getUsedByMember().getEmail() : null)
                .usedAt(invite.getUsedAt())
                .expiresAt(invite.getExpiresAt())
                .createdAt(invite.getCreatedAt())
                .isUsed(invite.getIsUsed())
                .isExpired(expired)
                .isValid(valid)
                .build();
    }
}
