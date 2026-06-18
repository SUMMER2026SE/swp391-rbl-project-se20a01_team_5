package com.unibus.api.coordinator;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.unibus.api.common.ApiResponse;
import com.unibus.api.notification.NotificationDtos.CreateNotificationRequest;
import com.unibus.api.notification.NotificationDtos.NotificationView;
import com.unibus.api.notification.NotificationService;
import com.unibus.api.security.CurrentUser;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/coordinator/notifications")
@PreAuthorize("hasRole('DISPATCHER')")
public class CoordinatorNotificationController {

    private final NotificationService notificationService;

    public CoordinatorNotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @PostMapping
    public ApiResponse<NotificationView> sendNotification(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Valid @RequestBody CreateNotificationRequest request) {
        return ApiResponse.ok("Notification created", notificationService.create(currentUser, request));
    }
}
