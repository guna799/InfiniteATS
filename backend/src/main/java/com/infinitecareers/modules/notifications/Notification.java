package com.infinitecareers.modules.notifications;

import com.infinitecareers.common.BaseTenantEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "notifications")
public class Notification extends BaseTenantEntity {

    @Column(name = "recipient_id", nullable = false)
    private String recipientId;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "message", columnDefinition = "TEXT", nullable = false)
    private String message;

    @Column(name = "type")
    private String type = "INFO"; // INFO, SUCCESS, WARNING, ACTION_REQUIRED

    @Column(name = "link")
    private String link;

    @Column(name = "is_read")
    private Boolean isRead = false;

    public String getRecipientId() { return recipientId; }
    public void setRecipientId(String recipientId) { this.recipientId = recipientId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getLink() { return link; }
    public void setLink(String link) { this.link = link; }
    public Boolean getIsRead() { return isRead; }
    public void setIsRead(Boolean read) { isRead = read; }
}
