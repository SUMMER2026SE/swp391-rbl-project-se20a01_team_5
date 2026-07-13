package com.unibus.api.ticketing;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriComponentsBuilder;

import com.unibus.api.common.ApiException;
import com.unibus.api.payment.VNPayConfig;
import com.unibus.api.payment.VNPayUtils;
import com.unibus.api.security.CurrentUser;
import com.unibus.api.ticketing.TicketingDtos.CreateVnpayPaymentRequest;
import com.unibus.api.ticketing.TicketingDtos.JourneyOrderView;
import com.unibus.api.ticketing.TicketingDtos.PassesDashboard;
import com.unibus.api.ticketing.TicketingDtos.MonthlyPassQuote;
import com.unibus.api.ticketing.TicketingDtos.PurchaseJourneyPassRequest;
import com.unibus.api.ticketing.TicketingDtos.PaymentView;
import com.unibus.api.ticketing.TicketingDtos.PurchaseMonthlyPassRequest;
import com.unibus.api.ticketing.TicketingDtos.PurchaseSingleTripTicketRequest;
import com.unibus.api.ticketing.TicketingDtos.SingleTripTicketView;
import com.unibus.api.ticketing.TicketingDtos.TicketView;
import com.unibus.api.ticketing.TicketingDtos.VnpayPaymentUrlView;
import com.unibus.api.ticketing.TicketingRepository.ApprovedRegistration;
import com.unibus.api.university.SubsidyService;

@Service
public class TicketingService {

    private final TicketingRepository ticketingRepository;
    private final SubsidyService subsidyService;
    private final VNPayConfig vnPayConfig;

    public TicketingService(TicketingRepository ticketingRepository, SubsidyService subsidyService, VNPayConfig vnPayConfig) {
        this.ticketingRepository = ticketingRepository;
        this.subsidyService = subsidyService;
        this.vnPayConfig = vnPayConfig;
    }

    @Transactional(readOnly = true)
    public PassesDashboard dashboard(CurrentUser currentUser) {
        String studentCode = requireStudentCode(currentUser);
        MonthlyPassQuote quote = ticketingRepository.approvedRegistration(studentCode)
                .map(registration -> {
                    BigDecimal amount = ticketingRepository.monthlyFare(registration.routeId());
                    return subsidyService.quoteFor(currentUser, registration.routeId(), registration.routeName(), amount);
                })
                .orElse(null);
        return new PassesDashboard(
                ticketingRepository.findTickets(studentCode),
                ticketingRepository.findPayments(studentCode),
                quote);
    }

    @Transactional(readOnly = true)
    public MonthlyPassQuote quote(CurrentUser currentUser, Integer routeId, String ticketType) {
        String studentCode = requireStudentCode(currentUser);
        if ("SINGLE".equalsIgnoreCase(ticketType)) {
            String routeName = ticketingRepository.activeRouteName(routeId)
                    .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Route is not available"));
            BigDecimal amount = ticketingRepository.singleFare(routeId);
            return subsidyService.quoteFor(currentUser, routeId, routeName, amount);
        }
        ApprovedRegistration registration = ticketingRepository.approvedRegistration(studentCode, routeId)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Student must have an approved route registration"));
        BigDecimal amount = ticketingRepository.monthlyFare(registration.routeId());
        return subsidyService.quoteFor(currentUser, registration.routeId(), registration.routeName(), amount);
    }

