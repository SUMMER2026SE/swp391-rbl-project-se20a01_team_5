package com.unibus.api.experience;

import static com.unibus.api.experience.ExperienceDtos.*;

import java.math.BigDecimal;
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

@Repository
public class ExperienceRepository {

    private final JdbcTemplate jdbcTemplate;

    public ExperienceRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Optional<String> studentCodeForUser(Integer userId) {
        return jdbcTemplate.query("SELECT student_code FROM students WHERE user_id = ?",
                rs -> rs.next() ? Optional.of(rs.getString("student_code")) : Optional.empty(), userId);
    }

    public Optional<Integer> driverIdForUser(Integer userId) {
        return jdbcTemplate.query("SELECT driver_id FROM drivers WHERE user_id = ?",
                rs -> rs.next() ? Optional.of(rs.getInt("driver_id")) : Optional.empty(), userId);
    }

    public Optional<Integer> conductorIdForUser(Integer userId) {
        return jdbcTemplate.query("SELECT conductor_id FROM conductors WHERE user_id = ?",
                rs -> rs.next() ? Optional.of(rs.getInt("conductor_id")) : Optional.empty(), userId);
    }

    public String fullName(Integer userId) {
        return jdbcTemplate.query("SELECT full_name FROM users WHERE user_id = ?",
                rs -> rs.next() ? rs.getString("full_name") : "UniBus User", userId);
    }

    public StudentDashboardView studentDashboard(Integer userId) {
        String studentCode = studentCodeForUser(userId).orElse(null);
        ProfileRow profile = studentProfile(userId);
        List<RouteCard> routes = routeCards(profile.universityId());
        RegistrationCard registration = studentCode == null ? null : currentRegistration(studentCode).orElse(null);
        TicketCard activeTicket = studentCode == null ? null : activeTicket(studentCode).orElse(null);
        TripCard nextTrip = registration == null ? liveTrips(null).stream().findFirst().orElse(null)
                : liveTrips(registration.routeId()).stream().findFirst().orElse(null);
        List<NotificationCard> notifications = notifications(userId, 5);
        List<HistoryCard> history = studentCode == null ? List.of() : history(studentCode, 5);
        List<DashboardStat> stats = List.of(
                stat("Tuyến khả dụng", routes.size(), "tuyến", "primary"),
                stat("Trạm phục vụ", stopCards(profile.universityId()).size(), "trạm", "secondary"),
                stat("Lịch sử chuyến", historyCount(studentCode), "chuyến", "tertiary"),
                stat("Thông báo chưa đọc", unreadCount(userId), "tin", "success"));
        return new StudentDashboardView(
                profile.fullName(),
                studentCode,
                profile.universityName(),
                profile.verificationStatus(),
                registration,
                activeTicket,
                nextTrip,
                routes,
                stopCards(profile.universityId()),
                notifications,
                history,
                stats);
    }

    public DriverDashboardView driverDashboard(Integer userId) {
        Integer driverId = driverIdForUser(userId).orElse(null);
        List<TripCard> trips = driverId == null ? List.of() : driverTrips(driverId, 12);
        TripCard activeTrip = trips.stream().filter(t -> "RUNNING".equalsIgnoreCase(t.status())).findFirst()
                .orElse(trips.stream().findFirst().orElse(null));
        List<FeedbackCard> feedback = driverId == null ? List.of() : driverFeedback(driverId, 8);
        return new DriverDashboardView(
                fullName(userId),
                trips,
                activeTrip,
                feedback,
                List.of(
                        stat("Chuyến hôm nay", trips.size(), "chuyến", "primary"),
                        stat("Đang chạy", trips.stream().filter(t -> "RUNNING".equalsIgnoreCase(t.status())).count(), "chuyến", "success"),
                        stat("Phản hồi", feedback.size(), "mục", "tertiary")));
    }

    public AssistantDashboardView assistantDashboard(Integer userId) {
        Integer conductorId = conductorIdForUser(userId).orElse(null);
        List<TripCard> trips = conductorId == null ? List.of() : conductorTrips(conductorId, 12);
        TripCard activeTrip = trips.stream().filter(t -> "RUNNING".equalsIgnoreCase(t.status())).findFirst()
                .orElse(trips.stream().findFirst().orElse(null));
        List<TicketCard> tickets = activeTrip == null ? List.of() : ticketsForTrip(activeTrip.tripId(), 20);
        List<IncidentCard> incidents = conductorId == null ? List.of() : incidents(conductorId, 8);
        List<LostItemCard> lostItems = lostItemsForAssistant(userId, 8);
        return new AssistantDashboardView(
                fullName(userId),
                trips,
                activeTrip,
                tickets,
                incidents,
                lostItems,
                List.of(
                        stat("Chuyến", trips.size(), "chuyến", "primary"),
                        stat("Vé cần kiểm", tickets.size(), "vé", "secondary"),
                        stat("Sự cố", incidents.size(), "mục", "error")));
    }

