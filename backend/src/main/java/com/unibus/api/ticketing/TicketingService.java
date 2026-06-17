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
import com.unibus.api.ticketing.TicketingDtos.PassesDashboard;
import com.unibus.api.ticketing.TicketingDtos.PaymentView;
import com.unibus.api.ticketing.TicketingDtos.PurchaseMonthlyPassRequest;
import com.unibus.api.ticketing.TicketingDtos.TicketView;
import com.unibus.api.ticketing.TicketingDtos.VnpayPaymentUrlView;
import com.unibus.api.ticketing.TicketingRepository.ApprovedRegistration;

@Service
public class TicketingService {

    private final TicketingRepository ticketingRepository;
    private final VNPayConfig vnPayConfig;

    public TicketingService(TicketingRepository ticketingRepository, VNPayConfig vnPayConfig) {
        this.ticketingRepository = ticketingRepository;
        this.vnPayConfig = vnPayConfig;
    }

    @Transactional(readOnly = true)
    public PassesDashboard dashboard(CurrentUser currentUser) {
        String studentCode = requireStudentCode(currentUser);
        return new PassesDashboard(
                ticketingRepository.findTickets(studentCode),
                ticketingRepository.findPayments(studentCode));
    }

    @Transactional
    public TicketView purchaseMonthlyPass(CurrentUser currentUser, PurchaseMonthlyPassRequest request) {
        String studentCode = requireStudentCode(currentUser);
        ApprovedRegistration registration = ticketingRepository.approvedRegistration(studentCode)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Student must have an approved route registration"));
        LocalDate now = LocalDate.now();
        int year = now.getYear();
        int month = now.getMonthValue();
        return ticketingRepository.activeMonthlyPass(studentCode, registration.routeId(), year, month)
                .orElseGet(() -> {
                    OffsetDateTime validFrom = now.withDayOfMonth(1).atStartOfDay().atOffset(ZoneOffset.UTC);
                    OffsetDateTime expiresAt = now.plusMonths(1).withDayOfMonth(1).atStartOfDay().atOffset(ZoneOffset.UTC);
                    BigDecimal amount = ticketingRepository.monthlyFare(registration.routeId());
                    TicketView ticket = ticketingRepository.createMonthlyTicket(studentCode, registration, year, month, validFrom, expiresAt, amount);
                    String method = method(request);
                    ticketingRepository.createPayment(
                            ticket.ticketId(),
                            amount,
                            method,
                            paymentStatus(request, method),
                            transactionCode(request, method),
                            paymentNotes(request, method));
                    return ticket;
                });
    }

    @Transactional(readOnly = true)
    public List<PaymentView> payments(CurrentUser currentUser) {
        return ticketingRepository.findPayments(requireStudentCode(currentUser));
    }

