package com.project.resourcivo.service;

import com.project.resourcivo.dto.StaffCreateRequest;
import com.project.resourcivo.dto.StaffCreateResponse;
import com.project.resourcivo.dto.UserSummaryDTO;
import com.project.resourcivo.exception.ResourceNotFoundException;
import com.project.resourcivo.model.Librarian;
import com.project.resourcivo.model.Role;
import com.project.resourcivo.model.TransportManager;
import com.project.resourcivo.model.User;
import com.project.resourcivo.repository.LibrarianRepository;
import com.project.resourcivo.repository.LibraryRepository;
import com.project.resourcivo.repository.RoleRepository;
import com.project.resourcivo.repository.TransportManagerRepository;
import com.project.resourcivo.repository.UserRepository;
import com.project.resourcivo.security.CurrentUser;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Admin-only account management: creating librarian / transport-manager logins
 * together with their staff records, and managing existing accounts.
 */
@Service
public class StaffService {

    // No look-alike characters (0/O, 1/l/I) so the password is easy to read out
    private static final String PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final LibrarianRepository librarianRepository;
    private final TransportManagerRepository transportManagerRepository;
    private final LibraryRepository libraryRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final CurrentUser currentUser;
    private final NotificationService notifications;

    public StaffService(UserRepository userRepository, RoleRepository roleRepository,
            LibrarianRepository librarianRepository, TransportManagerRepository transportManagerRepository,
            LibraryRepository libraryRepository, PasswordEncoder passwordEncoder, EmailService emailService,
            CurrentUser currentUser, NotificationService notifications) {
        this.notifications = notifications;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.librarianRepository = librarianRepository;
        this.transportManagerRepository = transportManagerRepository;
        this.libraryRepository = libraryRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.currentUser = currentUser;
    }

    @Transactional
    public StaffCreateResponse createStaff(StaffCreateRequest req) {
        Role.RoleName roleName = "LIBRARIAN".equals(req.getRole())
                ? Role.RoleName.ROLE_LIBRARIAN
                : Role.RoleName.ROLE_TRANSPORT_MANAGER;

        String email = req.getEmail().trim();
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email is already registered");
        }
        String username = resolveUsername(req.getUsername(), email);

