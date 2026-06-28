package com.unibus.api.ai;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Time;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class AiKnowledgeRepository {

    private final JdbcTemplate jdbcTemplate;

    public AiKnowledgeRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public StudentContext studentContext(Integer userId) {
        return jdbcTemplate.query("""
                SELECT u.user_id, u.full_name, u.student_verification_status,
                       s.student_code, s.university_id, COALESCE(uni.name, s.university) AS university_name
                FROM users u
                LEFT JOIN students s ON s.user_id = u.user_id
                LEFT JOIN universities uni ON uni.university_id = s.university_id
                WHERE u.user_id = ?
                """, rs -> rs.next()
                        ? new StudentContext(
                                rs.getInt("user_id"),
                                rs.getString("full_name"),
                                rs.getString("student_verification_status"),
                                rs.getString("student_code"),
                                (Integer) rs.getObject("university_id"),
                                rs.getString("university_name"))
                        : new StudentContext(userId, "Sinh viên", "UNKNOWN", null, null, null), userId);
    }

    public Optional<RegistrationSnapshot> currentRegistration(String studentCode) {
        if (studentCode == null || studentCode.isBlank()) {
            return Optional.empty();
        }
        return jdbcTemplate.query("""
                SELECT rr.registration_id, rr.route_id, r.route_code, r.route_name,
                       rr.boarding_stop_id, bs.stop_name AS boarding_stop_name,
                       rr.alighting_stop_id, als.stop_name AS alighting_stop_name,
                       rr.status, rr.effective_date
                FROM route_registrations rr
                JOIN routes r ON r.route_id = rr.route_id
                LEFT JOIN stops bs ON bs.stop_id = rr.boarding_stop_id
                LEFT JOIN stops als ON als.stop_id = rr.alighting_stop_id
                WHERE rr.student_code = ?
                ORDER BY CASE rr.status WHEN 'APPROVED' THEN 0 ELSE 1 END,
                         rr.registered_at DESC, rr.registration_id DESC
                LIMIT 1
                """, (rs, rowNum) -> new RegistrationSnapshot(
                        rs.getInt("registration_id"),
                        rs.getInt("route_id"),
                        rs.getString("route_code"),
                        rs.getString("route_name"),
                        (Integer) rs.getObject("boarding_stop_id"),
                        rs.getString("boarding_stop_name"),
                        (Integer) rs.getObject("alighting_stop_id"),
                        rs.getString("alighting_stop_name"),
                        rs.getString("status"),
                        rs.getObject("effective_date", LocalDate.class)), studentCode)
                .stream().findFirst();
    }

    public Optional<TicketSnapshot> activeTicket(String studentCode) {
        if (studentCode == null || studentCode.isBlank()) {
            return Optional.empty();
        }
        return jdbcTemplate.query("""
                        SELECT mp.monthly_pass_id AS ticket_id, 'MONTHLY' AS ticket_type,
                                      mp.route_id, r.route_code, r.route_name, mp.status,
                                      COALESCE(mp.final_fare_amount, mp.fare_amount) AS amount,
                                      mp.expires_on AS expires_at
                               FROM monthly_passes mp
                               JOIN routes r ON r.route_id = mp.route_id
                               WHERE mp.student_code = ?
                                 AND mp.status = 'ACTIVE'
                                 AND mp.expires_on >= CURRENT_DATE
                               ORDER BY mp.expires_on DESC, mp.monthly_pass_id DESC
                               LIMIT 1
                """, (rs, rowNum) -> new TicketSnapshot(
                        rs.getInt("ticket_id"),
                        rs.getString("ticket_type"),
                        rs.getInt("route_id"),
                        rs.getString("route_code"),
                        rs.getString("route_name"),
                        rs.getString("status"),
                        rs.getBigDecimal("amount"),
                        toOffset(rs.getTimestamp("expires_at"))), studentCode)
                .stream().findFirst();
    }

    public List<RouteCandidate> candidateRoutes(StudentContext student) {
        List<RouteCandidate> routes = jdbcTemplate.query("""
                SELECT DISTINCT r.route_id, r.route_code, r.route_name, r.color_hex,
                       r.distance_km, r.estimated_minutes, r.frequency_min,
                       CASE WHEN ru.route_university_id IS NULL THEN FALSE ELSE TRUE END AS university_linked
                FROM routes r
                LEFT JOIN route_universities ru ON ru.route_id = r.route_id
                   AND ru.status = 'ACTIVE'
                   AND ru.active_from <= CURRENT_DATE
                   AND (ru.active_until IS NULL OR ru.active_until >= CURRENT_DATE)
                   AND (? IS NOT NULL AND ru.university_id = ?)
                WHERE r.status = 'ACTIVE'
                ORDER BY r.route_name
                """, (rs, rowNum) -> new RouteCandidate(
                        rs.getInt("route_id"),
                        rs.getString("route_code"),
                        rs.getString("route_name"),
                        rs.getString("color_hex"),
                        rs.getBigDecimal("distance_km"),
                        (Integer) rs.getObject("estimated_minutes"),
                        (Integer) rs.getObject("frequency_min"),
                        rs.getBoolean("university_linked"),
                        List.of(),
                        BigDecimal.ZERO,
                        BigDecimal.ZERO,
                        BigDecimal.ZERO,
                        BigDecimal.ZERO,
                        List.of()),
                student.universityId(), student.universityId());
        return routes.stream()
                .map(route -> enrichRoute(route, student.universityId()))
                .toList();
    }

    private RouteCandidate enrichRoute(RouteCandidate route, Integer universityId) {
        BigDecimal singleFare = fare(route.routeId(), "SINGLE");
        BigDecimal monthlyFare = fare(route.routeId(), "MONTHLY");
        BigDecimal subsidyAmount = subsidyAmount(universityId, monthlyFare);
        BigDecimal finalFare = monthlyFare.subtract(subsidyAmount).max(BigDecimal.ZERO);
        return new RouteCandidate(
                route.routeId(),
                route.routeCode(),
                route.routeName(),
                route.colorHex(),
                route.distanceKm(),
                route.estimatedMinutes(),
                route.frequencyMin(),
                route.universityLinked(),
                routeStops(route.routeId()),
                singleFare,
                monthlyFare,
                subsidyAmount,
                finalFare,
                departureTimes(route.routeId(), null));
    }

    public List<String> departureTimes(Integer routeId, LocalTime preferredDepartureTime) {
        int weekday = LocalDate.now().getDayOfWeek().getValue();
        List<LocalTime> times = jdbcTemplate.query("""
                SELECT departure_time
                FROM bus_schedules
                WHERE route_id = ?
                  AND status = 'ACTIVE'
                  AND weekday_number = ?
                ORDER BY departure_time
                """, (rs, rowNum) -> {
                    Time time = rs.getTime("departure_time");
                    return time == null ? null : time.toLocalTime();
                }, routeId, weekday).stream()
                .filter(time -> time != null)
                .toList();
        LocalTime floor = preferredDepartureTime == null ? LocalTime.now() : preferredDepartureTime;
        List<String> upcoming = times.stream()
                .filter(time -> !time.isBefore(floor))
                .limit(3)
                .map(time -> time.toString().substring(0, 5))
                .toList();
        if (!upcoming.isEmpty()) {
            return upcoming;
        }
        return times.stream()
                .limit(3)
                .map(time -> time.toString().substring(0, 5))
                .toList();
    }

    private List<AiDtos.RouteStopCard> routeStops(Integer routeId) {
        return jdbcTemplate.query("""
                SELECT s.stop_id, s.stop_code, s.stop_name, rs.stop_order, rs.minutes_from_previous_stop
                FROM route_stops rs
                JOIN stops s ON s.stop_id = rs.stop_id
                WHERE rs.route_id = ?
                  AND s.status = 'ACTIVE'
                ORDER BY rs.stop_order
                """, (rs, rowNum) -> new AiDtos.RouteStopCard(
                        rs.getInt("stop_id"),
                        rs.getString("stop_code"),
                        rs.getString("stop_name"),
                        rs.getInt("stop_order"),
                        (Integer) rs.getObject("minutes_from_previous_stop")), routeId);
    }

    private BigDecimal fare(Integer routeId, String fareType) {
        return jdbcTemplate.query("""
                SELECT amount
                FROM fares
                WHERE route_id = ?
                  AND fare_type = ?
                  AND effective_from <= CURRENT_DATE
                  AND (effective_until IS NULL OR effective_until >= CURRENT_DATE)
                ORDER BY effective_from DESC, fare_id DESC
                LIMIT 1
                """, rs -> rs.next() ? rs.getBigDecimal("amount") : BigDecimal.ZERO, routeId, fareType);
    }

    private BigDecimal subsidyAmount(Integer universityId, BigDecimal monthlyFare) {
        if (universityId == null || monthlyFare == null || monthlyFare.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return jdbcTemplate.query("""
                SELECT subsidy_type, value, max_amount
                FROM subsidy_policies
                WHERE university_id = ?
                  AND status = 'ACTIVE'
                  AND active_from <= CURRENT_DATE
                  AND (active_until IS NULL OR active_until >= CURRENT_DATE)
                ORDER BY active_from DESC, subsidy_policy_id DESC
                LIMIT 1
                """, rs -> {
            if (!rs.next()) {
                return BigDecimal.ZERO;
            }
            String type = rs.getString("subsidy_type");
            BigDecimal value = rs.getBigDecimal("value");
            BigDecimal maxAmount = rs.getBigDecimal("max_amount");
            BigDecimal amount = "PERCENTAGE".equalsIgnoreCase(type)
                    ? monthlyFare.multiply(value).divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP)
                    : value;
            if (maxAmount != null && maxAmount.compareTo(BigDecimal.ZERO) > 0) {
                amount = amount.min(maxAmount);
            }
            return amount.min(monthlyFare).max(BigDecimal.ZERO);
        }, universityId);
    }

    private OffsetDateTime toOffset(java.sql.Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toInstant().atOffset(ZoneOffset.UTC);
    }

    public record StudentContext(
            Integer userId,
            String fullName,
            String verificationStatus,
            String studentCode,
            Integer universityId,
            String universityName) {
    }

    public record RegistrationSnapshot(
            Integer registrationId,
            Integer routeId,
            String routeCode,
            String routeName,
            Integer boardingStopId,
            String boardingStopName,
            Integer alightingStopId,
            String alightingStopName,
            String status,
            LocalDate effectiveDate) {
    }

    public record TicketSnapshot(
            Integer ticketId,
            String ticketType,
            Integer routeId,
            String routeCode,
            String routeName,
            String status,
            BigDecimal amount,
            OffsetDateTime expiresAt) {
    }

    public record RouteCandidate(
            Integer routeId,
            String routeCode,
            String routeName,
            String colorHex,
            BigDecimal distanceKm,
            Integer estimatedMinutes,
            Integer frequencyMin,
            boolean universityLinked,
            List<AiDtos.RouteStopCard> stops,
            BigDecimal singleFare,
            BigDecimal monthlyFare,
            BigDecimal subsidyAmount,
            BigDecimal finalFare,
            List<String> nextDepartures) {
    }
}