    @Transactional
    public VnpayPaymentUrlView createVnpayPaymentUrl(CurrentUser currentUser, CreateVnpayPaymentRequest request, String clientIp) {
        String studentCode = requireStudentCode(currentUser);
        ApprovedRegistration registration = ticketingRepository.approvedRegistration(studentCode)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Student must have an approved route registration"));
        LocalDate now = LocalDate.now();
        if (ticketingRepository.activeMonthlyPass(studentCode, registration.routeId(), now.getYear(), now.getMonthValue()).isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "Student already has an active monthly pass");
        }
        BigDecimal amount = paymentAmount(request, registration.routeId());
        String txnRef = "VNP" + System.currentTimeMillis() + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        PaymentView payment = ticketingRepository.createPendingVnpayPayment(studentCode, amount, txnRef);
        String paymentUrl = isVnpayConfigured()
                ? VNPayUtils.buildPaymentUrl(vnPayConfig, amount, txnRef, clientIp)
                : mockVnpayUrl(payment, txnRef);
        return new VnpayPaymentUrlView(payment.paymentId(), txnRef, amount, paymentUrl);
    }

    @Transactional
    public PaymentView completeMockVnpayPayment(CurrentUser currentUser, Integer paymentId) {
        PaymentView payment = requireStudentPayment(currentUser, paymentId);
        return completeVnpayPayment(payment);
    }

    @Transactional
    public PaymentView failMockVnpayPayment(CurrentUser currentUser, Integer paymentId) {
        PaymentView payment = requireStudentPayment(currentUser, paymentId);
        if ("PAID".equals(payment.status()) || "FAILED".equals(payment.status())) {
            return payment;
        }
        return ticketingRepository.markPaymentFailed(payment.paymentId(), "VNPay demo payment failed");
    }

    @Transactional
    public String handleVnpayReturn(Map<String, String> params) {
        String txnRef = params.get("vnp_TxnRef");
        PaymentView payment = txnRef == null ? null : ticketingRepository.findByTransactionCode(txnRef).orElse(null);
        boolean validSignature = VNPayUtils.verifyReturn(vnPayConfig, params);
        boolean success = payment != null && validSignature && successfulVnpayResponse(params);

        if (payment != null) {
            if (success) {
                completeVnpayPayment(payment);
            } else {
                ticketingRepository.markPaymentFailed(payment.paymentId(), "VNPay failed or invalid signature");
            }
        }

        return UriComponentsBuilder.fromUriString(vnPayConfig.frontendUrl())
                .path("/student/payment/result")
                .queryParam("status", success ? "success" : "failed")
                .queryParam("paymentId", payment == null ? "" : payment.paymentId())
                .queryParam("txnRef", txnRef == null ? "" : txnRef)
                .queryParam("responseCode", params.getOrDefault("vnp_ResponseCode", ""))
                .build()
                .toUriString();
    }

    private String requireStudentCode(CurrentUser currentUser) {
        return ticketingRepository.studentCodeForUser(currentUser.userId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Student profile not found"));
    }

    private boolean successfulVnpayResponse(Map<String, String> params) {
        String transactionStatus = params.get("vnp_TransactionStatus");
        return "00".equals(params.get("vnp_ResponseCode"))
                && (transactionStatus == null || transactionStatus.isBlank() || "00".equals(transactionStatus));
    }

    private PaymentView completeVnpayPayment(PaymentView payment) {
        if ("PAID".equals(payment.status())) {
            return payment;
        }
        if (ticketingRepository.paidMonthlyPassForPayment(payment.paymentId()).isPresent()) {
            return payment;
        }
        String studentCode = ticketingRepository.studentCodeForPayment(payment.paymentId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Payment student not found"));
        ApprovedRegistration registration = ticketingRepository.approvedRegistration(studentCode)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Student must have an approved route registration"));
        LocalDate now = LocalDate.now();
        int year = now.getYear();
        int month = now.getMonthValue();
        TicketView ticket = ticketingRepository.activeMonthlyPass(studentCode, registration.routeId(), year, month)
                .orElseGet(() -> {
                    OffsetDateTime validFrom = now.withDayOfMonth(1).atStartOfDay().atOffset(ZoneOffset.UTC);
                    OffsetDateTime expiresAt = now.plusMonths(1).withDayOfMonth(1).atStartOfDay().atOffset(ZoneOffset.UTC);
                    return ticketingRepository.createMonthlyTicket(studentCode, registration, year, month, validFrom, expiresAt, payment.amount());
                });
        return ticketingRepository.attachPaidMonthlyPass(payment.paymentId(), ticket.ticketId());
    }

    private BigDecimal paymentAmount(CreateVnpayPaymentRequest request, Integer routeId) {
        BigDecimal amount = ticketingRepository.monthlyFare(routeId);
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Monthly fare is not configured");
        }
        if (request != null && request.amount() != null && request.amount().compareTo(amount) != 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Payment amount must match the monthly fare");
        }
        return amount;
    }

    private boolean isVnpayConfigured() {
        return !vnPayConfig.tmnCode().isBlank() && !vnPayConfig.hashSecret().isBlank();
    }

    private String mockVnpayUrl(PaymentView payment, String txnRef) {
        return UriComponentsBuilder.fromUriString(vnPayConfig.frontendUrl())
                .path("/student/payment/mock")
                .queryParam("paymentId", payment.paymentId())
                .queryParam("txnRef", txnRef)
                .queryParam("amount", payment.amount())
                .build()
                .toUriString();
    }

    private PaymentView requireStudentPayment(CurrentUser currentUser, Integer paymentId) {
        String studentCode = requireStudentCode(currentUser);
        PaymentView payment = ticketingRepository.findPayment(paymentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Payment not found"));
        String paymentStudentCode = ticketingRepository.studentCodeForPayment(paymentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Payment student not found"));
        if (!studentCode.equals(paymentStudentCode)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Payment does not belong to current student");
        }
        return payment;
    }

    private String method(PurchaseMonthlyPassRequest request) {
        return request == null || request.method() == null || request.method().isBlank()
                ? "E_WALLET"
                : request.method();
    }

    private String paymentStatus(PurchaseMonthlyPassRequest request, String method) {
        if ("BANK_TRANSFER".equals(method) && isBlank(request == null ? null : request.transactionCode())) {
            return "PENDING";
        }
        return "PAID";
    }

    private String transactionCode(PurchaseMonthlyPassRequest request, String method) {
        if (request != null && !isBlank(request.transactionCode())) {
            return request.transactionCode().trim();
        }
        return "BANK_TRANSFER".equals(method) ? null : "PAY-" + UUID.randomUUID();
    }

    private String paymentNotes(PurchaseMonthlyPassRequest request, String method) {
        String notes = request == null ? null : request.notes();
        if (!isBlank(notes)) {
            return notes.trim();
        }
        if ("BANK_TRANSFER".equals(method)) {
            return "Waiting for bank transfer confirmation";
        }
        return "Internal payment confirmation";
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
