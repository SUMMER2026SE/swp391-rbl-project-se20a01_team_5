package com.unibus.api.notification;

import java.util.List;
import java.util.Map;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.unibus.api.common.ApiResponse;
import com.unibus.api.notification.NotificationDtos.CreateNotificationRequest;
import com.unibus.api.notification.NotificationDtos.NotificationView;
import com.unibus.api.security.CurrentUser;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/me")
    ApiResponse<List<NotificationView>> listMine(
            @AuthenticationPrincipal CurrentUser currentUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok("Notifications retrieved", notificationService.listForCurrentUser(currentUser, page, size));
    }

    @GetMapping("/me/unread-count")
    ApiResponse<Map<String, Integer>> unreadCount(@AuthenticationPrincipal CurrentUser currentUser) {
        return ApiResponse.ok("Unread notification count retrieved", Map.of("count", notificationService.countUnread(currentUser)));
    }

    @PostMapping("/{notificationId}/read")
    ApiResponse<Void> markRead(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Long notificationId) {
        notificationService.markRead(currentUser, notificationId);
        return ApiResponse.ok("Notification marked as read", null);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('DISPATCHER', 'ADMIN')")
    ApiResponse<NotificationView> create(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Valid @RequestBody CreateNotificationRequest request) {
        return ApiResponse.ok("Notification created", notificationService.create(currentUser, request));
    }
}
