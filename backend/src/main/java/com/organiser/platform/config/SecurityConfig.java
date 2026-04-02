package com.organiser.platform.config;

import com.organiser.platform.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    
    private final JwtAuthenticationFilter jwtAuthFilter;
    
    @Value("${cors.allowed-origins}")
    private String allowedOrigins;
    
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth -> auth
                        // Authentication endpoints - public
                        .requestMatchers(
                                new AntPathRequestMatcher("/api/v1/auth/magic-link", "POST"),
                                new AntPathRequestMatcher("/api/v1/auth/passcode", "POST"),
                                new AntPathRequestMatcher("/api/v1/auth/verify", "GET"),
                                new AntPathRequestMatcher("/api/v1/auth/passcode/verify", "POST"),
                                new AntPathRequestMatcher("/api/v1/auth/google", "POST")
                        ).permitAll()
                        
                        // Public READ-ONLY endpoints for events
                        .requestMatchers(
                                new AntPathRequestMatcher("/api/v1/events/public", "GET"),
                                new AntPathRequestMatcher("/api/v1/events/public/*", "GET"),
                                new AntPathRequestMatcher("/api/v1/events/public/search", "GET"),
                                new AntPathRequestMatcher("/api/v1/events/public/activity/*", "GET"),
                                new AntPathRequestMatcher("/api/v1/events/public/group/*", "GET"),
                                new AntPathRequestMatcher("/api/v1/events/public/*/participants", "GET"),
                                new AntPathRequestMatcher("/api/v1/events/public/*/calendar", "GET")
                        ).permitAll()
                        
                        // Public READ-ONLY endpoints for groups
                        .requestMatchers(
                                new AntPathRequestMatcher("/api/v1/groups/public", "GET"),
                                new AntPathRequestMatcher("/api/v1/groups/*", "GET"),
                                new AntPathRequestMatcher("/api/v1/groups/*/members", "GET")
                        ).permitAll()
                        
                        // Public READ-ONLY endpoints for members
                        .requestMatchers(
                                new AntPathRequestMatcher("/api/v1/members/*", "GET")
                        ).permitAll()
                        
                        // Public READ-ONLY endpoints for activities
                        .requestMatchers(
                                new AntPathRequestMatcher("/api/v1/activities", "GET"),
                                new AntPathRequestMatcher("/api/v1/activities/*", "GET")
                        ).permitAll()
                        
                        // Public READ-ONLY endpoint for feature flags map
                        .requestMatchers(
                                new AntPathRequestMatcher("/api/v1/admin/feature-flags/map", "GET")
                        ).permitAll()
                        
                        // Public READ-ONLY endpoints for agreement texts (users need to read before authentication)
                        .requestMatchers(
                                new AntPathRequestMatcher("/api/v1/agreements/user/current", "GET"),
                                new AntPathRequestMatcher("/api/v1/agreements/organiser/current", "GET"),
                                new AntPathRequestMatcher("/api/v1/agreements/verify-hash", "POST")
                        ).permitAll()

                        // Public invite validation endpoint (for landing page)
                        .requestMatchers(
                                new AntPathRequestMatcher("/api/v1/admin/invites/validate/*", "GET")
                        ).permitAll()

                        // Public VAPID key endpoint
                        .requestMatchers(
                                new AntPathRequestMatcher("/api/v1/push/vapid-public-key", "GET")
                        ).permitAll()
                        
                        // Event write operations - require authentication
                        .requestMatchers(
                                new AntPathRequestMatcher("/api/v1/events", "POST"),
                                new AntPathRequestMatcher("/api/v1/events/*", "PUT"),
                                new AntPathRequestMatcher("/api/v1/events/*", "DELETE"),
                                new AntPathRequestMatcher("/api/v1/events/*/join", "POST"),
                                new AntPathRequestMatcher("/api/v1/events/*/leave", "POST"),
                                new AntPathRequestMatcher("/api/v1/events/*/participants", "GET"),
                                new AntPathRequestMatcher("/api/v1/events/*/comments", "GET"),
                                new AntPathRequestMatcher("/api/v1/events/*/comments", "POST"),
                                new AntPathRequestMatcher("/api/v1/events/comments/*", "PUT"),
                                new AntPathRequestMatcher("/api/v1/events/comments/*", "DELETE"),
                                new AntPathRequestMatcher("/api/v1/events/comments/*/replies", "POST"),
                                new AntPathRequestMatcher("/api/v1/events/replies/*", "PUT"),
                                new AntPathRequestMatcher("/api/v1/events/replies/*", "DELETE")
                        ).authenticated()
                        
                        // Group write operations - require authentication
                        .requestMatchers(
                                new AntPathRequestMatcher("/api/v1/groups", "POST"),
                                new AntPathRequestMatcher("/api/v1/groups/*", "PUT"),
                                new AntPathRequestMatcher("/api/v1/groups/*", "DELETE"),
                                new AntPathRequestMatcher("/api/v1/groups/*/subscribe", "POST"),
                                new AntPathRequestMatcher("/api/v1/groups/*/unsubscribe", "POST")
                        ).authenticated()
                        
                        // File upload - require authentication
                        .requestMatchers(
                                new AntPathRequestMatcher("/api/v1/files/upload/*", "POST"),
                                new AntPathRequestMatcher("/api/v1/files/delete", "DELETE")
                        ).authenticated()
                        
                        // Member endpoints - require authentication
                        .requestMatchers(
                                new AntPathRequestMatcher("/api/v1/members/me", "GET"),
                                new AntPathRequestMatcher("/api/v1/members/me", "PUT"),
                                new AntPathRequestMatcher("/api/v1/members/me/events", "GET"),
                                new AntPathRequestMatcher("/api/v1/members/me/groups", "GET")
                        ).authenticated()
                        
                        // Admin check endpoint - authenticated users can check their status
                        .requestMatchers(new AntPathRequestMatcher("/api/v1/admin/check", "GET")).authenticated()
                        
                        // Other admin endpoints - require ADMIN role
                        .requestMatchers(new AntPathRequestMatcher("/api/v1/admin/**"),
                                         new AntPathRequestMatcher("/api/v1/admin/agreements", "PUT"),
                                         new AntPathRequestMatcher("/api/v1/admin/feature-flags/*", "PUT")
                                        ).hasRole("ADMIN")
                        
                        // Organiser endpoints
                        .requestMatchers(new AntPathRequestMatcher("/api/v1/organiser/**")).hasAnyRole("ORGANISER", "ADMIN")
                        
                        // Actuator health check endpoints (required for Render deployment)
                        .requestMatchers(
                                new AntPathRequestMatcher("/api/v1/actuator/health", "GET"),
                                new AntPathRequestMatcher("/api/v1/actuator/health/**", "GET"),
                                new AntPathRequestMatcher("/api/v1/actuator/info", "GET")
                        ).permitAll()
                        
                        // All other requests require authentication
                        .anyRequest().authenticated()
                )
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Parse comma-separated origins from properties
        List<String> origins = Arrays.asList(allowedOrigins.split(","));
        configuration.setAllowedOrigins(origins);
        
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList(
                "Authorization",
                "Content-Type",
                "Accept",
                "Origin",
                "X-Requested-With"
        ));
        configuration.setExposedHeaders(Arrays.asList(
                "Authorization",
                "Content-Type"
        ));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
