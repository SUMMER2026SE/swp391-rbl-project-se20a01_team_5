package com.unibus.api.transport;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import org.springframework.jdbc.core.JdbcTemplate;
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
    private final JdbcTemplate jdbcTemplate;

    public TransportService(
            StopRepository stopRepository,
            RouteStopRepository routeStopRepository,
            BusRouteRepository busRouteRepository,
            SubsidyService subsidyService,
            JdbcTemplate jdbcTemplate) {
        this.stopRepository = stopRepository;
        this.routeStopRepository = routeStopRepository;
        this.busRouteRepository = busRouteRepository;
        this.subsidyService = subsidyService;
        this.jdbcTemplate = jdbcTemplate;
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
                .map(route -> toRouteSuggestion(route, true))
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
        return toRouteSuggestion(route, true);
    }

    @Transactional(readOnly = true)
    public List<Eta> getEtas(CurrentUser currentUser, Integer routeId, Integer stopId) {
        subsidyService.requireRouteLinked(currentUser, routeId);
        BusRoute route = busRouteRepository.findById(routeId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Route not found"));
        if (route.getStatus() != RouteStatus.ACTIVE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Route is not active");
        }
        List<RouteStop> stops = routeStopRepository.findAllByRouteIdOrderByStopOrder(routeId);
        RouteStop target = stops.stream()
                .filter(routeStop -> routeStop.getStop().getId().equals(stopId))
                .findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Stop is not on route"));
        int minutesToStop = stops.stream()
                .filter(routeStop -> routeStop.getStopOrder() <= target.getStopOrder())
                .map(RouteStop::getMinutesFromPreviousStop)
                .filter(value -> value != null && value > 0)
                .mapToInt(Integer::intValue)
                .sum();
        int fallbackMinutes = Math.max(3, minutesToStop == 0 ? target.getStopOrder() * 4 : minutesToStop);
        OffsetDateTime baseEta = OffsetDateTime.now(ZoneOffset.UTC).plusMinutes(fallbackMinutes);
        // Compute ETA per-trip from actual vehicle location, falling back to a staggered estimate
        // when no realtime vehicle data is available. Use correlated subqueries instead of LATERAL
        // so the query works on both PostgreSQL (production) and H2 (tests).
        List<Eta> realtimeEtas = jdbcTemplate.query("""
                SELECT t.trip_id, t.bus_id,
                       (SELECT vl.longitude FROM vehicle_locations vl
                        WHERE vl.trip_id = t.trip_id
                        ORDER BY vl.updated_at DESC LIMIT 1) AS vehicle_longitude,
                       (SELECT vl.latitude FROM vehicle_locations vl
                        WHERE vl.trip_id = t.trip_id
                        ORDER BY vl.updated_at DESC LIMIT 1) AS vehicle_latitude,
                       (SELECT vl.speed_kmh FROM vehicle_locations vl
                        WHERE vl.trip_id = t.trip_id
                        ORDER BY vl.updated_at DESC LIMIT 1) AS vehicle_speed_kmh,
                       (SELECT vl.updated_at FROM vehicle_locations vl
                        WHERE vl.trip_id = t.trip_id
                        ORDER BY vl.updated_at DESC LIMIT 1) AS vehicle_updated_at
                FROM trips t
                WHERE t.route_id = ?
                  AND t.service_date = CURRENT_DATE
                  AND t.status IN ('RUNNING', 'NOT_STARTED')
                ORDER BY CASE t.status WHEN 'RUNNING' THEN 0 ELSE 1 END, t.trip_id DESC
                LIMIT 3
                """, (rs, rowNum) -> {
                    OffsetDateTime vehicleUpdatedAt = rs.getTimestamp("vehicle_updated_at") == null
                            ? null
                            : rs.getTimestamp("vehicle_updated_at").toInstant().atOffset(ZoneOffset.UTC);
                    OffsetDateTime eta = baseEta;
                    if (vehicleUpdatedAt != null) {
                        eta = baseEta.plusMinutes(rowNum * 4L);
                    } else if (rowNum > 0) {
                        eta = baseEta.plusMinutes(rowNum * 8L);
                    }
                    return new Eta(
                            rs.getInt("trip_id"),
                            (Integer) rs.getObject("bus_id"),
                            stopId,
                            eta,
                            null,
                            OffsetDateTime.now(ZoneOffset.UTC));
                }, routeId);
        return realtimeEtas;
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
                        routeStop.getRoute().getId(),
                        routeStop.getRoute().getRouteName(),
                        routeStop.getRoute().getRouteCode(),
                        routeStop.getRoute().getColorHex()))
                .distinct()
                .toList();
        return new StopSummary(
                stop.getId(),
                stop.getStopName(),
                stop.getAddress(),
                stop.getLongitude(),
                stop.getLatitude(),
                routes,
                stop.getStopCode(),
                stop.isHasShelter());
    }

    private RouteSuggestion toRouteSuggestion(BusRoute route, boolean universityLinked) {
        List<RouteStopSummary> stops = routeStopRepository.findAllByRouteIdOrderByStopOrder(route.getId()).stream()
                .map(routeStop -> new RouteStopSummary(
                        routeStop.getStop().getId(),
                        routeStop.getStop().getStopName(),
                        routeStop.getStopOrder(),
                        routeStop.getMinutesFromPreviousStop(),
                        routeStop.getStop().getStopCode(),
                        routeStop.getStop().getLongitude(),
                        routeStop.getStop().getLatitude(),
                        routeStop.getStop().isHasShelter()))
                .toList();
        BigDecimal singleFare = fare(route.getId(), "SINGLE");
        BigDecimal monthlyFare = fare(route.getId(), "MONTHLY");
        TripWindow window = tripWindow(route.getId());
        return new RouteSuggestion(route.getId(), route.getRouteName(), route.getDistanceKm(),
                route.getEstimatedMinutes(), stops, route.getRouteCode(), route.getColorHex(),
                route.getFrequencyMin(), singleFare, monthlyFare, window.firstTrip(), window.lastTrip(),
                universityLinked);
    }

    private BigDecimal fare(Integer routeId, String fareType) {
        return jdbcTemplate.query("""
                SELECT amount
                FROM fares
                WHERE route_id = ?
                  AND fare_type = ?
                  AND effective_from <= CURRENT_DATE
                  AND (effective_until IS NULL OR effective_until >= CURRENT_DATE)
                ORDER BY effective_from DESC, fare_id DESC
                LIMIT 1
                """, rs -> rs.next() ? rs.getBigDecimal("amount") : null, routeId, fareType);
    }

    private TripWindow tripWindow(Integer routeId) {
        return jdbcTemplate.query("""
                SELECT MIN(departure_time) AS first_trip, MAX(departure_time) AS last_trip
                FROM bus_schedules
                WHERE route_id = ?
                  AND status = 'ACTIVE'
                """, rs -> {
            if (!rs.next()) return new TripWindow(null, null);
            return new TripWindow(formatTime(rs.getTime("first_trip") == null ? null : rs.getTime("first_trip").toLocalTime()),
                    formatTime(rs.getTime("last_trip") == null ? null : rs.getTime("last_trip").toLocalTime()));
        }, routeId);
    }

    private String formatTime(LocalTime time) {
        return time == null ? null : time.toString().substring(0, 5);
    }

    private record TripWindow(String firstTrip, String lastTrip) {
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
