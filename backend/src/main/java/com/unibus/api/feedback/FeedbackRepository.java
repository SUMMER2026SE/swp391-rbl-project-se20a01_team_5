package com.unibus.api.feedback;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.unibus.api.feedback.FeedbackDtos.FeedbackView;

@Repository
public class FeedbackRepository {

    private final JdbcTemplate jdbcTemplate;

    public FeedbackRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public FeedbackView create(Integer userId, Integer tripId, Integer routeId, Integer rating, String category, String content) {
        return jdbcTemplate.queryForObject("""
                INSERT INTO feedback(student_code, trip_id, content, star_rating)
                SELECT s.student_code, ?, ?, ?
                FROM students s
                WHERE s.user_id = ?
                RETURNING feedback_id, student_code,
                          (SELECT full_name FROM users u JOIN students st ON st.user_id = u.user_id WHERE st.student_code = feedback.student_code) AS student_name,
                          trip_id,
                          (SELECT route_id FROM trips WHERE trip_id = feedback.trip_id) AS route_id,
                          (SELECT r.route_name FROM trips t JOIN routes r ON r.route_id = t.route_id WHERE t.trip_id = feedback.trip_id) AS route_name,
                          star_rating AS rating, NULL AS category, content, status, response,
                          NULL AS handler_name, NULL::timestamptz AS handled_at, submitted_at AS created_at
                """, (rs, rowNum) -> mapView(rs), tripId, content, rating, userId);
    }

    public List<FeedbackView> findByUserId(Integer userId, int limit, int offset) {
        return jdbcTemplate.query("""
                SELECT f.feedback_id, f.student_code, submitter.full_name AS student_name,
                       f.trip_id, t.route_id, r.route_name, f.star_rating AS rating, NULL AS category,
                       f.content, f.status, f.response, handler.full_name AS handler_name,
                       NULL::timestamptz AS handled_at, f.submitted_at AS created_at
                FROM feedback f
                JOIN students s ON s.student_code = f.student_code
                JOIN users submitter ON submitter.user_id = s.user_id
                JOIN trips t ON t.trip_id = f.trip_id
                JOIN routes r ON r.route_id = t.route_id
                LEFT JOIN users handler ON handler.user_id = f.handled_by_user_id
                WHERE s.user_id = ?
                ORDER BY f.submitted_at DESC, f.feedback_id DESC
                LIMIT ? OFFSET ?
                """, (rs, rowNum) -> mapView(rs), userId, limit, offset);
    }

    public List<FeedbackView> findAll(String status, int limit, int offset) {
        String normalizedStatus = status == null || status.equalsIgnoreCase("ALL") ? null : toFeedbackStatus(status);
        return jdbcTemplate.query("""
                SELECT f.feedback_id, f.student_code, submitter.full_name AS student_name,
                       f.trip_id, t.route_id, r.route_name, f.star_rating AS rating, NULL AS category,
                       f.content, f.status, f.response, handler.full_name AS handler_name,
                       NULL::timestamptz AS handled_at, f.submitted_at AS created_at
                FROM feedback f
                JOIN students s ON s.student_code = f.student_code
                JOIN users submitter ON submitter.user_id = s.user_id
                JOIN trips t ON t.trip_id = f.trip_id
                JOIN routes r ON r.route_id = t.route_id
                LEFT JOIN users handler ON handler.user_id = f.handled_by_user_id
                WHERE (?::varchar IS NULL OR f.status = ?)
                ORDER BY
                    CASE WHEN f.status IN ('OPEN', 'IN_PROGRESS') THEN 0 ELSE 1 END,
                    f.submitted_at DESC,
                    f.feedback_id DESC
                LIMIT ? OFFSET ?
                """, (rs, rowNum) -> mapView(rs), normalizedStatus, normalizedStatus, limit, offset);
    }

    public FeedbackView resolve(Long feedbackId, Integer handlerUserId, String response) {
        return jdbcTemplate.queryForObject("""
                UPDATE feedback
                SET status = 'RESOLVED',
                    response = ?,
                    handled_by_user_id = ?
                WHERE feedback_id = ?
                RETURNING feedback_id, student_code,
                          (SELECT full_name FROM users u JOIN students st ON st.user_id = u.user_id WHERE st.student_code = feedback.student_code) AS student_name,
                          trip_id,
                          (SELECT route_id FROM trips WHERE trip_id = feedback.trip_id) AS route_id,
                          (SELECT r.route_name FROM trips t JOIN routes r ON r.route_id = t.route_id WHERE t.trip_id = feedback.trip_id) AS route_name,
                          star_rating AS rating, NULL AS category, content, status, response,
                          (SELECT full_name FROM users WHERE user_id = ?) AS handler_name,
                          CURRENT_TIMESTAMP AS handled_at, submitted_at AS created_at
                """, (rs, rowNum) -> mapView(rs), response, handlerUserId, feedbackId, handlerUserId);
    }

    public boolean exists(Long feedbackId) {
        Boolean exists = jdbcTemplate.queryForObject("""
                SELECT EXISTS (
                    SELECT 1
                    FROM feedback
                    WHERE feedback_id = ?
                )
                """, Boolean.class, feedbackId);
        return Boolean.TRUE.equals(exists);
    }

    private FeedbackView mapView(ResultSet rs) throws SQLException {
        return new FeedbackView(
                rs.getLong("feedback_id"),
                rs.getString("student_code"),
                rs.getString("student_name"),
                (Integer) rs.getObject("trip_id"),
                (Integer) rs.getObject("route_id"),
                rs.getString("route_name"),
                (Integer) rs.getObject("rating"),
                rs.getString("category"),
                rs.getString("content"),
                toApiStatus(rs.getString("status")),
                rs.getString("response"),
                rs.getString("handler_name"),
                toOffsetDateTime(rs.getTimestamp("handled_at")),
                toOffsetDateTime(rs.getTimestamp("created_at")));
    }

    private String toApiStatus(String status) {
        return switch (status) {
            case "RESOLVED" -> "RESOLVED";
            default -> "PENDING";
        };
    }

    private String toFeedbackStatus(String status) {
        return switch (status.toUpperCase()) {
            case "PENDING" -> "OPEN";
            case "RESOLVED" -> "RESOLVED";
            default -> status.toUpperCase();
        };
    }

    private OffsetDateTime toOffsetDateTime(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toInstant().atOffset(ZoneOffset.UTC);
    }
}
