package com.organiser.platform.repository;

import com.organiser.platform.model.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    
    Optional<RefreshToken> findByToken(String token);
    
    List<RefreshToken> findByMemberIdAndRevokedFalse(Long memberId);
    
    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.revoked = true, rt.revokedAt = :revokedAt WHERE rt.member.id = :memberId AND rt.revoked = false")
    void revokeAllUserTokens(Long memberId, LocalDateTime revokedAt);
    
    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.expiresAt < :now")
    void deleteExpiredTokens(LocalDateTime now);
    
    @Query("SELECT COUNT(rt) FROM RefreshToken rt WHERE rt.member.id = :memberId AND rt.revoked = false AND rt.expiresAt > :now")
    long countActiveTokensByMemberId(Long memberId, LocalDateTime now);
}
