package com.unibus.api.operations;

import java.time.LocalDate;
import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.unibus.api.common.ApiResponse;
import com.unibus.api.operations.OperationsDtos.LiveFleetVehicle;
import com.unibus.api.transport.JourneyTrackingService;
import com.unibus.api.transport.dto.TransportDtos.JourneyTrackingSnapshot;

@RestController
@RequestMapping("/api/v1/coordinator/fleet")
@PreAuthorize("hasAnyRole('DISPATCHER', 'ADMIN')")
public class CoordinatorFleetController {

    private final OperationsService operationsService;
    private final JourneyTrackingService journeyTrackingService;

    public CoordinatorFleetController(OperationsService operationsService, JourneyTrackingService journeyTrackingService) {
        this.operationsService = operationsService;
        this.journeyTrackingService = journeyTrackingService;
    }

    @GetMapping("/live")
    ApiResponse<List<LiveFleetVehicle>> liveFleet(@RequestParam(required = false) LocalDate date) {
        List<LiveFleetVehicle> fleet = operationsService.getLiveFleet(date).stream().map(vehicle -> {
            if (!"RUNNING".equals(vehicle.status())) return vehicle;
            var snapshot = journeyTrackingService.tripSnapshot(vehicle.tripId());
            var tracked = snapshot.vehicles().isEmpty() ? null : snapshot.vehicles().get(0);
            if (tracked == null) return vehicle;
            return new LiveFleetVehicle(vehicle.tripId(), vehicle.routeId(), vehicle.routeName(), vehicle.busId(),
                    vehicle.licensePlate(), vehicle.driverName(), vehicle.conductorName(), vehicle.serviceDate(),
                    vehicle.departureTime(), vehicle.status(),
                    tracked.longitude() == null ? null : tracked.longitude().doubleValue(),
                    tracked.latitude() == null ? null : tracked.latitude().doubleValue(),
                    tracked.speedKmh() == null ? null : tracked.speedKmh().doubleValue(),
                    tracked.occupancy(), snapshot.updatedAt());
        }).toList();
        return ApiResponse.ok("Live fleet retrieved", fleet);
    }
    @GetMapping("/live/{tripId}/tracking")
    ApiResponse<JourneyTrackingSnapshot> trackTrip(@org.springframework.web.bind.annotation.PathVariable Integer tripId) {
        return ApiResponse.ok("Live trip tracking retrieved", journeyTrackingService.tripSnapshot(tripId));
    }
}
