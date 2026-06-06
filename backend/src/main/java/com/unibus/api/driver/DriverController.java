package com.unibus.api.driver;

import com.unibus.api.common.ApiResponse;
import com.unibus.api.driver.dto.DriverDtos.DriverActionRequest;
import com.unibus.api.driver.dto.DriverDtos.DriverActionResponse;
import com.unibus.api.driver.dto.DriverDtos.DriverContactPage;
import com.unibus.api.driver.dto.DriverDtos.DriverDashboard;
import com.unibus.api.driver.dto.DriverDtos.DriverProfile;
import com.unibus.api.driver.dto.DriverDtos.DriverTrip;
import org.springframework.security.access.prepost.PreAuthorize;
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
    ApiResponse<DriverDashboard> dashboard() {
        return ApiResponse.ok("Driver dashboard retrieved", driverService.dashboard());
    }

    @GetMapping("/trips/current")
    ApiResponse<DriverTrip> currentTrip() {
        return ApiResponse.ok("Current driver trip retrieved", driverService.currentTrip());
    }

    @PostMapping("/trips/{tripId}/start")
    ApiResponse<DriverActionResponse> startTrip(@PathVariable String tripId) {
        return ApiResponse.ok("Trip started", driverService.startTrip(tripId));
    }

    @PostMapping("/trips/{tripId}/end")
    ApiResponse<DriverActionResponse> endTrip(@PathVariable String tripId) {
        return ApiResponse.ok("Trip ended", driverService.endTrip(tripId));
    }

    @GetMapping("/contact")
    ApiResponse<DriverContactPage> contact() {
        return ApiResponse.ok("Driver contacts retrieved", driverService.contacts());
    }

    @PostMapping("/contact/messages")
    ApiResponse<DriverActionResponse> sendMessage(@RequestBody(required = false) DriverActionRequest request) {
        String message = request == null ? null : request.message();
        return ApiResponse.ok("Driver message sent", driverService.sendMessage(message));
    }

    @PostMapping("/incidents")
    ApiResponse<DriverActionResponse> reportIncident(@RequestBody(required = false) DriverActionRequest request) {
        String incidentType = request == null ? null : request.incidentType();
        return ApiResponse.ok("Driver incident reported", driverService.reportIncident(incidentType));
    }

    @GetMapping("/profile")
    ApiResponse<DriverProfile> profile() {
        return ApiResponse.ok("Driver profile retrieved", driverService.profile());
    }
}
