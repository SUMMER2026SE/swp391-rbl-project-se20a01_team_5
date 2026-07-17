package com.unibus.api.ticketing;

import com.unibus.api.user.model.UserRole;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.unibus.api.common.ApiException;
import com.unibus.api.security.CurrentUser;
import com.unibus.api.ticketing.TicketingDtos.MonthlyPassQuote;
import com.unibus.api.ticketing.TicketingRepository.ApprovedRegistration;
import com.unibus.api.university.SubsidyService;

@Service
public class SePayService {

    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final JdbcTemplate jdbcTemplate;
    private final TicketingRepository ticketingRepository;
    private final SubsidyService subsidyService;
    private final ObjectMapper objectMapper;

    @Value("${app.sepay.bank-code:MB}")
    private String bankCode;

    @Value("${app.sepay.account-no:20119999988888}")
    private String accountNo;

    @Value("${app.sepay.account-name:Nguyen Truong Phuc}")
    private String accountName;

    @Value("${app.sepay.qr-template:compact}")
    private String qrTemplate;

    @Value("${app.sepay.webhook-api-key:unibus-sepay-webhook-key}")
    private String webhookApiKey;

    public SePayService(JdbcTemplate jdbcTemplate, TicketingRepository ticketingRepository, SubsidyService subsidyService) {
        this.jdbcTemplate = jdbcTemplate;
        this.ticketingRepository = ticketingRepository;
        this.subsidyService = subsidyService;
        this.objectMapper = new ObjectMapper();
    }

    public String getWebhookApiKey() {
        return webhookApiKey;
    }

    @Transactional
    public Map<String, Object> createOrder(CurrentUser currentUser, String ticketType) {
        return createOrder(currentUser, ticketType, null);
    }

