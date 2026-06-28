package com.unibus.api.ticketing;

import com.unibus.api.user.model.UserRole;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
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

    private final JdbcTemplate jdbcTemplate;
    private final TicketingRepository ticketingRepository;
    private final SubsidyService subsidyService;

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
        String studentCode = ticketingRepository.studentCodeForUser(currentUser.userId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Student profile not found"));

        boolean testOrder = "test".equalsIgnoreCase(ticketType);
        if (testOrder && !"OKNIGGA".equalsIgnoreCase(studentCode)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Test payment is not enabled for this user");
        }
        String storedTicketType = testOrder ? "single" : ticketType.toLowerCase();
        Integer routeId = null;
        BigDecimal amount;
        BigDecimal originalFare;
        BigDecimal subsidyAmount = BigDecimal.ZERO;
        BigDecimal finalAmount;
        Integer subsidyPolicyId = null;

        if ("test".equalsIgnoreCase(ticketType)) {
            routeId = jdbcTemplate.queryForObject("SELECT route_id FROM routes ORDER BY route_id LIMIT 1", Integer.class);
            amount = new BigDecimal("3000");
            originalFare = amount;
            finalAmount = amount;
        } else {
            ApprovedRegistration registration = ticketingRepository.approvedRegistration(studentCode, requestedRouteId)
                    .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Student must have an approved route registration"));
            routeId = registration.routeId();

            if ("monthly".equalsIgnoreCase(ticketType)) {
                LocalDate now = LocalDate.now();
                int year = now.getYear();
                int month = now.getMonthValue();

                // Check if already has active monthly pass to avoid double purchase
                boolean exists = jdbcTemplate.queryForObject(
                        "SELECT EXISTS(SELECT 1 FROM monthly_passes WHERE student_code = ? AND route_id = ? AND effective_year = ? AND effective_month = ? AND status = 'ACTIVE')",
                        Boolean.class, studentCode, routeId, year, month);
                if (exists) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "Active monthly pass already exists for this month");
                }

                BigDecimal baseFare = ticketingRepository.monthlyFare(routeId);
                MonthlyPassQuote quote = subsidyService.quoteFor(currentUser, routeId, registration.routeName(), baseFare, now);

                if (SubsidyService.STATUS_NOT_VERIFIED.equals(quote.subsidyStatus())) {
                    throw new ApiException(HttpStatus.FORBIDDEN, "Student verification is required before buying a monthly pass");
                }
                if (SubsidyService.STATUS_NO_UNIVERSITY.equals(quote.subsidyStatus())) {
                    throw new ApiException(HttpStatus.CONFLICT, "Student university is not linked to a partner university yet");
                }
                if (SubsidyService.STATUS_ROUTE_NOT_LINKED.equals(quote.subsidyStatus())) {
                    throw new ApiException(HttpStatus.FORBIDDEN, "Route is not configured for the student's university");
                }

                amount = quote.finalFareAmount();
                originalFare = quote.originalFareAmount();
                subsidyAmount = quote.subsidyAmount();
                finalAmount = quote.finalFareAmount();
                subsidyPolicyId = quote.subsidyPolicyId();
            } else if ("single".equalsIgnoreCase(ticketType)) {
                // Get single fare for the route, fallback to 7000 if not configured
                List<BigDecimal> fares = jdbcTemplate.queryForList(
                        "SELECT amount FROM fares WHERE route_id = ? AND fare_type = 'SINGLE' AND effective_from <= CURRENT_DATE AND (effective_until IS NULL OR effective_until >= CURRENT_DATE) ORDER BY effective_from DESC LIMIT 1",
                        BigDecimal.class, routeId);
                BigDecimal singleFare = fares.isEmpty() ? new BigDecimal("7000") : fares.get(0);

                amount = singleFare;
                originalFare = singleFare;
                finalAmount = singleFare;
            } else {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid ticket type: " + ticketType);
            }
        }

        // Check for an existing unpaid order with same student_code, ticket_type, route_id and total amount to avoid spamming
        List<Map<String, Object>> existingOrders = jdbcTemplate.queryForList(
                "SELECT id, total FROM tb_orders WHERE student_code = ? AND ticket_type = ? AND route_id IS NOT DISTINCT FROM ? AND payment_status = 'Unpaid' ORDER BY created_at DESC LIMIT 1",
                studentCode, storedTicketType, routeId);

        if (!existingOrders.isEmpty()) {
            Map<String, Object> existing = existingOrders.get(0);
            BigDecimal existingTotal = (BigDecimal) existing.get("total");
            if (existingTotal.compareTo(amount) == 0) {
                long orderId = ((Number) existing.get("id")).longValue();
                String description = "DH" + orderId;
                String qrUrl = String.format("https://qr.sepay.vn/img?bank=%s&acc=%s&template=%s&amount=%s&des=%s",
                        bankCode, accountNo, qrTemplate, amount.toPlainString(), description);
                return Map.of(
                    "orderId", orderId,
                    "studentCode", studentCode,
                    "ticketType", testOrder ? "test" : storedTicketType,
                    "amount", amount,
                    "description", description,
                    "qrUrl", qrUrl,
                    "bankCode", bankCode,
                    "accountNo", accountNo,
                    "accountName", accountName
                );
            }
        }

        Integer orderRouteId = routeId;
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(
                    "INSERT INTO tb_orders (student_code, ticket_type, route_id, total, payment_status, name) VALUES (?, ?, ?, ?, 'Unpaid', ?)",
                    new String[] { "id" });
            statement.setString(1, studentCode);
            statement.setString(2, storedTicketType);
            statement.setObject(3, orderRouteId);
            statement.setBigDecimal(4, amount);
            statement.setString(5, testOrder ? "Test UniBus" : orderName(ticketType));
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

        return Map.of(
            "orderId", orderId,
            "studentCode", studentCode,
            "ticketType", testOrder ? "test" : storedTicketType,
            "amount", amount,
            "description", description,
            "qrUrl", qrUrl,
            "bankCode", bankCode,
            "accountNo", accountNo,
            "accountName", accountName
        );
    }


    private String orderName(String ticketType) {
        if ("monthly".equalsIgnoreCase(ticketType)) return "Vé tháng UniBus";
        if ("single".equalsIgnoreCase(ticketType)) return "Vé thường UniBus";
        if ("test".equalsIgnoreCase(ticketType)) return "Test thanh toán UniBus";
        return "Thanh toán UniBus";
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getOrderStatus(CurrentUser currentUser, Long orderId) {
        String studentCode = ticketingRepository.studentCodeForUser(currentUser.userId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Student profile not found"));

        List<Map<String, Object>> orders = jdbcTemplate.queryForList(
                "SELECT id, student_code, ticket_type, total, payment_status, paid_at FROM tb_orders WHERE id = ? AND student_code = ?",
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
        response.put("total", total);
        response.put("amount", total);
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
                "SELECT id, student_code, ticket_type, route_id, total, payment_status, name FROM tb_orders WHERE id = ? FOR UPDATE",
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
        String orderName = (String) order.get("name");
        if (orderName != null && orderName.startsWith("Test UniBus")) {
            return;
        }

        provisionTickets(studentCode, ticketType, routeId, total, refCode);
    }

    private void provisionTickets(String studentCode, String ticketType, Integer routeId, BigDecimal finalAmount, String transactionCode) {
        if ("test".equalsIgnoreCase(ticketType)) {
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
}
