package com.runbook.engine.security;

import com.runbook.engine.domain.Notification;
import com.runbook.engine.domain.NotificationType;
import com.runbook.engine.domain.Organization;
import com.runbook.engine.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepo;

    public void sendOrgInviteNotification(String email, Organization org, UUID inviteId) {
        Notification n = new Notification();
        n.setId(UUID.randomUUID());
        n.setEmail(email);
        n.setType(NotificationType.ORG_INVITE);
        n.setTitle("Organization Invite");
        n.setMessage("You have been invited to join " + org.getName());
        n.setReferenceId(inviteId);
        n.setRead(false);
        n.setCreatedAt(Instant.now());

        notificationRepo.save(n);
    }

    public List<Notification> getUnreadNotifications(String email) {
        return notificationRepo.findByEmailAndReadFalseOrderByCreatedAtDesc(email);
    }

    public void markAsRead(UUID id) {
        Notification n = notificationRepo.findById(id).orElseThrow();
        n.setRead(true);
        notificationRepo.save(n);
    }
}
