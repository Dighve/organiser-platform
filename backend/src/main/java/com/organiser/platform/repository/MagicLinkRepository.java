package com.organiser.platform.repository;

import com.organiser.platform.model.MagicLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface MagicLinkRepository extends JpaRepository<MagicLink, Long> {
    
    Optional<MagicLink> findByToken(String token);
    
    Optional<MagicLink> findByTokenAndUsedFalse(String token);
    
    @Modifying
    @Query("DELETE FROM MagicLink m WHERE m.expiresAt < :now OR m.used = true")
    void deleteExpiredAndUsedLinks(LocalDateTime now);
    
    @Modifying
    @Query("DELETE FROM MagicLink m WHERE m.email = :email AND m.used = false")
    void deleteUnusedLinksByEmail(String email);
}
