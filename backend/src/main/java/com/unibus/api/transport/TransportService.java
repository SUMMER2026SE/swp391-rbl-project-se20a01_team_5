package com.unibus.api.transport;

import java.util.List;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.unibus.api.common.ApiException;
import com.unibus.api.security.CurrentUser;
import com.unibus.api.transport.dto.TransportDtos.Eta;
import com.unibus.api.transport.dto.TransportDtos.RouteReference;
import com.unibus.api.transport.dto.TransportDtos.RouteStopSummary;
import com.unibus.api.transport.dto.TransportDtos.RouteSuggestion;
import com.unibus.api.transport.dto.TransportDtos.StopSummary;
import com.unibus.api.transport.model.BusRoute;
import com.unibus.api.transport.model.RouteStatus;
import com.unibus.api.transport.model.RouteStop;
import com.unibus.api.transport.model.Stop;
import com.unibus.api.university.SubsidyService;

@Service
public class TransportService {

    private final StopRepository stopRepository;
    private final RouteStopRepository routeStopRepository;
    private final BusRouteRepository busRouteRepository;
    private final SubsidyService subsidyService;

    public TransportService(
            StopRepository stopRepository,
            RouteStopRepository routeStopRepository,
            BusRouteRepository busRouteRepository,
            SubsidyService subsidyService) {
        this.stopRepository = stopRepository;
        this.routeStopRepository = routeStopRepository;
        this.busRouteRepository = busRouteRepository;
        this.subsidyService = subsidyService;
    }

    @Transactional(readOnly = true)
    public List<StopSummary> getActiveStops(CurrentUser currentUser) {
        Set<Integer> linkedRouteIds = subsidyService.activeLinkedRouteIds(currentUser);
        if (linkedRouteIds.isEmpty()) {
            return List.of();
        }
        return stopRepository.findAllByStatusOrderByStopName(RouteStatus.ACTIVE).stream()
                .map(stop -> toStopSummary(stop, linkedRouteIds))
                .filter(stop -> !stop.routes().isEmpty())
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RouteSuggestion> searchRoutes(CurrentUser currentUser, Integer boardingStopId, Integer alightingStopId) {
        if (boardingStopId.equals(alightingStopId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Boarding and alighting stops must be different");
        }
        requireActiveStop(boardingStopId);
        requireActiveStop(alightingStopId);
        Set<Integer> linkedRouteIds = subsidyService.activeLinkedRouteIds(currentUser);
        if (linkedRouteIds.isEmpty()) {
            return List.of();
        }
        return busRouteRepository.searchRoutes(boardingStopId, alightingStopId).stream()
                .filter(route -> linkedRouteIds.contains(route.getId()))
                .map(this::toRouteSuggestion)
                .toList();
    }

    @Transactional(readOnly = true)
    public RouteSuggestion getRoute(CurrentUser currentUser, Integer routeId) {
        subsidyService.requireRouteLinked(currentUser, routeId);
        BusRoute route = busRouteRepository.findById(routeId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Route not found"));
        if (route.getStatus() != RouteStatus.ACTIVE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Route is not active");
        }
        return toRouteSuggestion(route);
    }

    @Transactional(readOnly = true)
    public List<Eta> getEtas(CurrentUser currentUser, Integer routeId, Integer stopId) {
        subsidyService.requireRouteLinked(currentUser, routeId);
        BusRoute route = busRouteRepository.findById(routeId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Route not found"));
        if (route.getStatus() != RouteStatus.ACTIVE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Route is not active");
        }
        validateStopOnRoute(routeId, stopId);
        return List.of();
    }

    @Transactional(readOnly = true)
    public RouteSelection requireValidSelection(CurrentUser currentUser, Integer routeId, Integer boardingStopId, Integer alightingStopId) {
        subsidyService.requireRouteLinked(currentUser, routeId);
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

    private StopSummary toStopSummary(Stop stop, Set<Integer> linkedRouteIds) {
        List<RouteReference> routes = routeStopRepository.findAllByStopId(stop.getId()).stream()
                .filter(routeStop -> routeStop.getRoute().getStatus() == RouteStatus.ACTIVE)
                .filter(routeStop -> linkedRouteIds.contains(routeStop.getRoute().getId()))
                .map(routeStop -> new RouteReference(
                        routeStop.getRoute().getId(), routeStop.getRoute().getRouteName()))
                .distinct()
                .toList();
        return new StopSummary(
                stop.getId(),
                stop.getStopName(),
                stop.getAddress(),
                stop.getLongitude(),
                stop.getLatitude(),
                routes);
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
