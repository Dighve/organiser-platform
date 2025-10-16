package com.organiser.platform.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.organiser.platform.OrganiserPlatformApplication;
import com.organiser.platform.dto.AuthResponse;
import com.organiser.platform.dto.MagicLinkRequest;
import com.organiser.platform.model.MagicLink;
import com.organiser.platform.model.Member;
import com.organiser.platform.repository.MagicLinkRepository;
import com.organiser.platform.repository.MemberRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    classes = OrganiserPlatformApplication.class
)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthControllerIntegrationTest {

    // Using H2 in-memory database for testing

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private MagicLinkRepository magicLinkRepository;

    @BeforeEach
    void setUp() {
        // No need to clean up manually with @Transactional
    }

    @AfterEach
    void tearDown() {
        // No need to clean up manually with @Transactional
    }

    @Test
    void requestMagicLink_WithValidEmail_ShouldReturnSuccess() throws Exception {
        // Given
        String email = "test@example.com";
        MagicLinkRequest request = new MagicLinkRequest();
        request.setEmail(email);

        // When
        ResultActions result = mockMvc.perform(post("/api/v1/auth/magic-link")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)));

        // Then
        result.andExpect(status().isOk())
              .andExpect(jsonPath("$.message").value("Magic link sent to your email"))
              .andExpect(jsonPath("$.email").value(email));

        // Verify magic link was saved
        assertThat(magicLinkRepository.count()).isGreaterThan(0);
        Optional<Member> member = memberRepository.findByEmail(email);
        assertThat(member).isPresent();
    }

    @Test
    void requestMagicLink_WithInvalidEmail_ShouldReturnBadRequest() throws Exception {
        // Given
        MagicLinkRequest request = new MagicLinkRequest();
        request.setEmail(""); // Invalid email

        // When
        ResultActions result = mockMvc.perform(post("/api/v1/auth/magic-link")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)));

        // Then
        result.andExpect(status().isBadRequest());
    }

    @Test
    void verifyMagicLink_WithValidToken_ShouldReturnAuthResponse() throws Exception {
        // Given
        String email = "test@example.com";
        String token = UUID.randomUUID().toString();
        
        // Create a test member
        Member member = new Member();
        member.setEmail(email);
        member.setVerified(false);
        member = memberRepository.save(member);
        
        // Create a magic link
        MagicLink magicLink = new MagicLink();
        magicLink.setToken(token);
        magicLink.setEmail(email);
        magicLink.setExpiresAt(LocalDateTime.now().plusMinutes(15));
        magicLink.setUsed(false);
        magicLink.setUser(member);
        magicLinkRepository.save(magicLink);

        // When
        MvcResult result = mockMvc.perform(get("/api/v1/auth/verify")
                .param("token", token))
                                  .andExpect(status().isOk())
                                  .andExpect(jsonPath("$.email").value(email))
                                  .andExpect(jsonPath("$.token").isNotEmpty())
                                  .andExpect(jsonPath("$.userId").value(member.getId().toString()))
                                  .andExpect(jsonPath("$.role").value("MEMBER"))
                                  .andReturn();

        // Then
        AuthResponse response = objectMapper.readValue(
            result.getResponse().getContentAsString(), AuthResponse.class);
        assertThat(response).isNotNull();
        assertThat(response.getToken()).isNotBlank();
        
        // Verify magic link is marked as used
        MagicLink usedLink = magicLinkRepository.findByToken(token).orElseThrow();
        assertThat(usedLink.getUsed()).isTrue();
        assertThat(usedLink.getUsedAt()).isNotNull();
        
        // Verify user is marked as verified
        Member updatedMember = memberRepository.findById(member.getId()).orElseThrow();
        assertThat(updatedMember.getVerified()).isTrue();
    }

    @Test
    void verifyMagicLink_WithInvalidToken_ShouldReturnBadRequest() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/v1/auth/verify")
                .param("token", "invalid-token"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Invalid or expired magic link"));
    }

    @Test
    void verifyMagicLink_WithExpiredToken_ShouldReturnBadRequest() throws Exception {
        // Given
        String email = "test@example.com";
        String token = UUID.randomUUID().toString();
        
        // Create a test member
        Member member = new Member();
        member.setEmail(email);
        member = memberRepository.save(member);
        
        // Create an expired magic link
        MagicLink magicLink = new MagicLink();
        magicLink.setToken(token);
        magicLink.setEmail(email);
        magicLink.setExpiresAt(LocalDateTime.now().minusMinutes(30)); // Expired
        magicLink.setUsed(false);
        magicLink.setUser(member);
        magicLinkRepository.save(magicLink);

        // When & Then
        mockMvc.perform(get("/api/v1/auth/verify")
                .param("token", token))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Magic link has expired or been used"));
    }

    @Test
    void verifyMagicLink_WithUsedToken_ShouldReturnBadRequest() throws Exception {
        // Given
        String email = "test@example.com";
        String token = UUID.randomUUID().toString();
        
        // Create a test member
        Member member = new Member();
        member.setEmail(email);
        member = memberRepository.save(member);
        
        // Create an already used magic link
        MagicLink magicLink = new MagicLink();
        magicLink.setToken(token);
        magicLink.setEmail(email);
        magicLink.setExpiresAt(LocalDateTime.now().plusMinutes(15));
        magicLink.setUsed(true);
        magicLink.setUsedAt(LocalDateTime.now());
        magicLink.setUser(member);
        magicLinkRepository.save(magicLink);

        // When & Then
        mockMvc.perform(get("/api/v1/auth/verify")
                .param("token", token))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Invalid or expired magic link"));
    }
}
