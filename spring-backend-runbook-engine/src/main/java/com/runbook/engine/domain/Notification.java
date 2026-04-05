package com.runbook.engine.domain;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "notifications")
@Data
public class Notification {

    @Id
    private UUID id;

    private String email; // receiver

    @Enumerated(EnumType.STRING)
    private NotificationType type; // ORG_INVITE

    private String title;
    private String message;

    private UUID referenceId; // inviteId

    private boolean read;

    private Instant createdAt;
}
