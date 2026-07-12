package com.unibus.api.operations;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Time;
import java.sql.Timestamp;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.unibus.api.operations.OperationsDtos.BusOption;
import com.unibus.api.operations.OperationsDtos.DriverTripView;
import com.unibus.api.operations.OperationsDtos.DriverContactView;
import com.unibus.api.operations.OperationsDtos.ContactPersonView;
import com.unibus.api.operations.OperationsDtos.ConductorContactView;
import com.unibus.api.operations.OperationsDtos.ConductorTicketView;
import com.unibus.api.operations.OperationsDtos.ConductorTripView;
import com.unibus.api.operations.OperationsDtos.InternalMessageView;
import com.unibus.api.operations.OperationsDtos.LiveFleetVehicle;
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
                      AND (t.service_date = ? OR t.status = 'RUNNING')

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

    public List<DriverTripView> findDriverTripHistory(Integer driverId, LocalDate fromDate, LocalDate toDate) {
        return jdbcTemplate.query("""
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
                  AND t.service_date BETWEEN ? AND ?
                  AND t.status IN ('COMPLETED', 'CANCELLED')
                ORDER BY t.service_date DESC, COALESCE(t.ended_at, t.departed_at) DESC NULLS LAST, bs.departure_time DESC NULLS LAST, t.trip_id DESC
                """, (rs, rowNum) -> mapDriverTrip(rs),
                driverId, fromDate, toDate);
    }

    public List<DriverTripView> findDriverUpcomingActualTrips(Integer driverId, LocalDate fromDate, LocalDate toDate) {
        return jdbcTemplate.query("""
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
                  AND (t.service_date BETWEEN ? AND ? OR t.status = 'RUNNING')
                  AND t.status NOT IN ('COMPLETED', 'CANCELLED')
                ORDER BY t.service_date, bs.departure_time NULLS LAST, t.trip_id
                """, (rs, rowNum) -> mapDriverTrip(rs),
                driverId, fromDate, toDate);
    }

    public List<DriverScheduleTemplate> findDriverScheduleTemplates(Integer driverId) {
        return jdbcTemplate.query("""
                SELECT bs.schedule_id, bs.route_id, r.route_name,
                       bs.bus_id, b.license_plate, cu.full_name AS conductor_name, cu.phone_number AS conductor_phone,
                       bs.weekday_number, bs.departure_time
                FROM bus_schedules bs
                JOIN routes r ON r.route_id = bs.route_id
                LEFT JOIN buses b ON b.bus_id = bs.bus_id
                LEFT JOIN conductors c ON c.conductor_id = bs.conductor_id
                LEFT JOIN users cu ON cu.user_id = c.user_id
                WHERE bs.driver_id = ?
                  AND bs.status = 'ACTIVE'
                ORDER BY bs.weekday_number, bs.departure_time NULLS LAST, r.route_name
                """, (rs, rowNum) -> mapDriverScheduleTemplate(rs), driverId);
    }

    public List<ConductorTripView> findConductorTrips(Integer conductorId, LocalDate serviceDate) {
        return jdbcTemplate.query("""
                WITH assigned_trips AS (
                    SELECT t.schedule_id, t.trip_id, t.route_id, r.route_name,
                           t.bus_id, b.license_plate, du.full_name AS driver_name, du.phone_number AS driver_phone,
                           t.service_date, bs.departure_time, t.departed_at, t.ended_at, t.status
                    FROM trips t
                    JOIN routes r ON r.route_id = t.route_id
                    LEFT JOIN bus_schedules bs ON bs.schedule_id = t.schedule_id
                    LEFT JOIN buses b ON b.bus_id = t.bus_id
                    LEFT JOIN drivers d ON d.driver_id = t.driver_id
                    LEFT JOIN users du ON du.user_id = d.user_id
                    WHERE t.conductor_id = ?
                      AND t.service_date = ?
                )
                SELECT schedule_id, trip_id, route_id, route_name,
                       bus_id, license_plate, driver_name, driver_phone,
                       service_date, departure_time, departed_at, ended_at, status
                FROM assigned_trips
                UNION ALL
                SELECT bs.schedule_id, t.trip_id, bs.route_id, r.route_name,
                       bs.bus_id, b.license_plate, du.full_name AS driver_name, du.phone_number AS driver_phone,
                       CAST(? AS date) AS service_date, bs.departure_time, t.departed_at, t.ended_at,
                       COALESCE(t.status, 'NOT_CREATED') AS status
                FROM bus_schedules bs
                JOIN routes r ON r.route_id = bs.route_id
                LEFT JOIN buses b ON b.bus_id = bs.bus_id
                LEFT JOIN drivers d ON d.driver_id = bs.driver_id
                LEFT JOIN users du ON du.user_id = d.user_id
                LEFT JOIN trips t ON t.trip_id = (
                    SELECT latest.trip_id
                    FROM trips latest
                    WHERE latest.schedule_id = bs.schedule_id
                      AND latest.service_date = ?
                    ORDER BY latest.trip_id DESC
                    LIMIT 1
                )
                WHERE bs.conductor_id = ?
                  AND bs.weekday_number = ?
                  AND NOT EXISTS (
                      SELECT 1
                      FROM assigned_trips at
                      WHERE at.schedule_id = bs.schedule_id
                  )
                ORDER BY departure_time NULLS LAST, route_name
                """, (rs, rowNum) -> mapConductorTrip(rs),
                conductorId,
                serviceDate,
                serviceDate,
                serviceDate,
                conductorId,
                serviceDate.getDayOfWeek().getValue());
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

    public boolean conductorOwnsTrip(Integer tripId, Integer conductorId) {
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

    public Integer activeConductorTripId(Integer conductorId) {
        List<Integer> ids = jdbcTemplate.queryForList("""
                SELECT trip_id
                FROM trips
                WHERE conductor_id = ?
                  AND service_date = CURRENT_DATE
                  AND status IN ('RUNNING', 'NOT_STARTED')
                ORDER BY CASE status WHEN 'RUNNING' THEN 0 ELSE 1 END, departed_at NULLS LAST, trip_id DESC
                LIMIT 1
                """, Integer.class, conductorId);
        return ids.isEmpty() ? null : ids.get(0);
    }

    public ConductorContactView findConductorContact(Integer conductorUserId, Integer conductorId, Integer activeTripId) {
        List<ConductorTripContact> tripRows = activeTripId == null ? List.of() : jdbcTemplate.query("""
                SELECT t.trip_id, r.route_name, du.full_name AS driver_name, du.phone_number AS driver_phone
                FROM trips t
                JOIN routes r ON r.route_id = t.route_id
                LEFT JOIN drivers d ON d.driver_id = t.driver_id
                LEFT JOIN users du ON du.user_id = d.user_id
                WHERE t.trip_id = ?
                  AND t.conductor_id = ?
                """, (rs, rowNum) -> new ConductorTripContact(
                        rs.getInt("trip_id"),
                        rs.getString("route_name"),
                        rs.getString("driver_name"),
                        rs.getString("driver_phone")), activeTripId, conductorId);
        ConductorTripContact trip = tripRows.isEmpty() ? null : tripRows.get(0);
        return new ConductorContactView(
                activeTripId,
                trip == null ? null : trip.routeName(),
                trip == null ? null : trip.driverName(),
                trip == null ? null : trip.driverPhone(),
                findConductorContacts(activeTripId),
                findConductorMessages(conductorUserId, activeTripId, 50));
    }

    public List<ContactPersonView> findConductorContacts(Integer activeTripId) {
        return jdbcTemplate.query("""
                SELECT user_id, full_name, role, phone_number, primary_order
                FROM (
                    SELECT du.user_id, du.full_name, 'DRIVER' AS role, du.phone_number, 0 AS primary_order
                    FROM trips t
                    JOIN drivers d ON d.driver_id = t.driver_id
                    JOIN users du ON du.user_id = d.user_id
                    WHERE t.trip_id = ?
                    UNION ALL
                    SELECT u.user_id, u.full_name, 'DISPATCHER' AS role, u.phone_number, 1 AS primary_order
                    FROM users u
                    WHERE u.role = 'DISPATCHER'
                      AND u.status = 'ACTIVE'
                ) contacts
                ORDER BY primary_order, full_name
                """, (rs, rowNum) -> new ContactPersonView(
                        rs.getInt("user_id"),
                        rs.getString("full_name"),
                        rs.getString("role"),
                        rs.getString("phone_number"),
                        rs.getInt("primary_order") == 0), activeTripId);
    }

    public Optional<Integer> driverUserIdForTrip(Integer tripId) {
        List<Integer> ids = jdbcTemplate.queryForList("""
                SELECT u.user_id
                FROM trips t
                JOIN drivers d ON d.driver_id = t.driver_id
                JOIN users u ON u.user_id = d.user_id
                WHERE t.trip_id = ?
                """, Integer.class, tripId);
        return ids.stream().findFirst();
    }

    public Optional<Integer> firstDispatcherUserId() {
        List<Integer> ids = jdbcTemplate.queryForList("""
                SELECT user_id
                FROM users
                WHERE role = 'DISPATCHER'
                  AND status = 'ACTIVE'
                ORDER BY user_id
                LIMIT 1
                """, Integer.class);
        return ids.stream().findFirst();
    }

    public List<DriverContactView> findDriverDispatcherContacts() {
        return jdbcTemplate.query("""
                SELECT user_id, full_name, phone_number, email
                FROM users
                WHERE role = 'DISPATCHER'
                  AND status = 'ACTIVE'
                ORDER BY full_name
                """, (rs, rowNum) -> new DriverContactView(
                        rs.getInt("user_id"),
                        "COORDINATOR",
                        rs.getString("full_name"),
                        "Điều phối viên",
                        rs.getString("phone_number"),
                        rs.getString("email")));
    }

    public InternalMessageView createInternalMessage(Integer senderUserId, Integer recipientUserId, Integer tripId, String content) {
        return jdbcTemplate.queryForObject("""
                INSERT INTO internal_messages(sender_user_id, recipient_user_id, trip_id, content)
                VALUES (?, ?, ?, ?)
                RETURNING message_id, sender_user_id,
                          (SELECT full_name FROM users WHERE user_id = internal_messages.sender_user_id) AS sender_name,
                          recipient_user_id,
                          (SELECT full_name FROM users WHERE user_id = internal_messages.recipient_user_id) AS recipient_name,
                          trip_id, content, is_read, sent_at
                """, (rs, rowNum) -> mapInternalMessage(rs), senderUserId, recipientUserId, tripId, content);
    }

    public List<InternalMessageView> findConductorMessages(Integer conductorUserId, Integer tripId, int limit) {
        return jdbcTemplate.query("""
                SELECT m.message_id, m.sender_user_id, sender.full_name AS sender_name,
                       m.recipient_user_id, recipient.full_name AS recipient_name,
                       m.trip_id, m.content, m.is_read, m.sent_at
                FROM internal_messages m
                JOIN users sender ON sender.user_id = m.sender_user_id
                JOIN users recipient ON recipient.user_id = m.recipient_user_id
                WHERE (m.sender_user_id = ? OR m.recipient_user_id = ?)
                  AND (? IS NULL OR m.trip_id = ?)
                ORDER BY m.sent_at DESC, m.message_id DESC
                LIMIT ?
                """, (rs, rowNum) -> mapInternalMessage(rs), conductorUserId, conductorUserId, tripId, tripId, limit);
    }

    public void createNotification(Integer senderUserId, Integer recipientUserId, String title, String content) {
        jdbcTemplate.update("""
                INSERT INTO notifications(recipient_user_id, sender_user_id, title, content, notification_type)
                VALUES (?, ?, ?, ?, 'ALERT')
                """, recipientUserId, senderUserId, title, content);
    }

    public Long createIncident(Integer conductorId, Integer tripId, String incidentType, String description) {
        return jdbcTemplate.queryForObject("""
                INSERT INTO incidents(conductor_id, trip_id, incident_type, description)
                VALUES (?, ?, ?, ?)
                RETURNING incident_id
                """, Long.class, conductorId, tripId, incidentType, description);
    }

    public Long createLostItemReport(Integer reportedByUserId, Integer tripId, String itemDescription, Integer assistedByUserId) {
        return jdbcTemplate.queryForObject("""
                INSERT INTO lost_item_reports(reported_by_user_id, trip_id, item_description, assisted_by_user_id)
                VALUES (?, ?, ?, ?)
                RETURNING lost_item_report_id
                """, Long.class, reportedByUserId, tripId, itemDescription, assistedByUserId);
    }

    public Optional<TripRouteInfo> tripRouteInfo(Integer tripId) {
        List<TripRouteInfo> rows = jdbcTemplate.query("""
                SELECT t.trip_id, t.route_id, t.service_date, bs.departure_time, t.departed_at, t.ended_at, t.status
                FROM trips t
                LEFT JOIN bus_schedules bs ON bs.schedule_id = t.schedule_id
                WHERE t.trip_id = ?
                """, (rs, rowNum) -> new TripRouteInfo(
                        rs.getInt("trip_id"),
                        rs.getInt("route_id"),
                        rs.getObject("service_date", LocalDate.class),
                        toLocalTime(rs.getTime("departure_time")),
                        toOffsetDateTime(rs.getTimestamp("departed_at")),
                        toOffsetDateTime(rs.getTimestamp("ended_at")),
                        rs.getString("status")), tripId);
        return rows.stream().findFirst();
    }

    public List<ConductorTicketView> findTicketsForTrip(Integer tripId) {
        return jdbcTemplate.query("""
                WITH trip_scope AS (
                    SELECT route_id, service_date
                    FROM trips
                    WHERE trip_id = ?
                )
                SELECT 'MONTHLY' AS ticket_kind, mp.monthly_pass_id AS ticket_id, mp.qr_code,
                       mp.student_code, u.full_name AS student_name, mp.route_id, r.route_name,
                       bs.stop_name AS boarding_stop_name, als.stop_name AS alighting_stop_name,
                       mp.status, mp.valid_from::timestamptz AS valid_from, mp.expires_on::timestamptz AS expires_at,
                       mp.last_scanned_at
                FROM monthly_passes mp
                JOIN trip_scope ts ON ts.route_id = mp.route_id
                JOIN students s ON s.student_code = mp.student_code
                JOIN users u ON u.user_id = s.user_id
                JOIN routes r ON r.route_id = mp.route_id
                LEFT JOIN LATERAL (
                    SELECT boarding_stop_id, alighting_stop_id
                    FROM route_registrations rr
                    WHERE rr.student_code = mp.student_code
                      AND rr.route_id = mp.route_id
                      AND rr.status = 'APPROVED'
                    ORDER BY rr.approved_at DESC NULLS LAST, rr.registered_at DESC
                    LIMIT 1
                ) reg ON TRUE
                LEFT JOIN stops bs ON bs.stop_id = reg.boarding_stop_id
                LEFT JOIN stops als ON als.stop_id = reg.alighting_stop_id
                WHERE mp.status = 'ACTIVE'
                  AND ts.service_date >= mp.valid_from
                  AND ts.service_date < mp.expires_on
                UNION ALL
                SELECT 'SINGLE' AS ticket_kind, st.single_trip_ticket_id AS ticket_id, st.qr_code,
                       st.student_code, u.full_name AS student_name, st.route_id, r.route_name,
                       bs.stop_name AS boarding_stop_name, als.stop_name AS alighting_stop_name,
                       st.status, st.purchased_at AS valid_from, st.expires_at,
                       st.last_scanned_at
                FROM single_trip_tickets st
                JOIN trip_scope ts ON ts.route_id = st.route_id
                JOIN students s ON s.student_code = st.student_code
                JOIN users u ON u.user_id = s.user_id
                JOIN routes r ON r.route_id = st.route_id
                LEFT JOIN stops bs ON bs.stop_id = st.boarding_stop_id
                LEFT JOIN stops als ON als.stop_id = st.alighting_stop_id
                WHERE st.status IN ('UNUSED', 'USED')
                  AND st.expires_at >= CURRENT_TIMESTAMP
                ORDER BY student_name, ticket_kind
                """, (rs, rowNum) -> mapConductorTicket(rs), tripId);
    }

    public Optional<ConductorTicketView> findMonthlyTicketByQr(String qrCode) {
        List<ConductorTicketView> rows = jdbcTemplate.query("""
                SELECT 'MONTHLY' AS ticket_kind, mp.monthly_pass_id AS ticket_id, mp.qr_code,
                       mp.student_code, u.full_name AS student_name, mp.route_id, r.route_name,
                       bs.stop_name AS boarding_stop_name, als.stop_name AS alighting_stop_name,
                       mp.status, mp.valid_from::timestamptz AS valid_from, mp.expires_on::timestamptz AS expires_at,
                       mp.last_scanned_at
                FROM monthly_passes mp
                JOIN students s ON s.student_code = mp.student_code
                JOIN users u ON u.user_id = s.user_id
                JOIN routes r ON r.route_id = mp.route_id
                LEFT JOIN LATERAL (
                    SELECT boarding_stop_id, alighting_stop_id
                    FROM route_registrations rr
                    WHERE rr.student_code = mp.student_code
                      AND rr.route_id = mp.route_id
                      AND rr.status = 'APPROVED'
                    ORDER BY rr.approved_at DESC NULLS LAST, rr.registered_at DESC
                    LIMIT 1
                ) reg ON TRUE
                LEFT JOIN stops bs ON bs.stop_id = reg.boarding_stop_id
                LEFT JOIN stops als ON als.stop_id = reg.alighting_stop_id
                WHERE mp.qr_code = ?
                """, (rs, rowNum) -> mapConductorTicket(rs), qrCode);
        return rows.stream().findFirst();
    }

    public Optional<ConductorTicketView> findJourneyMonthlyTicketByQr(String qrCode, Integer routeId) {
        try {
            List<ConductorTicketView> rows = jdbcTemplate.query("""
                    SELECT 'JOURNEY_MONTHLY' AS ticket_kind, mp.monthly_pass_id AS ticket_id, jo.qr_code,
                           mp.student_code, u.full_name AS student_name, mp.route_id, r.route_name,
                           bs.stop_name AS boarding_stop_name, als.stop_name AS alighting_stop_name,
                           mp.status, mp.valid_from::timestamptz AS valid_from, mp.expires_on::timestamptz AS expires_at,
                           mp.last_scanned_at
                    FROM journey_orders jo
                    JOIN journey_order_items joi ON joi.journey_order_id = jo.journey_order_id
                    JOIN monthly_passes mp ON mp.monthly_pass_id = joi.monthly_pass_id
                    JOIN students s ON s.student_code = mp.student_code
                    JOIN users u ON u.user_id = s.user_id
                    JOIN routes r ON r.route_id = mp.route_id
                    LEFT JOIN stops bs ON bs.stop_id = joi.boarding_stop_id
                    LEFT JOIN stops als ON als.stop_id = joi.alighting_stop_id
                    WHERE jo.qr_code = ?
                      AND jo.status = 'ACTIVE'
                      AND mp.route_id = ?
                    ORDER BY joi.leg_order
                    LIMIT 1
                    """, (rs, rowNum) -> mapConductorTicket(rs), qrCode, routeId);
            return rows.stream().findFirst();
        } catch (org.springframework.dao.DataAccessException ignored) {
            return Optional.empty();
        }
    }

    public Optional<ConductorTicketView> findSingleTicketByQr(String qrCode) {
        List<ConductorTicketView> rows = jdbcTemplate.query("""
                SELECT 'SINGLE' AS ticket_kind, st.single_trip_ticket_id AS ticket_id, st.qr_code,
                       st.student_code, u.full_name AS student_name, st.route_id, r.route_name,
                       bs.stop_name AS boarding_stop_name, als.stop_name AS alighting_stop_name,
                       st.status, st.purchased_at AS valid_from, st.expires_at,
                       st.last_scanned_at
                FROM single_trip_tickets st
                JOIN students s ON s.student_code = st.student_code
                JOIN users u ON u.user_id = s.user_id
                JOIN routes r ON r.route_id = st.route_id
                LEFT JOIN stops bs ON bs.stop_id = st.boarding_stop_id
                LEFT JOIN stops als ON als.stop_id = st.alighting_stop_id
                WHERE st.qr_code = ?
                """, (rs, rowNum) -> mapConductorTicket(rs), qrCode);
        return rows.stream().findFirst();
    }

    public void markMonthlyPassScanned(Integer monthlyPassId) {
        jdbcTemplate.update("""
                UPDATE monthly_passes
                SET scans_today = CASE
                        WHEN last_scanned_at IS NOT NULL AND last_scanned_at::date = CURRENT_DATE THEN scans_today + 1
                        ELSE 1
                    END,
                    last_scanned_at = CURRENT_TIMESTAMP
                WHERE monthly_pass_id = ?
                """, monthlyPassId);
    }

    public int markSingleTicketUsed(Integer singleTicketId, Integer tripId, Integer conductorId) {
        return jdbcTemplate.update("""
                UPDATE single_trip_tickets
                SET status = 'USED',
                    used_on_trip_id = ?,
                    scanned_by_conductor_id = ?,
                    last_scanned_at = CURRENT_TIMESTAMP
                WHERE single_trip_ticket_id = ?
                  AND status = 'UNUSED'
                """, tripId, conductorId, singleTicketId);
    }

    public Integer ensureTravelHistoryForScan(String studentCode, Integer tripId, Integer conductorId, Integer routeId) {
        List<Integer> existing = jdbcTemplate.queryForList("""
                SELECT travel_history_id
                FROM travel_history
                WHERE student_code = ?
                  AND trip_id = ?
                ORDER BY travel_history_id DESC
                LIMIT 1
                """, Integer.class, studentCode, tripId);
        if (!existing.isEmpty()) {
            jdbcTemplate.update("""
                    UPDATE travel_history
                    SET confirmation_method = COALESCE(confirmation_method, 'QR_SCAN'),
                        confirmed_by_conductor_id = COALESCE(confirmed_by_conductor_id, ?)
                    WHERE travel_history_id = ?
                    """, conductorId, existing.get(0));
            return existing.get(0);
        }

        List<RouteStopsForStudent> stops = jdbcTemplate.query("""
                SELECT boarding_stop_id, alighting_stop_id
                FROM route_registrations
                WHERE student_code = ?
                  AND route_id = ?
                  AND status = 'APPROVED'
                ORDER BY approved_at DESC NULLS LAST, registered_at DESC
                LIMIT 1
                """, (rs, rowNum) -> new RouteStopsForStudent(
                        (Integer) rs.getObject("boarding_stop_id"),
                        (Integer) rs.getObject("alighting_stop_id")), studentCode, routeId);
        RouteStopsForStudent selectedStops = stops.isEmpty() ? new RouteStopsForStudent(null, null) : stops.get(0);
        Integer id = jdbcTemplate.queryForObject("""
                INSERT INTO travel_history(
                    student_code,
                    trip_id,
                    boarding_stop_id,
                    alighting_stop_id,
                    boarded_at,
                    confirmation_method,
                    confirmed_by_conductor_id
                )
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, 'QR_SCAN', ?)
                RETURNING travel_history_id
                """, Integer.class, studentCode, tripId, selectedStops.boardingStopId(), selectedStops.alightingStopId(), conductorId);
        return id == null ? 0 : id;
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
                SELECT rs.route_stop_id, s.stop_id, s.stop_name, rs.stop_order, rs.minutes_from_previous_stop,
                       COALESCE(rs.station_direction, 0) AS station_direction, rs.path_points,
                       s.latitude, s.longitude
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
                        (Integer) rs.getObject("minutes_from_previous_stop"),
                        rs.getInt("station_direction"),
                        rs.getString("path_points"),
                        toDouble(rs.getObject("latitude")),
                        toDouble(rs.getObject("longitude"))), scheduleId);
    }

    public void updateTripLocation(Integer tripId, double longitude, double latitude, Double speedKmh,
            Integer occupancy) {
        Integer busId = jdbcTemplate.queryForObject("SELECT bus_id FROM trips WHERE trip_id = ?", Integer.class, tripId);
        // Insert new location point (preserve history for replay/analytics).
        // The latest row is surfaced by findLiveFleet via ROW_NUMBER() OVER (PARTITION BY trip_id ORDER BY updated_at DESC).
        jdbcTemplate.update("""
                INSERT INTO vehicle_locations(bus_id, trip_id, longitude, latitude, speed_kmh, occupancy)
                VALUES (?, ?, ?, ?, ?, ?)
                """, busId, tripId, longitude, latitude, speedKmh, occupancy);
        // Best-effort cleanup of stale points older than 24h to bound table growth.
        jdbcTemplate.update("""
                DELETE FROM vehicle_locations
                WHERE trip_id = ? AND updated_at < NOW() - INTERVAL '24 hours'
                """, tripId);
    }

    public List<LiveFleetVehicle> findLiveFleet(LocalDate serviceDate) {
        return jdbcTemplate.query("""
                SELECT t.trip_id, t.route_id, r.route_name, t.bus_id, b.license_plate,
                       du.full_name AS driver_name, cu.full_name AS conductor_name,
                       t.service_date, bs.departure_time, t.status,
                       vl.longitude, vl.latitude, vl.speed_kmh, vl.occupancy, vl.updated_at AS location_updated_at
                FROM trips t
                JOIN routes r ON r.route_id = t.route_id
                JOIN buses b ON b.bus_id = t.bus_id
                LEFT JOIN bus_schedules bs ON bs.schedule_id = t.schedule_id
                LEFT JOIN drivers d ON d.driver_id = t.driver_id
                LEFT JOIN users du ON du.user_id = d.user_id
                LEFT JOIN conductors c ON c.conductor_id = t.conductor_id
                LEFT JOIN users cu ON cu.user_id = c.user_id
                LEFT JOIN LATERAL (
                    SELECT longitude, latitude, speed_kmh, occupancy, updated_at
                    FROM vehicle_locations
                    WHERE trip_id = t.trip_id
                    ORDER BY updated_at DESC
                    LIMIT 1
                ) vl ON TRUE
                WHERE t.service_date = ?
                  AND t.status IN ('NOT_STARTED', 'RUNNING', 'COMPLETED')
                ORDER BY
                    CASE t.status WHEN 'RUNNING' THEN 0 WHEN 'NOT_STARTED' THEN 1 ELSE 2 END,
                    bs.departure_time NULLS LAST,
                    r.route_name
                """, (rs, rowNum) -> mapLiveFleetVehicle(rs), serviceDate);
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

    private DriverScheduleTemplate mapDriverScheduleTemplate(ResultSet rs) throws SQLException {
        Integer scheduleId = (Integer) rs.getObject("schedule_id");
        return new DriverScheduleTemplate(
                scheduleId,
                rs.getInt("route_id"),
                rs.getString("route_name"),
                (Integer) rs.getObject("bus_id"),
                rs.getString("license_plate"),
                rs.getString("conductor_name"),
                rs.getString("conductor_phone"),
                rs.getInt("weekday_number"),
                toLocalTime(rs.getTime("departure_time")),
                findTripStopsBySchedule(scheduleId));
    }

    private ConductorTripView mapConductorTrip(ResultSet rs) throws SQLException {
        Integer scheduleId = rs.getInt("schedule_id");
        return new ConductorTripView(
                scheduleId,
                (Integer) rs.getObject("trip_id"),
                rs.getInt("route_id"),
                rs.getString("route_name"),
                (Integer) rs.getObject("bus_id"),
                rs.getString("license_plate"),
                rs.getString("driver_name"),
                rs.getString("driver_phone"),
                rs.getObject("service_date", LocalDate.class),
                toLocalTime(rs.getTime("departure_time")),
                toOffsetDateTime(rs.getTimestamp("departed_at")),
                toOffsetDateTime(rs.getTimestamp("ended_at")),
                rs.getString("status"),
                findTripStopsBySchedule(scheduleId));
    }

    private ConductorTicketView mapConductorTicket(ResultSet rs) throws SQLException {
        return new ConductorTicketView(
                rs.getString("ticket_kind"),
                rs.getInt("ticket_id"),
                rs.getString("qr_code"),
                rs.getString("student_code"),
                rs.getString("student_name"),
                rs.getInt("route_id"),
                rs.getString("route_name"),
                rs.getString("boarding_stop_name"),
                rs.getString("alighting_stop_name"),
                rs.getString("status"),
                toOffsetDateTime(rs.getTimestamp("valid_from")),
                toOffsetDateTime(rs.getTimestamp("expires_at")),
                toOffsetDateTime(rs.getTimestamp("last_scanned_at")));
    }

    private InternalMessageView mapInternalMessage(ResultSet rs) throws SQLException {
        return new InternalMessageView(
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

    private LiveFleetVehicle mapLiveFleetVehicle(ResultSet rs) throws SQLException {
        return new LiveFleetVehicle(
                rs.getInt("trip_id"),
                rs.getInt("route_id"),
                rs.getString("route_name"),
                rs.getInt("bus_id"),
                rs.getString("license_plate"),
                rs.getString("driver_name"),
                rs.getString("conductor_name"),
                rs.getObject("service_date", LocalDate.class),
                toLocalTime(rs.getTime("departure_time")),
                rs.getString("status"),
                toDouble(rs.getObject("longitude")),
                toDouble(rs.getObject("latitude")),
                toDouble(rs.getObject("speed_kmh")),
                (Integer) rs.getObject("occupancy"),
                toOffsetDateTime(rs.getTimestamp("location_updated_at")));
    }

    private LocalTime toLocalTime(Time time) {
        return time == null ? null : time.toLocalTime();
    }

    private OffsetDateTime toOffsetDateTime(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toInstant().atOffset(ZoneOffset.UTC);
    }

    private Double toDouble(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof BigDecimal decimal) {
            return decimal.doubleValue();
        }
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        return Double.valueOf(value.toString());
    }

    public String getTripStatusForSchedule(Integer scheduleId, LocalDate serviceDate) {
        List<String> statuses = jdbcTemplate.queryForList("""
                SELECT status
                FROM trips
                WHERE schedule_id = ? AND service_date = ?
                """, String.class, scheduleId, serviceDate);
        return statuses.isEmpty() ? null : statuses.get(0);
    }

    public boolean hasActiveOrCompletedTrips(Integer scheduleId) {
        Boolean exists = jdbcTemplate.queryForObject("""
                SELECT EXISTS (
                    SELECT 1 FROM trips
                    WHERE schedule_id = ? AND status IN ('RUNNING', 'COMPLETED')
                )
                """, Boolean.class, scheduleId);
        return Boolean.TRUE.equals(exists);
    }

    public void deleteSchedule(Integer scheduleId) {
        jdbcTemplate.update("DELETE FROM vehicle_locations WHERE trip_id IN (SELECT trip_id FROM trips WHERE schedule_id = ?)", scheduleId);
        jdbcTemplate.update("DELETE FROM trips WHERE schedule_id = ?", scheduleId);
        jdbcTemplate.update("DELETE FROM bus_schedules WHERE schedule_id = ?", scheduleId);
    }

    public record TripRouteInfo(
            Integer tripId,
            Integer routeId,
            LocalDate serviceDate,
            LocalTime departureTime,
            OffsetDateTime departedAt,
            OffsetDateTime endedAt,
            String status) {
        public LocalDateTime scheduledStart() {
            return serviceDate == null || departureTime == null ? null : LocalDateTime.of(serviceDate, departureTime);
        }
    }

    public record DriverScheduleTemplate(
            Integer scheduleId,
            Integer routeId,
            String routeName,
            Integer busId,
            String licensePlate,
            String conductorName,
            String conductorPhone,
            Integer weekdayNumber,
            LocalTime departureTime,
            List<TripStopView> stops) {
    }

    private record RouteStopsForStudent(Integer boardingStopId, Integer alightingStopId) {
    }

    private record ConductorTripContact(Integer tripId, String routeName, String driverName, String driverPhone) {
    }
}
