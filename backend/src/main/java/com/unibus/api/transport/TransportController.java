package com.unibus.api.transport;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.unibus.api.common.ApiResponse;
import com.unibus.api.transport.dto.TransportDtos.Eta;
import com.unibus.api.transport.dto.TransportDtos.RouteSuggestion;
import com.unibus.api.transport.dto.TransportDtos.StopSummary;

@RestController
@RequestMapping("/api/v1")
@PreAuthorize("hasRole('STUDENT')")
public class TransportController {

    private final TransportService transportService;

    public TransportController(TransportService transportService) {
        this.transportService = transportService;
    }

    @GetMapping("/stops")
    ApiResponse<List<StopSummary>> getStops() {
        return ApiResponse.ok("Stops retrieved", transportService.getActiveStops());
    }

    @GetMapping("/routes/search")
    ApiResponse<List<RouteSuggestion>> searchRoutes(
            @RequestParam Integer boardingStopId,
            @RequestParam Integer alightingStopId) {
        return ApiResponse.ok("Routes retrieved", transportService.searchRoutes(boardingStopId, alightingStopId));
    }

    @GetMapping("/routes/{routeId}/stops/{stopId}/eta")
    ApiResponse<List<Eta>> getEta(@PathVariable Integer routeId, @PathVariable Integer stopId) {
        return ApiResponse.ok("ETA retrieved", transportService.getEtas(routeId, stopId));
    }
}
