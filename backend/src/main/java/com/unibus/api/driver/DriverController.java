package com.unibus.api.driver;

import com.unibus.api.common.ApiResponse;
import com.unibus.api.driver.dto.DriverDtos.DriverActionRequest;
import com.unibus.api.driver.dto.DriverDtos.DriverActionResponse;
import com.unibus.api.driver.dto.DriverDtos.DriverContactPage;
import com.unibus.api.driver.dto.DriverDtos.DriverDashboard;
import com.unibus.api.driver.dto.DriverDtos.DriverProfile;
import com.unibus.api.driver.dto.DriverDtos.DriverTrip;
import com.unibus.api.security.CurrentUser;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/driver")
@PreAuthorize("hasRole('DRIVER')")
public class DriverController {
    private final DriverService driverService;

    public DriverController(DriverService driverService) {
        this.driverService = driverService;
    }

    @GetMapping("/dashboard")
    ApiResponse<DriverDashboard> dashboard(@AuthenticationPrincipal CurrentUser currentUser) {
        return ApiResponse.ok("Driver dashboard retrieved", driverService.dashboard(currentUser));
    }

    @GetMapping("/trips/current")
    ApiResponse<DriverTrip> currentTrip(@AuthenticationPrincipal CurrentUser currentUser) {
        return ApiResponse.ok("Current driver trip retrieved", driverService.currentTrip(currentUser));
    }

    @PostMapping("/trips/{tripId}/start")
    ApiResponse<DriverActionResponse> startTrip(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable String tripId) {
        return ApiResponse.ok("Trip started", driverService.startTrip(currentUser, tripId));
    }

    @PostMapping("/trips/{tripId}/end")
    ApiResponse<DriverActionResponse> endTrip(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable String tripId) {
        return ApiResponse.ok("Trip ended", driverService.endTrip(currentUser, tripId));
    }

    @GetMapping("/contact")
    ApiResponse<DriverContactPage> contact(@AuthenticationPrincipal CurrentUser currentUser) {
        return ApiResponse.ok("Driver contacts retrieved", driverService.contacts(currentUser));
    }

    @PostMapping("/contact/messages")
    ApiResponse<DriverActionResponse> sendMessage(
            @AuthenticationPrincipal CurrentUser currentUser,
            @RequestBody(required = false) DriverActionRequest request) {
        String message = request == null ? null : request.message();
        return ApiResponse.ok("Driver message sent", driverService.sendMessage(currentUser, message));
    }

    @PostMapping("/incidents")
    ApiResponse<DriverActionResponse> reportIncident(
            @AuthenticationPrincipal CurrentUser currentUser,
            @RequestBody(required = false) DriverActionRequest request) {
        String incidentType = request == null ? null : request.incidentType();
        String note = request == null ? null : request.note();
        return ApiResponse.ok("Driver incident reported", driverService.reportIncident(currentUser, incidentType, note));
    }

    @GetMapping("/profile")
    ApiResponse<DriverProfile> profile(@AuthenticationPrincipal CurrentUser currentUser) {
        return ApiResponse.ok("Driver profile retrieved", driverService.profile(currentUser));
    }
}
