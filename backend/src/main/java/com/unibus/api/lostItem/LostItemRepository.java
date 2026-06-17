package com.unibus.api.lostItem;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.unibus.api.lostItem.LostItemDtos.LostItemReportView;

@Repository
public class LostItemRepository {

    private final JdbcTemplate jdbcTemplate;

    public LostItemRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Optional<String> studentCodeForUser(Integer userId) {
        return jdbcTemplate.query("""
                SELECT student_code
                FROM students
                WHERE user_id = ?
                """, (rs, rowNum) -> rs.getString("student_code"), userId).stream().findFirst();
    }

    public boolean studentTravelledOnTrip(String studentCode, Integer tripId) {
        Boolean exists = jdbcTemplate.queryForObject("""
                SELECT EXISTS (
                    SELECT 1
                    FROM travel_history
                    WHERE student_code = ?
                      AND trip_id = ?
                )
                """, Boolean.class, studentCode, tripId);
        return Boolean.TRUE.equals(exists);
    }

    public LostItemReportView create(Integer reporterUserId, Integer tripId, String itemDescription, String notes) {
        return jdbcTemplate.queryForObject("""
                INSERT INTO lost_item_reports(reported_by_user_id, trip_id, item_description, notes)
                VALUES (?, ?, ?, ?)
                RETURNING lost_item_report_id, trip_id,
                          (SELECT route_id FROM trips WHERE trip_id = lost_item_reports.trip_id) AS route_id,
                          (SELECT r.route_name FROM trips t JOIN routes r ON r.route_id = t.route_id WHERE t.trip_id = lost_item_reports.trip_id) AS route_name,
                          item_description, status, notes,
                          (SELECT full_name FROM users WHERE user_id = lost_item_reports.assisted_by_user_id) AS assisted_by_name,
                          reported_at
                """, (rs, rowNum) -> mapView(rs), reporterUserId, tripId, itemDescription, notes);
    }

    public List<LostItemReportView> findByReporter(Integer reporterUserId, int limit, int offset) {
        return jdbcTemplate.query("""
                SELECT lir.lost_item_report_id, lir.trip_id, t.route_id, r.route_name,
                       lir.item_description, lir.status, lir.notes,
                       assistant.full_name AS assisted_by_name, lir.reported_at
                FROM lost_item_reports lir
                LEFT JOIN trips t ON t.trip_id = lir.trip_id
                LEFT JOIN routes r ON r.route_id = t.route_id
                LEFT JOIN users assistant ON assistant.user_id = lir.assisted_by_user_id
                WHERE lir.reported_by_user_id = ?
                ORDER BY lir.reported_at DESC, lir.lost_item_report_id DESC
                LIMIT ? OFFSET ?
                """, (rs, rowNum) -> mapView(rs), reporterUserId, limit, offset);
    }

    public List<Integer> findNotificationRecipients(Integer tripId) {
        if (tripId == null) {
            return jdbcTemplate.queryForList("""
                    SELECT user_id
                    FROM users
                    WHERE role = 'DISPATCHER'
                      AND status = 'ACTIVE'
                    """, Integer.class);
        }
        return jdbcTemplate.queryForList("""
                SELECT DISTINCT recipient_user_id
                FROM (
                    SELECT user_id AS recipient_user_id
                    FROM users
                    WHERE role = 'DISPATCHER'
                      AND status = 'ACTIVE'

                    UNION

                    SELECT cu.user_id AS recipient_user_id
                    FROM trips t
                    JOIN conductors c ON c.conductor_id = t.conductor_id
                    JOIN users cu ON cu.user_id = c.user_id
                    WHERE t.trip_id = ?
                      AND cu.status = 'ACTIVE'
                ) recipients
                """, Integer.class, tripId);
    }

    private LostItemReportView mapView(ResultSet rs) throws SQLException {
        return new LostItemReportView(
                rs.getInt("lost_item_report_id"),
                (Integer) rs.getObject("trip_id"),
                (Integer) rs.getObject("route_id"),
                rs.getString("route_name"),
                rs.getString("item_description"),
                rs.getString("status"),
                rs.getString("notes"),
                rs.getString("assisted_by_name"),
                toOffsetDateTime(rs.getTimestamp("reported_at")));
    }

    private OffsetDateTime toOffsetDateTime(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toInstant().atOffset(ZoneOffset.UTC);
    }
}
