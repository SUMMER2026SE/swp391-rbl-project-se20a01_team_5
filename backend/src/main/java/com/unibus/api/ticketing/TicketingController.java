package com.unibus.api.ticketing;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.unibus.api.common.ApiResponse;
import com.unibus.api.security.CurrentUser;
import com.unibus.api.ticketing.TicketingDtos.CreateVnpayPaymentRequest;
import com.unibus.api.ticketing.TicketingDtos.PassesDashboard;
import com.unibus.api.ticketing.TicketingDtos.PaymentView;
import com.unibus.api.ticketing.TicketingDtos.PurchaseMonthlyPassRequest;
import com.unibus.api.ticketing.TicketingDtos.TicketView;
import com.unibus.api.ticketing.TicketingDtos.VnpayPaymentUrlView;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/students/me")
@PreAuthorize("hasRole('STUDENT')")
public class TicketingController {

    private final TicketingService ticketingService;

    public TicketingController(TicketingService ticketingService) {
        this.ticketingService = ticketingService;
    }

    @GetMapping("/tickets")
    ApiResponse<PassesDashboard> dashboard(@AuthenticationPrincipal CurrentUser currentUser) {
        return ApiResponse.ok("Tickets retrieved", ticketingService.dashboard(currentUser));
    }

    @PostMapping("/tickets/monthly-pass")
    ApiResponse<TicketView> purchaseMonthlyPass(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Valid @RequestBody(required = false) PurchaseMonthlyPassRequest request) {
        return ApiResponse.ok("Monthly pass purchased", ticketingService.purchaseMonthlyPass(currentUser, request));
    }

    @GetMapping("/payments")
    ApiResponse<List<PaymentView>> payments(@AuthenticationPrincipal CurrentUser currentUser) {
        return ApiResponse.ok("Payments retrieved", ticketingService.payments(currentUser));
    }

    @PostMapping("/payments/vnpay-url")
    ApiResponse<VnpayPaymentUrlView> createVnpayPaymentUrl(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Valid @RequestBody(required = false) CreateVnpayPaymentRequest request,
            HttpServletRequest httpRequest) {
        return ApiResponse.ok("VNPay payment URL created",
                ticketingService.createVnpayPaymentUrl(currentUser, request, clientIp(httpRequest)));
    }

    @PostMapping("/payments/mock-vnpay/{paymentId}/complete")
    ApiResponse<PaymentView> completeMockVnpayPayment(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Integer paymentId) {
        return ApiResponse.ok("VNPay demo payment completed",
                ticketingService.completeMockVnpayPayment(currentUser, paymentId));
    }

    @PostMapping("/payments/mock-vnpay/{paymentId}/fail")
    ApiResponse<PaymentView> failMockVnpayPayment(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Integer paymentId) {
        return ApiResponse.ok("VNPay demo payment failed",
                ticketingService.failMockVnpayPayment(currentUser, paymentId));
    }

    private String clientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
