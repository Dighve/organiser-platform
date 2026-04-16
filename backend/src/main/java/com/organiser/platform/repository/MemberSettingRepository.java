package com.organiser.platform.repository;

import com.organiser.platform.model.MemberSetting;
import com.organiser.platform.model.MemberSettingId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MemberSettingRepository extends JpaRepository<MemberSetting, MemberSettingId> {

    List<MemberSetting> findAllByIdMemberId(Long memberId);

    Optional<MemberSetting> findByIdMemberIdAndIdKey(Long memberId, String key);

    @Query("SELECT s FROM MemberSetting s WHERE s.id.memberId = :memberId AND s.id.key IN :keys")
    List<MemberSetting> findByMemberIdAndKeys(@Param("memberId") Long memberId, @Param("keys") List<String> keys);
}