    public CoordinatorDashboardView coordinatorDashboard() {
        List<TripCard> liveFleet = liveTrips(null);
        List<RouteCard> routes = routeCards(null);
        List<StopCard> stops = stopCards(null);
        List<FeedbackCard> feedback = allFeedback(null, 8);
        return new CoordinatorDashboardView(
                liveFleet,
                routes,
                stops,
                feedback,
                List.of(
                        stat("Xe live", liveFleet.stream().filter(t -> "RUNNING".equalsIgnoreCase(t.status())).count(), "xe", "success"),
                        stat("Tuyến active", routes.size(), "tuyến", "primary"),
                        stat("Trạm", stops.size(), "trạm", "secondary"),
                        stat("Feedback mở", feedback.stream().filter(f -> !"RESOLVED".equalsIgnoreCase(f.status())).count(), "mục", "warning")));
    }

    public AdminStatsView adminStats() {
        return new AdminStatsView(
                List.of(
                        stat("Người dùng", count("users"), "tài khoản", "primary"),
                        stat("Sinh viên", count("students"), "hồ sơ", "secondary"),
                        stat("Tuyến", countWhere("routes", "status = 'ACTIVE'"), "tuyến", "tertiary"),
                        stat("Doanh thu", revenue(), "VND", "success")),
                routeMetrics(),
                complaints(null, 8),
                violations(null, 8),
                fares());
    }

    public List<RouteCard> routeSuggestions(Integer universityId) {
        return routeCards(universityId);
    }

    public List<LostItemCard> studentLostItems(Integer userId) {
        return jdbcTemplate.query("""
                SELECT li.lost_item_report_id, reporter.full_name AS reporter_name, li.trip_id,
                       r.route_code, r.route_name, li.item_description, li.status, li.notes, li.reported_at
                FROM lost_item_reports li
                JOIN users reporter ON reporter.user_id = li.reported_by_user_id
                LEFT JOIN trips t ON t.trip_id = li.trip_id
                LEFT JOIN routes r ON r.route_id = t.route_id
                WHERE li.reported_by_user_id = ?
                ORDER BY li.reported_at DESC, li.lost_item_report_id DESC
                LIMIT 50
                """, (rs, rowNum) -> mapLostItem(rs), userId);
    }

    public LostItemCard createLostItem(Integer userId, CreateLostItemRequest request) {
        Integer id = jdbcTemplate.queryForObject("""
                INSERT INTO lost_item_reports(reported_by_user_id, trip_id, item_description)
                VALUES (?, ?, ?)
                RETURNING lost_item_report_id
                """, Integer.class, userId, request.tripId(), request.itemDescription());
        return studentLostItems(userId).stream()
                .filter(item -> item.lostItemReportId().equals(id))
                .findFirst()
                .orElse(null);
    }

    public List<SupportTicketCard> supportTickets(Integer userId) {
        return jdbcTemplate.query("""
                SELECT support_ticket_id, title, content, support_type, status, response, created_at, updated_at
                FROM support_tickets
                WHERE submitted_by_user_id = ?
                ORDER BY created_at DESC, support_ticket_id DESC
                LIMIT 50
                """, (rs, rowNum) -> new SupportTicketCard(
                        rs.getInt("support_ticket_id"),
                        rs.getString("title"),
                        rs.getString("content"),
                        rs.getString("support_type"),
                        rs.getString("status"),
                        rs.getString("response"),
                        toOffset(rs.getTimestamp("created_at")),
                        toOffset(rs.getTimestamp("updated_at"))), userId);
    }

    public SupportTicketCard createSupportTicket(Integer userId, CreateSupportTicketRequest request) {
        Integer id = jdbcTemplate.queryForObject("""
                INSERT INTO support_tickets(submitted_by_user_id, support_type, title, content)
                VALUES (?, ?, ?, ?)
                RETURNING support_ticket_id
                """, Integer.class, userId, defaultText(request.supportType(), "OTHER"), request.title(), request.content());
        return supportTickets(userId).stream()
                .filter(ticket -> ticket.supportTicketId().equals(id))
                .findFirst()
                .orElse(null);
    }

    public List<IncidentCard> incidents(Integer conductorId, int limit) {
        return jdbcTemplate.query("""
                SELECT i.incident_id, i.trip_id, r.route_code, r.route_name, i.incident_type,
                       i.description, i.status, i.resolution, i.reported_at
                FROM incidents i
                LEFT JOIN trips t ON t.trip_id = i.trip_id
                LEFT JOIN routes r ON r.route_id = t.route_id
                WHERE i.conductor_id = ?
                ORDER BY i.reported_at DESC, i.incident_id DESC
                LIMIT ?
                """, (rs, rowNum) -> mapIncident(rs), conductorId, limit);
    }

    public IncidentCard createIncident(Integer conductorId, CreateIncidentRequest request) {
        Integer id = jdbcTemplate.queryForObject("""
                INSERT INTO incidents(conductor_id, trip_id, incident_type, description)
                VALUES (?, ?, ?, ?)
                RETURNING incident_id
                """, Integer.class, conductorId, request.tripId(), request.incidentType(), request.description());
        return incidents(conductorId, 50).stream()
                .filter(incident -> incident.incidentId().equals(id))
                .findFirst()
                .orElse(null);
    }

