package com.unibus.api.coordinator;

import com.unibus.api.coordinator.CoordinatorRouteDtos.CoordinatorRouteItem;
import com.unibus.api.coordinator.CoordinatorRouteDtos.CoordinatorRouteStopItem;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/coordinator/routes")
@PreAuthorize("hasAnyRole('DISPATCHER', 'ADMIN')")
public class CoordinatorRouteController {

    private final CoordinatorRouteService coordinatorRouteService;

    public CoordinatorRouteController(CoordinatorRouteService coordinatorRouteService) {
        this.coordinatorRouteService = coordinatorRouteService;
    }

    @GetMapping
    List<CoordinatorRouteItem> getRoutes() {
        return coordinatorRouteService.getRoutes();
    }

    @GetMapping("/{routeId}/stops")
    List<CoordinatorRouteStopItem> getRouteStops(@PathVariable Integer routeId) {
        return coordinatorRouteService.getRouteStops(routeId);
    }
}
