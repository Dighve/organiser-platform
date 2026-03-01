package com.organiser.platform.repository;

import com.organiser.platform.model.AgreementVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AgreementVersionRepository extends JpaRepository<AgreementVersion, Long> {
    
    /**
     * Find active agreement version by type
     */
    Optional<AgreementVersion> findByAgreementTypeAndIsActive(String agreementType, Boolean isActive);
    
    /**
     * Find specific version by type and version
     */
    Optional<AgreementVersion> findByAgreementTypeAndVersion(String agreementType, String version);
    
    /**
     * Find all versions of an agreement type, ordered by effective date
     */
    List<AgreementVersion> findByAgreementTypeOrderByEffectiveDateDesc(String agreementType);
    
    /**
     * Find active agreement at a specific date
     */
    @Query("SELECT av FROM AgreementVersion av WHERE av.agreementType = :type " +
           "AND av.effectiveDate <= :date " +
           "AND (av.expiryDate IS NULL OR av.expiryDate > :date) " +
           "ORDER BY av.effectiveDate DESC")
    Optional<AgreementVersion> findActiveAgreementAtDate(@Param("type") String agreementType, 
                                                         @Param("date") LocalDateTime date);
    
    /**
     * Check if agreement hash exists (for tamper detection)
     */
    boolean existsByAgreementHash(String agreementHash);
}
