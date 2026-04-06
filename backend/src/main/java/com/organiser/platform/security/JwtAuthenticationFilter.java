package com.organiser.platform.security;

import com.organiser.platform.model.Member;
import com.organiser.platform.repository.MemberRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    private final JwtUtil jwtUtil;
    private final MemberRepository memberRepository;
    
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String email;
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }
        
        try {
            jwt = authHeader.substring(7);
            email = jwtUtil.extractUsername(jwt); // Extract email from token
            
            if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                // Extract userId and role from JWT token
                Long userId = jwtUtil.extractClaim(jwt, claims -> claims.get("userId", Long.class));
                String role = jwtUtil.extractClaim(jwt, claims -> claims.get("role", String.class));
                
                // Load member by email
                Member member = memberRepository.findByEmail(email).orElse(null);
                
                if (member != null && member.getActive()) {
                    // Use role from JWT token, default to MEMBER if not present
                    String authority = "ROLE_" + (role != null ? role : "MEMBER");
                    
                    // Create simple UserDetails-like object
                    org.springframework.security.core.userdetails.User userDetails = 
                        new org.springframework.security.core.userdetails.User(
                            member.getEmail(),
                            "",  // No password needed
                            Collections.singletonList(new SimpleGrantedAuthority(authority))
                        );
                    
                    if (jwtUtil.validateToken(jwt, userDetails)) {
                        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );
                        // Store userId in the details so controllers can access it
                        authToken.setDetails(userId != null ? userId : member.getId());
                        SecurityContextHolder.getContext().setAuthentication(authToken);
                    }
                }
            }
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            // Token expired — return 401 so the frontend can trigger token refresh
            System.err.println("JWT token expired: " + e.getMessage());
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Token expired\",\"message\":\"JWT token has expired\"}");
            return; // Don't continue filter chain
        } catch (Exception e) {
            // Other JWT errors (malformed, invalid signature, etc.) - continue to let Spring Security handle
            System.err.println("JWT token validation failed: " + e.getMessage());
        }
        
        filterChain.doFilter(request, response);
    }
}
