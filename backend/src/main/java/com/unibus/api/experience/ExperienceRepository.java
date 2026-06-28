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
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
        List<StopCard> stops = stopCards(profile.universityId());
        RegistrationCard registration = studentCode == null ? null : currentRegistration(studentCode).orElse(null);
        TicketCard activeTicket = studentCode == null ? null : activeTicket(studentCode).orElse(null);
        TripCard nextTrip = registration == null ? liveTrips(null).stream().findFirst().orElse(null)
                : liveTrips(registration.routeId()).stream().findFirst().orElse(null);
        List<NotificationCard> notifications = notifications(userId, 5);
        List<HistoryCard> history = studentCode == null ? List.of() : history(studentCode, 5);
        List<DashboardStat> stats = List.of(
                stat("Tuyến khả dụng", routes.size(), "tuyến", "primary"),
                stat("Trạm phục vụ", stops.size(), "trạm", "secondary"),
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
                stops,
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

    public AdminStatsView adminStats(int days) {
        LocalDate to = LocalDate.now();
        LocalDate from = to.minusDays(days - 1L);
        return new AdminStatsView(
                List.of(
                        stat("Người dùng", count("users"), "tài khoản", "primary"),
                        stat("Sinh viên", count("students"), "hồ sơ", "secondary"),
                        stat("Trường đối tác", countWhere("universities", "status = 'ACTIVE'"), "trường", "tertiary"),
                        stat("Chờ xác thực", countWhere("student_verifications", "status = 'PENDING_REVIEW'"), "hồ sơ", "warning"),
                        stat("Tuyến", countWhere("routes", "status = 'ACTIVE'"), "tuyến", "tertiary"),
                        stat("Doanh thu", revenue(), "VND", "success")),
                routeMetrics(),
                complaints(null, 8),
                violations(null, 8),
                fares(),
                revenueSeries(from, to),
                tripsSeries(from, to),
                roleDistribution());
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
                       mp.purchased_at, mp.status
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
        List<RouteCore> routeRows = jdbcTemplate.query("""
                SELECT r.route_id, r.route_code, r.route_name, r.distance_km, r.estimated_minutes,
                       r.frequency_min, r.color_hex,
                       first_stop.stop_name AS from_stop_name,
                       last_stop.stop_name AS to_stop_name,
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
                             AND (?::integer IS NULL OR ru.university_id = ?)
                       ) AS university_linked
                FROM routes r
                LEFT JOIN LATERAL (
                    SELECT s.stop_name
                    FROM route_stops rs
                    JOIN stops s ON s.stop_id = rs.stop_id
                    WHERE rs.route_id = r.route_id
                    ORDER BY rs.stop_order
                    LIMIT 1
                ) first_stop ON TRUE
                LEFT JOIN LATERAL (
                    SELECT s.stop_name
                    FROM route_stops rs
                    JOIN stops s ON s.stop_id = rs.stop_id
                    WHERE rs.route_id = r.route_id
                    ORDER BY rs.stop_order DESC
                    LIMIT 1
                ) last_stop ON TRUE
                WHERE r.status = 'ACTIVE'
                ORDER BY COALESCE(r.route_code, r.route_name)
                """, (rs, rowNum) -> new RouteCore(
                        rs.getInt("route_id"),
                        rs.getString("route_code"),
                        rs.getString("route_name"),
                        rs.getBigDecimal("distance_km"),
                        (Integer) rs.getObject("estimated_minutes"),
                        (Integer) rs.getObject("frequency_min"),
                        rs.getBigDecimal("single_fare"),
                        rs.getBigDecimal("monthly_fare"),
                        rs.getString("color_hex"),
                        timeText(rs.getTime("first_trip")),
                        timeText(rs.getTime("last_trip")),
                        rs.getBoolean("university_linked")), universityId, universityId);
        if (routeRows.isEmpty()) {
            return List.of();
        }

        List<RouteCore> visibleRows = routeRows;
        if (universityId != null) {
            List<RouteCore> linked = routeRows.stream().filter(RouteCore::universityLinked).toList();
            if (!linked.isEmpty()) {
                visibleRows = linked;
            }
        }

        Map<Integer, List<StopCard>> stopsByRoute = new HashMap<>();
        jdbcTemplate.query("""
                SELECT rs.route_id, s.stop_id, s.stop_code, s.stop_name, s.address, s.longitude, s.latitude, s.has_shelter
                FROM route_stops rs
                JOIN stops s ON s.stop_id = rs.stop_id
                JOIN routes r ON r.route_id = rs.route_id
                WHERE r.status = 'ACTIVE'
                  AND s.status = 'ACTIVE'
                ORDER BY rs.route_id, rs.stop_order
                """, rs -> {
                    Integer routeId = rs.getInt("route_id");
                    stopsByRoute.computeIfAbsent(routeId, ignored -> new java.util.ArrayList<>())
                            .add(mapStop(rs, false));
                });

        List<RouteCard> base = visibleRows.stream()
                .map(route -> {
                    List<StopCard> stops = stopsByRoute.getOrDefault(route.routeId(), List.of());
                    String fromStopName = stops.isEmpty() ? null : stops.get(0).stopName();
                    String toStopName = stops.isEmpty() ? null : stops.get(stops.size() - 1).stopName();
                    return new RouteCard(
                            route.routeId(),
                            route.routeCode(),
                            route.routeName(),
                            fromStopName,
                            toStopName,
                            route.distanceKm(),
                            route.estimatedMinutes(),
                            route.frequencyMin(),
                            route.singleFare(),
                            route.monthlyFare(),
                            route.colorHex(),
                            route.firstTrip(),
                            route.lastTrip(),
                            route.universityLinked(),
                            stops);
                })
                .toList();
        if (universityId == null) return base;
        return base;
    }

    private List<StopCard> stopCards(Integer universityId) {
        List<StopCard> stops = jdbcTemplate.query("""
                SELECT DISTINCT s.stop_id, s.stop_code, s.stop_name, s.address, s.longitude, s.latitude, s.has_shelter
                FROM stops s
                JOIN route_stops rs ON rs.stop_id = s.stop_id
                JOIN routes r ON r.route_id = rs.route_id AND r.status = 'ACTIVE'
                LEFT JOIN route_universities ru ON ru.route_id = r.route_id AND ru.status = 'ACTIVE'
                WHERE s.status = 'ACTIVE'
                  AND (?::integer IS NULL OR ru.university_id = ?)
                ORDER BY s.stop_name
                """, (rs, rowNum) -> mapStop(rs, false), universityId, universityId);
        if (stops.isEmpty()) {
            return stops;
        }

        Map<Integer, List<RouteBadge>> routesByStop = new HashMap<>();
        jdbcTemplate.query("""
                SELECT DISTINCT s.stop_id, r.route_id, r.route_code, r.route_name, r.color_hex
                FROM stops s
                JOIN route_stops rs ON rs.stop_id = s.stop_id
                JOIN routes r ON r.route_id = rs.route_id AND r.status = 'ACTIVE'
                LEFT JOIN route_universities ru ON ru.route_id = r.route_id AND ru.status = 'ACTIVE'
                WHERE s.status = 'ACTIVE'
                  AND (?::integer IS NULL OR ru.university_id = ?)
                ORDER BY s.stop_id, r.route_code NULLS LAST, r.route_name
                """, rs -> {
                    Integer stopId = rs.getInt("stop_id");
                    routesByStop.computeIfAbsent(stopId, ignored -> new java.util.ArrayList<>())
                            .add(new RouteBadge(
                                    rs.getInt("route_id"),
                                    rs.getString("route_code"),
                                    rs.getString("route_name"),
                                    rs.getString("color_hex")));
                }, universityId, universityId);

        return stops.stream()
                .map(stop -> new StopCard(
                        stop.stopId(),
                        stop.stopCode(),
                        stop.stopName(),
                        stop.address(),
                        stop.longitude(),
                        stop.latitude(),
                        stop.hasShelter(),
                        routesByStop.getOrDefault(stop.stopId(), List.of())))
                .toList();
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
                       mp.valid_from, mp.expires_on, NULL::timestamptz AS expires_at, mp.purchased_at, mp.status
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

    public List<UniversityOperationsMetric> coordinatorByUniversity() {
        return jdbcTemplate.query("""
                SELECT u.university_id, u.name AS university_name, u.short_name,
                       MIN(r.color_hex) AS color_hex,
                       COUNT(DISTINCT ru.route_id) FILTER (WHERE ru.status = 'ACTIVE') AS route_count,
                       COUNT(DISTINCT t.bus_id) AS fleet_count,
                       COUNT(DISTINCT t.driver_id) AS driver_count,
                       COUNT(DISTINCT s.student_code) AS student_count,
                       COUNT(DISTINCT t.trip_id) AS trips_today
                FROM universities u
                LEFT JOIN route_universities ru ON ru.university_id = u.university_id
                    AND ru.status = 'ACTIVE'
                LEFT JOIN routes r ON r.route_id = ru.route_id
                LEFT JOIN trips t ON t.route_id = ru.route_id
                    AND t.service_date = CURRENT_DATE
                LEFT JOIN students s ON s.university_id = u.university_id
                WHERE u.status = 'ACTIVE'
                GROUP BY u.university_id, u.name, u.short_name
                ORDER BY u.name
                """, (rs, rowNum) -> new UniversityOperationsMetric(
                        rs.getInt("university_id"),
                        rs.getString("university_name"),
                        rs.getString("short_name"),
                        rs.getString("color_hex"),
                        rs.getInt("route_count"),
                        rs.getInt("fleet_count"),
                        rs.getInt("driver_count"),
                        rs.getInt("student_count"),
                        rs.getInt("trips_today")));
    }

    public List<UniversityRouteOperationsMetric> coordinatorUniversityRoutes(Integer universityId) {
        return jdbcTemplate.query("""
                SELECT r.route_id, r.route_code, r.route_name, r.color_hex,
                       COUNT(DISTINCT rr.student_code) AS registered_students,
                       COUNT(DISTINCT mp.monthly_pass_id) AS active_monthly_passes,
                       COUNT(DISTINCT t.trip_id) AS trips_today,
                       COUNT(DISTINCT t.trip_id) FILTER (WHERE t.status = 'RUNNING') AS running_trips,
                       COUNT(DISTINCT t.bus_id) FILTER (WHERE t.bus_id IS NOT NULL) AS assigned_buses,
                       COUNT(DISTINCT t.driver_id) FILTER (WHERE t.driver_id IS NOT NULL) AS assigned_drivers,
                       COUNT(DISTINCT t.conductor_id) FILTER (WHERE t.conductor_id IS NOT NULL) AS assigned_conductors
                FROM route_universities ru
                JOIN routes r ON r.route_id = ru.route_id
                LEFT JOIN students s ON s.university_id = ru.university_id
                LEFT JOIN route_registrations rr ON rr.student_code = s.student_code
                    AND rr.route_id = ru.route_id
                    AND rr.status = 'APPROVED'
                LEFT JOIN monthly_passes mp ON mp.student_code = s.student_code
                    AND mp.route_id = ru.route_id
                    AND mp.status = 'ACTIVE'
                    AND mp.expires_on >= CURRENT_DATE
                LEFT JOIN trips t ON t.route_id = ru.route_id
                    AND t.service_date = CURRENT_DATE
                WHERE ru.university_id = ?
                  AND ru.status = 'ACTIVE'
                  AND ru.active_from <= CURRENT_DATE
                  AND (ru.active_until IS NULL OR ru.active_until >= CURRENT_DATE)
                GROUP BY r.route_id, r.route_code, r.route_name, r.color_hex
                ORDER BY active_monthly_passes DESC, registered_students DESC, r.route_name
                """, (rs, rowNum) -> new UniversityRouteOperationsMetric(
                        rs.getInt("route_id"),
                        rs.getString("route_code"),
                        rs.getString("route_name"),
                        rs.getString("color_hex"),
                        rs.getInt("registered_students"),
                        rs.getInt("active_monthly_passes"),
                        rs.getInt("trips_today"),
                        rs.getInt("running_trips"),
                        rs.getInt("assigned_buses"),
                        rs.getInt("assigned_drivers"),
                        rs.getInt("assigned_conductors")),
                universityId);
    }

    private List<RevenueSeriesPoint> revenueSeries(LocalDate from, LocalDate to) {
        Map<LocalDate, BigDecimal> values = new HashMap<>();
        jdbcTemplate.query("""
                SELECT CAST(created_at AS date) AS series_date, COALESCE(SUM(amount), 0) AS revenue
                FROM payments
                WHERE status = 'PAID'
                  AND CAST(created_at AS date) BETWEEN ? AND ?
                GROUP BY CAST(created_at AS date)
                ORDER BY series_date
                """, rs -> {
                    values.put(rs.getObject("series_date", LocalDate.class), rs.getBigDecimal("revenue"));
                }, from, to);
        return from.datesUntil(to.plusDays(1))
                .map(date -> new RevenueSeriesPoint(dayLabel(date), date, values.getOrDefault(date, BigDecimal.ZERO)))
                .toList();
    }

    private List<TripsSeriesPoint> tripsSeries(LocalDate from, LocalDate to) {
        Map<LocalDate, Integer> values = new HashMap<>();
        jdbcTemplate.query("""
                SELECT service_date AS series_date, COUNT(*) AS trips
                FROM trips
                WHERE service_date BETWEEN ? AND ?
                GROUP BY service_date
                ORDER BY service_date
                """, rs -> {
                    values.put(rs.getObject("series_date", LocalDate.class), rs.getInt("trips"));
                }, from, to);
        return from.datesUntil(to.plusDays(1))
                .map(date -> new TripsSeriesPoint(dayLabel(date), date, values.getOrDefault(date, 0)))
                .toList();
    }

    private List<RoleDistributionPoint> roleDistribution() {
        return jdbcTemplate.query("""
                SELECT role, COUNT(*) AS user_count
                FROM users
                WHERE status = 'ACTIVE'
                GROUP BY role
                ORDER BY role
                """, (rs, rowNum) -> new RoleDistributionPoint(
                        rs.getString("role"),
                        rs.getInt("user_count")));
    }

    private String dayLabel(LocalDate date) {
        return switch (date.getDayOfWeek()) {
            case MONDAY -> "T2";
            case TUESDAY -> "T3";
            case WEDNESDAY -> "T4";
            case THURSDAY -> "T5";
            case FRIDAY -> "T6";
            case SATURDAY -> "T7";
            case SUNDAY -> "CN";
        };
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
                toOffset(rs.getTimestamp("purchased_at")),
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

    private record RouteCore(
            Integer routeId,
            String routeCode,
            String routeName,
            BigDecimal distanceKm,
            Integer estimatedMinutes,
            Integer frequencyMin,
            BigDecimal singleFare,
            BigDecimal monthlyFare,
            String colorHex,
            String firstTrip,
            String lastTrip,
            boolean universityLinked) {
    }

    // =========================================================================
    // Internal messages (REQ-DRV-006, REQ-AST-007)
    // =========================================================================

    public Long sendInternalMessage(Integer senderUserId, Integer recipientUserId, String body) {
        return jdbcTemplate.queryForObject("""
                INSERT INTO internal_messages (sender_user_id, recipient_user_id, body, content, sent_at)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
                RETURNING message_id
                """, Long.class, senderUserId, recipientUserId, body, body);
    }

    public List<InternalMessageCard> conversation(Integer userA, Integer userB, int limit) {
        return jdbcTemplate.query("""
                SELECT im.message_id, im.sender_user_id, im.recipient_user_id, COALESCE(im.body, im.content) AS body, im.sent_at, im.read_at,
                       su.full_name AS sender_name, ru.full_name AS recipient_name
                FROM internal_messages im
                LEFT JOIN users su ON su.user_id = im.sender_user_id
                LEFT JOIN users ru ON ru.user_id = im.recipient_user_id
                WHERE ((im.sender_user_id = ? AND im.recipient_user_id = ?)
                   OR (im.sender_user_id = ? AND im.recipient_user_id = ?))
                  AND COALESCE(im.body, im.content) NOT LIKE '[SOS]%'
                ORDER BY im.sent_at DESC
                LIMIT ?
                """, (rs, rowNum) -> new InternalMessageCard(
                        rs.getLong("message_id"),
                        rs.getInt("sender_user_id"),
                        rs.getString("sender_name"),
                        rs.getInt("recipient_user_id"),
                        rs.getString("recipient_name"),
                        rs.getString("body"),
                        toOffset(rs.getTimestamp("sent_at")),
                        toOffset(rs.getTimestamp("read_at"))),
                userA, userB, userB, userA, limit);
    }

    public void markConversationRead(Integer currentUser, Integer peerUser) {
        jdbcTemplate.update("""
                UPDATE internal_messages
                SET read_at = CURRENT_TIMESTAMP, is_read = true
                WHERE recipient_user_id = ? AND sender_user_id = ? AND read_at IS NULL
                """, currentUser, peerUser);
    }

    public List<ContactThreadCard> contactThreads(Integer userId) {
        return jdbcTemplate.query("""
                WITH peer_messages AS (
                    SELECT
                        CASE WHEN sender_user_id = ? THEN recipient_user_id ELSE sender_user_id END AS peer_id,
                        COALESCE(body, content) AS body, sent_at, recipient_user_id, read_at,
                        ROW_NUMBER() OVER (PARTITION BY
                            CASE WHEN sender_user_id = ? THEN recipient_user_id ELSE sender_user_id END
                            ORDER BY sent_at DESC) AS rn
                    FROM internal_messages
                    WHERE (sender_user_id = ? OR recipient_user_id = ?)
                      AND COALESCE(body, content) NOT LIKE '[SOS]%'
                )
                SELECT pm.peer_id, u.full_name AS peer_name, u.role AS peer_role,
                       pm.body AS last_body, pm.sent_at AS last_sent_at,
                       (SELECT COUNT(*) FROM internal_messages im2
                        WHERE im2.recipient_user_id = ? AND im2.sender_user_id = pm.peer_id
                          AND im2.read_at IS NULL
                          AND COALESCE(im2.body, im2.content) NOT LIKE '[SOS]%') AS unread_count
                FROM peer_messages pm
                JOIN users u ON u.user_id = pm.peer_id
                WHERE pm.rn = 1
                ORDER BY pm.sent_at DESC
                """, (rs, rowNum) -> new ContactThreadCard(
                        rs.getInt("peer_id"),
                        rs.getString("peer_name"),
                        rs.getString("peer_role"),
                        rs.getString("last_body"),
                        toOffset(rs.getTimestamp("last_sent_at")),
                        rs.getInt("unread_count")),
                userId, userId, userId, userId, userId);
    }

    private record ProfileRow(String fullName, String verificationStatus, String studentCode, Integer universityId,
            String universityName) {
    }

    // =========================================================================
    // Driver ratings (REQ-STU-011)
    // =========================================================================

    public void createDriverRating(Integer studentUserId, Integer tripId, Integer driverId,
            Integer starRating, String comment) {
        jdbcTemplate.update("""
                INSERT INTO driver_ratings (driver_id, student_user_id, trip_id, star_rating, comment)
                VALUES (?, ?, ?, ?, ?)
                """, driverId, studentUserId, tripId, starRating, comment);
    }

    public boolean existsDriverRating(Integer studentUserId, Integer tripId) {
        Long c = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM driver_ratings WHERE student_user_id = ? AND trip_id = ?",
                Long.class, studentUserId, tripId);
        return c != null && c > 0;
    }

    public Optional<Integer> driverIdForTrip(Integer tripId) {
        return jdbcTemplate.query("SELECT driver_id FROM trips WHERE trip_id = ?",
                rs -> rs.next() ? Optional.of(rs.getInt("driver_id")) : Optional.empty(), tripId);
    }

    public List<DriverRatingCard> driverRatings(Integer driverId, int limit) {
        return jdbcTemplate.query("""
                SELECT dr.rating_id, dr.driver_id, dr.student_user_id, dr.trip_id,
                       dr.star_rating, dr.comment, dr.created_at,
                       u.full_name AS student_name
                FROM driver_ratings dr
                LEFT JOIN users u ON u.user_id = dr.student_user_id
                WHERE dr.driver_id = ?
                ORDER BY dr.created_at DESC
                LIMIT ?
                """, (rs, rowNum) -> new DriverRatingCard(
                        rs.getLong("rating_id"),
                        rs.getInt("driver_id"),
                        rs.getString("student_name"),
                        (Integer) rs.getObject("trip_id"),
                        rs.getInt("star_rating"),
                        rs.getString("comment"),
                        toOffset(rs.getTimestamp("created_at"))),
                driverId, limit);
    }

    public Optional<DriverRatingSummary> driverRatingSummary(Integer driverId) {
        return jdbcTemplate.query("""
                SELECT AVG(star_rating) AS avg_rating, COUNT(*) AS total
                FROM driver_ratings
                WHERE driver_id = ?
                """, rs -> {
            if (!rs.next() || rs.getObject("total") == null) {
                return Optional.<DriverRatingSummary>empty();
            }
            int total = rs.getInt("total");
            if (total == 0) {
                return Optional.of(new DriverRatingSummary(driverId, fullNameByDriver(driverId), null, 0));
            }
            Double avg = rs.getDouble("avg_rating");
            return Optional.of(new DriverRatingSummary(driverId, fullNameByDriver(driverId), avg, total));
        }, driverId);
    }

    private String fullNameByDriver(Integer driverId) {
        return jdbcTemplate.query("""
                SELECT u.full_name FROM drivers d
                JOIN users u ON u.user_id = d.user_id
                WHERE d.driver_id = ?
                """, rs -> rs.next() ? rs.getString("full_name") : null, driverId);
    }

    // =========================================================================
    // Complaints workflow (REQ-ADM-002)
    // =========================================================================

    public Long createComplaint(Integer submittedByUserId, String subject, String description, String category) {
        return jdbcTemplate.queryForObject("""
                INSERT INTO complaints (submitted_by_user_id, subject, description, category, status, created_at)
                VALUES (?, ?, ?, ?, 'OPEN', CURRENT_TIMESTAMP)
                RETURNING complaint_id
                """, Long.class, submittedByUserId, subject, description, category);
    }

    public List<ComplaintCard> complaintsByStatus(String status, int limit) {
        String sql = """
                SELECT c.complaint_id, c.subject, c.description, c.status, c.created_at,
                       c.submitted_by_user_id, u.full_name AS submitter_name
                FROM complaints c
                LEFT JOIN users u ON u.user_id = c.submitted_by_user_id
                """ + (status == null || status.isBlank() ? "" : " WHERE c.status = ?")
                + " ORDER BY c.created_at DESC LIMIT ?";
        if (status == null || status.isBlank()) {
            return jdbcTemplate.query(sql,
                    (rs, rowNum) -> new ComplaintCard(
                            rs.getInt("complaint_id"),
                            rs.getString("subject"),
                            rs.getString("description"),
                            rs.getString("status"),
                            toOffset(rs.getTimestamp("created_at"))),
                    limit);
        }
        return jdbcTemplate.query(sql,
                (rs, rowNum) -> new ComplaintCard(
                        rs.getInt("complaint_id"),
                        rs.getString("subject"),
                        rs.getString("description"),
                        rs.getString("status"),
                        toOffset(rs.getTimestamp("created_at"))),
                status, limit);
    }

    public boolean resolveComplaint(Integer complaintId, Integer resolverUserId, String status, String resolution) {
        int rows = jdbcTemplate.update("""
                UPDATE complaints
                SET status = ?, resolution = ?, resolved_by_user_id = ?, resolved_at = CURRENT_TIMESTAMP
                WHERE complaint_id = ?
                """, status, resolution, resolverUserId, complaintId);
        return rows > 0;
    }

    // =========================================================================
    // Violations workflow (REQ-ADM-003)
    // =========================================================================

    public Long createViolation(Integer reportedByUserId, Integer reportedUserId, String category, String description) {
        return jdbcTemplate.queryForObject("""
                INSERT INTO violation_reports (reported_by_user_id, reported_user_id, category, description, status, created_at)
                VALUES (?, ?, ?, ?, 'REPORTED', CURRENT_TIMESTAMP)
                RETURNING violation_report_id
                """, Long.class, reportedByUserId, reportedUserId, category, description);
    }

    public boolean reviewViolation(Integer violationId, Integer reviewerUserId, String status, String actionTaken) {
        int rows = jdbcTemplate.update("""
                UPDATE violation_reports
                SET status = ?, action_taken = ?, reviewed_by_user_id = ?, reviewed_at = CURRENT_TIMESTAMP
                WHERE violation_report_id = ?
                """, status, actionTaken, reviewerUserId, violationId);
        return rows > 0;
    }



    // =========================================================================
    // Fare change history (REQ-ADM-007)
    // =========================================================================

    public void recordFareChange(Integer fareId, Integer routeId, BigDecimal oldAmount, BigDecimal newAmount,
            LocalDate effectiveFrom, Integer adjustedByUserId, String reason) {
        jdbcTemplate.update("""
                INSERT INTO fare_changes (fare_id, route_id, old_amount, new_amount, effective_from,
                                          adjusted_by_user_id, reason)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """, fareId, routeId, oldAmount, newAmount, effectiveFrom, adjustedByUserId, reason);
    }

    public List<java.util.Map<String, Object>> fareChangeHistory(Integer routeId) {
        return jdbcTemplate.queryForList("""
                SELECT fc.fare_change_id, fc.fare_id, fc.route_id, fc.old_amount, fc.new_amount,
                       fc.effective_from, fc.adjusted_by_user_id, u.full_name AS adjusted_by_name,
                       fc.reason, fc.created_at
                FROM fare_changes fc
                LEFT JOIN users u ON u.user_id = fc.adjusted_by_user_id
                WHERE fc.route_id = ?
                ORDER BY fc.created_at DESC
                LIMIT 50
                """, routeId);
    }
}
