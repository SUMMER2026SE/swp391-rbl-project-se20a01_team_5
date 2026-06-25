package com.unibus.api.ticketing;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.unibus.api.common.ApiResponse;
import com.unibus.api.security.CurrentUser;
import com.unibus.api.ticketing.TicketingDtos.PassesDashboard;
import com.unibus.api.ticketing.TicketingDtos.PaymentView;
import com.unibus.api.ticketing.TicketingDtos.PurchaseMonthlyPassRequest;
import com.unibus.api.ticketing.TicketingDtos.PurchaseSingleTripTicketRequest;
import com.unibus.api.ticketing.TicketingDtos.SingleTripTicketView;
import com.unibus.api.ticketing.TicketingDtos.TicketView;

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

    @PostMapping("/tickets/single-trip")
    ApiResponse<SingleTripTicketView> purchaseSingleTripTicket(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Valid @RequestBody PurchaseSingleTripTicketRequest request) {
        return ApiResponse.ok("Single-trip ticket purchased",
                ticketingService.purchaseSingleTripTicket(currentUser, request));
    }

    @GetMapping("/tickets/single-trip")
    ApiResponse<List<SingleTripTicketView>> listSingleTripTickets(
            @AuthenticationPrincipal CurrentUser currentUser) {
        return ApiResponse.ok("Single-trip tickets retrieved",
                ticketingService.listSingleTripTickets(currentUser));
    }

    @GetMapping("/payments")
    ApiResponse<List<PaymentView>> payments(@AuthenticationPrincipal CurrentUser currentUser) {
        return ApiResponse.ok("Payments retrieved", ticketingService.payments(currentUser));
    }
}
