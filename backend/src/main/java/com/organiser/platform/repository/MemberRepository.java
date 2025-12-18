package com.organiser.platform.repository;

import com.organiser.platform.model.Member;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface MemberRepository extends JpaRepository<Member, Long> {
    
    Optional<Member> findByEmail(String email);
    
    boolean existsByEmail(String email);
    
    // Admin dashboard queries
    
    @Query("SELECT COUNT(m) FROM Member m WHERE m.createdAt >= :startDate")
    Long countNewUsersSince(@Param("startDate") LocalDateTime startDate);
    
    @Query("SELECT COUNT(m) FROM Member m WHERE m.isOrganiser = true")
    Long countOrganisers();
    
    @Query("SELECT m FROM Member m ORDER BY m.createdAt DESC")
    Page<Member> findRecentUsers(Pageable pageable);
    
    @Query("SELECT DATE(m.createdAt) as date, COUNT(m) as count " +
           "FROM Member m " +
           "WHERE m.createdAt >= :startDate " +
           "GROUP BY DATE(m.createdAt) " +
           "ORDER BY DATE(m.createdAt)")
    List<Object[]> getDailySignupStats(@Param("startDate") LocalDateTime startDate);
}
