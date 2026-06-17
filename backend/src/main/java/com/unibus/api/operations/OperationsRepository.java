package com.unibus.api.operations;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Time;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.unibus.api.operations.OperationsDtos.BusOption;
import com.unibus.api.operations.OperationsDtos.DriverTripView;
import com.unibus.api.operations.OperationsDtos.RouteOption;
import com.unibus.api.operations.OperationsDtos.ShiftAssignment;
import com.unibus.api.operations.OperationsDtos.ShiftView;
import com.unibus.api.operations.OperationsDtos.StaffOption;
import com.unibus.api.operations.OperationsDtos.TripStopView;

@Repository
public class OperationsRepository {

    private final JdbcTemplate jdbcTemplate;

    public OperationsRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<ShiftView> findShifts(LocalDate serviceDate) {
        int weekday = serviceDate.getDayOfWeek().getValue();
        return jdbcTemplate.query("""
                SELECT bs.schedule_id, t.trip_id, bs.route_id, r.route_name,
                       bs.bus_id, b.license_plate, bs.driver_id, du.full_name AS driver_name,
                       bs.conductor_id, cu.full_name AS conductor_name,
                       bs.weekday_number, bs.departure_time,
                       COALESCE(t.status, bs.status) AS status
                FROM bus_schedules bs
                JOIN routes r ON r.route_id = bs.route_id
                LEFT JOIN buses b ON b.bus_id = bs.bus_id
                LEFT JOIN drivers d ON d.driver_id = bs.driver_id
                LEFT JOIN users du ON du.user_id = d.user_id
                LEFT JOIN conductors c ON c.conductor_id = bs.conductor_id
                LEFT JOIN users cu ON cu.user_id = c.user_id
                LEFT JOIN LATERAL (
                    SELECT trip_id, status
                    FROM trips
                    WHERE schedule_id = bs.schedule_id AND service_date = ?
                    ORDER BY trip_id DESC
                    LIMIT 1
                ) t ON TRUE
                WHERE bs.weekday_number = ?
                ORDER BY bs.departure_time, r.route_name
                """, (rs, rowNum) -> mapShift(rs), serviceDate, weekday);
    }

    public List<StaffOption> findStaff(String role) {
        if ("DRIVER".equals(role)) {
            return jdbcTemplate.query("""
                    SELECT d.driver_id AS staff_id, u.user_id, u.full_name, u.role, d.work_status
                    FROM drivers d
                    JOIN users u ON u.user_id = d.user_id
                    WHERE u.role = 'DRIVER' AND u.status = 'ACTIVE'
                    ORDER BY u.full_name
                    """, (rs, rowNum) -> mapStaff(rs));
        }
        if ("CONDUCTOR".equals(role)) {
            return jdbcTemplate.query("""
                    SELECT c.conductor_id AS staff_id, u.user_id, u.full_name, u.role, 'READY' AS work_status
                    FROM conductors c
                    JOIN users u ON u.user_id = c.user_id
                    WHERE u.role = 'CONDUCTOR' AND u.status = 'ACTIVE'
                    ORDER BY u.full_name
                    """, (rs, rowNum) -> mapStaff(rs));
        }
        return List.of();
    }

    public List<BusOption> findBuses() {
        return jdbcTemplate.query("""
                SELECT bus_id, license_plate, seat_count, bus_type, status
                FROM buses
                ORDER BY license_plate
                """, (rs, rowNum) -> new BusOption(
                        rs.getInt("bus_id"),
                        rs.getString("license_plate"),
                        rs.getInt("seat_count"),
                        rs.getString("bus_type"),
                        rs.getString("status")));
    }

    public List<RouteOption> findRoutes() {
        return jdbcTemplate.query("""
                SELECT route_id, route_name
                FROM routes
                WHERE status = 'ACTIVE'
                ORDER BY route_name
                """, (rs, rowNum) -> new RouteOption(rs.getInt("route_id"), rs.getString("route_name")));
    }

    public int saveSchedule(ShiftAssignment shift, Integer assignedByUserId) {
        if (shift.scheduleId() != null) {
            jdbcTemplate.update("""
                    UPDATE bus_schedules
                    SET route_id = COALESCE(?, route_id),
                        bus_id = ?,
                        driver_id = ?,
                        conductor_id = ?,
                        weekday_number = COALESCE(?, weekday_number),
                        departure_time = COALESCE(?, departure_time),
                        assigned_by_user_id = ?,
                        assigned_at = CURRENT_TIMESTAMP
                    WHERE schedule_id = ?
                    """, shift.routeId(), shift.busId(), shift.driverStaffId(), shift.conductorStaffId(),
                    shift.weekdayNumber(), shift.departureTime(), assignedByUserId, shift.scheduleId());
            return shift.scheduleId();
        }
        Integer id = jdbcTemplate.queryForObject("""
                INSERT INTO bus_schedules(route_id, bus_id, driver_id, conductor_id, weekday_number, departure_time, assigned_by_user_id, assigned_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                RETURNING schedule_id
                """, Integer.class, shift.routeId(), shift.busId(), shift.driverStaffId(), shift.conductorStaffId(),
                shift.weekdayNumber(), shift.departureTime(), assignedByUserId);
        return id == null ? 0 : id;
    }