        String temporaryPassword = generatePassword(12);
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + roleName));

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setFirstName(req.getFirstName().trim());
        user.setLastName(req.getLastName().trim());
        user.setPassword(passwordEncoder.encode(temporaryPassword));
        user.setEnabled(true); // an admin vouches for the address, so no email verification step
        user.setMustChangePassword(true);
        user.getRoles().add(role);
        User savedUser = userRepository.save(user);

        Long staffId;
        if (roleName == Role.RoleName.ROLE_LIBRARIAN) {
            Librarian librarian = new Librarian();
            librarian.setFirstName(savedUser.getFirstName());
            librarian.setLastName(savedUser.getLastName());
            librarian.setEmail(email);
            librarian.setPhoneNumber(req.getPhoneNumber());
            librarian.setJoiningDate(req.getJoiningDate());
            librarian.setUserId(savedUser.getId());
            if (req.getLibraryId() != null) {
                librarian.setLibrary(libraryRepository.findById(req.getLibraryId())
                        .orElseThrow(() -> new IllegalArgumentException("Library not found")));
            }
            staffId = librarianRepository.save(librarian).getId();
        } else {
            TransportManager manager = new TransportManager();
            manager.setFirstName(savedUser.getFirstName());
            manager.setLastName(savedUser.getLastName());
            manager.setEmail(email);
            manager.setPhoneNumber(req.getPhoneNumber());
            manager.setJoiningDate(req.getJoiningDate());
            manager.setUserId(savedUser.getId());
            staffId = transportManagerRepository.save(manager).getId();
        }

        notifications.notify(savedUser.getId(), NotificationService.ACCOUNT, NotificationService.SUCCESS,
                "Welcome to Resourcivo",
                "Your " + (roleName == Role.RoleName.ROLE_LIBRARIAN ? "librarian" : "transport manager")
                        + " account is ready. Please complete your profile.",
                "/profile");

        boolean emailSent = emailService.sendStaffWelcomeEmail(email, username, temporaryPassword);

        StaffCreateResponse res = new StaffCreateResponse();
        res.setUserId(savedUser.getId());
        res.setUsername(username);
        res.setEmail(email);
        res.setRole(req.getRole());
        res.setStaffId(staffId);
        res.setTemporaryPassword(temporaryPassword); // shown once; only the hash is stored
        res.setEmailSent(emailSent);
        res.setMessage(emailSent
                ? "Account created. The temporary password was also emailed to " + email + "."
                : "Account created. The email could not be sent, so give the temporary password to the user directly.");
        return res;
    }

    public List<UserSummaryDTO> listUsers() {
        return userRepository.findAll().stream().map(this::toSummary).collect(Collectors.toList());
    }

    @Transactional
    public UserSummaryDTO setEnabled(Long userId, boolean enabled) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (!enabled && user.getId().equals(currentUser.require().getId())) {
            throw new IllegalArgumentException("You cannot disable your own account");
        }
        user.setEnabled(enabled);
        return toSummary(userRepository.save(user));
    }

    @Transactional
    public UserSummaryDTO setRoles(Long userId, List<String> roleNames) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getId().equals(currentUser.require().getId())) {
            throw new IllegalArgumentException("You cannot change your own roles");
        }
        Set<Role> roles = new HashSet<>();
        for (String name : roleNames) {
            Role.RoleName rn;
            try {
                rn = Role.RoleName.valueOf(name.toUpperCase(Locale.ROOT).startsWith("ROLE_")
                        ? name.toUpperCase(Locale.ROOT)
                        : "ROLE_" + name.toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException("Unknown role: " + name);
            }
            roles.add(roleRepository.findByName(rn)
                    .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + rn)));
        }
        user.setRoles(roles);
        UserSummaryDTO summary = toSummary(userRepository.save(user));
        notifications.notify(userId, NotificationService.ACCOUNT, NotificationService.WARNING, "Your access changed",
                "An administrator updated your roles. Sign out and back in to see your new access.", "/profile");
        return summary;
    }

    private UserSummaryDTO toSummary(User u) {
        UserSummaryDTO dto = new UserSummaryDTO();
        dto.setId(u.getId());
        dto.setUsername(u.getUsername());
        dto.setEmail(u.getEmail());
        dto.setFirstName(u.getFirstName());
        dto.setLastName(u.getLastName());
        dto.setEnabled(u.isEnabled());
        dto.setMustChangePassword(u.isMustChangePassword());
        dto.setRoles(u.getRoles().stream().map(r -> r.getName().name()).sorted().collect(Collectors.toList()));
        dto.setCreatedAt(u.getCreatedAt());
        return dto;
    }

    private String resolveUsername(String requested, String email) {
        if (requested != null && !requested.isBlank()) {
            String name = requested.trim();
            if (name.length() < 3) {
                throw new IllegalArgumentException("Username must be at least 3 characters");
            }
            if (userRepository.existsByUsername(name)) {
                throw new IllegalArgumentException("Username is already taken");
            }
            return name;
        }
        // derive from the email's local part and make it unique
        String base = email.substring(0, email.indexOf('@')).replaceAll("[^A-Za-z0-9._-]", "");
        if (base.length() < 3) {
            base = base + "user";
        }
        String candidate = base;
        int n = 1;
        while (userRepository.existsByUsername(candidate)) {
            candidate = base + (++n);
        }
        return candidate;
    }

    private String generatePassword(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(PASSWORD_CHARS.charAt(RANDOM.nextInt(PASSWORD_CHARS.length())));
        }
        return sb.toString();
    }
}