    @Transactional
    public TicketView purchaseMonthlyPass(CurrentUser currentUser, PurchaseMonthlyPassRequest request) {
        String studentCode = requireStudentCode(currentUser);
        Integer routeId = request == null ? null : request.routeId();
        ApprovedRegistration registration = ticketingRepository.approvedRegistration(studentCode, routeId)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Student must have an approved route registration"));
        LocalDate now = LocalDate.now();
        int year = now.getYear();
        int month = now.getMonthValue();
        return ticketingRepository.activeMonthlyPass(studentCode, registration.routeId(), year, month)
                .orElseGet(() -> {
                    OffsetDateTime validFrom = now.withDayOfMonth(1).atStartOfDay().atOffset(ZoneOffset.UTC);
                    OffsetDateTime expiresAt = now.plusMonths(1).withDayOfMonth(1).atStartOfDay().atOffset(ZoneOffset.UTC);
                    BigDecimal amount = ticketingRepository.monthlyFare(registration.routeId());
                    MonthlyPassQuote quote = subsidyService.quoteFor(currentUser, registration.routeId(), registration.routeName(), amount, now);
                    ensurePurchasableQuote(quote);
                    TicketView ticket = ticketingRepository.createMonthlyTicket(studentCode, registration, year, month, validFrom, expiresAt, quote);
                    ticketingRepository.createPaidPayment(ticket.ticketId(), quote.finalFareAmount(), method(request));
                    return ticket;
                });
    }

