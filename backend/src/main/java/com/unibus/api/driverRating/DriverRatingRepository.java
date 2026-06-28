package com.unibus.api.driverRating;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.unibus.api.driverRating.DriverRatingDtos.DriverRatingSummary;
import com.unibus.api.driverRating.DriverRatingDtos.DriverRatingView;

@Repository
public class DriverRatingRepository {

    private final JdbcTemplate jdbcTemplate;

    public DriverRatingRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public boolean driverExists(Integer driverId) {
        Boolean exists = jdbcTemplate.queryForObject("""
                SELECT EXISTS (
                    SELECT 1
                    FROM drivers
                    WHERE driver_id = ?
                )
                """, Boolean.class, driverId);
        return Boolean.TRUE.equals(exists);
    }

    public TripReviewContext findTripReviewContext(Integer tripId) {
        List<TripReviewContext> rows = jdbcTemplate.query("""
                SELECT trip_id, driver_id, status
                FROM trips
                WHERE trip_id = ?
                """, (rs, rowNum) -> new TripReviewContext(
                        rs.getInt("trip_id"),
                        (Integer) rs.getObject("driver_id"),
                        rs.getString("status")), tripId);
        return rows.isEmpty() ? null : rows.getFirst();
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

    public boolean alreadyRated(String studentCode, Integer tripId) {
        Boolean exists = jdbcTemplate.queryForObject("""
                SELECT EXISTS (
                    SELECT 1
                    FROM driver_ratings
                    WHERE student_code = ?
                      AND trip_id = ?
                )
                """, Boolean.class, studentCode, tripId);
        return Boolean.TRUE.equals(exists);
    }

    public DriverRatingView create(String studentCode, Integer driverId, Integer tripId, Integer rating, String comment) {
        return jdbcTemplate.queryForObject("""
                INSERT INTO driver_ratings(student_code, driver_id, trip_id, stars, comment)
                VALUES (?, ?, ?, ?, ?)
                RETURNING driver_rating_id, student_code,
                          (SELECT full_name FROM users u JOIN students s ON s.user_id = u.user_id WHERE s.student_code = driver_ratings.student_code) AS student_name,
                          driver_id,
                          (SELECT full_name FROM users u JOIN drivers d ON d.user_id = u.user_id WHERE d.driver_id = driver_ratings.driver_id) AS driver_name,
                          trip_id, stars AS rating, comment, rated_at AS created_at
                """, (rs, rowNum) -> mapView(rs), studentCode, driverId, tripId, rating, comment);
    }

    public void refreshDriverAverageRating(Integer driverId) {
        jdbcTemplate.update("""
                UPDATE drivers
                SET average_rating = COALESCE((
                    SELECT ROUND(AVG(stars)::numeric, 2)
                    FROM driver_ratings
                    WHERE driver_id = ?
                ), 0.00)
                WHERE driver_id = ?
                """, driverId, driverId);
    }

    public List<DriverRatingView> findByDriverId(Integer driverId, int limit, int offset) {
        return jdbcTemplate.query("""
                SELECT dr.driver_rating_id, dr.student_code, submitter.full_name AS student_name,
                       dr.driver_id, driver_user.full_name AS driver_name, dr.trip_id,
                       dr.stars AS rating, dr.comment, dr.rated_at AS created_at
                FROM driver_ratings dr
                JOIN students s ON s.student_code = dr.student_code
                JOIN users submitter ON submitter.user_id = s.user_id
                JOIN drivers d ON d.driver_id = dr.driver_id
                JOIN users driver_user ON driver_user.user_id = d.user_id
                WHERE dr.driver_id = ?
                ORDER BY dr.rated_at DESC, dr.driver_rating_id DESC
                LIMIT ? OFFSET ?
                """, (rs, rowNum) -> mapView(rs), driverId, limit, offset);
    }

    public DriverRatingSummary summarize(Integer driverId) {
        return jdbcTemplate.queryForObject("""
                SELECT COALESCE(ROUND(AVG(stars)::numeric, 2), 0.00) AS average_rating,
                       COUNT(*) AS total_reviews
                FROM driver_ratings
                WHERE driver_id = ?
                """, (rs, rowNum) -> new DriverRatingSummary(
                        rs.getBigDecimal("average_rating"),
                        rs.getLong("total_reviews")), driverId);
    }

    private DriverRatingView mapView(ResultSet rs) throws SQLException {
        return new DriverRatingView(
                rs.getLong("driver_rating_id"),
                rs.getString("student_code"),
                rs.getString("student_name"),
                rs.getInt("driver_id"),
                rs.getString("driver_name"),
                (Integer) rs.getObject("trip_id"),
                rs.getInt("rating"),
                rs.getString("comment"),
                toOffsetDateTime(rs.getTimestamp("created_at")));
    }

    private OffsetDateTime toOffsetDateTime(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toInstant().atOffset(ZoneOffset.UTC);
    }

    public record TripReviewContext(Integer tripId, Integer driverId, String status) {
    }
}
