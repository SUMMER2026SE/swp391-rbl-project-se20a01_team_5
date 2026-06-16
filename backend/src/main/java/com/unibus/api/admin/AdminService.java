package com.unibus.api.admin;

import java.math.BigDecimal;
import java.sql.Date;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.unibus.api.admin.AdminDtos.AdminCaseSummary;
import com.unibus.api.admin.AdminDtos.AdminNote;
import com.unibus.api.admin.AdminDtos.AdminUserSummary;
import com.unibus.api.admin.AdminDtos.AdminNoteRequest;
import com.unibus.api.admin.AdminDtos.BroadcastNotificationRequest;
import com.unibus.api.admin.AdminDtos.BroadcastNotificationResult;
import com.unibus.api.admin.AdminDtos.CreateStaffAccountRequest;
import com.unibus.api.admin.AdminDtos.DashboardSummary;
import com.unibus.api.admin.AdminDtos.FareSummary;
import com.unibus.api.admin.AdminDtos.FareUpdateRequest;
import com.unibus.api.admin.AdminDtos.RevenuePoint;
import com.unibus.api.admin.AdminDtos.RoleCount;
import com.unibus.api.admin.AdminDtos.RoutePricingOption;
import com.unibus.api.admin.AdminDtos.SchoolCount;
import com.unibus.api.admin.AdminDtos.UpdateCaseStatusRequest;
import com.unibus.api.admin.AdminDtos.UpdateUserStatusRequest;
import com.unibus.api.common.ApiException;
import com.unibus.api.student.model.StudentVerificationStatus;
import com.unibus.api.user.UserRepository;
import com.unibus.api.user.model.User;
import com.unibus.api.user.model.UserRole;
import com.unibus.api.user.model.UserStatus;

@Service
public class AdminService {

    private static final List<UserRole> STAFF_ROLES = List.of(UserRole.DRIVER, UserRole.CONDUCTOR, UserRole.DISPATCHER, UserRole.ADMIN);

    private final UserRepository userRepository;
    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;

