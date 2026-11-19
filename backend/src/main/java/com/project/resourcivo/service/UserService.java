package com.project.resourcivo.service;

import com.project.resourcivo.dto.*;
import com.project.resourcivo.exception.ResourceNotFoundException;
import com.project.resourcivo.model.*;
import com.project.resourcivo.repository.*;
import com.project.resourcivo.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private VerificationTokenRepository verificationTokenRepository;

    // Optional so the service still works when constructed without the notification layer (unit tests)
    @Autowired(required = false)
    private NotificationService notificationService;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private EmailService emailService;

    /**
     * Register new user
     */
    @Transactional
    public String registerUser(RegisterRequest request) {
        // Check if username exists
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username is already taken");
        }

        // Check if email exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already registered");
        }

        // Create new user
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());
        user.setEnabled(false); // Will be enabled after email verification

        // Assign role
        Role.RoleName roleName;
        switch (request.getRole().toUpperCase()) {
            // ADMIN, LIBRARIAN and TRANSPORT_MANAGER accounts are created by an admin only
            case "FACULTY":
                roleName = Role.RoleName.ROLE_FACULTY;
                break;
            case "STUDENT":
                roleName = Role.RoleName.ROLE_STUDENT;
                break;
            default:
                throw new IllegalArgumentException("Invalid role: " + request.getRole());
        }

        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + roleName));

        user.getRoles().add(role);

        // Save user
        User savedUser = userRepository.save(user);

        // Create verification token
        String token = UUID.randomUUID().toString();
        VerificationToken verificationToken = new VerificationToken(token, savedUser);
        verificationTokenRepository.save(verificationToken);

        // Send verification email
        emailService.sendVerificationEmail(savedUser.getEmail(), token);

        return "User registered successfully. Please check your email to verify your account.";
    }

    /**
     * Login user
     */
    public AuthResponse loginUser(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);

        String jwt = tokenProvider.generateToken(authentication);

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!user.isEnabled()) {
            throw new IllegalArgumentException("Please verify your email before logging in");
        }

        return buildAuthResponse(user, jwt);
    }

    /**
     * Build the login/refresh payload for a user.
     */
    public AuthResponse buildAuthResponse(User user, String jwt) {
        List<String> roles = user.getRoles().stream()
                .map(role -> role.getName().name())
                .collect(Collectors.toList());

        return new AuthResponse(jwt, user.getId(), user.getUsername(), user.getEmail(), roles,
                user.getFirstName(), user.getLastName(), user.isMustChangePassword());
    }

    /**
     * Issue a fresh token for the currently authenticated user.
     */
    public AuthResponse refreshToken() {
        User user = getCurrentUser();
        return buildAuthResponse(user, tokenProvider.generateTokenFromUsername(user.getUsername()));
    }

    /**
     * Change password while signed in (also clears the "temporary password" flag).
     */
    @Transactional
    public String changePassword(ChangePasswordRequest request) {
        User user = getCurrentUser();
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new IllegalArgumentException("New password must be different from the current one");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setMustChangePassword(false);
        userRepository.save(user);
        if (notificationService != null) {
            notificationService.notify(user.getId(), NotificationService.ACCOUNT, NotificationService.INFO,
                    "Password changed", "Your password was changed. If this wasn't you, reset it right away.",
                    "/profile");
        }
        return "Password changed successfully.";
    }

    /**
     * Send a new verification link (the generic reply avoids revealing which emails exist).
     */
    @Transactional
    public String resendVerification(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            if (user.isEnabled()) {
                return;
            }
            verificationTokenRepository.findByUser(user).ifPresent(verificationTokenRepository::delete);
            verificationTokenRepository.flush();
            String token = UUID.randomUUID().toString();
            verificationTokenRepository.save(new VerificationToken(token, user));
            emailService.sendVerificationEmail(user.getEmail(), token);
        });
        return "If that email belongs to an unverified account, a new verification link has been sent.";
    }

    /**
     * Verify email
     */
    @Transactional
    public String verifyEmail(String token) {
        logger.info(">>> Verifying email with token: {}", token);
        VerificationToken verificationToken = verificationTokenRepository.findByToken(token)
                .orElseThrow(() -> {
                    logger.error(">>> Invalid verification token: {}", token);
                    return new ResourceNotFoundException("Invalid verification token");
                });

        User user = verificationToken.getUser();

        // Opening the link twice (a repeat click, or a mail scanner that opened it first) must not look like a failure
        if (user.isEnabled()) {
            return "Email already verified. You can now login.";
        }

        if (verificationToken.isExpired()) {
            logger.error(">>> Verification token expired: {}", token);
            throw new IllegalArgumentException("Verification token has expired. Request a new link.");
        }

        logger.info(">>> Enabling user: {}", user.getUsername());
        user.setEnabled(true);
        userRepository.save(user);

        if (notificationService != null) {
            notificationService.notify(user.getId(), NotificationService.ACCOUNT, NotificationService.SUCCESS,
                    "Welcome to Resourcivo", "Your email is verified and your account is ready to use.", "/profile");
            String who = ((user.getFirstName() == null ? "" : user.getFirstName()) + " "
                    + (user.getLastName() == null ? "" : user.getLastName())).trim();
            notificationService.notifyRole(Role.RoleName.ROLE_ADMIN, NotificationService.ACCOUNT,
                    NotificationService.INFO, "New user joined",
                    (who.isEmpty() ? user.getUsername() : who) + " (" + user.getUsername()
                            + ") verified their account.", "/admin");
        }

        // The token is kept until it expires so the same link keeps answering "verified"; old ones are swept here
        verificationTokenRepository.deleteByExpiryDateBefore(java.time.LocalDateTime.now());
        logger.info(">>> Email verified successfully for user: {}", user.getUsername());

        return "Email verified successfully. You can now login.";
    }


    /**
     * Request password reset
     */
    @Transactional
    public String forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + request.getEmail()));

        // Delete any existing reset tokens for this user
        passwordResetTokenRepository.findByUser(user).ifPresent(passwordResetTokenRepository::delete);

        // Create new reset token
        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = new PasswordResetToken(token, user);
        passwordResetTokenRepository.save(resetToken);

        // Send reset email
        emailService.sendPasswordResetEmail(user.getEmail(), token);

        return "Password reset email sent. Please check your email.";
    }

    /**
     * Reset password
     */
    @Transactional
    public String resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new ResourceNotFoundException("Invalid password reset token"));

        if (resetToken.isExpired()) {
            throw new IllegalArgumentException("Password reset token has expired");
        }

        if (resetToken.isUsed()) {
            throw new IllegalArgumentException("Password reset token has already been used");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        if (notificationService != null) {
            notificationService.notify(user.getId(), NotificationService.ACCOUNT, NotificationService.INFO,
                    "Password reset", "Your password was reset. If this wasn't you, contact an administrator.",
                    "/profile");
        }

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        return "Password reset successfully. You can now login with your new password.";
    }

    /**
     * Get current user
     */
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
