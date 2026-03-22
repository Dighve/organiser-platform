package com.organiser.platform.repository;

import com.organiser.platform.model.EmailOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface EmailOtpRepository extends JpaRepository<EmailOtp, Long> {

    Optional<EmailOtp> findTopByEmailAndUsedFalseOrderByCreatedAtDesc(String email);

    Optional<EmailOtp> findTopByEmailAndCodeAndUsedFalseOrderByCreatedAtDesc(String email, String code);

    @Modifying
    @Query("DELETE FROM EmailOtp o WHERE o.email = :email AND o.used = false")
    void deleteUnusedOtpsByEmail(@Param("email") String email);

    @Modifying
    @Query("DELETE FROM EmailOtp o WHERE o.expiresAt < :now OR o.used = true")
    void deleteExpiredAndUsedOtps(@Param("now") LocalDateTime now);
}
