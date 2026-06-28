package com.unibus.api.assistant;

import java.time.LocalDate;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.unibus.api.assistant.AssistantTicketDtos.ConductorDashboard;
import com.unibus.api.assistant.AssistantTicketDtos.ScanTicketRequest;
import com.unibus.api.assistant.AssistantTicketDtos.ScanTicketResult;
import com.unibus.api.common.ApiResponse;
import com.unibus.api.security.CurrentUser;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/assistant")
@PreAuthorize("hasRole('CONDUCTOR')")
public class AssistantTicketController {

    private final AssistantTicketService service;

    public AssistantTicketController(AssistantTicketService service) {
        this.service = service;
    }

    @GetMapping("/dashboard")
    ApiResponse<ConductorDashboard> dashboard(
            @AuthenticationPrincipal CurrentUser currentUser,
            @RequestParam(required = false) LocalDate date) {
        return ApiResponse.ok("Conductor dashboard retrieved", service.dashboard(currentUser, date));
    }

    @PostMapping("/scan")
    ApiResponse<ScanTicketResult> scan(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Valid @RequestBody ScanTicketRequest request) {
        return ApiResponse.ok("Ticket scanned", service.scan(currentUser, request));
    }
}
