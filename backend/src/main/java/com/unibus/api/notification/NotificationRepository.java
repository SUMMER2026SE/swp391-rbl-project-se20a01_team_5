package com.unibus.api.notification;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.unibus.api.notification.NotificationDtos.NotificationView;
import com.unibus.api.user.model.UserRole;

@Repository
public class NotificationRepository {

    private final JdbcTemplate jdbcTemplate;

    public NotificationRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<NotificationView> findForUser(Integer userId, int limit, int offset) {
        return jdbcTemplate.query("""
                SELECT n.notification_id, n.title, n.content,
                       n.notification_type AS target, NULL AS route_id,
                       sender.full_name AS sender_name, n.sent_at AS created_at,
                       n.is_read
                FROM notifications n
                LEFT JOIN users sender ON sender.user_id = n.sender_user_id
                WHERE n.recipient_user_id = ?
                ORDER BY n.sent_at DESC, n.notification_id DESC
                LIMIT ? OFFSET ?
                """, (rs, rowNum) -> mapView(rs), userId, limit, offset);
    }

    public int countUnreadForUser(Integer userId) {
        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM notifications
                WHERE recipient_user_id = ?
                  AND is_read = FALSE
                """, Integer.class, userId);
        return count == null ? 0 : count;
    }

    public List<Integer> findRecipientUserIds(UserRole targetRole, Integer routeId) {
        if (routeId != null) {
            return jdbcTemplate.queryForList("""
                    SELECT DISTINCT u.user_id
                    FROM users u
                    JOIN students s ON s.user_id = u.user_id
                    JOIN route_registrations rr ON rr.student_code = s.student_code
                    WHERE u.role = 'STUDENT'
                      AND u.status = 'ACTIVE'
                      AND rr.route_id = ?
                      AND rr.status IN ('PENDING', 'APPROVED')
                    """, Integer.class, routeId);
        }
        if (targetRole != null) {
            return jdbcTemplate.queryForList("""
                    SELECT user_id
                    FROM users
                    WHERE role = ?
                      AND status = 'ACTIVE'
                    """, Integer.class, targetRole.name());
        }
        return jdbcTemplate.queryForList("""
                SELECT user_id
                FROM users
                WHERE status = 'ACTIVE'
                """, Integer.class);
    }

    public List<Integer> findStaffRecipientUserIds() {
        return jdbcTemplate.queryForList("""
                SELECT user_id
                FROM users
                WHERE status = 'ACTIVE'
                  AND role IN ('DRIVER', 'CONDUCTOR', 'DISPATCHER')
                """, Integer.class);
    }

    public NotificationView createForRecipient(String title, String content, String notificationType, Integer recipientUserId, Integer createdByUserId) {
        return jdbcTemplate.queryForObject("""
                INSERT INTO notifications(recipient_user_id, sender_user_id, title, content, notification_type)
                VALUES (?, ?, ?, ?, ?)
                RETURNING notification_id, title, content, notification_type AS target,
                          NULL AS route_id,
                          (SELECT full_name FROM users WHERE user_id = ?) AS sender_name,
                          sent_at AS created_at,
                          is_read
                """, (rs, rowNum) -> mapView(rs), recipientUserId, createdByUserId, title, content,
                normalizeType(notificationType), createdByUserId);
    }

    public boolean existsForUser(Long notificationId, Integer userId) {
        Boolean exists = jdbcTemplate.queryForObject("""
                SELECT EXISTS (
                    SELECT 1
                    FROM notifications
                    WHERE notification_id = ?
                      AND recipient_user_id = ?
                )
                """, Boolean.class, notificationId, userId);
        return Boolean.TRUE.equals(exists);
    }

    public void markRead(Long notificationId, Integer userId) {
        jdbcTemplate.update("""
                UPDATE notifications
                SET is_read = TRUE
                WHERE notification_id = ?
                  AND recipient_user_id = ?
                """, notificationId, userId);
    }

    public Optional<UserRole> targetRoleFrom(String target) {
        String normalized = target == null ? "" : target.trim().toLowerCase();
        return switch (normalized) {
            case "", "all", "all_users" -> Optional.empty();
            case "all_students" -> Optional.of(UserRole.STUDENT);
            case "all_drivers" -> Optional.of(UserRole.DRIVER);
            case "all_conductors" -> Optional.of(UserRole.CONDUCTOR);
            case "all_dispatchers" -> Optional.of(UserRole.DISPATCHER);
            case "all_admins" -> Optional.of(UserRole.ADMIN);
            default -> Optional.empty();
        };
    }

    private String normalizeType(String type) {
        return switch (type == null ? "" : type.toUpperCase()) {
            case "TRIP", "PAYMENT", "COMPLAINT", "ALERT" -> type.toUpperCase();
            default -> "SYSTEM";
        };
    }

    private NotificationView mapView(ResultSet rs) throws SQLException {
        return new NotificationView(
                rs.getLong("notification_id"),
                rs.getString("title"),
                rs.getString("content"),
                rs.getString("target"),
                (Integer) rs.getObject("route_id"),
                rs.getString("sender_name"),
                rs.getBoolean("is_read"),
                toOffsetDateTime(rs.getTimestamp("created_at")));
    }

    private OffsetDateTime toOffsetDateTime(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toInstant().atOffset(ZoneOffset.UTC);
    }
}
