package com.unibus.api.transport;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.unibus.api.common.ApiResponse;
import com.unibus.api.security.CurrentUser;
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
    ApiResponse<List<StopSummary>> getStops(@AuthenticationPrincipal CurrentUser currentUser) {
        return ApiResponse.ok("Stops retrieved", transportService.getActiveStops(currentUser));
    }

    @GetMapping("/routes/search")
    ApiResponse<List<RouteSuggestion>> searchRoutes(
            @AuthenticationPrincipal CurrentUser currentUser,
            @RequestParam Integer boardingStopId,
            @RequestParam Integer alightingStopId) {
        return ApiResponse.ok("Routes retrieved", transportService.searchRoutes(currentUser, boardingStopId, alightingStopId));
    }

    @GetMapping("/routes/{routeId}")
    ApiResponse<RouteSuggestion> getRoute(@AuthenticationPrincipal CurrentUser currentUser, @PathVariable Integer routeId) {
        return ApiResponse.ok("Route retrieved", transportService.getRoute(currentUser, routeId));
    }

    @GetMapping("/routes/{routeId}/stops/{stopId}/eta")
    ApiResponse<List<Eta>> getEta(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Integer routeId,
            @PathVariable Integer stopId) {
        return ApiResponse.ok("ETA retrieved", transportService.getEtas(currentUser, routeId, stopId));
    }
}
