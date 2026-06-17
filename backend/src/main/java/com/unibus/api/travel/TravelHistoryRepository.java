package com.unibus.api.travel;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class TravelHistoryRepository {

    private final JdbcTemplate jdbcTemplate;

    public TravelHistoryRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<TravelHistoryView> findRecentByStudentCode(String studentCode, int limit, int offset) {
        return jdbcTemplate.query("""
                SELECT th.travel_history_id, th.trip_id, r.route_id, r.route_name,
                       t.driver_id, du.full_name AS driver_name,
                       t.service_date, th.boarded_at, th.alighted_at,
                       bs.stop_name AS boarding_stop_name,
                       als.stop_name AS alighting_stop_name
                FROM travel_history th
                JOIN trips t ON t.trip_id = th.trip_id
                JOIN routes r ON r.route_id = t.route_id
                LEFT JOIN drivers d ON d.driver_id = t.driver_id
                LEFT JOIN users du ON du.user_id = d.user_id
                LEFT JOIN stops bs ON bs.stop_id = th.boarding_stop_id
                LEFT JOIN stops als ON als.stop_id = th.alighting_stop_id
                WHERE th.student_code = ?
                ORDER BY t.service_date DESC, th.boarded_at DESC
                LIMIT ? OFFSET ?
                """, (resultSet, rowNumber) -> new TravelHistoryView(
                        resultSet.getInt("travel_history_id"),
                        resultSet.getInt("trip_id"),
                        resultSet.getInt("route_id"),
                        resultSet.getString("route_name"),
                        (Integer) resultSet.getObject("driver_id"),
                        resultSet.getString("driver_name"),
                        resultSet.getObject("service_date", LocalDate.class),
                        resultSet.getObject("boarded_at", OffsetDateTime.class),
                        resultSet.getObject("alighted_at", OffsetDateTime.class),
                        resultSet.getString("boarding_stop_name"),
                        resultSet.getString("alighting_stop_name")),
                studentCode, limit, offset);
    }

    public record TravelHistoryView(
            Integer travelHistoryId,
            Integer tripId,
            Integer routeId,
            String routeName,
            Integer driverId,
            String driverName,
            LocalDate serviceDate,
            OffsetDateTime boardedAt,
            OffsetDateTime alightedAt,
            String boardingStopName,
            String alightingStopName) {
    }
}
