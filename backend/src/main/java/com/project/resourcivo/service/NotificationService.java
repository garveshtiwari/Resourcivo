package com.project.resourcivo.service;

import com.project.resourcivo.dto.NotificationDTO;
import com.project.resourcivo.model.Notification;
import com.project.resourcivo.model.Role;
import com.project.resourcivo.repository.NotificationRepository;
import com.project.resourcivo.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Creates and serves in-app notifications. The "send" methods never throw: a problem with a
 * notification must not undo the booking / approval / update that caused it.
 */
@Service
public class NotificationService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);

    // type
    public static final String TRANSPORT = "TRANSPORT";
    public static final String LIBRARY = "LIBRARY";
    public static final String ACCOUNT = "ACCOUNT";
    public static final String SYSTEM = "SYSTEM";

    // level
    public static final String INFO = "INFO";
    public static final String SUCCESS = "SUCCESS";
    public static final String WARNING = "WARNING";
    public static final String ALERT = "ALERT";

    private final NotificationRepository repository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository repository, UserRepository userRepository) {
        this.repository = repository;
        this.userRepository = userRepository;
    }

    // ------------------------------------------------------------------ sending

    public void notify(Long userId, String type, String level, String title, String message, String link) {
        save(userId, type, level, title, message, link, null);
    }

    /** Sends at most one notification per (user, dedupeKey), e.g. a daily overdue reminder. */
    public void notifyOnce(Long userId, String type, String level, String title, String message, String link,
            String dedupeKey) {
        try {
            if (userId == null || repository.existsByUserIdAndDedupeKey(userId, dedupeKey)) {
                return;
            }
        } catch (Exception e) {
            logger.warn("Notification de-dupe check failed: {}", e.getMessage());
            return;
        }
        save(userId, type, level, title, message, link, dedupeKey);
    }

    public void notifyAll(Collection<Long> userIds, String type, String level, String title, String message,
            String link) {
        if (userIds == null) {
            return;
        }
        for (Long id : new LinkedHashSet<>(userIds)) {
            notify(id, type, level, title, message, link);
        }
    }

    public void notifyRole(Role.RoleName role, String type, String level, String title, String message,
            String link) {
        notifyAll(userIdsWithRole(role), type, level, title, message, link);
    }

    public List<Long> userIdsWithRole(Role.RoleName role) {
        try {
            return userRepository.findEnabledIdsByRole(role);
        } catch (Exception e) {
            logger.warn("Could not look up users with role {}: {}", role, e.getMessage());
            return List.of();
        }
    }

    private void save(Long userId, String type, String level, String title, String message, String link,
            String dedupeKey) {
        if (userId == null) {
            return;
        }
        try {
            Notification n = new Notification();
            n.setUserId(userId);
            n.setType(type);
            n.setLevel(level == null ? INFO : level);
            n.setTitle(clip(title, 150));
            n.setMessage(clip(message, 1000));
            n.setLink(clip(link, 200));
            n.setDedupeKey(clip(dedupeKey, 120));
            repository.save(n);
        } catch (Exception e) {
            logger.warn("Could not save notification for user {}: {}", userId, e.getMessage());
        }
    }

    private static String clip(String s, int max) {
        if (s == null) {
            return null;
        }
        return s.length() <= max ? s : s.substring(0, max - 1) + "…";
    }

    // ------------------------------------------------------------------ reading (always scoped to one user)

    @Transactional(readOnly = true)
    public List<NotificationDTO> list(Long userId, boolean unreadOnly) {
        List<Notification> rows = unreadOnly
                ? repository.findTop50ByUserIdAndSeenFalseOrderByCreatedAtDescIdDesc(userId)
                : repository.findTop50ByUserIdOrderByCreatedAtDescIdDesc(userId);
        return rows.stream().map(NotificationDTO::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long unreadCount(Long userId) {
        return repository.countByUserIdAndSeenFalse(userId);
    }

    @Transactional
    public boolean markRead(Long userId, Long id) {
        return repository.findByIdAndUserId(id, userId).map(n -> {
            n.setSeen(true);
            repository.save(n);
            return true;
        }).orElse(false);
    }

    @Transactional
    public int markAllRead(Long userId) {
        List<Notification> unread = repository.findByUserIdAndSeenFalse(userId);
        unread.forEach(n -> n.setSeen(true));
        repository.saveAll(unread);
        return unread.size();
    }

    @Transactional
    public boolean delete(Long userId, Long id) {
        return repository.findByIdAndUserId(id, userId).map(n -> {
            repository.delete(n);
            return true;
        }).orElse(false);
    }

    @Transactional
    public void clearAll(Long userId) {
        repository.deleteByUserId(userId);
    }

    @Transactional
    public void purgeOlderThan(java.time.LocalDateTime cutoff) {
        repository.deleteByCreatedAtBefore(cutoff);
    }
}
