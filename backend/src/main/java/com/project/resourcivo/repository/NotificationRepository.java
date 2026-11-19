package com.project.resourcivo.repository;

import com.project.resourcivo.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findTop50ByUserIdOrderByCreatedAtDescIdDesc(Long userId);

    List<Notification> findTop50ByUserIdAndSeenFalseOrderByCreatedAtDescIdDesc(Long userId);

    List<Notification> findByUserIdAndSeenFalse(Long userId);

    long countByUserIdAndSeenFalse(Long userId);

    Optional<Notification> findByIdAndUserId(Long id, Long userId);

    boolean existsByUserIdAndDedupeKey(Long userId, String dedupeKey);

    void deleteByUserId(Long userId);

    void deleteByCreatedAtBefore(LocalDateTime cutoff);
}