    public List<LostItemCard> lostItemsForAssistant(Integer userId, int limit) {
        return jdbcTemplate.query("""
                SELECT li.lost_item_report_id, reporter.full_name AS reporter_name, li.trip_id,
                       r.route_code, r.route_name, li.item_description, li.status, li.notes, li.reported_at
                FROM lost_item_reports li
                JOIN users reporter ON reporter.user_id = li.reported_by_user_id
                LEFT JOIN trips t ON t.trip_id = li.trip_id
                LEFT JOIN routes r ON r.route_id = t.route_id
                WHERE li.assisted_by_user_id IS NULL OR li.assisted_by_user_id = ?
                ORDER BY CASE li.status WHEN 'REPORTED' THEN 0 WHEN 'SEARCHING' THEN 1 ELSE 2 END,
                         li.reported_at DESC
                LIMIT ?
                """, (rs, rowNum) -> mapLostItem(rs), userId, limit);
    }

    public LostItemCard updateLostItem(Integer userId, Integer lostItemId, UpdateLostItemStatusRequest request) {
        jdbcTemplate.update("""
                UPDATE lost_item_reports
                SET status = ?, notes = ?, assisted_by_user_id = COALESCE(assisted_by_user_id, ?)
                WHERE lost_item_report_id = ?
                """, request.status(), request.notes(), userId, lostItemId);
        return lostItemsForAssistant(userId, 50).stream()
                .filter(item -> item.lostItemReportId().equals(lostItemId))
                .findFirst()
                .orElse(null);
    }

    public List<FeedbackCard> driverFeedback(Integer driverId, int limit) {
        return jdbcTemplate.query("""
                SELECT f.feedback_id, submitter.full_name AS student_name, r.route_code, r.route_name,
                       f.trip_id, f.star_rating, 'GENERAL' AS category, f.content, f.status, f.response, f.submitted_at
                FROM feedback f
                JOIN students s ON s.student_code = f.student_code
                JOIN users submitter ON submitter.user_id = s.user_id
                LEFT JOIN trips t ON t.trip_id = f.trip_id
                LEFT JOIN routes r ON r.route_id = t.route_id
                WHERE t.driver_id = ?
                ORDER BY f.submitted_at DESC, f.feedback_id DESC
                LIMIT ?
                """, (rs, rowNum) -> mapFeedback(rs), driverId, limit);
    }

    public List<FeedbackCard> allFeedback(String status, int limit) {
        if (status == null || status.isBlank()) {
            return jdbcTemplate.query("""
                    SELECT f.feedback_id, submitter.full_name AS student_name, r.route_code, r.route_name,
                           f.trip_id, f.star_rating, 'GENERAL' AS category, f.content, f.status, f.response, f.submitted_at
                    FROM feedback f
                    JOIN students s ON s.student_code = f.student_code
                    JOIN users submitter ON submitter.user_id = s.user_id
                    LEFT JOIN trips t ON t.trip_id = f.trip_id
                    LEFT JOIN routes r ON r.route_id = t.route_id
                    ORDER BY f.submitted_at DESC, f.feedback_id DESC
                    LIMIT ?
                    """, (rs, rowNum) -> mapFeedback(rs), limit);
        }
        return jdbcTemplate.query("""
                SELECT f.feedback_id, submitter.full_name AS student_name, r.route_code, r.route_name,
                       f.trip_id, f.star_rating, 'GENERAL' AS category, f.content, f.status, f.response, f.submitted_at
                FROM feedback f
                JOIN students s ON s.student_code = f.student_code
                JOIN users submitter ON submitter.user_id = s.user_id
                LEFT JOIN trips t ON t.trip_id = f.trip_id
                LEFT JOIN routes r ON r.route_id = t.route_id
                WHERE f.status = ?
                ORDER BY f.submitted_at DESC, f.feedback_id DESC
                LIMIT ?
                """, (rs, rowNum) -> mapFeedback(rs), status, limit);
    }

    public List<FareCard> fares() {
        return jdbcTemplate.query("""
                SELECT f.fare_id, f.route_id, r.route_code, r.route_name, f.fare_type,
                       f.amount, f.effective_from, f.effective_until, f.notes
                FROM fares f
                JOIN routes r ON r.route_id = f.route_id
                ORDER BY r.route_name, f.fare_type, f.effective_from DESC
                """, (rs, rowNum) -> new FareCard(
                        rs.getInt("fare_id"),
                        rs.getInt("route_id"),
                        rs.getString("route_code"),
                        rs.getString("route_name"),
                        rs.getString("fare_type"),
                        rs.getBigDecimal("amount"),
                        rs.getObject("effective_from", LocalDate.class),
                        rs.getObject("effective_until", LocalDate.class),
                        rs.getString("notes")));
    }

