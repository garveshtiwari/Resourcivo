package com.project.resourcivo.config;

import com.project.resourcivo.security.JwtAuthenticationFilter;
import com.project.resourcivo.security.CustomUserDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex
                        // No / expired / invalid token -> 401 with a JSON body (not an empty 403)
                        .authenticationEntryPoint((request, response, e) -> writeJson(response, 401,
                                "Authentication required or session expired"))
                        .accessDeniedHandler((request, response, e) -> writeJson(response, 403,
                                "You do not have permission to access this resource")))
                .authorizeHttpRequests(auth -> auth
                        // ---- Signed-in account endpoints (must come before the public /api/auth/** rule)
                        .requestMatchers("/api/auth/me", "/api/auth/change-password", "/api/auth/refresh")
                        .authenticated()
                        // ---- Public endpoints
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/public/**").permitAll()
                        .requestMatchers("/h2-console/**").permitAll()
                        .requestMatchers("/error").permitAll()
                        .requestMatchers("/actuator/health", "/actuator/health/**", "/actuator/info").permitAll()
                        .requestMatchers("/actuator/**").hasRole("ADMIN")
                        // Static resources
                        .requestMatchers("/", "/index.html", "/login.html", "/register.html", "/css/**", "/js/**",
                                "/images/**")
                        .permitAll()
                        // Swagger UI and API Docs
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html", "/api-docs/**")
                        .permitAll()

                        // ---- Admin only
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // ---- Profile pictures: any signed-in user (the controller limits changes to the owner)
                        .requestMatchers("/api/profile-photo/**").authenticated()

                        // ---- Notifications: any signed-in user, always scoped to their own
                        .requestMatchers("/api/notifications/**").authenticated()

                        // ---- Dashboard (the controller shapes the numbers by role)
                        .requestMatchers("/api/dashboard/**").authenticated()

                        // ---- Transport: bookings (ownership is checked again in the controller)
                        .requestMatchers(HttpMethod.GET, "/api/transport/bookings/me")
                        .hasAnyRole("STUDENT", "FACULTY")
                        .requestMatchers("/api/transport/booking/student/**").hasAnyRole("ADMIN", "STUDENT")
                        .requestMatchers("/api/transport/booking/faculty/**").hasAnyRole("ADMIN", "FACULTY")
                        .requestMatchers("/api/transport/bookings", "/api/transport/bookings/**")
                        .hasAnyRole("ADMIN", "TRANSPORT_MANAGER")
                        .requestMatchers(HttpMethod.GET, "/api/transport/*/bookings")
                        .hasAnyRole("ADMIN", "TRANSPORT_MANAGER")
                        // Transport: vehicles - anyone signed in can read, staff can change
                        .requestMatchers(HttpMethod.GET, "/api/transport", "/api/transport/available",
                                "/api/transport/*")
                        .authenticated()
                        .requestMatchers("/api/transport/**").hasAnyRole("ADMIN", "TRANSPORT_MANAGER")
                        .requestMatchers(HttpMethod.GET, "/api/transport-manager/me").hasRole("TRANSPORT_MANAGER")
                        .requestMatchers("/api/transport-manager/**").hasRole("ADMIN")

                        // ---- Library desk (librarian staff or admin)
                        .requestMatchers("/api/librarian/me").hasRole("LIBRARIAN")
                        .requestMatchers("/api/librarian/issue-request/**", "/api/librarian/issue-requests",
                                "/api/librarian/return-requests", "/api/librarian/issues",
                                "/api/librarian/overdue")
                        .hasAnyRole("ADMIN", "LIBRARIAN")
                        .requestMatchers("/api/librarian/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/library/librarians").hasAnyRole("ADMIN", "LIBRARIAN")
                        .requestMatchers(HttpMethod.GET, "/api/library/**")
                        .hasAnyRole("ADMIN", "FACULTY", "STUDENT", "LIBRARIAN")
                        .requestMatchers(HttpMethod.POST, "/api/library").hasAnyRole("ADMIN", "LIBRARIAN")
                        .requestMatchers(HttpMethod.PUT, "/api/library/*").hasAnyRole("ADMIN", "LIBRARIAN")
                        .requestMatchers("/api/library/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/library-book/*/history")
                        .hasAnyRole("ADMIN", "LIBRARIAN")
                        .requestMatchers(HttpMethod.GET, "/api/library-book", "/api/library-book/**")
                        .hasAnyRole("ADMIN", "FACULTY", "STUDENT", "LIBRARIAN")
                        .requestMatchers(HttpMethod.POST, "/api/library-book/search")
                        .hasAnyRole("ADMIN", "FACULTY", "STUDENT", "LIBRARIAN")
                        .requestMatchers("/api/library-book/**").hasAnyRole("ADMIN", "LIBRARIAN")

                        // ---- Inventory and labs: read for campus users, write for admin
                        .requestMatchers(HttpMethod.GET, "/api/inventory-item", "/api/inventory-item/**",
                                "/api/lab-equipment", "/api/lab-equipment/**")
                        .hasAnyRole("ADMIN", "FACULTY", "STUDENT")
                        .requestMatchers(HttpMethod.POST, "/api/inventory-item/search", "/api/lab-equipment/search")
                        .hasAnyRole("ADMIN", "FACULTY", "STUDENT")
                        .requestMatchers("/api/inventory-item/**", "/api/lab-equipment/**").hasRole("ADMIN")

                        // ---- Academic (Course, Subject, Classroom): read for campus users, write for admin
                        .requestMatchers(HttpMethod.GET, "/api/course/**", "/api/subject/**", "/api/classroom/**")
                        .hasAnyRole("ADMIN", "FACULTY", "STUDENT")
                        .requestMatchers(HttpMethod.POST, "/api/course/search", "/api/subject/search",
                                "/api/classroom/search")
                        .hasAnyRole("ADMIN", "FACULTY", "STUDENT")
                        .requestMatchers("/api/course/**", "/api/subject/**", "/api/classroom/**").hasRole("ADMIN")

                        // ---- Faculty: own record via /me, directory for admin + faculty
                        .requestMatchers("/api/faculty/me", "/api/faculty/me/**").hasRole("FACULTY")
                        .requestMatchers(HttpMethod.GET, "/api/faculty", "/api/faculty/**")
                        .hasAnyRole("ADMIN", "FACULTY")
                        .requestMatchers(HttpMethod.POST, "/api/faculty/search").hasAnyRole("ADMIN", "FACULTY")
                        .requestMatchers("/api/faculty/**").hasRole("ADMIN")

                        // ---- Students: own record via /me, library actions, directory reads, admin writes
                        .requestMatchers("/api/student/me", "/api/student/me/**").hasRole("STUDENT")
                        .requestMatchers("/api/student/issue-request", "/api/student/issue-request/**",
                                "/api/student/*/issued-books", "/api/student/*/issue-history",
                                "/api/student/*/emergency-contact", "/api/student/*/emergency-contacts",
                                "/api/student/*/emergency-contacts/*")
                        .hasAnyRole("ADMIN", "STUDENT")
                        .requestMatchers(HttpMethod.GET, "/api/student", "/api/student/*")
                        .hasAnyRole("ADMIN", "FACULTY", "STUDENT")
                        .requestMatchers(HttpMethod.POST, "/api/student/search")
                        .hasAnyRole("ADMIN", "FACULTY", "STUDENT")
                        .requestMatchers("/api/student/**").hasRole("ADMIN")

                        // ---- Raw contact / address / emergency-contact records: staff read, admin write
                        .requestMatchers(HttpMethod.GET, "/api/contact/**", "/api/address/**")
                        .hasAnyRole("ADMIN", "FACULTY")
                        .requestMatchers(HttpMethod.POST, "/api/contact/search", "/api/address/search")
                        .hasAnyRole("ADMIN", "FACULTY")
                        .requestMatchers("/api/contact/**", "/api/address/**", "/api/emergencycontact/**")
                        .hasRole("ADMIN")

                        // All other endpoints require authentication
                        .anyRequest().authenticated())
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        // For H2 Console
        http.headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()));

        return http.build();
    }

    private static void writeJson(HttpServletResponse response, int status, String message)
            throws java.io.IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("{\"status\":" + status + ",\"message\":\"" + message + "\",\"timestamp\":\""
                + java.time.LocalDateTime.now() + "\"}");
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003", "http://localhost:5173"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