    public AdminService(UserRepository userRepository, JdbcTemplate jdbcTemplate, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.jdbcTemplate = jdbcTemplate;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<AdminUserSummary> getUsers(String search, UserRole role, UserStatus status) {
        return userRepository.findAll().stream()
                .filter(user -> role == null || user.getRole() == role)
                .filter(user -> status == null || user.getStatus() == status)
                .filter(user -> matchesSearch(user, search))
                .map(this::toUserSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public AdminUserSummary getUser(Integer id) {
        return toUserSummary(requireUser(id));
    }

    @Transactional
    public AdminUserSummary createStaffAccount(CreateStaffAccountRequest request) {
        if (request.role() == UserRole.STUDENT || !STAFF_ROLES.contains(request.role())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only staff or admin accounts can be created here");
        }
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "Email is already registered");
        }
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setFullName(request.fullName().trim());
        user.setPhoneNumber(blankToNull(request.phoneNumber()));
        user.setRole(request.role());
        user.setStatus(UserStatus.ACTIVE);
        user.setStudentVerificationStatus(StudentVerificationStatus.NOT_SUBMITTED);
        user.setCreatedAt(now);
        user.setUpdatedAt(now);
        return toUserSummary(userRepository.save(user));
    }

    @Transactional
    public AdminUserSummary updateUserStatus(Integer id, UpdateUserStatusRequest request) {
        User user = requireUser(id);
        user.setStatus(request.status());
        user.setLockReason(request.status() == UserStatus.LOCKED ? blankToNull(request.reason()) : null);
        user.setUpdatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        return toUserSummary(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public List<AdminCaseSummary> getCases(String status, String type, String search) {
        String sql = """
                SELECT c.case_id, c.case_type, c.title, c.category, c.content, c.priority, c.status,
                       c.resolution, c.created_at, c.closed_at, c.subject_user_id,
                       reporter.full_name AS reporter_name, target.full_name AS target_name, handler.full_name AS handler_name
                FROM cases c
                JOIN users reporter ON reporter.user_id = c.submitted_by_user_id
                LEFT JOIN users target ON target.user_id = c.subject_user_id
                LEFT JOIN users handler ON handler.user_id = c.handled_by_user_id
                WHERE c.case_type IN ('COMPLAINT', 'VIOLATION', 'INCIDENT', 'SUPPORT')
                ORDER BY c.created_at DESC
                """;
        return jdbcTemplate.query(sql, this::toCaseSummary).stream()
                .filter(item -> status == null || status.isBlank() || item.status().equalsIgnoreCase(toDbCaseStatus(status)))
                .filter(item -> type == null || type.isBlank() || item.type().equalsIgnoreCase(type))
                .filter(item -> matchesCaseSearch(item, search))
                .toList();
    }

    @Transactional(readOnly = true)
    public AdminCaseSummary getCase(Integer id) {
        return jdbcTemplate.query("""
                SELECT c.case_id, c.case_type, c.title, c.category, c.content, c.priority, c.status,
                       c.resolution, c.created_at, c.closed_at, c.subject_user_id,
                       reporter.full_name AS reporter_name, target.full_name AS target_name, handler.full_name AS handler_name
                FROM cases c
                JOIN users reporter ON reporter.user_id = c.submitted_by_user_id
                LEFT JOIN users target ON target.user_id = c.subject_user_id
                LEFT JOIN users handler ON handler.user_id = c.handled_by_user_id
                WHERE c.case_id = ?
                """, this::toCaseSummary, id).stream()
                .findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Case not found"));
    }

    @Transactional
    public AdminCaseSummary updateCaseStatus(Integer id, UpdateCaseStatusRequest request, Integer adminUserId) {
        String status = toDbCaseStatus(request.status());
        int updated = jdbcTemplate.update("""
                UPDATE cases
                SET status = ?, resolution = ?, handled_by_user_id = ?, updated_at = CURRENT_TIMESTAMP,
                    closed_at = CASE WHEN ? IN ('RESOLVED', 'REJECTED', 'CLOSED') THEN CURRENT_TIMESTAMP ELSE closed_at END
                WHERE case_id = ?
                """, status, blankToNull(request.resolution()), adminUserId, status, id);
        if (updated == 0) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Case not found");
        }
        return getCase(id);
    }

    @Transactional(readOnly = true)
    public List<AdminNote> getCaseNotes(Integer caseId) {
        return jdbcTemplate.query("""
                SELECT cm.communication_id, sender.full_name AS sender_name, cm.content, cm.sent_at
                FROM communications cm
                LEFT JOIN users sender ON sender.user_id = cm.sender_user_id
                WHERE cm.case_id = ? AND cm.communication_kind = 'MESSAGE'
                ORDER BY cm.sent_at ASC
                """, (rs, rowNum) -> new AdminNote(
                rs.getLong("communication_id"),
                rs.getString("sender_name"),
                rs.getString("content"),
                toOffsetDateTime(rs.getTimestamp("sent_at"))), caseId);
    }

    @Transactional
    public AdminNote addCaseNote(Integer caseId, AdminNoteRequest request, Integer adminUserId) {
        getCase(caseId);
        Long id = jdbcTemplate.queryForObject("""
                INSERT INTO communications (communication_kind, sender_user_id, case_id, title, content, communication_type)
                VALUES ('MESSAGE', ?, ?, 'Admin note', ?, 'CASE')
                RETURNING communication_id
                """, Long.class, adminUserId, caseId, request.content().trim());
        return getCaseNotes(caseId).stream()
                .filter(note -> note.id().equals(id))
                .findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to create note"));
    }

    @Transactional(readOnly = true)
    public DashboardSummary getDashboard() {
        BigDecimal todayRevenue = queryBigDecimal("""
                SELECT COALESCE(SUM(amount), 0)
                FROM payments
                WHERE status = 'COMPLETED' AND paid_at::date = CURRENT_DATE
                """);
        long studentCount = queryLong("SELECT COUNT(*) FROM users WHERE role = 'STUDENT'");
        long driverCount = queryLong("SELECT COUNT(*) FROM users WHERE role = 'DRIVER'");
        long todayTripCount = queryLong("SELECT COUNT(*) FROM trips WHERE service_date = CURRENT_DATE");
        long pendingCaseCount = queryLong("SELECT COUNT(*) FROM cases WHERE status IN ('NEW', 'OPEN', 'IN_PROGRESS')");
        List<RevenuePoint> revenue = jdbcTemplate.query("""
                SELECT day::date AS revenue_day, COALESCE(SUM(p.amount), 0) AS amount
                FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, INTERVAL '1 day') day
                LEFT JOIN payments p ON p.status = 'COMPLETED' AND p.paid_at::date = day::date
                GROUP BY day
                ORDER BY day
                """, (rs, rowNum) -> new RevenuePoint(rs.getDate("revenue_day").toLocalDate(), rs.getBigDecimal("amount")));
        List<RoleCount> roleCounts = jdbcTemplate.query("""
                SELECT role, COUNT(*) AS total
                FROM users
                GROUP BY role
                """, (rs, rowNum) -> new RoleCount(UserRole.valueOf(rs.getString("role")), rs.getLong("total")));
        List<SchoolCount> schoolCounts = jdbcTemplate.query("""
                SELECT COALESCE(university_name, 'Chua cap nhat') AS school, COUNT(*) AS total
                FROM students
                GROUP BY COALESCE(university_name, 'Chua cap nhat')
                ORDER BY total DESC
                LIMIT 5
                """, (rs, rowNum) -> new SchoolCount(rs.getString("school"), rs.getLong("total")));
        return new DashboardSummary(todayRevenue, studentCount, driverCount, todayTripCount, pendingCaseCount,
                revenue, roleCounts, schoolCounts);
    }

    @Transactional(readOnly = true)
    public List<RoutePricingOption> getRoutePricingOptions() {
        return jdbcTemplate.query("""
                SELECT route_id, route_name
                FROM routes
                WHERE status = 'ACTIVE'
                ORDER BY route_name
                """, (rs, rowNum) -> new RoutePricingOption(rs.getInt("route_id"), rs.getString("route_name")));
    }

    @Transactional(readOnly = true)
    public List<FareSummary> getCurrentFares() {
        return jdbcTemplate.query("""
                SELECT DISTINCT ON (f.route_id, f.fare_type)
                       f.fare_id, f.route_id, r.route_name, f.fare_type, f.amount,
                       f.effective_from, f.effective_until, f.notes
                FROM fares f
                JOIN routes r ON r.route_id = f.route_id
                WHERE f.effective_from <= CURRENT_DATE
                  AND (f.effective_until IS NULL OR f.effective_until >= CURRENT_DATE)
                ORDER BY f.route_id, f.fare_type, f.effective_from DESC
                """, this::toFareSummary);
    }

    @Transactional
    public List<FareSummary> updateFare(FareUpdateRequest request, Integer adminUserId) {
        String fareType = request.fareType().trim().toUpperCase(Locale.ROOT);
        if (!fareType.equals("SINGLE") && !fareType.equals("MONTHLY")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Fare type must be SINGLE or MONTHLY");
        }
        LocalDate effectiveFrom = request.effectiveFrom() == null ? LocalDate.now(ZoneOffset.UTC) : request.effectiveFrom();
        if (request.effectiveUntil() != null && request.effectiveUntil().isBefore(effectiveFrom)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Effective until must not be before effective from");
        }
        List<Integer> routeIds = request.routeId() == null
                ? jdbcTemplate.queryForList("SELECT route_id FROM routes WHERE status = 'ACTIVE'", Integer.class)
                : List.of(request.routeId());
        if (routeIds.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "No active routes available for fare update");
        }
        for (Integer routeId : routeIds) {
            jdbcTemplate.update("""
                    INSERT INTO fares (route_id, fare_type, amount, effective_from, effective_until, adjusted_by_user_id, notes)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, routeId, fareType, request.amount(), Date.valueOf(effectiveFrom),
                    request.effectiveUntil() == null ? null : Date.valueOf(request.effectiveUntil()),
                    adminUserId, blankToNull(request.notes()));
        }
        return getCurrentFares();
    }

    @Transactional
    public BroadcastNotificationResult broadcast(BroadcastNotificationRequest request, Integer adminUserId) {
        List<Integer> recipients = switch (request.target()) {
            case "all_students" -> jdbcTemplate.queryForList("SELECT user_id FROM users WHERE role = 'STUDENT' AND status = 'ACTIVE'", Integer.class);
            case "all_staffs" -> jdbcTemplate.queryForList("SELECT user_id FROM users WHERE role <> 'STUDENT' AND status = 'ACTIVE'", Integer.class);
            case "all" -> jdbcTemplate.queryForList("SELECT user_id FROM users WHERE status = 'ACTIVE'", Integer.class);
            default -> throw new ApiException(HttpStatus.BAD_REQUEST, "Unsupported notification target");
        };
        for (Integer recipientId : recipients) {
            jdbcTemplate.update("""
                    INSERT INTO communications (
                        communication_kind, recipient_user_id, sender_user_id, title, content, communication_type
                    )
                    VALUES ('NOTIFICATION', ?, ?, ?, ?, 'ALERT')
                    """, recipientId, adminUserId, request.title().trim(), request.content().trim());
        }
        return new BroadcastNotificationResult(recipients.size());
    }

    private AdminUserSummary toUserSummary(User user) {
        return new AdminUserSummary(
                user.getId(),
                codeFor(user),
                user.getFullName(),
                user.getEmail(),
                user.getPhoneNumber(),
                user.getRole(),
                user.getStatus(),
                user.getLockReason(),
                user.getCreatedAt());
    }

    private AdminCaseSummary toCaseSummary(ResultSet rs, int rowNum) throws SQLException {
        Integer id = rs.getInt("case_id");
        return new AdminCaseSummary(
                id,
                "CASE-" + String.format("%04d", id),
                rs.getString("case_type"),
                rs.getString("title"),
                rs.getString("category"),
                rs.getString("content"),
                rs.getString("reporter_name"),
                rs.getObject("subject_user_id", Integer.class),
                rs.getString("target_name"),
                rs.getString("priority"),
                rs.getString("status"),
                rs.getString("resolution"),
                rs.getString("handler_name"),
                toOffsetDateTime(rs.getTimestamp("created_at")),
                toOffsetDateTime(rs.getTimestamp("closed_at")));
    }

    private FareSummary toFareSummary(ResultSet rs, int rowNum) throws SQLException {
        Date effectiveUntil = rs.getDate("effective_until");
        return new FareSummary(
                rs.getInt("fare_id"),
                rs.getInt("route_id"),
                rs.getString("route_name"),
                rs.getString("fare_type"),
                rs.getBigDecimal("amount"),
                rs.getDate("effective_from").toLocalDate(),
                effectiveUntil == null ? null : effectiveUntil.toLocalDate(),
                rs.getString("notes"));
    }

    private boolean matchesSearch(User user, String search) {
        if (search == null || search.isBlank()) {
            return true;
        }
        String needle = search.trim().toLowerCase(Locale.ROOT);
        return String.valueOf(user.getId()).contains(needle)
                || user.getEmail().toLowerCase(Locale.ROOT).contains(needle)
                || user.getFullName().toLowerCase(Locale.ROOT).contains(needle)
                || (user.getPhoneNumber() != null && user.getPhoneNumber().contains(needle));
    }

    private boolean matchesCaseSearch(AdminCaseSummary item, String search) {
        if (search == null || search.isBlank()) {
            return true;
        }
        String needle = search.trim().toLowerCase(Locale.ROOT);
        return item.code().toLowerCase(Locale.ROOT).contains(needle)
                || safeContains(item.title(), needle)
                || safeContains(item.reporter(), needle)
                || safeContains(item.target(), needle)
                || safeContains(item.content(), needle);
    }

    private boolean safeContains(String value, String needle) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(needle);
    }

    private User requireUser(Integer id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private String codeFor(User user) {
        String prefix = switch (user.getRole()) {
            case STUDENT -> "SV";
            case DRIVER -> "TX";
            case CONDUCTOR -> "PX";
            case DISPATCHER -> "DP";
            case ADMIN -> "AD";
        };
        return prefix + String.format("%05d", user.getId());
    }

    private String toDbCaseStatus(String status) {
        return switch (status.trim().toLowerCase(Locale.ROOT)) {
            case "pending", "new", "open" -> "OPEN";
            case "in_progress", "processing" -> "IN_PROGRESS";
            case "resolved" -> "RESOLVED";
            case "rejected" -> "REJECTED";
            case "closed" -> "CLOSED";
            default -> status.trim().toUpperCase(Locale.ROOT);
        };
    }

    private BigDecimal queryBigDecimal(String sql) {
        BigDecimal value = jdbcTemplate.queryForObject(sql, BigDecimal.class);
        return value == null ? BigDecimal.ZERO : value;
    }

    private long queryLong(String sql) {
        Long value = jdbcTemplate.queryForObject(sql, Long.class);
        return value == null ? 0L : value;
    }

    private OffsetDateTime toOffsetDateTime(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toInstant().atOffset(ZoneOffset.UTC);
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
