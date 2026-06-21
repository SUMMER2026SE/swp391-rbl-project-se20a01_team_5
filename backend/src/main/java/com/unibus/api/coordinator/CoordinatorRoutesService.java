package com.unibus.api.coordinator;

import java.time.OffsetDateTime;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.unibus.api.common.ApiException;
import com.unibus.api.coordinator.dto.CoordinatorRoutesDtos.AddStopRequest;
import com.unibus.api.coordinator.dto.CoordinatorRoutesDtos.CreateRouteRequest;
import com.unibus.api.coordinator.dto.CoordinatorRoutesDtos.RouteListItem;
import com.unibus.api.coordinator.dto.CoordinatorRoutesDtos.RouteStopDto;
import com.unibus.api.coordinator.dto.CoordinatorRoutesDtos.UpdateRouteRequest;
import com.unibus.api.coordinator.dto.CoordinatorRoutesDtos.UpdateStopRequest;
import com.unibus.api.transport.BusRouteRepository;
import com.unibus.api.transport.RouteStopRepository;
import com.unibus.api.transport.StopRepository;
import com.unibus.api.transport.model.BusRoute;
import com.unibus.api.transport.model.RouteStatus;
import com.unibus.api.transport.model.RouteStop;
import com.unibus.api.transport.model.Stop;

import jakarta.persistence.EntityManager;

@Service
public class CoordinatorRoutesService {

    private final BusRouteRepository routeRepository;
    private final StopRepository stopRepository;
    private final RouteStopRepository routeStopRepository;
    private final EntityManager entityManager;

    public CoordinatorRoutesService(
            BusRouteRepository routeRepository,
            StopRepository stopRepository,
            RouteStopRepository routeStopRepository,
            EntityManager entityManager) {
        this.routeRepository = routeRepository;
        this.stopRepository = stopRepository;
        this.routeStopRepository = routeStopRepository;
        this.entityManager = entityManager;
    }

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

    @Transactional
    public RouteListItem updateRoute(Integer routeId, UpdateRouteRequest request) {
        BusRoute route = routeRepository.findById(routeId).orElseThrow();
        if (request.routeName() != null) {
            route.setRouteName(request.routeName());
        }
        if (request.description() != null) {
            route.setDescription(request.description());
        }
        if (request.estimatedMinutes() != null) {
            route.setEstimatedMinutes(request.estimatedMinutes());
        }
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

        if (request.stopName() != null && !request.stopName().isBlank()) {
            Stop stop = rs.getStop();
            stop.setStopName(request.stopName());
            stopRepository.save(stop);
        }

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

    private static final List<String> TABLES_TO_CHECK = List.of(
            "bus_schedules",
            "trips",
            "route_registrations",
            "monthly_passes",
            "single_trip_tickets",
            "fares",
            "route_universities",
            "daily_statistics"
    );

    private boolean tableExists(String tableName) {
        try {
            String sql = "SELECT COUNT(*) FROM information_schema.tables WHERE LOWER(table_name) = LOWER(:tableName)";
            Number count = (Number) entityManager.createNativeQuery(sql)
                    .setParameter("tableName", tableName)
                    .getSingleResult();
            return count != null && count.intValue() > 0;
        } catch (Exception e) {
            return true;
        }
    }

    private boolean tableHasRouteAssociation(String tableName, Integer routeId) {
        if (!tableExists(tableName)) {
            return false;
        }
        try {
            String sql = "SELECT COUNT(*) FROM " + tableName + " WHERE route_id = :routeId";
            Number count = (Number) entityManager.createNativeQuery(sql)
                    .setParameter("routeId", routeId)
                    .getSingleResult();
            return count != null && count.longValue() > 0;
        } catch (Exception e) {
            return false;
        }
    }

    @Transactional
    public void deleteRoute(Integer routeId) {
        BusRoute route = routeRepository.findById(routeId).orElseThrow();
        
        for (String tableName : TABLES_TO_CHECK) {
            if (tableHasRouteAssociation(tableName, routeId)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Không thể xóa tuyến đường này vì đã có lịch trình, chuyến xe hoặc dữ liệu vé liên quan.");
            }
        }
        
        List<RouteStop> routeStops = routeStopRepository.findAllByRouteIdOrderByStopOrder(routeId);
        routeStopRepository.deleteAll(routeStops);
        routeRepository.delete(route);
    }
}

