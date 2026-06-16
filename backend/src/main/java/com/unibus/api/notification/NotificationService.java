package com.unibus.api.notification;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.unibus.api.common.ApiException;
import com.unibus.api.notification.NotificationDtos.CreateNotificationRequest;
import com.unibus.api.notification.NotificationDtos.NotificationView;
import com.unibus.api.security.CurrentUser;
import com.unibus.api.user.model.UserRole;

@Service
public class NotificationService {

    private static final Pattern ROUTE_TARGET = Pattern.compile("route_(\\d+)");

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Transactional(readOnly = true)
    public List<NotificationView> listForCurrentUser(CurrentUser currentUser, int page, int size) {
        validatePage(page, size);
        return notificationRepository.findForUser(currentUser.userId(), size, page * size);
    }

    @Transactional(readOnly = true)
    public int countUnread(CurrentUser currentUser) {
        return notificationRepository.countUnreadForUser(currentUser.userId());
    }

    @Transactional
    public void markRead(CurrentUser currentUser, Long notificationId) {
        if (!notificationRepository.existsForUser(notificationId, currentUser.userId())) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Notification not found");
        }
        notificationRepository.markRead(notificationId, currentUser.userId());
    }

    @Transactional
    public NotificationView create(CurrentUser currentUser, CreateNotificationRequest request) {
        Audience audience = parseAudience(request.target());
        List<Integer> recipients = notificationRepository.findRecipientUserIds(audience.targetRole(), audience.routeId());
        if (recipients.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "No notification recipients found");
        }

        NotificationView first = null;
        String type = audience.routeId() == null ? "SYSTEM" : "TRIP";
        for (Integer recipientUserId : recipients) {
            NotificationView created = notificationRepository.createForRecipient(
                    request.title().trim(),
                    request.content().trim(),
                    type,
                    recipientUserId,
                    currentUser.userId());
            if (first == null) {
                first = created;
            }
        }
        return first;
    }

    private Audience parseAudience(String target) {
        String normalized = target == null ? "" : target.trim().toLowerCase();
        Matcher matcher = ROUTE_TARGET.matcher(normalized);
        if (matcher.matches()) {
            return new Audience(UserRole.STUDENT, Integer.parseInt(matcher.group(1)));
        }
        return new Audience(notificationRepository.targetRoleFrom(normalized).orElse(null), null);
    }

    private void validatePage(int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Page must be non-negative and size must be between 1 and 100");
        }
    }

    private record Audience(UserRole targetRole, Integer routeId) {
    }
}
