package com.organiser.platform.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "legal_agreements")
@Data
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
    
    @Column(name = "accepted_at", nullable = false)
    private LocalDateTime acceptedAt;
    
    @Column(name = "ip_address", length = 45)
    private String ipAddress;
    
    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;
}
