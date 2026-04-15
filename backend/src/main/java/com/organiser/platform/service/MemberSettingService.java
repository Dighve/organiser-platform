package com.organiser.platform.service;

import com.organiser.platform.model.Member;
import com.organiser.platform.model.MemberSetting;
import com.organiser.platform.model.MemberSettingId;
import com.organiser.platform.repository.MemberRepository;
import com.organiser.platform.repository.MemberSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MemberSettingService {

    // Keys for email notification sub-settings
    public static final String EMAIL_INVITATIONS = "email.invitations";
    public static final String EMAIL_REVIEWS = "email.reviews";

    private final MemberSettingRepository memberSettingRepository;
    private final MemberRepository memberRepository;

    /**
     * Returns all settings for a member as a key→boolean map.
     * Missing rows are filled with the default value (true).
     */
    public Map<String, Boolean> getSettings(Long memberId) {
        List<MemberSetting> rows = memberSettingRepository.findAllByIdMemberId(memberId);
        Map<String, Boolean> result = rows.stream()
                .collect(Collectors.toMap(
                        s -> s.getId().getKey(),
                        s -> Boolean.parseBoolean(s.getValue())
                ));
        // Fill in defaults for any key not yet persisted
        for (String key : knownKeys()) {
            result.putIfAbsent(key, true);
        }
        return result;
    }

    /**
     * Returns the boolean value for a single setting key.
     * Defaults to true if no row exists.
     */
    public boolean getSetting(Long memberId, String key) {
        return memberSettingRepository.findByIdMemberIdAndIdKey(memberId, key)
                .map(s -> Boolean.parseBoolean(s.getValue()))
                .orElse(true);
    }

    /**
     * Upserts one or more settings for a member.
     * Accepts a map of key → boolean.
     */
    @Transactional
    public Map<String, Boolean> updateSettings(Long memberId, Map<String, Boolean> updates) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found"));

        for (Map.Entry<String, Boolean> entry : updates.entrySet()) {
            String key = entry.getKey();
            if (!knownKeys().contains(key)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown setting key: " + key);
            }
            MemberSettingId id = new MemberSettingId(memberId, key);
            MemberSetting setting = memberSettingRepository.findById(id)
                    .orElse(MemberSetting.builder().id(id).member(member).build());
            setting.setValue(entry.getValue().toString());
            memberSettingRepository.save(setting);
        }

        return getSettings(memberId);
    }

    private List<String> knownKeys() {
        return List.of(EMAIL_INVITATIONS, EMAIL_REVIEWS);
    }
}