    public FareCard updateFare(Integer fareId, Integer userId, UpdateFareRequest request) {
        jdbcTemplate.update("""
                UPDATE fares
                SET amount = ?, notes = ?, adjusted_by_user_id = ?
                WHERE fare_id = ?
                """, request.amount(), request.notes(), userId, fareId);
        return fares().stream().filter(fare -> fare.fareId().equals(fareId)).findFirst().orElse(null);
    }

    public List<ComplaintCard> complaints(String status, int limit) {
        if (status == null || status.isBlank()) {
            return jdbcTemplate.query("""
                    SELECT complaint_id, title, content, status, submitted_at
                    FROM complaints
                    ORDER BY submitted_at DESC, complaint_id DESC
                    LIMIT ?
                    """, (rs, rowNum) -> mapComplaint(rs), limit);
        }
        return jdbcTemplate.query("""
                SELECT complaint_id, title, content, status, submitted_at
                FROM complaints
                WHERE status = ?
                ORDER BY submitted_at DESC, complaint_id DESC
                LIMIT ?
                """, (rs, rowNum) -> mapComplaint(rs), status, limit);
    }

    public List<ViolationCard> violations(String status, int limit) {
        if (status == null || status.isBlank()) {
            return jdbcTemplate.query("""
                    SELECT vr.violation_report_id, reporter.full_name AS reporter_name,
                           reported.full_name AS reported_name, vr.content, vr.status, vr.submitted_at
                    FROM violation_reports vr
                    JOIN users reporter ON reporter.user_id = vr.reported_by_user_id
                    JOIN users reported ON reported.user_id = vr.reported_user_id
                    ORDER BY vr.submitted_at DESC, vr.violation_report_id DESC
                    LIMIT ?
                    """, (rs, rowNum) -> mapViolation(rs), limit);
        }
        return jdbcTemplate.query("""
                SELECT vr.violation_report_id, reporter.full_name AS reporter_name,
                       reported.full_name AS reported_name, vr.content, vr.status, vr.submitted_at
                FROM violation_reports vr
                JOIN users reporter ON reporter.user_id = vr.reported_by_user_id
                JOIN users reported ON reported.user_id = vr.reported_user_id
                WHERE vr.status = ?
                ORDER BY vr.submitted_at DESC, vr.violation_report_id DESC
                LIMIT ?
                """, (rs, rowNum) -> mapViolation(rs), status, limit);
    }

    public List<ChatMessageCard> chatHistory(Integer userId) {
        return jdbcTemplate.query("""
                SELECT chat_history_id, message_role, content, sent_at
                FROM ai_chat_history
                WHERE user_id = ?
                ORDER BY sent_at DESC, chat_history_id DESC
                LIMIT 50
                """, (rs, rowNum) -> new ChatMessageCard(
                        rs.getLong("chat_history_id"),
                        rs.getString("message_role"),
                        rs.getString("content"),
                        toOffset(rs.getTimestamp("sent_at"))), userId);
    }

    private ProfileRow studentProfile(Integer userId) {
        return jdbcTemplate.query("""
                SELECT u.full_name, u.student_verification_status, s.student_code,
                       s.university_id, COALESCE(uni.short_name, s.university) AS university_name
                FROM users u
                LEFT JOIN students s ON s.user_id = u.user_id
                LEFT JOIN universities uni ON uni.university_id = s.university_id
                WHERE u.user_id = ?
                """, rs -> rs.next()
                        ? new ProfileRow(
                                rs.getString("full_name"),
                                rs.getString("student_verification_status"),
                                rs.getString("student_code"),
                                (Integer) rs.getObject("university_id"),
                                rs.getString("university_name"))
                        : new ProfileRow("Sinh viên", "UNKNOWN", null, null, null), userId);
    }

    private Optional<RegistrationCard> currentRegistration(String studentCode) {
        return jdbcTemplate.query("""
                SELECT rr.registration_id, rr.route_id, r.route_code, r.route_name, r.color_hex,
                       bs.stop_name AS boarding_stop_name, als.stop_name AS alighting_stop_name,
                       rr.effective_date, rr.status
                FROM route_registrations rr
                JOIN routes r ON r.route_id = rr.route_id
                JOIN stops bs ON bs.stop_id = rr.boarding_stop_id
                JOIN stops als ON als.stop_id = rr.alighting_stop_id
                WHERE rr.student_code = ?
                  AND rr.status IN ('APPROVED', 'PENDING')
                ORDER BY rr.registered_at DESC, rr.registration_id DESC
                LIMIT 1
                """, rs -> rs.next() ? Optional.of(new RegistrationCard(
                        rs.getInt("registration_id"),
                        rs.getInt("route_id"),
                        rs.getString("route_code"),
                        rs.getString("route_name"),
                        rs.getString("color_hex"),
                        rs.getString("boarding_stop_name"),
                        rs.getString("alighting_stop_name"),
                        rs.getObject("effective_date", LocalDate.class),
                        rs.getString("status"))) : Optional.empty(), studentCode);
    }

