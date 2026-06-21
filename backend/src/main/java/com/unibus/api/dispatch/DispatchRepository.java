package com.unibus.api.dispatch;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.unibus.api.dispatch.DispatchDtos.DispatchMessageView;
import com.unibus.api.dispatch.DispatchDtos.DispatcherContact;

@Repository
public class DispatchRepository {

    private final JdbcTemplate jdbcTemplate;

    public DispatchRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Integer driverIdForUser(Integer userId) {
        List<Integer> ids = jdbcTemplate.queryForList("""
                SELECT driver_id
                FROM drivers
                WHERE user_id = ?
                """, Integer.class, userId);
        return ids.isEmpty() ? null : ids.get(0);
    }

    public List<Integer> activeDispatcherUserIds() {
        return jdbcTemplate.queryForList("""
                SELECT u.user_id
                FROM users u
                WHERE u.status = 'ACTIVE'
                  AND u.role = 'DISPATCHER'
                ORDER BY user_id
                """, Integer.class);
    }

    public DispatcherContact findPrimaryDispatcher(Integer driverUserId, Integer activeTripId) {
        List<DispatcherContact> rows = jdbcTemplate.query("""
                SELECT u.user_id, u.full_name, u.phone_number
                FROM users u
                WHERE u.status = 'ACTIVE'
                  AND u.role = 'DISPATCHER'
                ORDER BY u.user_id
                LIMIT 1
                """, (rs, rowNum) -> new DispatcherContact(
                        rs.getInt("user_id"),
                        rs.getString("full_name"),
                        rs.getString("phone_number"),
                        "Trung tâm điều phối",
                        activeTripId,
                        List.of()));
        if (rows.isEmpty()) {
            return new DispatcherContact(null, null, null, null, activeTripId, List.of());
        }
        DispatcherContact contact = rows.get(0);
        return new DispatcherContact(
                contact.dispatcherUserId(),
                contact.dispatcherName(),
                contact.phoneNumber(),
                contact.department(),
                activeTripId,
                findConversation(driverUserId, contact.dispatcherUserId(), 50));
    }

    public Integer activeTripIdForDriver(Integer driverId) {
        List<Integer> ids = jdbcTemplate.queryForList("""
                SELECT trip_id
                FROM trips
                WHERE driver_id = ?
                  AND service_date = CURRENT_DATE
                  AND status IN ('RUNNING', 'NOT_STARTED')
                ORDER BY CASE status WHEN 'RUNNING' THEN 0 ELSE 1 END, departed_at NULLS LAST, trip_id DESC
                LIMIT 1
                """, Integer.class, driverId);
        return ids.isEmpty() ? null : ids.get(0);
    }

    public boolean driverOwnsTrip(Integer tripId, Integer driverId) {
        Boolean owns = jdbcTemplate.queryForObject("""
                SELECT EXISTS (
                    SELECT 1
                    FROM trips
                    WHERE trip_id = ?
                      AND driver_id = ?
                )
                """, Boolean.class, tripId, driverId);
        return Boolean.TRUE.equals(owns);
    }

    public Integer conductorIdForTrip(Integer tripId) {
        List<Integer> ids = jdbcTemplate.queryForList("""
                SELECT conductor_id
                FROM trips
                WHERE trip_id = ?
                  AND conductor_id IS NOT NULL
                """, Integer.class, tripId);
        return ids.isEmpty() ? null : ids.get(0);
    }

    public String driverName(Integer driverUserId) {
        List<String> names = jdbcTemplate.queryForList("""
                SELECT full_name
                FROM users
                WHERE user_id = ?
                """, String.class, driverUserId);
        return names.isEmpty() ? "Tài xế" : names.get(0);
    }

