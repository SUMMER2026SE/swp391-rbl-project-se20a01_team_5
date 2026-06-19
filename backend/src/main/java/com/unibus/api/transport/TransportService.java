package com.unibus.api.transport;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.unibus.api.common.ApiException;
import com.unibus.api.transport.dto.TransportDtos.Eta;
import com.unibus.api.transport.dto.TransportDtos.RouteReference;
import com.unibus.api.transport.dto.TransportDtos.RouteStopSummary;
import com.unibus.api.transport.dto.TransportDtos.RouteSuggestion;
import com.unibus.api.transport.dto.TransportDtos.StopSummary;
import com.unibus.api.transport.model.BusRoute;
import com.unibus.api.transport.model.RouteStatus;
import com.unibus.api.transport.model.RouteStop;
import com.unibus.api.transport.model.Stop;

@Service
public class TransportService {

    private final StopRepository stopRepository;
    private final RouteStopRepository routeStopRepository;
    private final BusRouteRepository busRouteRepository;

    public TransportService(
            StopRepository stopRepository,
            RouteStopRepository routeStopRepository,
            BusRouteRepository busRouteRepository) {
        this.stopRepository = stopRepository;
        this.routeStopRepository = routeStopRepository;
        this.busRouteRepository = busRouteRepository;
    }

    @Transactional(readOnly = true)
    public List<StopSummary> getActiveStops() {
        return stopRepository.findAllByStatusOrderByStopName(RouteStatus.ACTIVE).stream()
                .map(stop -> new StopSummary(
                        stop.getId(),
                        stop.getStopName(),
                        stop.getAddress(),
                        stop.getLongitude(),
                        stop.getLatitude(),
                        routeStopRepository.findAllByStopId(stop.getId()).stream()
                                .filter(routeStop -> routeStop.getRoute().getStatus() == RouteStatus.ACTIVE)
                                .map(routeStop -> new RouteReference(
                                        routeStop.getRoute().getId(), routeStop.getRoute().getRouteName()))
                                .distinct()
                                .toList()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RouteSuggestion> searchRoutes(Integer boardingStopId, Integer alightingStopId) {
        if (boardingStopId.equals(alightingStopId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Boarding and alighting stops must be different");
        }
        requireActiveStop(boardingStopId);
        requireActiveStop(alightingStopId);
        return busRouteRepository.searchRoutes(boardingStopId, alightingStopId).stream()
                .map(this::toRouteSuggestion)
                .toList();
    }

    @Transactional(readOnly = true)
    public RouteSuggestion getRoute(Integer routeId) {
        BusRoute route = busRouteRepository.findById(routeId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Route not found"));
        if (route.getStatus() != RouteStatus.ACTIVE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Route is not active");
        }
        return toRouteSuggestion(route);
    }

    @Transactional(readOnly = true)
    public List<Eta> getEtas(Integer routeId, Integer stopId) {
        BusRoute route = busRouteRepository.findById(routeId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Route not found"));
        if (route.getStatus() != RouteStatus.ACTIVE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Route is not active");
        }
        validateStopOnRoute(routeId, stopId);
        return List.of();
    }

    @Transactional(readOnly = true)
    public RouteSelection requireValidSelection(Integer routeId, Integer boardingStopId, Integer alightingStopId) {
        BusRoute route = busRouteRepository.findById(routeId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Route not found"));
        if (route.getStatus() != RouteStatus.ACTIVE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Route is not active");
        }
        List<RouteStop> stops = routeStopRepository.findAllByRouteIdOrderByStopOrder(routeId);
        RouteStop boarding = stops.stream().filter(item -> item.getStop().getId().equals(boardingStopId))
                .findFirst().orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Boarding stop is not on route"));
        RouteStop alighting = stops.stream().filter(item -> item.getStop().getId().equals(alightingStopId))
                .filter(item -> item.getStopOrder() > boarding.getStopOrder())
                .findFirst().orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST,
                        "Alighting stop must be after boarding stop on route"));
        return new RouteSelection(route, boarding.getStop(), alighting.getStop());
    }

    private RouteSuggestion toRouteSuggestion(BusRoute route) {
        List<RouteStopSummary> stops = routeStopRepository.findAllByRouteIdOrderByStopOrder(route.getId()).stream()
                .map(routeStop -> new RouteStopSummary(
                        routeStop.getStop().getId(),
                        routeStop.getStop().getStopName(),
                        routeStop.getStopOrder(),
                        routeStop.getMinutesFromPreviousStop()))
                .toList();
        return new RouteSuggestion(route.getId(), route.getRouteName(), route.getDistanceKm(),
                route.getEstimatedMinutes(), stops);
    }

    private Stop requireActiveStop(Integer stopId) {
        Stop stop = stopRepository.findById(stopId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Stop not found"));
        if (stop.getStatus() != RouteStatus.ACTIVE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Stop is not active");
        }
        return stop;
    }

    private void validateStopOnRoute(Integer routeId, Integer stopId) {
        if (routeStopRepository.findAllByRouteIdOrderByStopOrder(routeId).stream()
                .noneMatch(routeStop -> routeStop.getStop().getId().equals(stopId))) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Stop is not on route");
        }
    }

    public record RouteSelection(BusRoute route, Stop boardingStop, Stop alightingStop) {
    }
}
