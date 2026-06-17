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
import com.unibus.api.operations.OperationsDtos.DriverTripView;
import com.unibus.api.operations.OperationsDtos.VehicleLocationRequest;
import com.unibus.api.security.CurrentUser;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/driver/trips")
@PreAuthorize("hasRole('DRIVER')")
public class DriverTripController {

    private final OperationsService operationsService;

    public DriverTripController(OperationsService operationsService) {
        this.operationsService = operationsService;
    }

    @GetMapping
    ApiResponse<List<DriverTripView>> list(
            @AuthenticationPrincipal CurrentUser currentUser,
            @RequestParam(required = false) LocalDate date) {
        return ApiResponse.ok("Driver trips retrieved", operationsService.getDriverTrips(currentUser, date));
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

    @PostMapping("/{tripId}/location")
    ApiResponse<Void> updateLocation(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Integer tripId,
            @Valid @RequestBody VehicleLocationRequest request) {
        operationsService.updateLocation(currentUser, tripId, request);
        return ApiResponse.ok("Trip location updated", null);
    }
}
