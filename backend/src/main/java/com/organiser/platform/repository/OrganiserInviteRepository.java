package com.organiser.platform.repository;

import com.organiser.platform.model.OrganiserInvite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrganiserInviteRepository extends JpaRepository<OrganiserInvite, Long> {

    Optional<OrganiserInvite> findByToken(String token);

    @Query("SELECT i FROM OrganiserInvite i WHERE i.createdByAdmin.id = :adminId ORDER BY i.createdAt DESC")
    List<OrganiserInvite> findByAdminIdOrderByCreatedAtDesc(@Param("adminId") Long adminId);

    @Query("SELECT i FROM OrganiserInvite i ORDER BY i.createdAt DESC")
    List<OrganiserInvite> findAllOrderByCreatedAtDesc();

    @Query("SELECT COUNT(i) FROM OrganiserInvite i WHERE i.expiresAt > :now AND i.isUsed = false")
    long countActiveInvites(@Param("now") LocalDateTime now);
}
