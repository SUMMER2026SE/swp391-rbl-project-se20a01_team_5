package com.unibus.api.operations;

import java.time.LocalDate;
import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.unibus.api.common.ApiResponse;
import com.unibus.api.operations.OperationsDtos.DriverTripOverview;
import com.unibus.api.operations.OperationsDtos.DriverTripView;
import com.unibus.api.operations.OperationsDtos.VehicleLocationRequest;
import com.unibus.api.security.CurrentUser;
import com.unibus.api.transport.JourneyTrackingService;
import com.unibus.api.transport.dto.TransportDtos.JourneyTrackingSnapshot;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/driver/trips")
@PreAuthorize("hasRole('DRIVER')")
public class DriverTripController {

    private final OperationsService operationsService;
    private final JourneyTrackingService journeyTrackingService;

    public DriverTripController(OperationsService operationsService, JourneyTrackingService journeyTrackingService) {
        this.operationsService = operationsService;
        this.journeyTrackingService = journeyTrackingService;
    }

    @GetMapping
    ApiResponse<List<DriverTripView>> list(
            @AuthenticationPrincipal CurrentUser currentUser,
            @RequestParam(required = false) LocalDate date) {
        return ApiResponse.ok("Driver trips retrieved", operationsService.getDriverTrips(currentUser, date));
    }

    @GetMapping("/overview")
    ApiResponse<DriverTripOverview> overview(@AuthenticationPrincipal CurrentUser currentUser) {
        return ApiResponse.ok("Driver trip overview retrieved", operationsService.getDriverTripOverview(currentUser));
    }

    @PostMapping("/{tripId}/start")
    ApiResponse<DriverTripView> start(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Integer tripId) {
        return ApiResponse.ok("Trip started", operationsService.startTrip(currentUser, tripId));
    }

    @PostMapping("/{tripId}/end")
    ApiResponse<DriverTripView> end(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Integer tripId) {
        return ApiResponse.ok("Trip ended", operationsService.endTrip(currentUser, tripId));
    }

    @GetMapping("/{tripId}/tracking")
    ApiResponse<JourneyTrackingSnapshot> trackTrip(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Integer tripId) {
        operationsService.getDriverTripForTracking(currentUser, tripId);
        return ApiResponse.ok("Driver trip tracking retrieved", journeyTrackingService.tripSnapshot(tripId));
    }

    @PostMapping("/{tripId}/location")
    ApiResponse<Void> updateLocation(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Integer tripId,
            @Valid @RequestBody VehicleLocationRequest request) {
        operationsService.updateLocation(currentUser, tripId, request);
        return ApiResponse.ok("Trip location updated", null);
    }
}
