package com.organiser.platform.repository;

import com.organiser.platform.model.MemberContactInfo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MemberContactInfoRepository extends JpaRepository<MemberContactInfo, Long> {

    List<MemberContactInfo> findByMemberIdOrderByDisplayOrderAsc(Long memberId);

    void deleteByMemberId(Long memberId);
}
