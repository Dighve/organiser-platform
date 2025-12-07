package com.organiser.platform.config;

import com.organiser.platform.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
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
    
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints - no authentication required
                        .requestMatchers(
                                new AntPathRequestMatcher("/api/v1/auth/**"),
                                new AntPathRequestMatcher("/api/v1/events/**"),
                                new AntPathRequestMatcher("/api/v1/files/**"),
                                new AntPathRequestMatcher("/api/v1/events/*/comments", "GET"),
                                new AntPathRequestMatcher("/api/v1/activities/**"),
                                new AntPathRequestMatcher("/api/v1/groups/public"),
                                new AntPathRequestMatcher("/api/v1/groups/*"),
                                new AntPathRequestMatcher("/api/v1/groups/*/members", "GET"),
                                new AntPathRequestMatcher("/api/v1/groups/*/subscribe"),
                                new AntPathRequestMatcher("/actuator/**"),
                                new AntPathRequestMatcher("/api/v1/actuator/**"),
                                new AntPathRequestMatcher("/swagger-ui/**"),
                                new AntPathRequestMatcher("/v3/api-docs/**"),
                                new AntPathRequestMatcher("/h2-console/**"),
                                new AntPathRequestMatcher("/api/v1/files/**")
                        ).permitAll()
                        // Admin endpoints
                        .requestMatchers(new AntPathRequestMatcher("/api/v1/admin/**")).hasRole("ADMIN")
                        // Organiser endpoints
                        .requestMatchers(new AntPathRequestMatcher("/api/v1/organiser/**")).hasAnyRole("ORGANISER", "ADMIN")
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
        configuration.setAllowedOrigins(Arrays.asList(
                "http://localhost:3000",
                "http://localhost:3002",
                "http://localhost:3003",
                "http://127.0.0.1:3002",
                "http://localhost:5173",
                "http://192.168.0.114:3000",
                "https://organiser-platform.netlify.app",
                "https://hikehub-poc.netlify.app",
                "https://www.outmeets.com/"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setExposedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        
        // Log CORS configuration for debugging
        System.out.println("CORS Configuration:");
        System.out.println("Allowed Origins: " + configuration.getAllowedOrigins());
        System.out.println("Allowed Methods: " + configuration.getAllowedMethods());
        System.out.println("Allowed Headers: " + configuration.getAllowedHeaders());
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
