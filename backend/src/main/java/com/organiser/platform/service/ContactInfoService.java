package com.organiser.platform.service;

import com.organiser.platform.dto.ContactInfoDTO;
import com.organiser.platform.dto.UpdateContactInfoRequest;
import com.organiser.platform.model.Member;
import com.organiser.platform.model.MemberContactInfo;
import com.organiser.platform.model.MemberContactInfo.ContactPlatform;
import com.organiser.platform.model.MemberContactInfo.ContactVisibility;
import com.organiser.platform.model.Subscription;
import com.organiser.platform.repository.EventParticipantRepository;
import com.organiser.platform.repository.MemberContactInfoRepository;
import com.organiser.platform.repository.MemberRepository;
import com.organiser.platform.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContactInfoService {

    private final MemberContactInfoRepository contactInfoRepository;
    private final MemberRepository memberRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final EventParticipantRepository eventParticipantRepository;

    // ============================================================
    // GET OWN CONTACTS (all, with visibility info)
    // ============================================================

    public List<ContactInfoDTO> getOwnContacts(Long memberId) {
        List<MemberContactInfo> contacts = contactInfoRepository.findByMemberIdOrderByDisplayOrderAsc(memberId);
        return contacts.stream()
                .map(c -> toDTO(c, true))
                .collect(Collectors.toList());
    }

    // ============================================================
    // GET CONTACTS FOR ANOTHER MEMBER (privacy-filtered)
    // ============================================================

    public List<ContactInfoDTO> getVisibleContacts(Long targetMemberId, Long viewerMemberId) {
        if (targetMemberId.equals(viewerMemberId)) {
            return getOwnContacts(targetMemberId);
        }

        List<MemberContactInfo> contacts = contactInfoRepository.findByMemberIdOrderByDisplayOrderAsc(targetMemberId);

        // Pre-compute relationship between viewer and target
        boolean sharesGroup = sharesGroup(viewerMemberId, targetMemberId);
        boolean sharesEvent = sharesEvent(viewerMemberId, targetMemberId);

        return contacts.stream()
                .filter(c -> isVisible(c.getVisibility(), sharesGroup, sharesEvent))
                .map(c -> toDTO(c, false))
                .collect(Collectors.toList());
    }

    // ============================================================
    // UPDATE CONTACTS (batch replace)
    // ============================================================

    @Transactional
    public List<ContactInfoDTO> updateContacts(Long memberId, UpdateContactInfoRequest request) {
        log.info("Updating contact info for member: {}", memberId);

        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Member not found"));

        // Delete existing contacts
        contactInfoRepository.deleteByMemberId(memberId);
        contactInfoRepository.flush();

        // Create new contacts
        List<MemberContactInfo> newContacts = request.getContacts().stream()
                .map((entry) -> {
                    ContactPlatform platform;
                    try {
                        platform = ContactPlatform.valueOf(entry.getPlatform().toUpperCase());
                    } catch (IllegalArgumentException e) {
                        throw new RuntimeException("Invalid platform: " + entry.getPlatform());
                    }

                    ContactVisibility visibility = ContactVisibility.GROUP_MEMBERS;
                    if (entry.getVisibility() != null) {
                        try {
                            visibility = ContactVisibility.valueOf(entry.getVisibility().toUpperCase());
                        } catch (IllegalArgumentException e) {
                            log.warn("Invalid visibility '{}', defaulting to GROUP_MEMBERS", entry.getVisibility());
                        }
                    }

                    return MemberContactInfo.builder()
                            .member(member)
                            .platform(platform)
                            .contactValue(entry.getContactValue().trim())
                            .displayLabel(entry.getDisplayLabel())
                            .visibility(visibility)
                            .displayOrder(entry.getDisplayOrder() != null ? entry.getDisplayOrder() : 0)
                            .build();
                })
                .collect(Collectors.toList());

        List<MemberContactInfo> saved = contactInfoRepository.saveAll(newContacts);
        log.info("Saved {} contact entries for member {}", saved.size(), memberId);

        return saved.stream()
                .map(c -> toDTO(c, true))
                .collect(Collectors.toList());
    }

    // ============================================================
    // PRIVACY HELPERS
    // ============================================================

    private boolean sharesGroup(Long memberA, Long memberB) {
        List<Subscription> subsA = subscriptionRepository.findByMemberId(memberA);
        Set<Long> groupIdsA = subsA.stream()
                .filter(s -> s.getStatus() == Subscription.SubscriptionStatus.ACTIVE)
                .map(s -> s.getGroup().getId())
                .collect(Collectors.toSet());

        if (groupIdsA.isEmpty()) return false;

        List<Subscription> subsB = subscriptionRepository.findByMemberId(memberB);
        return subsB.stream()
                .filter(s -> s.getStatus() == Subscription.SubscriptionStatus.ACTIVE)
                .anyMatch(s -> groupIdsA.contains(s.getGroup().getId()));
    }

    private boolean sharesEvent(Long memberA, Long memberB) {
        var participationsA = eventParticipantRepository.findByMemberId(memberA);
        Set<Long> eventIdsA = participationsA.stream()
                .map(p -> p.getEvent().getId())
                .collect(Collectors.toSet());

        if (eventIdsA.isEmpty()) return false;

        var participationsB = eventParticipantRepository.findByMemberId(memberB);
        return participationsB.stream()
                .anyMatch(p -> eventIdsA.contains(p.getEvent().getId()));
    }

    private boolean isVisible(ContactVisibility visibility, boolean sharesGroup, boolean sharesEvent) {
        return switch (visibility) {
            case EVERYONE -> true;
            case GROUP_MEMBERS -> sharesGroup;
            case EVENT_ATTENDEES -> sharesEvent;
            case NOBODY -> false;
        };
    }

    // ============================================================
    // DTO CONVERSION
    // ============================================================

    private ContactInfoDTO toDTO(MemberContactInfo info, boolean includeVisibility) {
        ContactInfoDTO.ContactInfoDTOBuilder builder = ContactInfoDTO.builder()
                .id(info.getId())
                .platform(info.getPlatform().name())
                .contactValue(info.getContactValue())
                .displayLabel(info.getDisplayLabel())
                .displayOrder(info.getDisplayOrder())
                .deepLink(generateDeepLink(info.getPlatform(), info.getContactValue()));

        if (includeVisibility) {
            builder.visibility(info.getVisibility().name());
        }

        return builder.build();
    }

    // ============================================================
    // DEEP LINK GENERATION
    // ============================================================

    public static String generateDeepLink(ContactPlatform platform, String value) {
        if (value == null || value.isBlank()) return null;
        String v = value.trim();

        return switch (platform) {
            case WHATSAPP -> {
                // Accept phone number (with or without +) or already a link
                String phone = v.replaceAll("[^0-9+]", "").replace("+", "");
                yield "https://wa.me/" + phone;
            }
            case TELEGRAM -> {
                String username = v.startsWith("@") ? v.substring(1) : v;
                yield "https://t.me/" + username;
            }
            case INSTAGRAM -> {
                String username = v.startsWith("@") ? v.substring(1) : v;
                yield "https://instagram.com/" + username;
            }
            case FACEBOOK -> {
                if (v.startsWith("http")) yield v;
                yield "https://facebook.com/" + v;
            }
            case X_TWITTER -> {
                String username = v.startsWith("@") ? v.substring(1) : v;
                yield "https://x.com/" + username;
            }
            case LINKEDIN -> {
                if (v.startsWith("http")) yield v;
                yield "https://linkedin.com/in/" + v;
            }
            case SNAPCHAT -> {
                String username = v.startsWith("@") ? v.substring(1) : v;
                yield "https://snapchat.com/add/" + username;
            }
            case OTHER -> v.startsWith("http") ? v : null;
        };
    }
}
