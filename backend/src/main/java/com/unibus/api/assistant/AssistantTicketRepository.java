package com.unibus.api.assistant;

import java.sql.Date;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Time;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.unibus.api.assistant.AssistantTicketDtos.ConductorTripView;
import com.unibus.api.assistant.AssistantTicketDtos.ScanTicketResult;

@Repository
public class AssistantTicketRepository {

    private final JdbcTemplate jdbcTemplate;

    public AssistantTicketRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Optional<Integer> conductorIdForUser(Integer userId) {
        List<Integer> ids = jdbcTemplate.queryForList("SELECT conductor_id FROM conductors WHERE user_id = ?", Integer.class, userId);
        return ids.stream().findFirst();
    }

    public List<ConductorTripView> findConductorTrips(Integer conductorId, LocalDate serviceDate) {
        return jdbcTemplate.query("""
                SELECT t.trip_id, t.route_id, r.route_name, COALESCE(b.license_plate, 'N/A') AS license_plate,
                       t.service_date, NULL::time AS departure_time, t.status
                FROM trips t
                JOIN routes r ON r.route_id = t.route_id
                LEFT JOIN buses b ON b.bus_id = t.bus_id
                WHERE t.conductor_id = ?
                  AND t.service_date = ?
                ORDER BY t.departed_at NULLS LAST, t.trip_id DESC
                """, (rs, rowNum) -> mapTrip(rs), conductorId, serviceDate);
    }

    public boolean conductorOwnsTrip(Integer conductorId, Integer tripId) {
        Boolean owns = jdbcTemplate.queryForObject("""
                SELECT EXISTS (
                    SELECT 1
                    FROM trips
                    WHERE trip_id = ?
                      AND conductor_id = ?
                )
                """, Boolean.class, tripId, conductorId);
        return Boolean.TRUE.equals(owns);
    }

    public Optional<MonthlyPassScanContext> findMonthlyPassByQr(String qrCode) {
        List<MonthlyPassScanContext> rows = jdbcTemplate.query("""
                SELECT mp.monthly_pass_id, mp.qr_code, mp.student_code, u.full_name AS student_name, u.email,
                       mp.route_id, r.route_name, mp.fare_amount, mp.valid_from, mp.expires_on,
                       mp.status, mp.last_scanned_at, mp.scans_today
                FROM monthly_passes mp
                JOIN students s ON s.student_code = mp.student_code
                JOIN users u ON u.user_id = s.user_id
                JOIN routes r ON r.route_id = mp.route_id
                WHERE mp.qr_code = ?
                LIMIT 1
                """, (rs, rowNum) -> mapMonthlyPass(rs), qrCode);
        return rows.stream().findFirst();
    }

    public Optional<Integer> routeIdForTrip(Integer tripId) {
        List<Integer> rows = jdbcTemplate.queryForList("SELECT route_id FROM trips WHERE trip_id = ?", Integer.class, tripId);
        return rows.stream().findFirst();
    }

    public ScanTicketResult recordMonthlyPassScan(MonthlyPassScanContext pass, Integer tripId, Integer conductorId) {
        jdbcTemplate.update("""
                UPDATE monthly_passes
                SET last_scanned_at = CURRENT_TIMESTAMP,
                    scans_today = CASE
                        WHEN last_scanned_at::date = CURRENT_DATE THEN scans_today + 1
                        ELSE 1
                    END
                WHERE monthly_pass_id = ?
                """, pass.monthlyPassId());

        jdbcTemplate.update("""
                INSERT INTO travel_history(student_code, trip_id, boarding_stop_id, alighting_stop_id,
                                           boarded_at, confirmation_method, confirmed_by_conductor_id)
                SELECT ?, ?, rr.boarding_stop_id, rr.alighting_stop_id,
                       CURRENT_TIMESTAMP, 'QR_SCAN', ?
                FROM route_registrations rr
                WHERE rr.student_code = ?
                  AND rr.route_id = ?
                  AND rr.status = 'APPROVED'
                ORDER BY rr.approved_at DESC NULLS LAST, rr.registered_at DESC
                LIMIT 1
                """, pass.studentCode(), tripId, conductorId, pass.studentCode(), pass.routeId());

        MonthlyPassScanContext updated = findMonthlyPassByQr(pass.qrCode()).orElse(pass);
        return new ScanTicketResult(
                true,
                "Vé tháng hợp lệ. Đã ghi nhận sinh viên lên xe.",
                "MONTHLY",
                updated.monthlyPassId(),
                updated.qrCode(),
                updated.studentCode(),
                updated.studentName(),
                updated.email(),
                updated.routeId(),
                updated.routeName(),
                updated.fareAmount(),
                updated.validFrom(),
                updated.expiresAt(),
                updated.lastScannedAt(),
                updated.scansToday());
    }

    private ConductorTripView mapTrip(ResultSet rs) throws SQLException {
        return new ConductorTripView(
                rs.getInt("trip_id"),
                rs.getInt("route_id"),
                rs.getString("route_name"),
                rs.getString("license_plate"),
                rs.getObject("service_date", LocalDate.class),
                toLocalTime(rs.getTime("departure_time")),
                rs.getString("status"));
    }

    private MonthlyPassScanContext mapMonthlyPass(ResultSet rs) throws SQLException {
        return new MonthlyPassScanContext(
                rs.getInt("monthly_pass_id"),
                rs.getString("qr_code"),
                rs.getString("student_code"),
                rs.getString("student_name"),
                rs.getString("email"),
                rs.getInt("route_id"),
                rs.getString("route_name"),
                rs.getBigDecimal("fare_amount"),
                toOffsetDateTime(rs.getDate("valid_from")),
                toOffsetDateTime(rs.getDate("expires_on")),
                rs.getString("status"),
                toOffsetDateTime(rs.getTimestamp("last_scanned_at")),
                rs.getInt("scans_today"));
    }

    private LocalTime toLocalTime(Time time) {
        return time == null ? null : time.toLocalTime();
    }

    private OffsetDateTime toOffsetDateTime(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toInstant().atOffset(ZoneOffset.UTC);
    }

    private OffsetDateTime toOffsetDateTime(Date date) {
        return date == null ? null : date.toLocalDate().atStartOfDay().atOffset(ZoneOffset.UTC);
    }

    public record MonthlyPassScanContext(
            Integer monthlyPassId,
            String qrCode,
            String studentCode,
            String studentName,
            String email,
            Integer routeId,
            String routeName,
            java.math.BigDecimal fareAmount,
            OffsetDateTime validFrom,
            OffsetDateTime expiresAt,
            String status,
            OffsetDateTime lastScannedAt,
            Integer scansToday) {
    }
}