    @Transactional
    public Map<String, Object> createOrder(CurrentUser currentUser, String ticketType, Integer requestedRouteId) {
        if ("test".equalsIgnoreCase(ticketType)) {
            return createTestOrder(currentUser);
        }
        Map<String, Object> request = new LinkedHashMap<>();
        request.put("ticketType", ticketType);
        request.put("routeId", requestedRouteId);
        return createOrder(currentUser, request);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> quote(CurrentUser currentUser, Map<String, Object> request) {
        String studentCode = studentCode(currentUser);
        PaymentRequest paymentRequest = paymentRequest(request);
        List<OrderLine> lines = quoteLines(currentUser, studentCode, paymentRequest);
        paymentRequest = resolveStopLabels(paymentRequest, lines);
        return quoteResponse(paymentRequest, lines);
    }

    @Transactional
    public Map<String, Object> createOrder(CurrentUser currentUser, Map<String, Object> request) {
        String studentCode = studentCode(currentUser);
        PaymentRequest paymentRequest = paymentRequest(request);
        List<OrderLine> lines = quoteLines(currentUser, studentCode, paymentRequest);
        PaymentRequest resolvedRequest = resolveStopLabels(paymentRequest, lines);
        BigDecimal amount = sumFinal(lines);
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Bạn đã có vé còn hiệu lực cho toàn bộ hành trình");
        }

        Integer routeId = resolvedRequest.routeId();
        Integer orderRouteId = routeId == null && !lines.isEmpty() ? lines.get(0).routeId() : routeId;
        String ticketType = resolvedRequest.ticketType();
        List<Map<String, Object>> existingOrders = jdbcTemplate.queryForList(
                """
                SELECT id, total
                FROM tb_orders
                WHERE student_code = ?
                  AND ticket_type = ?
                  AND COALESCE(route_id, -1) = COALESCE(?, -1)
                  AND order_mode = ?
                  AND ticket_period = ?
                  AND payment_status = 'Unpaid'
                ORDER BY created_at DESC
                LIMIT 1
                """,
                studentCode, ticketType, orderRouteId, resolvedRequest.mode(), resolvedRequest.ticketPeriod());

        if (!existingOrders.isEmpty()) {
            Map<String, Object> existing = existingOrders.get(0);
            BigDecimal existingTotal = (BigDecimal) existing.get("total");
            if (existingTotal.compareTo(amount) == 0) {
                long orderId = ((Number) existing.get("id")).longValue();
                String description = "DH" + orderId;
                String qrUrl = String.format("https://qr.sepay.vn/img?bank=%s&acc=%s&template=%s&amount=%s&des=%s",
                        bankCode, accountNo, qrTemplate, amount.toPlainString(), description);
                return orderResponse(orderId, studentCode, resolvedRequest, lines, amount, description, qrUrl);
            }
        }

        KeyHolder keyHolder = new GeneratedKeyHolder();
        String legsJson = legsJson(resolvedRequest, lines);
        BigDecimal originalAmount = sumOriginal(lines);
        BigDecimal subsidyAmount = sumSubsidy(lines);
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(
                    """
                    INSERT INTO tb_orders (
                        student_code, ticket_type, route_id, total, payment_status, name,
                        order_mode, ticket_period, origin_label, destination_label, legs_json,
                        original_amount, subsidy_amount, final_amount
                    )
                    VALUES (?, ?, ?, ?, 'Unpaid', ?, ?, ?, ?, ?, ?::jsonb, ?, ?, ?)
                    """,
                    new String[] { "id" });
            statement.setString(1, studentCode);
            statement.setString(2, ticketType);
            statement.setInt(3, orderRouteId);
            statement.setBigDecimal(4, amount);
            statement.setString(5, "month".equals(resolvedRequest.ticketPeriod()) ? "Vé tháng UniBus" : "Vé ngày UniBus");
            statement.setString(6, resolvedRequest.mode());
            statement.setString(7, resolvedRequest.ticketPeriod());
            statement.setString(8, resolvedRequest.originLabel());
            statement.setString(9, resolvedRequest.destinationLabel());
            statement.setString(10, legsJson);
            statement.setBigDecimal(11, originalAmount);
            statement.setBigDecimal(12, subsidyAmount);
            statement.setBigDecimal(13, amount);
            return statement;
        }, keyHolder);

        Number idVal = keyHolder.getKey();
        if (idVal == null) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to create payment order");
        }
        long orderId = idVal.longValue();
        String description = "DH" + orderId;
        // Generate SePay QR URL
        String qrUrl = String.format("https://qr.sepay.vn/img?bank=%s&acc=%s&template=%s&amount=%s&des=%s",
                bankCode, accountNo, qrTemplate, amount.toPlainString(), description);

        return orderResponse(orderId, studentCode, resolvedRequest, lines, amount, description, qrUrl);
    }

    private Map<String, Object> createTestOrder(CurrentUser currentUser) {
        String studentCode = studentCode(currentUser);
        if (!"OKNIGGA".equalsIgnoreCase(studentCode)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Test payment is not enabled for this user");
        }
        Integer routeId = jdbcTemplate.queryForObject("SELECT route_id FROM routes ORDER BY route_id LIMIT 1", Integer.class);
        BigDecimal amount = new BigDecimal("3000");
        List<Map<String, Object>> existingOrders = jdbcTemplate.queryForList(
                """
                SELECT id, total
                FROM tb_orders
                WHERE student_code = ?
                  AND ticket_type = 'single'
                  AND COALESCE(route_id, -1) = COALESCE(?, -1)
                  AND order_mode = 'single-route'
                  AND ticket_period = 'day'
                  AND payment_status = 'Unpaid'
                ORDER BY created_at DESC
                LIMIT 1
                """,
                studentCode, routeId);
        if (!existingOrders.isEmpty()) {
            Map<String, Object> existing = existingOrders.get(0);
            if (((BigDecimal) existing.get("total")).compareTo(amount) == 0) {
                long orderId = ((Number) existing.get("id")).longValue();
                return testOrderResponse(orderId, studentCode, routeId, amount);
            }
        }

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(
                    """
                    INSERT INTO tb_orders (
                        student_code, ticket_type, route_id, total, payment_status, name,
                        order_mode, ticket_period, original_amount, subsidy_amount, final_amount
                    )
                    VALUES (?, 'single', ?, ?, 'Unpaid', 'Test UniBus', 'single-route', 'day', ?, 0, ?)
                    """,
                    new String[] { "id" });
            statement.setString(1, studentCode);
            statement.setInt(2, routeId);
            statement.setBigDecimal(3, amount);
            statement.setBigDecimal(4, amount);
            statement.setBigDecimal(5, amount);
            return statement;
        }, keyHolder);
        Number idVal = keyHolder.getKey();
        if (idVal == null) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to create payment order");
        }
        return testOrderResponse(idVal.longValue(), studentCode, routeId, amount);
    }

    private Map<String, Object> testOrderResponse(long orderId, String studentCode, Integer routeId, BigDecimal amount) {
        String description = "DH" + orderId;
        String qrUrl = String.format("https://qr.sepay.vn/img?bank=%s&acc=%s&template=%s&amount=%s&des=%s",
                bankCode, accountNo, qrTemplate, amount.toPlainString(), description);
        PaymentRequest request = new PaymentRequest("single-route", "day", "test", routeId,
                "Test UniBus", "Test UniBus", LocalDate.now(), List.of());
        return orderResponse(orderId, studentCode, request, List.of(), amount, description, qrUrl);
    }

    private Map<String, Object> orderResponse(
            long orderId,
            String studentCode,
            PaymentRequest request,
            List<OrderLine> lines,
            BigDecimal amount,
            String description,
            String qrUrl) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("orderId", orderId);
        response.put("studentCode", studentCode);
        response.put("ticketType", request.ticketType());
        response.put("ticketPeriod", request.ticketPeriod());
        response.put("mode", request.mode());
        response.put("routeId", request.routeId());
        response.put("routeName", lines.isEmpty() ? null : lines.get(0).routeName());
        response.put("originLabel", request.originLabel());
        response.put("destinationLabel", request.destinationLabel());
        response.put("amount", amount);
        response.put("originalAmount", sumOriginal(lines));
        response.put("subsidyAmount", sumSubsidy(lines));
        response.put("finalAmount", amount);
        response.put("items", lineViews(lines));
        response.put("description", description);
        response.put("qrUrl", qrUrl);
        response.put("bankCode", bankCode);
        response.put("accountNo", accountNo);
        response.put("accountName", accountName);
        return response;
    }

    private Map<String, Object> quoteResponse(PaymentRequest request, List<OrderLine> lines) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("mode", request.mode());
        response.put("ticketPeriod", request.ticketPeriod());
        response.put("ticketType", request.ticketType());
        response.put("routeId", request.routeId());
        response.put("originLabel", request.originLabel());
        response.put("destinationLabel", request.destinationLabel());
        response.put("items", lineViews(lines));
        response.put("originalAmount", sumOriginal(lines));
        response.put("subsidyAmount", sumSubsidy(lines));
        response.put("finalAmount", sumFinal(lines));
        return response;
    }

    private List<Map<String, Object>> lineViews(List<OrderLine> lines) {
        return lines.stream().map(line -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("routeId", line.routeId());
            item.put("routeName", line.routeName());
            item.put("boardingStopId", line.boardingStopId());
            item.put("boardingStopName", line.boardingStopName());
            item.put("alightingStopId", line.alightingStopId());
            item.put("alightingStopName", line.alightingStopName());
            item.put("legOrder", line.legOrder());
            item.put("originalAmount", line.originalAmount());
            item.put("subsidyAmount", line.subsidyAmount());
            item.put("finalAmount", line.finalAmount());
            item.put("subsidyApplied", line.subsidyPolicyId() != null && line.subsidyAmount().compareTo(BigDecimal.ZERO) > 0);
            item.put("subsidyStatus", line.subsidyStatus());
            item.put("subsidyNote", subsidyNote(line));
            item.put("alreadyActive", line.alreadyActive());
            return item;
        }).toList();
    }

    private String subsidyNote(OrderLine line) {
        if (line.alreadyActive()) {
            return "Bạn đã có vé tháng còn hiệu lực cho tuyến này";
        }
        if (line.subsidyPolicyId() != null && line.subsidyAmount().compareTo(BigDecimal.ZERO) > 0) {
            return "Trường của bạn hỗ trợ tuyến này";
        }
        return "Tuyến này chưa có trợ giá từ trường của bạn";
    }

    private List<OrderLine> quoteLines(CurrentUser currentUser, String studentCode, PaymentRequest request) {
        LocalDate serviceDate = request.serviceDate() == null ? LocalDate.now() : request.serviceDate();
        int year = serviceDate.getYear();
        int month = serviceDate.getMonthValue();
        List<OrderLine> lines = new ArrayList<>();
        Set<Integer> seenRoutes = new HashSet<>();
        for (PaymentLeg leg : request.legs()) {
            if (leg.routeId() == null || !seenRoutes.add(leg.routeId())) {
                continue;
            }
            boolean monthly = "month".equals(request.ticketPeriod());
            Optional<ApprovedRegistration> registration = ticketingRepository.approvedRegistration(studentCode, leg.routeId());
            if (monthly && registration.isEmpty()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Cần đăng ký tuyến được duyệt trước khi mua vé tháng");
            }
            String routeName = registration.map(ApprovedRegistration::routeName).orElseGet(() -> routeName(leg.routeId()));
            Integer boardingStopId = monthly && leg.boardingStopId() == null
                    ? registration.map(ApprovedRegistration::boardingRouteStopId).orElse(null)
                    : leg.boardingStopId();
            Integer alightingStopId = monthly && leg.alightingStopId() == null
                    ? registration.map(ApprovedRegistration::alightingRouteStopId).orElse(null)
                    : leg.alightingStopId();
            if (boardingStopId == null || alightingStopId == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Vui lòng chọn điểm lên và điểm xuống cho vé lượt");
            }
            if (!monthly) {
                validateSingleStopPair(leg.routeId(), boardingStopId, alightingStopId);
            }
            BigDecimal baseFare = monthly
                    ? ticketingRepository.monthlyFare(leg.routeId())
                    : ticketingRepository.singleFare(leg.routeId());
            if (baseFare.compareTo(BigDecimal.ZERO) <= 0) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Route does not have a fare configured");
            }
            MonthlyPassQuote quote = subsidyService.quoteFor(currentUser, leg.routeId(), routeName, baseFare, serviceDate);
            if (monthly) ensureStudentCanBuy(quote);
            boolean active = monthly
                    && ticketingRepository.activeMonthlyPass(studentCode, leg.routeId(), year, month).isPresent();
            lines.add(new OrderLine(
                    leg.routeId(),
                    routeName,
                    boardingStopId,
                    stopName(boardingStopId, registration.map(ApprovedRegistration::boardingStopName).orElse("Trạm lên")),
                    alightingStopId,
                    stopName(alightingStopId, registration.map(ApprovedRegistration::alightingStopName).orElse("Trạm xuống")),
                    leg.legOrder() == null ? lines.size() + 1 : leg.legOrder(),
                    active ? BigDecimal.ZERO : quote.originalFareAmount(),
                    active ? BigDecimal.ZERO : quote.subsidyAmount(),
                    active ? BigDecimal.ZERO : quote.finalFareAmount(),
                    active ? null : quote.subsidyPolicyId(),
                    active ? "ALREADY_ACTIVE" : quote.subsidyStatus(),
                    active));
        }
        if (lines.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "No route legs found for payment");
        }
        return lines;
    }

    private void ensureStudentCanBuy(MonthlyPassQuote quote) {
        if (SubsidyService.STATUS_NOT_VERIFIED.equals(quote.subsidyStatus())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Student verification is required before buying tickets");
        }
        if (SubsidyService.STATUS_NO_UNIVERSITY.equals(quote.subsidyStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Student university is not linked to a partner university yet");
        }
    }

    void validateSingleStopPair(Integer routeId, Integer boardingStopId, Integer alightingStopId) {
        Integer matches = jdbcTemplate.queryForObject("""
                SELECT count(*)
                FROM route_stops boarding
                JOIN route_stops alighting
                  ON alighting.route_id = boarding.route_id
                 AND alighting.station_direction = boarding.station_direction
                JOIN routes route ON route.route_id = boarding.route_id
                WHERE boarding.route_id = ?
                  AND boarding.stop_id = ?
                  AND alighting.stop_id = ?
                  AND boarding.stop_order < alighting.stop_order
                  AND upper(route.status) = 'ACTIVE'
                """, Integer.class, routeId, boardingStopId, alightingStopId);
        if (matches == null || matches == 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Điểm lên/xuống không hợp lệ cho tuyến đã chọn");
        }
    }

    OffsetDateTime singleTicketExpiry(Instant now) {
        return now.atZone(BUSINESS_ZONE).toLocalDate().atTime(23, 59, 59).atZone(BUSINESS_ZONE).toOffsetDateTime();
    }

    private PaymentRequest resolveStopLabels(PaymentRequest request, List<OrderLine> lines) {
        if (lines.size() != 1) return request;
        OrderLine line = lines.get(0);
        String origin = "Điểm đi".equals(request.originLabel()) ? line.boardingStopName() : request.originLabel();
        String destination = "Điểm đến".equals(request.destinationLabel()) ? line.alightingStopName() : request.destinationLabel();
        return new PaymentRequest(request.mode(), request.ticketPeriod(), request.ticketType(), request.routeId(), origin, destination, request.serviceDate(), request.legs());
    }
    private String stopName(Integer stopId, String fallback) {
        if (stopId == null) return fallback;
        List<String> names = jdbcTemplate.queryForList("SELECT stop_name FROM stops WHERE stop_id = ?", String.class, stopId);
        return names.isEmpty() ? fallback : names.get(0);
    }

    private String routeName(Integer routeId) {
        List<String> names = jdbcTemplate.queryForList("SELECT route_name FROM routes WHERE route_id = ?", String.class, routeId);
        return names.isEmpty() ? "Tuyến " + routeId : names.get(0);
    }

    private String studentCode(CurrentUser currentUser) {
        return ticketingRepository.studentCodeForUser(currentUser.userId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Student profile not found"));
    }

    private PaymentRequest paymentRequest(Map<String, Object> request) {
        Map<String, Object> source = request == null ? Map.of() : request;
        String ticketPeriod = normalizeTicketPeriod(stringValue(request, "ticketPeriod", null),
                stringValue(request, "ticketType", "monthly"));
        String ticketType = "month".equals(ticketPeriod) ? "monthly" : "single";
        String mode = stringValue(request, "mode", null);
        Integer routeId = intValue(source.get("routeId"));
        List<PaymentLeg> legs = parseLegs(source.get("legs"));
        if (legs.isEmpty() && routeId != null) {
            legs = List.of(new PaymentLeg(routeId, intValue(source.get("boardingStopId")),
                    intValue(source.get("alightingStopId")), 1));
        }
        if (mode == null || mode.isBlank()) {
            mode = legs.size() > 1 ? "journey-combo" : "single-route";
        }
        if (!"single-route".equals(mode) && !"journey-combo".equals(mode)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid order mode");
        }
        LocalDate serviceDate = dateValue(source.get("serviceDate"));
        return new PaymentRequest(
                mode,
                ticketPeriod,
                ticketType,
                routeId == null && legs.size() == 1 ? legs.get(0).routeId() : routeId,
                label(stringValue(request, "originLabel", null), "Điểm đi"),
                label(stringValue(request, "destinationLabel", null), "Điểm đến"),
                serviceDate,
                legs);
    }

    private List<PaymentLeg> parseLegs(Object raw) {
        if (!(raw instanceof List<?> rawList)) {
            return List.of();
        }
        List<PaymentLeg> legs = new ArrayList<>();
        int order = 1;
        for (Object item : rawList) {
            if (!(item instanceof Map<?, ?> map)) continue;
            Integer routeId = intValue(map.get("routeId"));
            if (routeId == null) continue;
            legs.add(new PaymentLeg(
                    routeId,
                    intValue(map.get("boardingStopId")),
                    intValue(map.get("alightingStopId")),
                    intValue(map.get("legOrder")) == null ? order : intValue(map.get("legOrder"))));
            order++;
        }
        return legs;
    }

    private String normalizeTicketPeriod(String ticketPeriod, String ticketType) {
        String raw = ticketPeriod == null || ticketPeriod.isBlank() ? ticketType : ticketPeriod;
        if ("MONTHLY".equalsIgnoreCase(raw) || "monthly".equalsIgnoreCase(raw) || "month".equalsIgnoreCase(raw)) {
            return "month";
        }
        if ("SINGLE".equalsIgnoreCase(raw) || "single".equalsIgnoreCase(raw) || "day".equalsIgnoreCase(raw) || "daily".equalsIgnoreCase(raw)) {
            return "day";
        }
        throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid ticket period");
    }

    private String stringValue(Map<String, Object> request, String key, String fallback) {
        Object raw = request == null ? null : request.get(key);
        return raw == null ? fallback : String.valueOf(raw);
    }

    private Integer intValue(Object raw) {
        if (raw == null) return null;
        if (raw instanceof Number number) return number.intValue();
        try {
            String value = String.valueOf(raw);
            return value.isBlank() ? null : Integer.valueOf(value);
        } catch (NumberFormatException exception) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "routeId and stop ids must be numbers");
        }
    }

    private LocalDate dateValue(Object raw) {
        if (raw == null || String.valueOf(raw).isBlank()) return null;
        return LocalDate.parse(String.valueOf(raw));
    }

    private String label(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private BigDecimal sumOriginal(List<OrderLine> lines) {
        return lines.stream().map(OrderLine::originalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal sumSubsidy(List<OrderLine> lines) {
        return lines.stream().map(OrderLine::subsidyAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal sumFinal(List<OrderLine> lines) {
        return lines.stream().map(OrderLine::finalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private String legsJson(PaymentRequest request, List<OrderLine> lines) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("mode", request.mode());
        payload.put("ticketPeriod", request.ticketPeriod());
        payload.put("serviceDate", request.serviceDate() == null ? null : request.serviceDate().toString());
        payload.put("legs", lineViews(lines));
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException exception) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to serialize payment context");
        }
    }

    private List<Map<String, Object>> orderItems(Object rawJson) {
        if (rawJson == null) return List.of();
        try {
            Map<String, Object> payload = objectMapper.readValue(String.valueOf(rawJson), new TypeReference<>() {});
            Object legs = payload.get("legs");
            if (legs instanceof List<?> list) {
                List<Map<String, Object>> items = new ArrayList<>();
                for (Object item : list) {
                    if (item instanceof Map<?, ?> map) {
                        Map<String, Object> normalized = new LinkedHashMap<>();
                        map.forEach((key, value) -> normalized.put(String.valueOf(key), value));
                        items.add(normalized);
                    }
                }
                return items;
            }
        } catch (Exception ignored) {
        }
        return List.of();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getOrderStatus(CurrentUser currentUser, Long orderId) {
        String studentCode = ticketingRepository.studentCodeForUser(currentUser.userId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Student profile not found"));

        List<Map<String, Object>> orders = jdbcTemplate.queryForList(
                """
                SELECT id, student_code, ticket_type, route_id, total, payment_status, paid_at,
                       order_mode, ticket_period, origin_label, destination_label,
                       original_amount, subsidy_amount, final_amount, legs_json
                FROM tb_orders
                WHERE id = ? AND student_code = ?
                """,
                orderId, studentCode);

        if (orders.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Order not found or access denied");
        }

        Map<String, Object> order = orders.get(0);
        BigDecimal total = (BigDecimal) order.get("total");
        long id = ((Number) order.get("id")).longValue();
        String description = "DH" + id;
        String qrUrl = String.format("https://qr.sepay.vn/img?bank=%s&acc=%s&template=%s&amount=%s&des=%s",
                bankCode, accountNo, qrTemplate, total.toPlainString(), description);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("orderId", id);
        response.put("ticketType", order.get("ticket_type"));
        response.put("ticketPeriod", order.get("ticket_period"));
        response.put("mode", order.get("order_mode"));
        response.put("routeId", order.get("route_id"));
        response.put("originLabel", order.get("origin_label"));
        response.put("destinationLabel", order.get("destination_label"));
        response.put("total", total);
        response.put("amount", total);
        response.put("originalAmount", order.get("original_amount"));
        response.put("subsidyAmount", order.get("subsidy_amount"));
        response.put("finalAmount", order.get("final_amount"));
        response.put("items", orderItems(order.get("legs_json")));
        response.put("description", description);
        response.put("qrUrl", qrUrl);
        response.put("bankCode", bankCode);
        response.put("accountNo", accountNo);
        response.put("accountName", accountName);
        response.put("status", order.get("payment_status"));
        response.put("paid", "Paid".equalsIgnoreCase((String) order.get("payment_status")));
        response.put("paidAt", order.get("paid_at") != null ? order.get("paid_at").toString() : "");
        return response;
    }

    @Transactional
    public void processWebhook(Map<String, Object> payload) {
        String content = (String) payload.get("content");
        if (content == null || content.isBlank()) {
            content = (String) payload.get("transactionContent");
        }
        if (content == null) {
            content = "";
        }

        Long orderId = null;
        Pattern pattern = Pattern.compile("DH([0-9]+)");
        Matcher matcher = pattern.matcher(content);
        if (matcher.find()) {
            orderId = Long.parseLong(matcher.group(1));
        }

        // Save webhook transaction
        Long sepayTransId = null;
        Object rawId = payload.get("id");
        if (rawId instanceof Number) {
            sepayTransId = ((Number) rawId).longValue();
        } else if (rawId instanceof String) {
            sepayTransId = Long.parseLong((String) rawId);
        }

        String gateway = (String) payload.get("gateway");
        String transDateStr = (String) payload.get("transactionDate");
        String accountNum = (String) payload.get("accountNumber");
        String subAccount = (String) payload.get("subAccount");
        String transferType = (String) payload.get("transferType");
        
        BigDecimal transferAmount = BigDecimal.ZERO;
        Object rawAmount = payload.get("transferAmount");
        if (rawAmount instanceof Number) {
            transferAmount = new BigDecimal(rawAmount.toString());
        } else if (rawAmount instanceof String) {
            transferAmount = new BigDecimal((String) rawAmount);
        }

        BigDecimal amountIn = "out".equalsIgnoreCase(transferType) ? BigDecimal.ZERO : transferAmount;
        BigDecimal amountOut = "out".equalsIgnoreCase(transferType) ? transferAmount : BigDecimal.ZERO;

        BigDecimal accumulated = BigDecimal.ZERO;
        Object rawAccumulated = payload.get("accumulated");
        if (rawAccumulated instanceof Number) {
            accumulated = new BigDecimal(rawAccumulated.toString());
        } else if (rawAccumulated instanceof String) {
            accumulated = new BigDecimal((String) rawAccumulated);
        }

        String code = (String) payload.get("code");
        String refCode = (String) payload.get("referenceCode");
        String description = (String) payload.get("description");

        // Insert transaction log
        jdbcTemplate.update(
                "INSERT INTO tb_transactions (sepay_transaction_id, gateway, transaction_date, account_number, sub_account, amount_in, amount_out, accumulated, code, transaction_content, reference_number, body, matched_order_id) VALUES (?, ?, NULLIF(?, '')::timestamptz, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (sepay_transaction_id) DO NOTHING",
                sepayTransId, gateway, transDateStr, accountNum, subAccount, amountIn, amountOut, accumulated, code, content, refCode, description, orderId);

        if (orderId == null) {
            return;
        }

        List<Map<String, Object>> orders = jdbcTemplate.queryForList(
                """
                SELECT id, student_code, ticket_type, route_id, total, payment_status,
                       order_mode, ticket_period, origin_label, destination_label, legs_json
                FROM tb_orders
                WHERE id = ?
                FOR UPDATE
                """,
                orderId);

        if (orders.isEmpty()) {
            return;
        }

        Map<String, Object> order = orders.get(0);
        String currentStatus = (String) order.get("payment_status");
        if (!"Unpaid".equalsIgnoreCase(currentStatus)) {
            return;
        }

        // Verify paid amount matches order total
        BigDecimal total = (BigDecimal) order.get("total");
        if (total.compareTo(amountIn) != 0) {
            return;
        }

        // Update order status to Paid
        jdbcTemplate.update("UPDATE tb_orders SET payment_status = 'Paid', paid_at = CURRENT_TIMESTAMP WHERE id = ?", orderId);

        // Provision the tickets inside UniBus system
        String studentCode = (String) order.get("student_code");
        String ticketType = (String) order.get("ticket_type");
        Integer routeId = (Integer) order.get("route_id");

        provisionTickets(studentCode, ticketType, routeId, total, refCode, order);
    }

    private void provisionTickets(String studentCode, String ticketType, Integer routeId, BigDecimal finalAmount, String transactionCode) {
        provisionTickets(studentCode, ticketType, routeId, finalAmount, transactionCode, Map.of());
    }

    private void provisionTickets(String studentCode, String ticketType, Integer routeId, BigDecimal finalAmount,
            String transactionCode, Map<String, Object> order) {
        String mode = (String) order.getOrDefault("order_mode", "single-route");
        String ticketPeriod = (String) order.getOrDefault("ticket_period",
                "monthly".equalsIgnoreCase(ticketType) ? "month" : "day");
        List<Map<String, Object>> items = orderItems(order.get("legs_json"));
        if (!items.isEmpty()) {
            provisionOrderItems(studentCode, ticketPeriod, mode, order, items, transactionCode);
            return;
        }
        if ("monthly".equalsIgnoreCase(ticketType)) {
            LocalDate now = LocalDate.now();
            int year = now.getYear();
            int month = now.getMonthValue();
            
            LocalDate validFrom = now.withDayOfMonth(1);
            LocalDate expiresOn = now.plusMonths(1).withDayOfMonth(1).minusDays(1);
            String qrCode = "UB-MONTHLY-" + UUID.randomUUID();

            // Find route registration details
            List<Map<String, Object>> registrations = jdbcTemplate.queryForList(
                    "SELECT registration_id, boarding_stop_id, alighting_stop_id FROM route_registrations WHERE student_code = ? AND route_id = ? AND status = 'APPROVED' ORDER BY approved_at DESC NULLS LAST LIMIT 1",
                    studentCode, routeId);

            Integer subsidyPolicyId = null;
            BigDecimal originalFare = finalAmount;
            BigDecimal subsidyAmount = BigDecimal.ZERO;

            // Try to resolve dynamic subsidy info again for DB insertion consistency
            try {
                List<Map<String, Object>> users = jdbcTemplate.queryForList(
                        "SELECT u.user_id, u.role FROM users u JOIN students s ON s.user_id = u.user_id WHERE s.student_code = ?",
                        studentCode);
                if (!users.isEmpty()) {
                    CurrentUser dummyUser = new CurrentUser(
                            (Integer) users.get(0).get("user_id"),
                            studentCode + "@unibus.com",
                            UserRole.STUDENT,
                            0L
                    );
                    List<Map<String, Object>> routeDetails = jdbcTemplate.queryForList("SELECT route_name FROM routes WHERE route_id = ?", routeId);
                    String routeName = routeDetails.isEmpty() ? "" : (String) routeDetails.get(0).get("route_name");
                    BigDecimal baseFare = ticketingRepository.monthlyFare(routeId);
                    MonthlyPassQuote quote = subsidyService.quoteFor(dummyUser, routeId, routeName, baseFare, now);
                    subsidyPolicyId = quote.subsidyPolicyId();
                    originalFare = quote.originalFareAmount();
                    subsidyAmount = quote.subsidyAmount();
                }
            } catch (Exception ignored) {}

            KeyHolder keyHolder = new GeneratedKeyHolder();
            final Integer finalPolicyId = subsidyPolicyId;
            final BigDecimal finalOrigFare = originalFare;
            final BigDecimal finalSubAmount = subsidyAmount;

            jdbcTemplate.update(connection -> {
                PreparedStatement statement = connection.prepareStatement(
                        "INSERT INTO monthly_passes(student_code, route_id, effective_month, effective_year, valid_from, expires_on, fare_amount, original_fare_amount, subsidy_amount, final_fare_amount, subsidy_policy_id, qr_code, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')",
                        new String[] { "monthly_pass_id" });
                statement.setString(1, studentCode);
                statement.setInt(2, routeId);
                statement.setInt(3, month);
                statement.setInt(4, year);
                statement.setDate(5, java.sql.Date.valueOf(validFrom));
                statement.setDate(6, java.sql.Date.valueOf(expiresOn));
                statement.setBigDecimal(7, finalOrigFare);
                statement.setBigDecimal(8, finalOrigFare);
                statement.setBigDecimal(9, finalSubAmount);
                statement.setBigDecimal(10, finalAmount);
                if (finalPolicyId != null) {
                    statement.setInt(11, finalPolicyId);
                } else {
                    statement.setNull(11, java.sql.Types.INTEGER);
                }
                statement.setString(12, qrCode);
                return statement;
            }, keyHolder);

            Number passId = keyHolder.getKey();
            if (passId != null) {
                // Create payment record
                KeyHolder payKeyHolder = new GeneratedKeyHolder();
                jdbcTemplate.update(connection -> {
                    PreparedStatement statement = connection.prepareStatement(
                            "INSERT INTO payments(student_code, monthly_pass_id, amount, method, status, transaction_code, notes) VALUES (?, ?, ?, 'BANK_TRANSFER', 'PAID', ?, 'Paid via SePay')",
                            new String[] { "payment_id" });
                    statement.setString(1, studentCode);
                    statement.setInt(2, passId.intValue());
                    statement.setBigDecimal(3, finalAmount);
                    statement.setString(4, transactionCode != null ? transactionCode : "SEPAY-" + UUID.randomUUID());
                    return statement;
                }, payKeyHolder);

                Number payId = payKeyHolder.getKey();
                if (payId != null) {
                    // Create invoice
                    jdbcTemplate.update(
                            "INSERT INTO invoices(payment_id, student_code, description, amount, original_amount, subsidy_amount, final_amount) VALUES (?, ?, 'Monthly bus pass paid via SePay', ?, ?, ?, ?)",
                            payId.intValue(), studentCode, finalAmount, finalOrigFare, finalSubAmount, finalAmount);
                }
            }
        } else if ("single".equalsIgnoreCase(ticketType)) {
            String qrCode = "UB-SINGLE-" + UUID.randomUUID();
            LocalDate now = LocalDate.now();
            OffsetDateTime expiresAt = now.atTime(23, 59, 59).atOffset(ZoneOffset.UTC); // valid until end of day

            // Find route registrations approved
            List<Map<String, Object>> registrations = jdbcTemplate.queryForList(
                    "SELECT boarding_stop_id, alighting_stop_id FROM route_registrations WHERE student_code = ? AND route_id = ? AND status = 'APPROVED' ORDER BY approved_at DESC NULLS LAST LIMIT 1",
                    studentCode, routeId);
            
            Integer bStop = null;
            Integer aStop = null;
            if (!registrations.isEmpty()) {
                bStop = (Integer) registrations.get(0).get("boarding_stop_id");
                aStop = (Integer) registrations.get(0).get("alighting_stop_id");
            }

            final Integer finalBStop = bStop;
            final Integer finalAStop = aStop;

            KeyHolder keyHolder = new GeneratedKeyHolder();
            jdbcTemplate.update(connection -> {
                PreparedStatement statement = connection.prepareStatement(
                        "INSERT INTO single_trip_tickets(student_code, route_id, boarding_stop_id, alighting_stop_id, fare_amount, qr_code, expires_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'UNUSED')",
                        new String[] { "single_trip_ticket_id" });
                statement.setString(1, studentCode);
                statement.setInt(2, routeId);
                if (finalBStop != null) statement.setInt(3, finalBStop); else statement.setNull(3, java.sql.Types.INTEGER);
                if (finalAStop != null) statement.setInt(4, finalAStop); else statement.setNull(4, java.sql.Types.INTEGER);
                statement.setBigDecimal(5, finalAmount);
                statement.setString(6, qrCode);
                statement.setTimestamp(7, java.sql.Timestamp.from(expiresAt.toInstant()));
                return statement;
            }, keyHolder);

            Number ticketId = keyHolder.getKey();
            if (ticketId != null) {
                // Create payment
                KeyHolder payKeyHolder = new GeneratedKeyHolder();
                jdbcTemplate.update(connection -> {
                    PreparedStatement statement = connection.prepareStatement(
                            "INSERT INTO payments(student_code, single_trip_ticket_id, amount, method, status, transaction_code, notes) VALUES (?, ?, ?, 'BANK_TRANSFER', 'PAID', ?, 'Paid via SePay')",
                            new String[] { "payment_id" });
                    statement.setString(1, studentCode);
                    statement.setInt(2, ticketId.intValue());
                    statement.setBigDecimal(3, finalAmount);
                    statement.setString(4, transactionCode != null ? transactionCode : "SEPAY-" + UUID.randomUUID());
                    return statement;
                }, payKeyHolder);

                Number payId = payKeyHolder.getKey();
                if (payId != null) {
                    // Create invoice
                    jdbcTemplate.update(
                            "INSERT INTO invoices(payment_id, student_code, description, amount, original_amount, subsidy_amount, final_amount) VALUES (?, ?, 'Single bus ticket paid via SePay', ?, ?, 0, ?)",
                            payId.intValue(), studentCode, finalAmount, finalAmount, finalAmount);
                }
            }
        }
    }

    private void provisionOrderItems(String studentCode, String ticketPeriod, String mode, Map<String, Object> order,
            List<Map<String, Object>> items, String transactionCode) {
        if ("month".equals(ticketPeriod)) {
            LocalDate now = LocalDate.now();
            int year = now.getYear();
            int month = now.getMonthValue();
            List<ProvisionedMonthlyLine> provisioned = new ArrayList<>();
            for (Map<String, Object> item : items) {
                Integer routeId = intValue(item.get("routeId"));
                if (routeId == null) continue;
                Integer existing = activeMonthlyPassId(studentCode, routeId, year, month);
                Integer monthlyPassId = existing != null ? existing : createMonthlyPassFromOrder(studentCode, item, year, month);
                if (existing == null) {
                    createPaidPaymentForMonthly(monthlyPassId, decimalValue(item.get("finalAmount")), transactionCode);
                }
                provisioned.add(new ProvisionedMonthlyLine(
                        monthlyPassId,
                        routeId,
                        intValue(item.get("legOrder")),
                        intValue(item.get("boardingStopId")),
                        intValue(item.get("alightingStopId")),
                        decimalValue(item.get("originalAmount")),
                        decimalValue(item.get("subsidyAmount")),
                        decimalValue(item.get("finalAmount"))));
            }
            if ("journey-combo".equals(mode) && !provisioned.isEmpty()) {
                Integer journeyOrderId = ticketingRepository.createJourneyOrder(
                        studentCode,
                        label((String) order.get("origin_label"), "Điểm đi"),
                        label((String) order.get("destination_label"), "Điểm đến"),
                        provisioned.stream().map(ProvisionedMonthlyLine::originalAmount).reduce(BigDecimal.ZERO, BigDecimal::add),
                        provisioned.stream().map(ProvisionedMonthlyLine::subsidyAmount).reduce(BigDecimal.ZERO, BigDecimal::add),
                        provisioned.stream().map(ProvisionedMonthlyLine::finalAmount).reduce(BigDecimal.ZERO, BigDecimal::add));
                for (ProvisionedMonthlyLine line : provisioned) {
                    ticketingRepository.addJourneyOrderItem(journeyOrderId, line.monthlyPassId(), line.routeId(),
                            line.legOrder(), line.boardingStopId(), line.alightingStopId(),
                            line.originalAmount(), line.subsidyAmount(), line.finalAmount());
                }
            }
            return;
        }

        for (Map<String, Object> item : items) {
            Integer routeId = intValue(item.get("routeId"));
            if (routeId == null) continue;
            Integer ticketId = createSingleTicketFromOrder(studentCode, item);
            createPaidPaymentForSingle(ticketId, decimalValue(item.get("finalAmount")), transactionCode);
        }
    }

    private Integer activeMonthlyPassId(String studentCode, Integer routeId, int year, int month) {
        List<Integer> ids = jdbcTemplate.queryForList(
                """
                SELECT monthly_pass_id
                FROM monthly_passes
                WHERE student_code = ? AND route_id = ? AND effective_year = ? AND effective_month = ? AND status = 'ACTIVE'
                ORDER BY purchased_at DESC
                LIMIT 1
                """,
                Integer.class, studentCode, routeId, year, month);
        return ids.isEmpty() ? null : ids.get(0);
    }

    private Integer createMonthlyPassFromOrder(String studentCode, Map<String, Object> item, int year, int month) {
        LocalDate now = LocalDate.now();
        LocalDate validFrom = now.withDayOfMonth(1);
        LocalDate expiresOn = now.plusMonths(1).withDayOfMonth(1).minusDays(1);
        String qrCode = "UB-MONTHLY-" + UUID.randomUUID();
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(
                    """
                    INSERT INTO monthly_passes(student_code, route_id, effective_month, effective_year,
                                               valid_from, expires_on, fare_amount, original_fare_amount,
                                               subsidy_amount, final_fare_amount, subsidy_policy_id, qr_code, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, 'ACTIVE')
                    """,
                    new String[] { "monthly_pass_id" });
            statement.setString(1, studentCode);
            statement.setInt(2, intValue(item.get("routeId")));
            statement.setInt(3, month);
            statement.setInt(4, year);
            statement.setDate(5, java.sql.Date.valueOf(validFrom));
            statement.setDate(6, java.sql.Date.valueOf(expiresOn));
            statement.setBigDecimal(7, decimalValue(item.get("finalAmount")));
            statement.setBigDecimal(8, decimalValue(item.get("originalAmount")));
            statement.setBigDecimal(9, decimalValue(item.get("subsidyAmount")));
            statement.setBigDecimal(10, decimalValue(item.get("finalAmount")));
            statement.setString(11, qrCode);
            return statement;
        }, keyHolder);
        Number key = keyHolder.getKey();
        if (key == null) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to create monthly pass");
        }
        return key.intValue();
    }

    private Integer createSingleTicketFromOrder(String studentCode, Map<String, Object> item) {
        return insertSingleTicketFromOrder(studentCode, item, hasColumns("single_trip_tickets",
                "original_fare_amount", "subsidy_amount", "final_fare_amount", "subsidy_policy_id"));
    }

    private Integer insertSingleTicketFromOrder(String studentCode, Map<String, Object> item, boolean withSubsidyFields) {
        String qrCode = "UB-SINGLE-" + UUID.randomUUID();
        OffsetDateTime expiresAt = singleTicketExpiry(Instant.now());
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(
                    withSubsidyFields
                            ? """
                              INSERT INTO single_trip_tickets(student_code, route_id, boarding_stop_id, alighting_stop_id,
                                                              fare_amount, original_fare_amount, subsidy_amount,
                                                              final_fare_amount, subsidy_policy_id, qr_code, expires_at, status)
                              VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, 'UNUSED')
                              """
                            : """
                              INSERT INTO single_trip_tickets(student_code, route_id, boarding_stop_id, alighting_stop_id,
                                                              fare_amount, qr_code, expires_at, status)
                              VALUES (?, ?, ?, ?, ?, ?, ?, 'UNUSED')
                              """,
                    new String[] { "single_trip_ticket_id" });
            statement.setString(1, studentCode);
            statement.setInt(2, intValue(item.get("routeId")));
            setNullableInt(statement, 3, intValue(item.get("boardingStopId")));
            setNullableInt(statement, 4, intValue(item.get("alightingStopId")));
            statement.setBigDecimal(5, decimalValue(item.get("finalAmount")));
            if (withSubsidyFields) {
                statement.setBigDecimal(6, decimalValue(item.get("originalAmount")));
                statement.setBigDecimal(7, decimalValue(item.get("subsidyAmount")));
                statement.setBigDecimal(8, decimalValue(item.get("finalAmount")));
                statement.setString(9, qrCode);
                statement.setTimestamp(10, java.sql.Timestamp.from(expiresAt.toInstant()));
            } else {
                statement.setString(6, qrCode);
                statement.setTimestamp(7, java.sql.Timestamp.from(expiresAt.toInstant()));
            }
            return statement;
        }, keyHolder);
        Number key = keyHolder.getKey();
        if (key == null) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to create day ticket");
        }
        return key.intValue();
    }

    private void createPaidPaymentForMonthly(Integer monthlyPassId, BigDecimal amount, String transactionCode) {
        KeyHolder payKeyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(
                    "INSERT INTO payments(student_code, monthly_pass_id, amount, method, status, transaction_code, notes) SELECT student_code, monthly_pass_id, ?, 'BANK_TRANSFER', 'PAID', ?, 'Paid via SePay' FROM monthly_passes WHERE monthly_pass_id = ?",
                    new String[] { "payment_id" });
            statement.setBigDecimal(1, amount);
            statement.setString(2, transactionCode != null ? transactionCode : "SEPAY-" + UUID.randomUUID());
            statement.setInt(3, monthlyPassId);
            return statement;
        }, payKeyHolder);
        Number payId = payKeyHolder.getKey();
        if (payId != null) {
            jdbcTemplate.update(
                    "INSERT INTO invoices(payment_id, student_code, description, amount, original_amount, subsidy_amount, final_amount) SELECT ?, student_code, 'Monthly bus pass paid via SePay', final_fare_amount, original_fare_amount, subsidy_amount, final_fare_amount FROM monthly_passes WHERE monthly_pass_id = ?",
                    payId.intValue(), monthlyPassId);
        }
    }

    private void createPaidPaymentForSingle(Integer ticketId, BigDecimal amount, String transactionCode) {
        KeyHolder payKeyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(
                    "INSERT INTO payments(student_code, single_trip_ticket_id, amount, method, status, transaction_code, notes) SELECT student_code, single_trip_ticket_id, ?, 'BANK_TRANSFER', 'PAID', ?, 'Paid via SePay' FROM single_trip_tickets WHERE single_trip_ticket_id = ?",
                    new String[] { "payment_id" });
            statement.setBigDecimal(1, amount);
            statement.setString(2, transactionCode != null ? transactionCode : "SEPAY-" + UUID.randomUUID());
            statement.setInt(3, ticketId);
            return statement;
        }, payKeyHolder);
        Number payId = payKeyHolder.getKey();
        if (payId != null) {
            if (hasColumns("single_trip_tickets", "original_fare_amount", "subsidy_amount", "final_fare_amount")
                    && hasColumns("invoices", "original_amount", "subsidy_amount", "final_amount")) {
                jdbcTemplate.update(
                        "INSERT INTO invoices(payment_id, student_code, description, amount, original_amount, subsidy_amount, final_amount) SELECT ?, student_code, 'Day bus ticket paid via SePay', final_fare_amount, original_fare_amount, subsidy_amount, final_fare_amount FROM single_trip_tickets WHERE single_trip_ticket_id = ?",
                        payId.intValue(), ticketId);
            } else if (hasColumns("invoices", "original_amount", "subsidy_amount", "final_amount")) {
                jdbcTemplate.update(
                        "INSERT INTO invoices(payment_id, student_code, description, amount, original_amount, subsidy_amount, final_amount) SELECT ?, student_code, 'Day bus ticket paid via SePay', fare_amount, fare_amount, 0, fare_amount FROM single_trip_tickets WHERE single_trip_ticket_id = ?",
                        payId.intValue(), ticketId);
            } else {
                jdbcTemplate.update(
                        "INSERT INTO invoices(payment_id, student_code, description, amount) SELECT ?, student_code, 'Day bus ticket paid via SePay', fare_amount FROM single_trip_tickets WHERE single_trip_ticket_id = ?",
                        payId.intValue(), ticketId);
            }
        }
    }

    private boolean hasColumns(String tableName, String... columnNames) {
        StringBuilder placeholders = new StringBuilder();
        List<Object> arguments = new ArrayList<>();
        arguments.add(tableName.toLowerCase());
        for (String columnName : columnNames) {
            if (!placeholders.isEmpty()) placeholders.append(", ");
            placeholders.append('?');
            arguments.add(columnName.toLowerCase());
        }
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.columns WHERE LOWER(table_name) = ? AND LOWER(column_name) IN ("
                        + placeholders + ")",
                Integer.class, arguments.toArray());
        return count != null && count == columnNames.length;
    }

    private void setNullableInt(PreparedStatement statement, int index, Integer value) throws java.sql.SQLException {
        if (value == null) {
            statement.setNull(index, java.sql.Types.INTEGER);
        } else {
            statement.setInt(index, value);
        }
    }

    private BigDecimal decimalValue(Object raw) {
        if (raw == null) return BigDecimal.ZERO;
        if (raw instanceof BigDecimal decimal) return decimal;
        if (raw instanceof Number number) return new BigDecimal(number.toString());
        String value = String.valueOf(raw);
        return value.isBlank() ? BigDecimal.ZERO : new BigDecimal(value);
    }

    private record PaymentRequest(String mode, String ticketPeriod, String ticketType, Integer routeId,
            String originLabel, String destinationLabel, LocalDate serviceDate, List<PaymentLeg> legs) {
    }

    private record PaymentLeg(Integer routeId, Integer boardingStopId, Integer alightingStopId, Integer legOrder) {
    }

    private record OrderLine(Integer routeId, String routeName,
            Integer boardingStopId, String boardingStopName,
            Integer alightingStopId, String alightingStopName,
            Integer legOrder,
            BigDecimal originalAmount, BigDecimal subsidyAmount, BigDecimal finalAmount,
            Integer subsidyPolicyId, String subsidyStatus, boolean alreadyActive) {
    }

    private record ProvisionedMonthlyLine(Integer monthlyPassId, Integer routeId, Integer legOrder,
            Integer boardingStopId, Integer alightingStopId, BigDecimal originalAmount,
            BigDecimal subsidyAmount, BigDecimal finalAmount) {
    }
}
