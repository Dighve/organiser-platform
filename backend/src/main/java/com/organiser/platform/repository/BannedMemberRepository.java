package com.organiser.platform.repository;

import com.organiser.platform.model.BannedMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BannedMemberRepository extends JpaRepository<BannedMember, Long> {
    
    /**
     * Check if a member is banned from a specific group
     */
    boolean existsByGroupIdAndMemberId(Long groupId, Long memberId);
    
    /**
     * Find a specific ban record
     */
    Optional<BannedMember> findByGroupIdAndMemberId(Long groupId, Long memberId);
    
    /**
     * Get all banned members for a group
     */
    List<BannedMember> findByGroupIdOrderByBannedAtDesc(Long groupId);
    
    /**
     * Get all groups a member is banned from
     */
    List<BannedMember> findByMemberIdOrderByBannedAtDesc(Long memberId);
    
    /**
     * Get all group IDs a member is banned from (for filtering)
     */
    @Query("SELECT bm.group.id FROM BannedMember bm WHERE bm.member.id = :memberId")
    List<Long> findBannedGroupIdsByMemberId(@Param("memberId") Long memberId);
    
    /**
     * Check if any banned members exist for a group
     */
    boolean existsByGroupId(Long groupId);

    /**
     * Delete all banned member records for a group (used when permanently deleting group)
     */
    void deleteByGroupId(Long groupId);
}
