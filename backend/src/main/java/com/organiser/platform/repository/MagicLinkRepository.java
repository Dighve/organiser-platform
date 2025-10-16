package com.organiser.platform.repository;

import com.organiser.platform.model.MagicLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface MagicLinkRepository extends JpaRepository<MagicLink, Long> {
    
    Optional<MagicLink> findByToken(String token);
    
    Optional<MagicLink> findByTokenAndUsedFalse(String token);
    
    List<MagicLink> findByEmail(String email);
    
    @Modifying
    @Query("DELETE FROM MagicLink m WHERE m.email = :email AND m.used = false")
    void deleteUnusedLinksByEmail(@Param("email") String email);
    
    @Modifying
    @Query("DELETE FROM MagicLink m WHERE m.expiresAt < :now OR m.used = true")
    void deleteExpiredAndUsedLinks(@Param("now") LocalDateTime now);
}
