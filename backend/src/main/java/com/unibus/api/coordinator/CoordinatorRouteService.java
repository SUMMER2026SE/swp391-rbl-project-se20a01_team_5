package com.unibus.api.coordinator;

import com.unibus.api.common.ApiException;
import com.unibus.api.coordinator.CoordinatorRouteDtos.CoordinatorRouteItem;
import com.unibus.api.coordinator.CoordinatorRouteDtos.CoordinatorRouteStopItem;
import com.unibus.api.transport.BusRouteRepository;
import com.unibus.api.transport.RouteStopRepository;
import com.unibus.api.transport.model.BusRoute;
import com.unibus.api.transport.model.RouteStatus;
import com.unibus.api.transport.model.RouteStop;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CoordinatorRouteService {

    private final BusRouteRepository busRouteRepository;
    private final RouteStopRepository routeStopRepository;

    public CoordinatorRouteService(
            BusRouteRepository busRouteRepository,
            RouteStopRepository routeStopRepository) {
        this.busRouteRepository = busRouteRepository;
        this.routeStopRepository = routeStopRepository;
    }

    @Transactional(readOnly = true)
    public List<CoordinatorRouteItem> getRoutes() {
        return busRouteRepository.findAll().stream()
                .map(route -> new CoordinatorRouteItem(
                        route.getId(),
                        route.getRouteName(),
                        route.getDescription(),
                        routeStopRepository.findAllByRouteIdOrderByStopOrder(route.getId()).size(),
                        RouteStatus.ACTIVE.equals(route.getStatus())))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CoordinatorRouteStopItem> getRouteStops(Integer routeId) {
        BusRoute route = busRouteRepository.findById(routeId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Route not found"));
        List<RouteStop> stops = routeStopRepository.findAllByRouteIdOrderByStopOrder(route.getId());
        int[] elapsed = { 0 };
        return stops.stream()
                .map(routeStop -> {
                    elapsed[0] += routeStop.getMinutesFromPreviousStop() == null ? 0
                            : routeStop.getMinutesFromPreviousStop();
                    return new CoordinatorRouteStopItem(
                            routeStop.getId(),
                            routeStop.getStop().getStopName(),
                            routeStop.getStop().getAddress(),
                            elapsed[0] + " phut",
                            stopType(routeStop, stops.size()));
                })
                .toList();
    }

    private String stopType(RouteStop routeStop, int totalStops) {
        if (routeStop.getStopOrder() == 1) {
            return "Diem dau";
        }
        if (routeStop.getStopOrder() == totalStops) {
            return "Diem cuoi";
        }
        return "Tram dung";
    }
}