    private Optional<TicketCard> activeTicket(String studentCode) {
        return jdbcTemplate.query("""
                SELECT mp.monthly_pass_id AS ticket_id, 'MONTHLY' AS ticket_type, mp.route_id,
                       r.route_code, r.route_name, r.color_hex, bs.stop_name AS boarding_stop_name,
                       als.stop_name AS alighting_stop_name, mp.original_fare_amount, mp.subsidy_amount,
                       mp.final_fare_amount, mp.qr_code, mp.valid_from, mp.expires_on, NULL::timestamptz AS expires_at,
                       mp.status
                FROM monthly_passes mp
                JOIN routes r ON r.route_id = mp.route_id
                LEFT JOIN route_registrations rr ON rr.student_code = mp.student_code AND rr.route_id = mp.route_id
                LEFT JOIN stops bs ON bs.stop_id = rr.boarding_stop_id
                LEFT JOIN stops als ON als.stop_id = rr.alighting_stop_id
                WHERE mp.student_code = ?
                ORDER BY CASE mp.status WHEN 'ACTIVE' THEN 0 ELSE 1 END, mp.purchased_at DESC
                LIMIT 1
                """, rs -> rs.next() ? Optional.of(mapTicket(rs)) : Optional.empty(), studentCode);
    }

    private List<HistoryCard> history(String studentCode, int limit) {
        return jdbcTemplate.query("""
                SELECT th.travel_history_id, th.trip_id, r.route_code, r.route_name,
                       bs.stop_name AS boarding_stop_name, als.stop_name AS alighting_stop_name,
                       th.boarded_at, th.alighted_at
                FROM travel_history th
                JOIN trips t ON t.trip_id = th.trip_id
                JOIN routes r ON r.route_id = t.route_id
                LEFT JOIN stops bs ON bs.stop_id = th.boarding_stop_id
                LEFT JOIN stops als ON als.stop_id = th.alighting_stop_id
                WHERE th.student_code = ?
                ORDER BY th.boarded_at DESC NULLS LAST, th.travel_history_id DESC
                LIMIT ?
                """, (rs, rowNum) -> new HistoryCard(
                        rs.getInt("travel_history_id"),
                        rs.getInt("trip_id"),
                        rs.getString("route_code"),
                        rs.getString("route_name"),
                        rs.getString("boarding_stop_name"),
                        rs.getString("alighting_stop_name"),
                        toOffset(rs.getTimestamp("boarded_at")),
                        toOffset(rs.getTimestamp("alighted_at"))), studentCode, limit);
    }

    private List<NotificationCard> notifications(Integer userId, int limit) {
        return jdbcTemplate.query("""
                SELECT notification_id, title, content, notification_type, is_read, sent_at
                FROM notifications
                WHERE recipient_user_id = ?
                ORDER BY sent_at DESC, notification_id DESC
                LIMIT ?
                """, (rs, rowNum) -> new NotificationCard(
                        rs.getLong("notification_id"),
                        rs.getString("title"),
                        rs.getString("content"),
                        rs.getString("notification_type"),
                        rs.getBoolean("is_read"),
                        toOffset(rs.getTimestamp("sent_at"))), userId, limit);
    }

    private List<RouteCard> routeCards(Integer universityId) {
        List<RouteCard> base = jdbcTemplate.query("""
                SELECT r.route_id, r.route_code, r.route_name, r.distance_km, r.estimated_minutes,
                       r.frequency_min, r.color_hex,
                       (SELECT amount FROM fares f WHERE f.route_id = r.route_id AND f.fare_type = 'SINGLE'
                        ORDER BY f.effective_from DESC, f.fare_id DESC LIMIT 1) AS single_fare,
                       (SELECT amount FROM fares f WHERE f.route_id = r.route_id AND f.fare_type = 'MONTHLY'
                        ORDER BY f.effective_from DESC, f.fare_id DESC LIMIT 1) AS monthly_fare,
                       (SELECT MIN(departure_time) FROM bus_schedules bs WHERE bs.route_id = r.route_id AND bs.status = 'ACTIVE') AS first_trip,
                       (SELECT MAX(departure_time) FROM bus_schedules bs WHERE bs.route_id = r.route_id AND bs.status = 'ACTIVE') AS last_trip,
                       EXISTS (
                           SELECT 1 FROM route_universities ru
                           WHERE ru.route_id = r.route_id
                             AND ru.status = 'ACTIVE'
                             AND (? IS NULL OR ru.university_id = ?)
                       ) AS university_linked
                FROM routes r
                WHERE r.status = 'ACTIVE'
                ORDER BY COALESCE(r.route_code, r.route_name)
                """, (rs, rowNum) -> new RouteCard(
                        rs.getInt("route_id"),
                        rs.getString("route_code"),
                        rs.getString("route_name"),
                        firstStopName(rs.getInt("route_id")),
                        lastStopName(rs.getInt("route_id")),
                        rs.getBigDecimal("distance_km"),
                        (Integer) rs.getObject("estimated_minutes"),
                        (Integer) rs.getObject("frequency_min"),
                        rs.getBigDecimal("single_fare"),
                        rs.getBigDecimal("monthly_fare"),
                        rs.getString("color_hex"),
                        timeText(rs.getTime("first_trip")),
                        timeText(rs.getTime("last_trip")),
                        rs.getBoolean("university_linked"),
                        stopsForRoute(rs.getInt("route_id"))), universityId, universityId);
        if (universityId == null) return base;
        List<RouteCard> linked = base.stream().filter(RouteCard::universityLinked).toList();
        return linked.isEmpty() ? base : linked;
    }

