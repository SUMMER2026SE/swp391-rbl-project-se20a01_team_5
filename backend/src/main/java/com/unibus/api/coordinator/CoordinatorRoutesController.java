package com.unibus.api.coordinator;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.unibus.api.common.ApiResponse;
import com.unibus.api.coordinator.dto.CoordinatorRoutesDtos.AddStopRequest;
import com.unibus.api.coordinator.dto.CoordinatorRoutesDtos.CreateRouteRequest;
import com.unibus.api.coordinator.dto.CoordinatorRoutesDtos.RouteListItem;
import com.unibus.api.coordinator.dto.CoordinatorRoutesDtos.RouteStopDto;
import com.unibus.api.coordinator.dto.CoordinatorRoutesDtos.UpdateStopRequest;

@RestController
@RequestMapping("/api/v1/coordinator/routes")
public class CoordinatorRoutesController {

    private final CoordinatorRoutesService routesService;

    public CoordinatorRoutesController(CoordinatorRoutesService routesService) {
        this.routesService = routesService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DISPATCHER')")
    ApiResponse<List<RouteListItem>> getRoutes() {
        return ApiResponse.ok("Routes retrieved successfully", routesService.getRoutes());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DISPATCHER')")
    ApiResponse<RouteListItem> createRoute(@RequestBody CreateRouteRequest request) {
        return ApiResponse.ok("Route created successfully", routesService.createRoute(request));
    }

    @GetMapping("/{routeId}/stops")
    @PreAuthorize("hasAnyRole('ADMIN', 'DISPATCHER')")
    ApiResponse<List<RouteStopDto>> getRouteStops(@PathVariable Integer routeId) {
        return ApiResponse.ok("Route stops retrieved successfully", routesService.getRouteStops(routeId));
    }

    @PostMapping("/{routeId}/stops")
    @PreAuthorize("hasAnyRole('ADMIN', 'DISPATCHER')")
    ApiResponse<RouteStopDto> addStop(@PathVariable Integer routeId, @RequestBody AddStopRequest request) {
        return ApiResponse.ok("Stop added successfully", routesService.addStop(routeId, request));
    }

    @PutMapping("/{routeId}/stops/{stopId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DISPATCHER')")
    ApiResponse<RouteStopDto> updateStop(@PathVariable Integer routeId, @PathVariable Integer stopId, @RequestBody UpdateStopRequest request) {
        return ApiResponse.ok("Stop updated successfully", routesService.updateStop(routeId, request));
    }

    @DeleteMapping("/{routeId}/stops/{stopId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DISPATCHER')")
    ApiResponse<Void> deleteStop(@PathVariable Integer routeId, @PathVariable Integer stopId) {
        routesService.deleteStop(routeId, stopId);
        return ApiResponse.ok("Stop deleted successfully", null);
    }
}
