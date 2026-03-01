package com.organiser.platform.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

/**
 * Master table for agreement versions with full text and metadata
 * Supports version management and audit compliance
 */
@Entity
@Table(name = "agreement_versions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgreementVersion {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "agreement_type", nullable = false, length = 50)
    private String agreementType;
    
    @Column(name = "version", nullable = false, length = 20)
    private String version;
    
    @Column(name = "effective_date", nullable = false)
    private LocalDateTime effectiveDate;
    
    @Column(name = "expiry_date")
    private LocalDateTime expiryDate;
    
    @Column(name = "agreement_text", nullable = false, columnDefinition = "TEXT")
    private String agreementText;
    
    @Column(name = "agreement_hash", nullable = false, length = 64)
    private String agreementHash;
    
    @Column(name = "created_by", length = 100)
    private String createdBy;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