    public void createDriverSosFeedback(Integer driverUserId, Integer tripId, String incidentType, String description) {
        ensureDriverSosStudent();
        String driverName = driverName(driverUserId);
        jdbcTemplate.update("""
                INSERT INTO feedback(student_code, trip_id, content, star_rating)
                VALUES ('DRIVER_SOS', ?, ?, 1)
                """, tripId, "[SOS tài xế] " + driverName + " - " + incidentType + ": " + description);
    }

    private void ensureDriverSosStudent() {
        Integer userId = jdbcTemplate.queryForObject("""
                INSERT INTO users(email, full_name, role, status, email_verified_at, created_at)
                VALUES ('driver-sos@unibus.local', 'Tài xế báo SOS', 'STUDENT', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                ON CONFLICT (email) DO UPDATE
                SET full_name = EXCLUDED.full_name
                RETURNING user_id
                """, Integer.class);
        jdbcTemplate.update("""
                INSERT INTO students(student_code, user_id, university)
                VALUES ('DRIVER_SOS', ?, 'UniBus Operations')
                ON CONFLICT (student_code) DO NOTHING
                """, userId);
    }

    public DispatchMessageView createMessage(Integer senderUserId, Integer recipientUserId, Integer tripId, String content) {
        return jdbcTemplate.queryForObject("""
                INSERT INTO internal_messages(sender_user_id, recipient_user_id, trip_id, content)
                VALUES (?, ?, ?, ?)
                RETURNING message_id, sender_user_id,
                          (SELECT full_name FROM users WHERE user_id = internal_messages.sender_user_id) AS sender_name,
                          recipient_user_id,
                          (SELECT full_name FROM users WHERE user_id = internal_messages.recipient_user_id) AS recipient_name,
                          trip_id, content, is_read, sent_at
                """, (rs, rowNum) -> mapMessage(rs), senderUserId, recipientUserId, tripId, content);
    }

    public Long createIncident(Integer conductorId, Integer tripId, String incidentType, String description) {
        return jdbcTemplate.queryForObject("""
                INSERT INTO incidents(conductor_id, trip_id, incident_type, description)
                VALUES (?, ?, ?, ?)
                RETURNING incident_id
                """, Long.class, conductorId, tripId, incidentType, description);
    }

    public void createNotification(Integer senderUserId, Integer recipientUserId, String title, String content) {
        jdbcTemplate.update("""
                INSERT INTO notifications(recipient_user_id, sender_user_id, title, content, notification_type)
                VALUES (?, ?, ?, ?, 'ALERT')
                """, recipientUserId, senderUserId, title, content);
    }

    public List<DispatchMessageView> findConversation(Integer userA, Integer userB, int limit) {
        return jdbcTemplate.query("""
                SELECT m.message_id, m.sender_user_id, sender.full_name AS sender_name,
                       m.recipient_user_id, recipient.full_name AS recipient_name,
                       m.trip_id, m.content, m.is_read, m.sent_at
                FROM internal_messages m
                JOIN users sender ON sender.user_id = m.sender_user_id
                JOIN users recipient ON recipient.user_id = m.recipient_user_id
                WHERE (m.sender_user_id = ? AND m.recipient_user_id = ?)
                   OR (m.sender_user_id = ? AND m.recipient_user_id = ?)
                ORDER BY m.sent_at DESC, m.message_id DESC
                LIMIT ?
                """, (rs, rowNum) -> mapMessage(rs), userA, userB, userB, userA, limit);
    }

    private DispatchMessageView mapMessage(ResultSet rs) throws SQLException {
        return new DispatchMessageView(
                rs.getLong("message_id"),
                rs.getInt("sender_user_id"),
                rs.getString("sender_name"),
                rs.getInt("recipient_user_id"),
                rs.getString("recipient_name"),
                (Integer) rs.getObject("trip_id"),
                rs.getString("content"),
                rs.getBoolean("is_read"),
                toOffsetDateTime(rs.getTimestamp("sent_at")));
    }

    private OffsetDateTime toOffsetDateTime(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toInstant().atOffset(ZoneOffset.UTC);
    }
}
