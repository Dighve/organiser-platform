package com.organiser.platform.service;

import com.organiser.platform.config.TestConfig;
import com.organiser.platform.config.TestDatabaseConfig;
import com.organiser.platform.config.TestJwtConfig;
import com.organiser.platform.dto.MagicLinkRequest;
import com.organiser.platform.model.MagicLink;
import com.organiser.platform.model.Member;
import com.organiser.platform.repository.MagicLinkRepository;
import com.organiser.platform.repository.MemberRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import static org.junit.jupiter.api.Assertions.*;
import java.util.List;
import java.util.Optional;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Import({TestConfig.class, TestJwtConfig.class, TestDatabaseConfig.class})
@Transactional
class AuthServiceIntegrationTest {

    @Autowired
    private AuthService authService;
    
    @Autowired
    private MemberRepository memberRepository;
    
    @Autowired
    private MagicLinkRepository magicLinkRepository;
    
    private final String TEST_EMAIL = "test@example.com";
    
    @BeforeEach
    void setUp() {
        // Clean up before each test
        magicLinkRepository.deleteAll();
        memberRepository.deleteAll();
    }
    
    @Test
    void requestMagicLink_NewUser_CreatesUserAndMagicLink() {
        // Given
        MagicLinkRequest request = new MagicLinkRequest();
        request.setEmail(TEST_EMAIL);
        
        // When
        authService.requestMagicLink(request);
        
        // Then
        // Verify member was created
        Optional<Member> savedMember = memberRepository.findByEmail(TEST_EMAIL);
        assertTrue(savedMember.isPresent(), "Member should be created");
        
        // Verify magic link was created and associated with the member
        Optional<MagicLink> savedLink = magicLinkRepository.findByEmail(TEST_EMAIL)
                .stream()
                .filter(link -> !link.getUsed())
                .findFirst();
                
        assertTrue(savedLink.isPresent(), "Magic link should be created");
        assertNotNull(savedLink.get().getUser(), "Magic link should be associated with a user");
        assertEquals(
            savedMember.get().getId(), 
            savedLink.get().getUser().getId(), 
            "Magic link should be associated with the created user"
        );
        assertFalse(savedLink.get().getUsed(), "Magic link should not be marked as used");
        assertTrue(
            savedLink.get().getExpiresAt().isAfter(LocalDateTime.now()),
            "Magic link should have a future expiration time"
        );
    }
    
    @Test
    void requestMagicLink_ExistingUser_CreatesNewMagicLink() {
        // Given - create existing user
        Member existingMember = new Member();
        existingMember.setEmail(TEST_EMAIL);
        memberRepository.save(existingMember);
        
        MagicLinkRequest request = new MagicLinkRequest();
        request.setEmail(TEST_EMAIL);
        
        // When
        authService.requestMagicLink(request);
        
        // Then
        Optional<MagicLink> savedLink = magicLinkRepository.findByEmail(TEST_EMAIL)
                .stream()
                .filter(link -> !link.getUsed())
                .findFirst();
                
        assertTrue(savedLink.isPresent(), "Magic link should be created");
        assertEquals(
            existingMember.getId(), 
            savedLink.get().getUser().getId(), 
            "Magic link should be associated with the existing user"
        );
    }
    
    @PersistenceContext
    private EntityManager entityManager;
    
    @Test
    @Transactional
    void requestMagicLink_ExistingUnusedLink_DeletesOldLink() {
        // Given - create existing unused magic link
        Member member = new Member();
        member.setEmail(TEST_EMAIL);
        member = memberRepository.save(member);
        entityManager.flush();
        
        MagicLink oldLink = new MagicLink();
        oldLink.setToken("old-token");
        oldLink.setEmail(TEST_EMAIL);
        oldLink.setUser(member);
        oldLink.setExpiresAt(LocalDateTime.now().plusHours(1));
        oldLink.setUsed(false);
        oldLink = magicLinkRepository.save(oldLink);
        entityManager.flush();
        
        // Verify the old link exists
        // Verify the old link exists by token since findById might not be available
        assertTrue(magicLinkRepository.findByToken("old-token").isPresent(), "Old link should exist before deletion");
        
        MagicLinkRequest request = new MagicLinkRequest();
        request.setEmail(TEST_EMAIL);
        
        // When - Call the service method
        authService.requestMagicLink(request);
        
        // Then - old link should be deleted and new one created
        // Force flush and clear the persistence context to ensure we're getting fresh data
        entityManager.flush();
        entityManager.clear();
        
        // Check old link is deleted by token
        assertFalse(magicLinkRepository.findByToken("old-token").isPresent(), "Old unused magic link should be deleted");
        
        // Check new link exists
        List<MagicLink> links = magicLinkRepository.findByEmail(TEST_EMAIL);
        assertEquals(1, links.size(), "There should be exactly one magic link after deletion");
        assertNotEquals(oldLink.getToken(), links.get(0).getToken(), "The token should be different from the old one");
    }
    
    @Test
    void requestMagicLink_NullEmail_ThrowsException() {
        // Given
        MagicLinkRequest request = new MagicLinkRequest();
        request.setEmail(null);
        
        // When & Then
        assertThrows(
            IllegalArgumentException.class,
            () -> authService.requestMagicLink(request),
            "Should throw exception for null email"
        );
    }
    
    @Test
    void requestMagicLink_EmptyEmail_ThrowsException() {
        // Given
        MagicLinkRequest request = new MagicLinkRequest();
        request.setEmail("   ");
        
        // When & Then
        assertThrows(
            IllegalArgumentException.class,
            () -> authService.requestMagicLink(request),
            "Should throw exception for empty email"
        );
    }
}
