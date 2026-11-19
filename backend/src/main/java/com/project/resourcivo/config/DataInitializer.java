package com.project.resourcivo.config;

import com.project.resourcivo.model.Role;
import com.project.resourcivo.model.User;
import com.project.resourcivo.repository.RoleRepository;
import com.project.resourcivo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashSet;
import java.util.Set;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Autowired
    private com.project.resourcivo.service.ITransportBookingService transportBookingService;

    @org.springframework.beans.factory.annotation.Value("${app.admin.default-password:password}")
    private String defaultAdminPassword;

    @org.springframework.beans.factory.annotation.Value("${app.admin.reset-password-on-startup:false}")
    private boolean resetAdminPassword;

    @Override
    public void run(String... args) throws Exception {
        try {
            // Bookings left active on vehicles that were already deactivated are cancelled (users are notified).
            int cleaned = transportBookingService.sweepBookingsOnInactiveTransports();
            if (cleaned > 0) {
                logger.info("Cancelled {} stale transport booking(s) on inactive vehicles", cleaned);
            }
        } catch (Exception e) {
            logger.warn("Stale transport booking cleanup skipped: {}", e.getMessage());
        }

        try {
            jdbcTemplate.execute("ALTER TABLE roles MODIFY name VARCHAR(64)");
        } catch (Exception e) {
            /* Ignore */ }

        try {
            // The picture column was first created as TINYBLOB (255 bytes). Widen it; harmless if already wide.
            jdbcTemplate.execute("ALTER TABLE user_photos MODIFY COLUMN `data` MEDIUMBLOB NOT NULL");
        } catch (Exception e) {
            /* table not created yet, or not MySQL */ }

        try {
            jdbcTemplate.execute("ALTER TABLE transport MODIFY seating_capacity INT NULL");
        } catch (Exception e) {
            /* Ignore */ }

        try {
            jdbcTemplate.execute("ALTER TABLE transport MODIFY vehicle_number VARCHAR(255) NULL");
        } catch (Exception e) {
            /* Ignore */ }

        try {
            jdbcTemplate.execute("ALTER TABLE transport MODIFY manufacturer VARCHAR(255) NULL");
        } catch (Exception e) {
            /* Ignore */ }

        // Initialize roles if they don't exist
        if (roleRepository.count() == 0) {
            Role adminRole = new Role(Role.RoleName.ROLE_ADMIN);
            Role facultyRole = new Role(Role.RoleName.ROLE_FACULTY);
            Role studentRole = new Role(Role.RoleName.ROLE_STUDENT);
            Role transportManagerRole = new Role(Role.RoleName.ROLE_TRANSPORT_MANAGER);

            roleRepository.save(adminRole);
            roleRepository.save(facultyRole);
            roleRepository.save(studentRole);
            roleRepository.save(transportManagerRole);

            logger.info("✅ Default roles created: ADMIN, FACULTY, STUDENT, TRANSPORT_MANAGER");
        } else {
            // Check if TRANSPORT_MANAGER exists, if not create it (migration logic
            // equivalent)
            if (roleRepository.findByName(Role.RoleName.ROLE_TRANSPORT_MANAGER).isEmpty()) {
                roleRepository.save(new Role(Role.RoleName.ROLE_TRANSPORT_MANAGER));
                logger.info("✅ Added missing role: TRANSPORT_MANAGER");
            }
            logger.info("✅ Roles already exist in database");
        }

        // Make sure every role exists (covers databases created before a role was added, e.g. LIBRARIAN)
        for (Role.RoleName roleName : Role.RoleName.values()) {
            if (roleRepository.findByName(roleName).isEmpty()) {
                roleRepository.save(new Role(roleName));
                logger.info("✅ Added missing role: " + roleName);
            }
        }

        // Initialize default user if it doesn't exist
        if (!userRepository.existsByUsername("username")) {
            User user = new User();
            user.setUsername("username");
            user.setEmail("username@example.com");
            user.setPassword(passwordEncoder.encode(defaultAdminPassword));
            user.setEnabled(true);
            user.setAccountNonExpired(true);
            user.setAccountNonLocked(true);
            user.setCredentialsNonExpired(true);

            Set<Role> roles = new HashSet<>();
            Role adminRole = roleRepository.findByName(Role.RoleName.ROLE_ADMIN)
                    .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
            roles.add(adminRole);
            user.setRoles(roles);

            userRepository.save(user);
            logger.info("✅ Default admin created (username: username). Change its password after first login.");
        } else {
            User user = userRepository.findByUsername("username").orElse(null);
            if (user != null) {
                // Only reset the admin password on startup when explicitly asked to
                // (app.admin.reset-password-on-startup=true), e.g. to recover a lost password.
                if (resetAdminPassword) {
                    user.setPassword(passwordEncoder.encode(defaultAdminPassword));
                }
                // Ensure enabled
                user.setEnabled(true);
                // Force Ensure Admin Role
                 Role adminRole = roleRepository.findByName(Role.RoleName.ROLE_ADMIN)
                    .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
                if (user.getRoles() == null) {
                    user.setRoles(new HashSet<>());
                }
                user.getRoles().add(adminRole);
                
                userRepository.save(user);
                
                // Force insert role via SQL to bypass Hibernate cache issues
                try {
                    Integer count = jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM user_roles WHERE user_id = ? AND role_id = ?",
                        Integer.class, user.getId(), adminRole.getId());
                    
                    if (count != null && count == 0) {
                        jdbcTemplate.update("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)",
                             user.getId(), adminRole.getId());
                        logger.info("✅ Forced ROLE_ADMIN insertion via SQL");
                    }
                } catch (Exception e) {
                    logger.warn("SQL Role Insertion check failed: " + e.getMessage());
                }

                if (resetAdminPassword) {
                    logger.warn("Default admin password was reset because app.admin.reset-password-on-startup=true");
                }
            }
        }
    }
}
