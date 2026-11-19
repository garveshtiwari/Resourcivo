package com.project.resourcivo.security;

import com.project.resourcivo.exception.ResourceNotFoundException;
import com.project.resourcivo.model.User;
import com.project.resourcivo.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Resolves the logged-in account and answers ownership questions, so controllers
 * never trust an id that came from the URL or request body.
 */
@Component
public class CurrentUser {

    private final UserRepository userRepository;

    public CurrentUser(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User require() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new AccessDeniedException("Authentication required");
        }
        return userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    public boolean hasRole(String roleName) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().stream().anyMatch(a -> roleName.equals(a.getAuthority()));
    }

    public boolean isAdmin() {
        return hasRole("ROLE_ADMIN");
    }

    /** Allows admins, or the account whose id is {@code userId}. */
    public void requireSelfOrAdmin(Long userId) {
        if (isAdmin()) {
            return;
        }
        User me = require();
        if (userId == null || !userId.equals(me.getId())) {
            throw new AccessDeniedException("You can only access your own records");
        }
    }
}
