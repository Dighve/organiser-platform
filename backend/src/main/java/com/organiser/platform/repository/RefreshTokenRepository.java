package com.organiser.platform.repository;

import com.organiser.platform.model.RefreshToken;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    
    Optional<RefreshToken> findByToken(String token);
    
    // Pessimistic locking to prevent concurrent token rotation
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT rt FROM RefreshToken rt WHERE rt.token = :token")
    Optional<RefreshToken> findByTokenWithLock(@Param("token") String token);
    
    List<RefreshToken> findByMemberIdAndRevokedFalse(Long memberId);
    
    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.revoked = true, rt.revokedAt = :revokedAt WHERE rt.member.id = :memberId AND rt.revoked = false")
    void revokeAllUserTokens(@Param("memberId") Long memberId, @Param("revokedAt") LocalDateTime revokedAt);
    
    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.expiresAt < :now")
    void deleteExpiredTokens(@Param("now") LocalDateTime now);
    
    @Query("SELECT COUNT(rt) FROM RefreshToken rt WHERE rt.member.id = :memberId AND rt.revoked = false AND rt.expiresAt > :now")
    long countActiveTokensByMemberId(@Param("memberId") Long memberId, @Param("now") LocalDateTime now);
}
