package com.runbook.engine.controller;

import com.runbook.engine.domain.Notification;
import com.runbook.engine.security.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public List<Notification> getMyNotifications(@RequestParam String email) {
        return notificationService.getUnreadNotifications(email);
    }

    @PostMapping("/{id}/read")
    public void markRead(@PathVariable UUID id) {
        notificationService.markAsRead(id);
    }
}