    public void ensureTrip(Integer scheduleId, LocalDate serviceDate) {
        jdbcTemplate.update("""
                INSERT INTO trips(schedule_id, route_id, bus_id, driver_id, conductor_id, service_date)
                SELECT schedule_id, route_id, bus_id, driver_id, conductor_id, ?
                FROM bus_schedules bs
                WHERE bs.schedule_id = ?
                  AND bs.bus_id IS NOT NULL
                  AND bs.driver_id IS NOT NULL
                  AND NOT EXISTS (
                      SELECT 1 FROM trips t
                      WHERE t.schedule_id = bs.schedule_id
                        AND t.service_date = ?
                  )
                """, serviceDate, scheduleId, serviceDate);
    }

    public Integer staffIdForUser(Integer userId, String expectedRole) {
        String table = "DRIVER".equals(expectedRole) ? "drivers" : "conductors";
        String idColumn = "DRIVER".equals(expectedRole) ? "driver_id" : "conductor_id";
        List<Integer> ids = jdbcTemplate.queryForList("""
                SELECT %s
                FROM %s
                WHERE user_id = ?
                """.formatted(idColumn, table), Integer.class, userId);
        return ids.isEmpty() ? null : ids.get(0);
    }

    public List<DriverTripView> findDriverTrips(Integer driverId, LocalDate serviceDate) {
        return jdbcTemplate.query("""
                SELECT schedule_id, trip_id, route_id, route_name, bus_id, license_plate,
                       conductor_name, conductor_phone, service_date, departure_time,
                       departed_at, ended_at, status
                FROM (
                    SELECT bs.schedule_id, t.trip_id, t.route_id, r.route_name,
                           t.bus_id, b.license_plate, cu.full_name AS conductor_name, cu.phone_number AS conductor_phone,
                           t.service_date, bs.departure_time, t.departed_at, t.ended_at, t.status
                    FROM trips t
                    LEFT JOIN bus_schedules bs ON bs.schedule_id = t.schedule_id
                    JOIN routes r ON r.route_id = t.route_id
                    LEFT JOIN buses b ON b.bus_id = t.bus_id
                    LEFT JOIN conductors c ON c.conductor_id = COALESCE(t.conductor_id, bs.conductor_id)
                    LEFT JOIN users cu ON cu.user_id = c.user_id
                    WHERE t.driver_id = ?
                      AND t.service_date = ?

                    UNION ALL

                    SELECT bs.schedule_id, NULL AS trip_id, bs.route_id, r.route_name,
                           bs.bus_id, b.license_plate, cu.full_name AS conductor_name, cu.phone_number AS conductor_phone,
                           ?::date AS service_date, bs.departure_time, NULL AS departed_at, NULL AS ended_at,
                           'NOT_CREATED' AS status
                    FROM bus_schedules bs
                    JOIN routes r ON r.route_id = bs.route_id
                    LEFT JOIN buses b ON b.bus_id = bs.bus_id
                    LEFT JOIN conductors c ON c.conductor_id = bs.conductor_id
                    LEFT JOIN users cu ON cu.user_id = c.user_id
                    WHERE bs.driver_id = ?
                      AND bs.weekday_number = ?
                      AND NOT EXISTS (
                          SELECT 1
                          FROM trips t
                          WHERE t.schedule_id = bs.schedule_id
                            AND t.service_date = ?
                      )
                ) driver_trips
                ORDER BY departure_time NULLS LAST, route_name, trip_id
                """, (rs, rowNum) -> mapDriverTrip(rs),
                driverId, serviceDate, serviceDate, driverId, serviceDate.getDayOfWeek().getValue(), serviceDate);
    }

