package com.unibus.api.notification;

import java.time.OffsetDateTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class NotificationDtos {

    private NotificationDtos() {
    }

    public record CreateNotificationRequest(
            @NotBlank @Size(max = 120) String title,
            @NotBlank @Size(max = 2000) String content,
            @Size(max = 40) String target) {
    }

    public record NotificationView(
            Long notificationId,
            String title,
            String content,
            String target,
            Integer routeId,
            String senderName,
            boolean read,
            OffsetDateTime createdAt) {
    }
}