    private List<StopCard> stopCards(Integer universityId) {
        return jdbcTemplate.query("""
                SELECT DISTINCT s.stop_id, s.stop_code, s.stop_name, s.address, s.longitude, s.latitude, s.has_shelter
                FROM stops s
                JOIN route_stops rs ON rs.stop_id = s.stop_id
                JOIN routes r ON r.route_id = rs.route_id AND r.status = 'ACTIVE'
                LEFT JOIN route_universities ru ON ru.route_id = r.route_id AND ru.status = 'ACTIVE'
                WHERE s.status = 'ACTIVE'
                  AND (? IS NULL OR ru.university_id = ?)
                ORDER BY s.stop_name
                """, (rs, rowNum) -> mapStop(rs, true), universityId, universityId);
    }

    private List<StopCard> stopsForRoute(Integer routeId) {
        return jdbcTemplate.query("""
                SELECT s.stop_id, s.stop_code, s.stop_name, s.address, s.longitude, s.latitude, s.has_shelter
                FROM route_stops rs
                JOIN stops s ON s.stop_id = rs.stop_id
                WHERE rs.route_id = ?
                ORDER BY rs.stop_order
                """, (rs, rowNum) -> mapStop(rs, false), routeId);
    }

    private StopCard mapStop(ResultSet rs, boolean includeRoutes) throws SQLException {
        Integer stopId = rs.getInt("stop_id");
        return new StopCard(
                stopId,
                rs.getString("stop_code"),
                rs.getString("stop_name"),
                rs.getString("address"),
                rs.getBigDecimal("longitude"),
                rs.getBigDecimal("latitude"),
                rs.getBoolean("has_shelter"),
                includeRoutes ? routesForStop(stopId) : List.of());
    }

    private List<RouteBadge> routesForStop(Integer stopId) {
        return jdbcTemplate.query("""
                SELECT r.route_id, r.route_code, r.route_name, r.color_hex
                FROM route_stops rs
                JOIN routes r ON r.route_id = rs.route_id
                WHERE rs.stop_id = ?
                  AND r.status = 'ACTIVE'
                ORDER BY COALESCE(r.route_code, r.route_name)
                """, (rs, rowNum) -> new RouteBadge(
                        rs.getInt("route_id"),
                        rs.getString("route_code"),
                        rs.getString("route_name"),
                        rs.getString("color_hex")), stopId);
    }

    private String firstStopName(Integer routeId) {
        return stopName(routeId, "ASC");
    }

    private String lastStopName(Integer routeId) {
        return stopName(routeId, "DESC");
    }

    private String stopName(Integer routeId, String direction) {
        return jdbcTemplate.query("""
                SELECT s.stop_name
                FROM route_stops rs
                JOIN stops s ON s.stop_id = rs.stop_id
                WHERE rs.route_id = ?
                ORDER BY rs.stop_order %s
                LIMIT 1
                """.formatted(direction), rs -> rs.next() ? rs.getString("stop_name") : null, routeId);
    }

    private List<TripCard> liveTrips(Integer routeId) {
        if (routeId == null) {
            return jdbcTemplate.query(tripSelect("""
                    WHERE t.service_date = CURRENT_DATE
                      AND t.status IN ('RUNNING', 'NOT_STARTED', 'COMPLETED')
                    ORDER BY CASE t.status WHEN 'RUNNING' THEN 0 WHEN 'NOT_STARTED' THEN 1 ELSE 2 END,
                             bs.departure_time NULLS LAST, t.trip_id DESC
                    LIMIT 20
                    """), (rs, rowNum) -> mapTrip(rs));
        }
        return jdbcTemplate.query(tripSelect("""
                WHERE t.service_date = CURRENT_DATE
                  AND t.route_id = ?
                  AND t.status IN ('RUNNING', 'NOT_STARTED', 'COMPLETED')
                ORDER BY CASE t.status WHEN 'RUNNING' THEN 0 WHEN 'NOT_STARTED' THEN 1 ELSE 2 END,
                         bs.departure_time NULLS LAST, t.trip_id DESC
                LIMIT 5
                """), (rs, rowNum) -> mapTrip(rs), routeId);
    }

    private List<TripCard> driverTrips(Integer driverId, int limit) {
        return jdbcTemplate.query(tripSelect("""
                WHERE t.driver_id = ?
                  AND t.service_date BETWEEN CURRENT_DATE - INTERVAL '7 days' AND CURRENT_DATE + INTERVAL '7 days'
                ORDER BY t.service_date DESC, bs.departure_time NULLS LAST, t.trip_id DESC
                LIMIT ?
                """), (rs, rowNum) -> mapTrip(rs), driverId, limit);
    }