    @Transactional
    public JourneyOrderView purchaseJourneyMonthlyPass(CurrentUser currentUser, PurchaseJourneyPassRequest request) {
        String studentCode = requireStudentCode(currentUser);
        if (request == null || request.legs() == null || request.legs().isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Journey legs are required");
        }
        LocalDate now = LocalDate.now();
        int year = now.getYear();
        int month = now.getMonthValue();
        OffsetDateTime validFrom = now.withDayOfMonth(1).atStartOfDay().atOffset(ZoneOffset.UTC);
        OffsetDateTime expiresAt = now.plusMonths(1).withDayOfMonth(1).atStartOfDay().atOffset(ZoneOffset.UTC);

        List<JourneyOrderLine> lines = new java.util.ArrayList<>();
        java.util.Set<Integer> routeIds = new java.util.HashSet<>();
        for (var leg : request.legs()) {
            if (leg.routeId() == null || !routeIds.add(leg.routeId())) {
                continue;
            }
            ApprovedRegistration registration = ticketingRepository.approvedRegistration(studentCode, leg.routeId())
                    .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST,
                            "Student must register every route before buying a journey pass"));
            TicketView ticket = ticketingRepository.activeMonthlyPass(studentCode, registration.routeId(), year, month)
                    .orElseGet(() -> {
                        BigDecimal amount = ticketingRepository.monthlyFare(registration.routeId());
                        MonthlyPassQuote quote = subsidyService.quoteFor(currentUser, registration.routeId(),
                                registration.routeName(), amount, now);
                        ensurePurchasableQuote(quote);
                        TicketView created = ticketingRepository.createMonthlyTicket(studentCode, registration, year, month,
                                validFrom, expiresAt, quote);
                        ticketingRepository.createPaidPayment(created.ticketId(), quote.finalFareAmount(), method(request.method()));
                        return created;
                    });
            lines.add(new JourneyOrderLine(
                    ticket.ticketId(),
                    registration.routeId(),
                    leg.legOrder() == null ? lines.size() + 1 : leg.legOrder(),
                    leg.boardingStopId() == null ? registration.boardingRouteStopId() : leg.boardingStopId(),
                    leg.alightingStopId() == null ? registration.alightingRouteStopId() : leg.alightingStopId(),
                    ticket.originalFareAmount(),
                    ticket.subsidyAmount(),
                    ticket.finalFareAmount()));
        }
        if (lines.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "No purchasable journey legs found");
        }
        BigDecimal total = lines.stream().map(JourneyOrderLine::originalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal subsidy = lines.stream().map(JourneyOrderLine::subsidyAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal finalAmount = lines.stream().map(JourneyOrderLine::finalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        Integer journeyOrderId = ticketingRepository.createJourneyOrder(
                studentCode,
                label(request.originLabel(), "Điểm đi"),
                label(request.destinationLabel(), "Điểm đến"),
                total,
                subsidy,
                finalAmount);
        for (JourneyOrderLine line : lines) {
            ticketingRepository.addJourneyOrderItem(journeyOrderId, line.monthlyPassId(), line.routeId(),
                    line.legOrder(), line.boardingStopId(), line.alightingStopId(),
                    line.originalAmount(), line.subsidyAmount(), line.finalAmount());
        }
        return ticketingRepository.findJourneyOrder(journeyOrderId).orElseThrow();
    }

    @Transactional
    public SingleTripTicketView purchaseSingleTripTicket(CurrentUser currentUser,
            PurchaseSingleTripTicketRequest request) {
        String studentCode = requireStudentCode(currentUser);
        if (request.boardingStopId().equals(request.alightingStopId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Boarding and alighting stops must be different");
        }
        BigDecimal singleAmount = ticketingRepository.singleFare(request.routeId());
        if (singleAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Route does not have a single-trip fare configured");
        }
        // Apply subsidy if available
        MonthlyPassQuote quote = subsidyService.quoteFor(currentUser, request.routeId(),
                "Route " + request.routeId(), singleAmount);
        ensurePurchasableQuote(quote);
        Integer ticketId = ticketingRepository.createSingleTripTicket(studentCode, request.routeId(),
                request.boardingStopId(), request.alightingStopId(),
                quote.finalFareAmount(), quote.originalFareAmount(),
                quote.subsidyAmount(), quote.finalFareAmount(),
                quote.subsidyPolicyId());
        String method = request.method() == null || request.method().isBlank() ? "BANK_TRANSFER" : request.method();
        ticketingRepository.createPaidPaymentForSingleTicket(ticketId, quote.finalFareAmount(), method);
        return ticketingRepository.findSingleTripTicket(ticketId)
                .map(t -> new SingleTripTicketView(t.ticketId(), t.routeId(), t.routeName(),
                        t.boardingStopId(), t.boardingStopName(), t.alightingStopId(), t.alightingStopName(),
                        t.originalFareAmount(), t.subsidyAmount(), t.finalFareAmount(), t.qrCode(),
                        t.status(), t.purchasedAt(), t.expiresAt()))
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "Failed to retrieve created single-trip ticket"));
    }

    @Transactional(readOnly = true)
    public List<SingleTripTicketView> listSingleTripTickets(CurrentUser currentUser) {
        String studentCode = requireStudentCode(currentUser);
        return ticketingRepository.findSingleTripTickets(studentCode).stream()
                .map(t -> new SingleTripTicketView(t.ticketId(), t.routeId(), t.routeName(),
                        t.boardingStopId(), t.boardingStopName(), t.alightingStopId(), t.alightingStopName(),
                        t.originalFareAmount(), t.subsidyAmount(), t.finalFareAmount(), t.qrCode(),
                        t.status(), t.purchasedAt(), t.expiresAt()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PaymentView> payments(CurrentUser currentUser) {
        return ticketingRepository.findPayments(requireStudentCode(currentUser));
    }

    @Transactional
    public VnpayPaymentUrlView createVnpayPaymentUrl(CurrentUser currentUser,
            CreateVnpayPaymentRequest request, String clientIp) {
        String studentCode = requireStudentCode(currentUser);
        ApprovedRegistration registration = ticketingRepository.approvedRegistration(studentCode)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST,
                        "Student must have an approved route registration"));
        BigDecimal defaultAmount = ticketingRepository.monthlyFare(registration.routeId());
        MonthlyPassQuote quote = subsidyService.quoteFor(currentUser, registration.routeId(),
                registration.routeName(), defaultAmount);
        ensurePurchasableQuote(quote);

        BigDecimal amount = request != null && request.amount() != null && request.amount().compareTo(BigDecimal.ZERO) > 0
                ? request.amount()
                : quote.finalFareAmount();
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Payment amount must be greater than zero");
        }

        String transactionCode = "VNP" + UUID.randomUUID().toString().replace("-", "").substring(0, 24).toUpperCase();
        PaymentView payment = ticketingRepository.createPendingVnpayPayment(studentCode, amount, transactionCode);
        String paymentUrl = hasVnpayCredentials()
                ? VNPayUtils.buildPaymentUrl(vnPayConfig, amount, transactionCode, clientIp)
                : mockVnpayUrl(payment.paymentId(), transactionCode, amount);
        return new VnpayPaymentUrlView(payment.paymentId(), transactionCode, amount, paymentUrl);
    }

    @Transactional
    public PaymentView completeMockVnpayPayment(CurrentUser currentUser, Integer paymentId) {
        String studentCode = requireStudentCode(currentUser);
        ticketingRepository.findPaymentForStudent(paymentId, studentCode)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Payment not found"));
        return ticketingRepository.markPaymentPaid(paymentId);
    }

    @Transactional
    public PaymentView failMockVnpayPayment(CurrentUser currentUser, Integer paymentId) {
        String studentCode = requireStudentCode(currentUser);
        ticketingRepository.findPaymentForStudent(paymentId, studentCode)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Payment not found"));
        return ticketingRepository.markPaymentFailed(paymentId);
    }

    @Transactional
    public String handleVnpayReturn(Map<String, String> params) {
        String transactionCode = params.get("vnp_TxnRef");
        String responseCode = params.getOrDefault("vnp_ResponseCode", "99");
        PaymentView payment = transactionCode == null || transactionCode.isBlank()
                ? null
                : ticketingRepository.findPaymentByTransactionCode(transactionCode).orElse(null);

        boolean verified = hasVnpayCredentials() && VNPayUtils.verifyReturn(vnPayConfig, params);
        boolean success = verified
                && "00".equals(responseCode)
                && "00".equals(params.getOrDefault("vnp_TransactionStatus", "00"));

        if (payment != null) {
            payment = success
                    ? ticketingRepository.markPaymentPaid(payment.paymentId())
                    : ticketingRepository.markPaymentFailed(payment.paymentId());
        }
        return paymentResultUrl(success, payment == null ? null : payment.paymentId(), transactionCode, responseCode);
    }

    private String requireStudentCode(CurrentUser currentUser) {
        return ticketingRepository.studentCodeForUser(currentUser.userId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Student profile not found"));
    }

    private String method(PurchaseMonthlyPassRequest request) {
        return request == null || request.method() == null || request.method().isBlank()
                ? "BANK_TRANSFER"
                : request.method();
    }

    private boolean hasVnpayCredentials() {
        return vnPayConfig.tmnCode() != null && !vnPayConfig.tmnCode().isBlank()
                && vnPayConfig.hashSecret() != null && !vnPayConfig.hashSecret().isBlank();
    }

    private String mockVnpayUrl(Integer paymentId, String transactionCode, BigDecimal amount) {
        return UriComponentsBuilder.fromUriString(vnPayConfig.frontendUrl())
                .path("/student/payment/mock")
                .queryParam("paymentId", paymentId)
                .queryParam("txnRef", transactionCode)
                .queryParam("amount", amount)
                .build()
                .toUriString();
    }

    private String paymentResultUrl(boolean success, Integer paymentId, String transactionCode, String responseCode) {
        UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(vnPayConfig.frontendUrl())
                .path("/student/payment/result")
                .queryParam("status", success ? "success" : "failed")
                .queryParam("responseCode", responseCode == null || responseCode.isBlank() ? "99" : responseCode);
        if (paymentId != null) {
            builder.queryParam("paymentId", paymentId);
        }
        if (transactionCode != null && !transactionCode.isBlank()) {
            builder.queryParam("txnRef", transactionCode);
        }
        return builder.build().toUriString();
    }

    private String method(String method) {
        return method == null || method.isBlank() ? "BANK_TRANSFER" : method;
    }

    private String label(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private void ensurePurchasableQuote(MonthlyPassQuote quote) {
        if (SubsidyService.STATUS_NOT_VERIFIED.equals(quote.subsidyStatus())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Student verification is required before buying a monthly pass");
        }
        if (SubsidyService.STATUS_NO_UNIVERSITY.equals(quote.subsidyStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Student university is not linked to a partner university yet");
        }
    }

    private record JourneyOrderLine(Integer monthlyPassId, Integer routeId, Integer legOrder,
            Integer boardingStopId, Integer alightingStopId, BigDecimal originalAmount,
            BigDecimal subsidyAmount, BigDecimal finalAmount) {
    }
}

