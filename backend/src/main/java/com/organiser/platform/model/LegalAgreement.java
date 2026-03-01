package com.organiser.platform.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

/**
 * Immutable audit trail of user agreement acceptances
 * Each row represents a specific acceptance event with full agreement text preserved for legal compliance
 */
@Entity
@Table(name = "legal_agreements")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LegalAgreement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;
    
    @Column(name = "agreement_type", nullable = false, length = 50)
    private String agreementType;
    
    @Column(name = "agreement_version", nullable = false, length = 20)
    private String agreementVersion;
    
    /**
     * Full text of agreement at time of acceptance - immutable for legal compliance
     */
    @Column(name = "agreement_text", columnDefinition = "TEXT")
    private String agreementText;
    
    /**
     * SHA-256 hash of agreement text for tamper detection
     */
    @Column(name = "agreement_hash", length = 64)
    private String agreementHash;
    
    @Column(name = "accepted_at", nullable = false)
    private LocalDateTime acceptedAt;
    
    @Column(name = "ip_address", length = 45)
    private String ipAddress;
    
    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;
    
    /**
     * How consent was obtained: web_form, api, email, etc.
     */
    @Builder.Default
    @Column(name = "consent_method", length = 50)
    private String consentMethod = "web_form";
    
    @Column(name = "browser_fingerprint", length = 255)
    private String browserFingerprint;
    
    @Column(name = "session_id", length = 255)
    private String sessionId;
    
    @Column(name = "referrer_url", columnDefinition = "TEXT")
    private String referrerUrl;
    
    /**
     * Whether user has withdrawn consent for this specific agreement
     */
    @Builder.Default
    @Column(name = "is_withdrawn", nullable = false)
    private Boolean isWithdrawn = false;
    
    /**
     * Timestamp when consent was withdrawn
     */
    @Column(name = "withdrawn_at")
    private LocalDateTime withdrawnAt;
    
    @Column(name = "withdrawal_reason", columnDefinition = "TEXT")
    private String withdrawalReason;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    /**
     * Mark this agreement acceptance as withdrawn
     */
    public void withdraw(String reason) {
        this.isWithdrawn = true;
        this.withdrawnAt = LocalDateTime.now();
        this.withdrawalReason = reason;
    }
}
