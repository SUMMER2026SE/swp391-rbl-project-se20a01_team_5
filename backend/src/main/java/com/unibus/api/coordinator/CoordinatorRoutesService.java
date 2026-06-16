package com.unibus.api.coordinator;

import java.time.OffsetDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.unibus.api.coordinator.dto.CoordinatorRoutesDtos.AddStopRequest;
import com.unibus.api.coordinator.dto.CoordinatorRoutesDtos.CreateRouteRequest;
import com.unibus.api.coordinator.dto.CoordinatorRoutesDtos.RouteListItem;
import com.unibus.api.coordinator.dto.CoordinatorRoutesDtos.RouteStopDto;
import com.unibus.api.coordinator.dto.CoordinatorRoutesDtos.UpdateStopRequest;
import com.unibus.api.transport.BusRouteRepository;
import com.unibus.api.transport.RouteStopRepository;
import com.unibus.api.transport.StopRepository;
import com.unibus.api.transport.model.BusRoute;
import com.unibus.api.transport.model.RouteStatus;
import com.unibus.api.transport.model.RouteStop;
import com.unibus.api.transport.model.Stop;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CoordinatorRoutesService {

    private final BusRouteRepository routeRepository;
    private final StopRepository stopRepository;
    private final RouteStopRepository routeStopRepository;

    @Transactional(readOnly = true)
    public List<RouteListItem> getRoutes() {
        return routeRepository.findAll().stream()
                .map(r -> new RouteListItem(
                        r.getId(),
                        r.getRouteName(),
                        r.getDescription(),
                        r.getEstimatedMinutes(),
                        r.getStatus().name()
                )).toList();
    }

    @Transactional
    public RouteListItem createRoute(CreateRouteRequest request) {
        BusRoute route = new BusRoute();
        route.setRouteName(request.routeName());
        route.setDescription(request.description());
        route.setEstimatedMinutes(request.estimatedMinutes());
        route.setCircular(false);
        route.setStatus(RouteStatus.ACTIVE);
        route.setCreatedAt(OffsetDateTime.now());

        BusRoute saved = routeRepository.save(route);
        return new RouteListItem(
                saved.getId(),
                saved.getRouteName(),
                saved.getDescription(),
                saved.getEstimatedMinutes(),
                saved.getStatus().name());
    }

    @Transactional(readOnly = true)
    public List<RouteStopDto> getRouteStops(Integer routeId) {
        return routeStopRepository.findAllByRouteIdOrderByStopOrder(routeId)
                .stream()
                .map(rs -> new RouteStopDto(
                        rs.getId(),
                        rs.getStop().getId(),
                        rs.getStop().getStopName(),
                        rs.getStopOrder(),
                        rs.getMinutesFromPreviousStop()
                )).toList();
    }

    @Transactional
    public RouteStopDto addStop(Integer routeId, AddStopRequest request) {
        BusRoute route = routeRepository.findById(routeId).orElseThrow();
        Stop stop;
        if (request.stopId() != null) {
            stop = stopRepository.findById(request.stopId()).orElseThrow();
        } else {
            stop = new Stop();
            stop.setStopName(request.stopName());
            stop.setAddress(request.address());
            stop.setLongitude(request.longitude());
            stop.setLatitude(request.latitude());
            stop.setStatus(RouteStatus.ACTIVE);
            stop.setCreatedAt(OffsetDateTime.now());
            stop = stopRepository.save(stop);
        }

        RouteStop rs = new RouteStop();
        rs.setRoute(route);
        rs.setStop(stop);
        rs.setStopOrder(request.stopOrder());
        rs.setMinutesFromPreviousStop(request.minutesFromPreviousStop());
        rs = routeStopRepository.save(rs);

        return new RouteStopDto(
                rs.getId(),
                rs.getStop().getId(),
                rs.getStop().getStopName(),
                rs.getStopOrder(),
                rs.getMinutesFromPreviousStop());
    }

    @Transactional
    public RouteStopDto updateStop(Integer routeId, UpdateStopRequest request) {
        RouteStop rs = routeStopRepository.findById(request.id()).orElseThrow();
        rs.setStopOrder(request.stopOrder());
        rs.setMinutesFromPreviousStop(request.minutesFromPreviousStop());
        rs = routeStopRepository.save(rs);
        return new RouteStopDto(
                rs.getId(),
                rs.getStop().getId(),
                rs.getStop().getStopName(),
                rs.getStopOrder(),
                rs.getMinutesFromPreviousStop());
    }

    @Transactional
    public void deleteStop(Integer routeId, Integer routeStopId) {
        routeStopRepository.deleteById(routeStopId);
    }
}
