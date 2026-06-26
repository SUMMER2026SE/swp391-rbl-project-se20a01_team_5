package com.unibus.api.operations;

import java.time.LocalDate;
import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.unibus.api.common.ApiResponse;
import com.unibus.api.operations.OperationsDtos.ConductorTicketView;
import com.unibus.api.operations.OperationsDtos.ConductorContactView;
import com.unibus.api.operations.OperationsDtos.ConductorMessageRequest;
import com.unibus.api.operations.OperationsDtos.ConductorSupportRequest;
import com.unibus.api.operations.OperationsDtos.ConductorSupportResult;
import com.unibus.api.operations.OperationsDtos.ConductorTripView;
import com.unibus.api.operations.OperationsDtos.InternalMessageView;
import com.unibus.api.operations.OperationsDtos.TicketScanRequest;
import com.unibus.api.operations.OperationsDtos.TicketScanResult;
import com.unibus.api.security.CurrentUser;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/conductor")
@PreAuthorize("hasRole('CONDUCTOR')")
public class ConductorTripController {

    private final OperationsService operationsService;

    public ConductorTripController(OperationsService operationsService) {
        this.operationsService = operationsService;
    }

    @GetMapping("/trips")
    ApiResponse<List<ConductorTripView>> listTrips(
            @AuthenticationPrincipal CurrentUser currentUser,
            @RequestParam(required = false) LocalDate date) {
        return ApiResponse.ok("Conductor trips retrieved", operationsService.getConductorTrips(currentUser, date));
    }

    @GetMapping("/tickets")
    ApiResponse<List<ConductorTicketView>> listTickets(
            @AuthenticationPrincipal CurrentUser currentUser,
            @RequestParam Integer tripId) {
        return ApiResponse.ok("Conductor tickets retrieved", operationsService.getConductorTickets(currentUser, tripId));
    }

    @PostMapping("/tickets/scan")
    ApiResponse<TicketScanResult> scanTicket(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Valid @RequestBody TicketScanRequest request) {
        return ApiResponse.ok("Ticket scan completed", operationsService.scanTicket(currentUser, request));
    }

    @GetMapping("/contact")
    ApiResponse<ConductorContactView> contact(@AuthenticationPrincipal CurrentUser currentUser) {
        return ApiResponse.ok("Conductor contacts retrieved", operationsService.getConductorContact(currentUser));
    }

    @PostMapping("/messages")
    ApiResponse<InternalMessageView> sendMessage(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Valid @RequestBody ConductorMessageRequest request) {
        return ApiResponse.ok("Message sent", operationsService.sendConductorMessage(currentUser, request));
    }

    @PostMapping("/support")
    ApiResponse<ConductorSupportResult> support(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Valid @RequestBody ConductorSupportRequest request) {
        return ApiResponse.ok("Support report submitted", operationsService.submitConductorSupport(currentUser, request));
    }
}
