package com.project.resourcivo.dto;

import com.project.resourcivo.model.Notification;

import java.time.LocalDateTime;

public class NotificationDTO {

    private Long id;
    private String type;
    private String level;
    private String title;
    private String message;
    private String link;
    private boolean read;
    private LocalDateTime createdAt;

    public static NotificationDTO from(Notification n) {
        NotificationDTO d = new NotificationDTO();
        d.id = n.getId();
        d.type = n.getType();
        d.level = n.getLevel();
        d.title = n.getTitle();
        d.message = n.getMessage();
        d.link = n.getLink();
        d.read = n.isSeen();
        d.createdAt = n.getCreatedAt();
        return d;
    }

    public Long getId() { return id; }
    public String getType() { return type; }
    public String getLevel() { return level; }
    public String getTitle() { return title; }
    public String getMessage() { return message; }
    public String getLink() { return link; }
    public boolean isRead() { return read; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