    private List<TripCard> conductorTrips(Integer conductorId, int limit) {
        return jdbcTemplate.query(tripSelect("""
                WHERE t.conductor_id = ?
                  AND t.service_date BETWEEN CURRENT_DATE - INTERVAL '7 days' AND CURRENT_DATE + INTERVAL '7 days'
                ORDER BY t.service_date DESC, bs.departure_time NULLS LAST, t.trip_id DESC
                LIMIT ?
                """), (rs, rowNum) -> mapTrip(rs), conductorId, limit);
    }

    private String tripSelect(String where) {
        return """
                SELECT t.trip_id, t.route_id, r.route_code, r.route_name, r.color_hex, t.bus_id,
                       b.license_plate, b.seat_count, vl.occupancy, du.full_name AS driver_name,
                       cu.full_name AS conductor_name, t.service_date, bs.departure_time,
                       t.departed_at, t.ended_at, t.status, vl.longitude, vl.latitude, vl.speed_kmh
                FROM trips t
                JOIN routes r ON r.route_id = t.route_id
                JOIN buses b ON b.bus_id = t.bus_id
                LEFT JOIN bus_schedules bs ON bs.schedule_id = t.schedule_id
                LEFT JOIN drivers d ON d.driver_id = t.driver_id
                LEFT JOIN users du ON du.user_id = d.user_id
                LEFT JOIN conductors c ON c.conductor_id = t.conductor_id
                LEFT JOIN users cu ON cu.user_id = c.user_id
                LEFT JOIN LATERAL (
                    SELECT longitude, latitude, speed_kmh, occupancy
                    FROM vehicle_locations
                    WHERE trip_id = t.trip_id
                    ORDER BY updated_at DESC
                    LIMIT 1
                ) vl ON TRUE
                """ + where;
    }

    private List<TicketCard> ticketsForTrip(Integer tripId, int limit) {
        return jdbcTemplate.query("""
                SELECT mp.monthly_pass_id AS ticket_id, 'MONTHLY' AS ticket_type, mp.route_id,
                       r.route_code, r.route_name, r.color_hex, NULL AS boarding_stop_name, NULL AS alighting_stop_name,
                       mp.original_fare_amount, mp.subsidy_amount, mp.final_fare_amount, mp.qr_code,
                       mp.valid_from, mp.expires_on, NULL::timestamptz AS expires_at, mp.status
                FROM monthly_passes mp
                JOIN trips t ON t.route_id = mp.route_id
                JOIN routes r ON r.route_id = mp.route_id
                WHERE t.trip_id = ?
                ORDER BY mp.purchased_at DESC
                LIMIT ?
                """, (rs, rowNum) -> mapTicket(rs), tripId, limit);
    }

    private List<RouteMetric> routeMetrics() {
        return jdbcTemplate.query("""
                SELECT r.route_code, r.route_name, r.color_hex,
                       COALESCE(t.trip_count, 0) AS trips,
                       COALESCE(m.monthly_revenue, 0) + COALESCE(s.single_revenue, 0) AS revenue
                FROM routes r
                LEFT JOIN (
                    SELECT route_id, COUNT(trip_id) AS trip_count
                    FROM trips
                    GROUP BY route_id
                ) t ON t.route_id = r.route_id
                LEFT JOIN (
                    SELECT mp.route_id, COALESCE(SUM(p.amount), 0) AS monthly_revenue
                    FROM monthly_passes mp
                    JOIN payments p ON p.monthly_pass_id = mp.monthly_pass_id
                    WHERE p.status = 'PAID'
                    GROUP BY mp.route_id
                ) m ON m.route_id = r.route_id
                LEFT JOIN (
                    SELECT st.route_id, COALESCE(SUM(p.amount), 0) AS single_revenue
                    FROM single_trip_tickets st
                    JOIN payments p ON p.single_trip_ticket_id = st.single_trip_ticket_id
                    WHERE p.status = 'PAID'
                    GROUP BY st.route_id
                ) s ON s.route_id = r.route_id
                WHERE r.status = 'ACTIVE'
                ORDER BY COALESCE(r.route_code, r.route_name)
                """, (rs, rowNum) -> new RouteMetric(
                        rs.getString("route_code"),
                        rs.getString("route_name"),
                        rs.getString("color_hex"),
                        rs.getInt("trips"),
                        rs.getBigDecimal("revenue")));
    }