    public DriverTripView findDriverTrip(Integer tripId, Integer driverId) {
        List<DriverTripView> rows = jdbcTemplate.query("""
                SELECT bs.schedule_id, t.trip_id, t.route_id, r.route_name,
                       t.bus_id, b.license_plate, cu.full_name AS conductor_name, cu.phone_number AS conductor_phone,
                       t.service_date, bs.departure_time, t.departed_at, t.ended_at, t.status
                FROM trips t
                JOIN bus_schedules bs ON bs.schedule_id = t.schedule_id
                JOIN routes r ON r.route_id = t.route_id
                JOIN buses b ON b.bus_id = t.bus_id
                LEFT JOIN conductors c ON c.conductor_id = t.conductor_id
                LEFT JOIN users cu ON cu.user_id = c.user_id
                WHERE t.trip_id = ?
                  AND t.driver_id = ?
                """, (rs, rowNum) -> mapDriverTrip(rs), tripId, driverId);
        return rows.isEmpty() ? null : rows.get(0);
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

    public void startTrip(Integer tripId) {
        jdbcTemplate.update("""
                UPDATE trips
                SET status = 'RUNNING',
                    departed_at = COALESCE(departed_at, CURRENT_TIMESTAMP)
                WHERE trip_id = ?
                  AND status IN ('NOT_STARTED', 'RUNNING')
                """, tripId);
    }

    public void endTrip(Integer tripId) {
        jdbcTemplate.update("""
                UPDATE trips
                SET status = 'COMPLETED',
                    ended_at = COALESCE(ended_at, CURRENT_TIMESTAMP)
                WHERE trip_id = ?
                  AND status IN ('RUNNING', 'NOT_STARTED', 'COMPLETED')
                """, tripId);
    }

    public List<TripStopView> findTripStopsBySchedule(Integer scheduleId) {
        if (scheduleId == null) {
            return List.of();
        }
        return jdbcTemplate.query("""
                SELECT rs.route_stop_id, s.stop_id, s.stop_name, rs.stop_order, rs.minutes_from_previous_stop
                FROM bus_schedules bs
                JOIN route_stops rs ON rs.route_id = bs.route_id
                JOIN stops s ON s.stop_id = rs.stop_id
                WHERE bs.schedule_id = ?
                ORDER BY rs.stop_order
                """, (rs, rowNum) -> new TripStopView(
                        rs.getInt("route_stop_id"),
                        rs.getInt("stop_id"),
                        rs.getString("stop_name"),
                        rs.getInt("stop_order"),
                        (Integer) rs.getObject("minutes_from_previous_stop")), scheduleId);
    }

    public void updateTripLocation(Integer tripId, double longitude, double latitude, Double speedKmh) {
        Integer busId = jdbcTemplate.queryForObject("SELECT bus_id FROM trips WHERE trip_id = ?", Integer.class, tripId);
        jdbcTemplate.update("DELETE FROM vehicle_locations WHERE trip_id = ?", tripId);
        jdbcTemplate.update("""
                INSERT INTO vehicle_locations(bus_id, trip_id, longitude, latitude, speed_kmh)
                VALUES (?, ?, ?, ?, ?)
                """, busId, tripId, longitude, latitude, speedKmh);
    }

    private StaffOption mapStaff(ResultSet rs) throws SQLException {
        return new StaffOption(
                rs.getInt("staff_id"),
                rs.getInt("user_id"),
                rs.getString("full_name"),
                rs.getString("role"),
                rs.getString("work_status"));
    }

    private ShiftView mapShift(ResultSet rs) throws SQLException {
        LocalTime departure = toLocalTime(rs.getTime("departure_time"));
        return new ShiftView(
                rs.getInt("schedule_id"),
                (Integer) rs.getObject("trip_id"),
                rs.getInt("route_id"),
                rs.getString("route_name"),
                (Integer) rs.getObject("bus_id"),
                rs.getString("license_plate"),
                (Integer) rs.getObject("driver_id"),
                rs.getString("driver_name"),
                (Integer) rs.getObject("conductor_id"),
                rs.getString("conductor_name"),
                rs.getInt("weekday_number"),
                departure,
                departure == null ? "" : departure.toString(),
                rs.getString("status"));
    }

    private DriverTripView mapDriverTrip(ResultSet rs) throws SQLException {
        Integer scheduleId = (Integer) rs.getObject("schedule_id");
        return new DriverTripView(
                scheduleId,
                (Integer) rs.getObject("trip_id"),
                rs.getInt("route_id"),
                rs.getString("route_name"),
                (Integer) rs.getObject("bus_id"),
                rs.getString("license_plate"),
                rs.getString("conductor_name"),
                rs.getString("conductor_phone"),
                rs.getObject("service_date", LocalDate.class),
                toLocalTime(rs.getTime("departure_time")),
                toOffsetDateTime(rs.getTimestamp("departed_at")),
                toOffsetDateTime(rs.getTimestamp("ended_at")),
                rs.getString("status"),
                findTripStopsBySchedule(scheduleId));
    }

    private LocalTime toLocalTime(Time time) {
        return time == null ? null : time.toLocalTime();
    }

    private OffsetDateTime toOffsetDateTime(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toInstant().atOffset(ZoneOffset.UTC);
    }
}
