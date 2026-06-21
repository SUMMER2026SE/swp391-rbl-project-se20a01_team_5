package com.unibus.api.dispatch;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.unibus.api.common.ApiResponse;
import com.unibus.api.dispatch.DispatchDtos.DispatchMessageRequest;
import com.unibus.api.dispatch.DispatchDtos.DispatchMessageView;
import com.unibus.api.dispatch.DispatchDtos.DispatcherContact;
import com.unibus.api.dispatch.DispatchDtos.IncidentReportRequest;
import com.unibus.api.security.CurrentUser;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/driver/dispatch")
@PreAuthorize("hasRole('DRIVER')")
public class DriverDispatchController {

    private final DispatchService dispatchService;

    public DriverDispatchController(DispatchService dispatchService) {
        this.dispatchService = dispatchService;
    }

    @GetMapping("/contact")
    ApiResponse<DispatcherContact> contact(@AuthenticationPrincipal CurrentUser currentUser) {
        return ApiResponse.ok("Dispatcher contact retrieved", dispatchService.getDriverContact(currentUser));
    }

    @PostMapping("/messages")
    ApiResponse<DispatchMessageView> sendMessage(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Valid @RequestBody DispatchMessageRequest request) {
        return ApiResponse.ok("Message sent to dispatcher", dispatchService.sendDriverMessage(currentUser, request));
    }

    @PostMapping("/incidents")
    ApiResponse<DispatchMessageView> reportIncident(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Valid @RequestBody IncidentReportRequest request) {
        return ApiResponse.ok("Incident reported to dispatcher", dispatchService.reportIncident(currentUser, request));
    }
}