    private TripCard mapTrip(ResultSet rs) throws SQLException {
        return new TripCard(
                rs.getInt("trip_id"),
                rs.getInt("route_id"),
                rs.getString("route_code"),
                rs.getString("route_name"),
                rs.getString("color_hex"),
                (Integer) rs.getObject("bus_id"),
                rs.getString("license_plate"),
                (Integer) rs.getObject("seat_count"),
                (Integer) rs.getObject("occupancy"),
                rs.getString("driver_name"),
                rs.getString("conductor_name"),
                rs.getObject("service_date", LocalDate.class),
                toLocalTime(rs.getTime("departure_time")),
                toOffset(rs.getTimestamp("departed_at")),
                toOffset(rs.getTimestamp("ended_at")),
                rs.getString("status"),
                rs.getBigDecimal("longitude"),
                rs.getBigDecimal("latitude"),
                rs.getBigDecimal("speed_kmh"));
    }

    private TicketCard mapTicket(ResultSet rs) throws SQLException {
        return new TicketCard(
                rs.getInt("ticket_id"),
                rs.getString("ticket_type"),
                rs.getInt("route_id"),
                rs.getString("route_code"),
                rs.getString("route_name"),
                rs.getString("color_hex"),
                rs.getString("boarding_stop_name"),
                rs.getString("alighting_stop_name"),
                rs.getBigDecimal("original_fare_amount"),
                rs.getBigDecimal("subsidy_amount"),
                rs.getBigDecimal("final_fare_amount"),
                rs.getString("qr_code"),
                rs.getObject("valid_from", LocalDate.class),
                rs.getObject("expires_on", LocalDate.class),
                toOffset(rs.getTimestamp("expires_at")),
                rs.getString("status"));
    }

    private FeedbackCard mapFeedback(ResultSet rs) throws SQLException {
        return new FeedbackCard(
                rs.getLong("feedback_id"),
                rs.getString("student_name"),
                rs.getString("route_code"),
                rs.getString("route_name"),
                (Integer) rs.getObject("trip_id"),
                (Integer) rs.getObject("star_rating"),
                rs.getString("category"),
                rs.getString("content"),
                rs.getString("status"),
                rs.getString("response"),
                toOffset(rs.getTimestamp("submitted_at")));
    }

    private LostItemCard mapLostItem(ResultSet rs) throws SQLException {
        return new LostItemCard(
                rs.getInt("lost_item_report_id"),
                rs.getString("reporter_name"),
                (Integer) rs.getObject("trip_id"),
                rs.getString("route_code"),
                rs.getString("route_name"),
                rs.getString("item_description"),
                rs.getString("status"),
                rs.getString("notes"),
                toOffset(rs.getTimestamp("reported_at")));
    }

    private IncidentCard mapIncident(ResultSet rs) throws SQLException {
        return new IncidentCard(
                rs.getInt("incident_id"),
                rs.getInt("trip_id"),
                rs.getString("route_code"),
                rs.getString("route_name"),
                rs.getString("incident_type"),
                rs.getString("description"),
                rs.getString("status"),
                rs.getString("resolution"),
                toOffset(rs.getTimestamp("reported_at")));
    }

    private ComplaintCard mapComplaint(ResultSet rs) throws SQLException {
        return new ComplaintCard(
                rs.getInt("complaint_id"),
                rs.getString("title"),
                rs.getString("content"),
                rs.getString("status"),
                toOffset(rs.getTimestamp("submitted_at")));
    }

    private ViolationCard mapViolation(ResultSet rs) throws SQLException {
        return new ViolationCard(
                rs.getInt("violation_report_id"),
                rs.getString("reporter_name"),
                rs.getString("reported_name"),
                rs.getString("content"),
                rs.getString("status"),
                toOffset(rs.getTimestamp("submitted_at")));
    }

    private DashboardStat stat(String label, long value, String unit, String tone) {
        return stat(label, BigDecimal.valueOf(value), unit, tone);
    }

    private DashboardStat stat(String label, BigDecimal value, String unit, String tone) {
        return new DashboardStat(label, value == null ? BigDecimal.ZERO : value, unit, tone);
    }

    private long count(String table) {
        Long value = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM " + table, Long.class);
        return value == null ? 0 : value;
    }

    private long countWhere(String table, String where) {
        Long value = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM " + table + " WHERE " + where, Long.class);
        return value == null ? 0 : value;
    }

    private long historyCount(String studentCode) {
        if (studentCode == null) return 0;
        Long value = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM travel_history WHERE student_code = ?",
                Long.class, studentCode);
        return value == null ? 0 : value;
    }

    private long unreadCount(Integer userId) {
        Long value = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM notifications WHERE recipient_user_id = ? AND is_read = false",
                Long.class, userId);
        return value == null ? 0 : value;
    }

    private BigDecimal revenue() {
        return jdbcTemplate.queryForObject("SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'PAID'",
                BigDecimal.class);
    }

    private String defaultText(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private String timeText(Time time) {
        LocalTime localTime = toLocalTime(time);
        return localTime == null ? null : localTime.toString().substring(0, 5);
    }

    private LocalTime toLocalTime(Time time) {
        return time == null ? null : time.toLocalTime();
    }

    private OffsetDateTime toOffset(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toInstant().atOffset(ZoneOffset.UTC);
    }

    private record ProfileRow(String fullName, String verificationStatus, String studentCode, Integer universityId,
            String universityName) {
    }
}
