package com.project.resourcivo.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/**
 * An in-app notification for one login (users.id). Created by the services when something
 * happens that the person should know about (booking cancelled, book approved, ...).
 */
@Entity
@Table(name = "notifications", indexes = {
        @Index(name = "idx_notification_user", columnList = "user_id, is_read, created_at")
})
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** TRANSPORT, LIBRARY, ACCOUNT or SYSTEM (plain text so new kinds need no schema change). */
    @Column(length = 30, nullable = false)
    private String type;

    /** INFO, SUCCESS, WARNING or ALERT - only used to colour the item in the UI. */
    @Column(length = 20, nullable = false)
    private String level = "INFO";

    @Column(length = 150, nullable = false)
    private String title;

    @Column(length = 1000)
    private String message;

    /** Front-end path to open when the notification is clicked, e.g. /transport. */
    @Column(length = 200)
    private String link;

    @Column(name = "is_read", nullable = false)
    private boolean seen = false;

    /** Lets scheduled jobs avoid sending the same reminder twice. */
    @Column(name = "dedupe_key", length = 120)
    private String dedupeKey;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getLink() { return link; }
    public void setLink(String link) { this.link = link; }
    public boolean isSeen() { return seen; }
    public void setSeen(boolean seen) { this.seen = seen; }
    public String getDedupeKey() { return dedupeKey; }
    public void setDedupeKey(String dedupeKey) { this.dedupeKey = dedupeKey; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
