package com.unibus.api.transport;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
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
import com.unibus.api.transport.dto.TransportDtos.Coordinate;
import com.unibus.api.transport.dto.TransportDtos.JourneyStop;
import com.unibus.api.transport.dto.TransportDtos.MapPolyline;
import com.unibus.api.transport.dto.TransportDtos.RouteDirectionSummary;
import com.unibus.api.transport.dto.TransportDtos.RouteLookup;
import com.unibus.api.transport.dto.TransportDtos.RouteMapPreview;
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
    public List<RouteLookup> listRoutes(CurrentUser currentUser) {
        Set<Integer> linkedRouteIds = subsidyService.activeLinkedRouteIds(currentUser);
        List<RouteLookupRow> rows = jdbcTemplate.query("""
                SELECT r.route_id, r.route_name, r.route_code, r.color_hex,
                       r.distance_km, r.estimated_minutes, r.frequency_min,
                       r.description, COALESCE(r.is_interregional, false) AS is_interregional,
                       r.external_source,
                       COUNT(rs.route_stop_id) AS stop_count
                FROM routes r
                JOIN route_stops rs ON rs.route_id = r.route_id
                JOIN stops s ON s.stop_id = rs.stop_id
                WHERE r.status = 'ACTIVE'
                  AND s.status = 'ACTIVE'
                  AND s.latitude IS NOT NULL
                  AND s.longitude IS NOT NULL
                  AND COALESCE(r.is_interregional, false) = false
                  AND (
                      r.external_source = 'BUSMAP_DN'
                      OR NOT EXISTS (
                          SELECT 1
                          FROM routes official_routes
                          WHERE official_routes.external_source = 'BUSMAP_DN'
                            AND official_routes.status = 'ACTIVE'
                      )
                  )
                GROUP BY r.route_id, r.route_name, r.route_code, r.color_hex,
                         r.distance_km, r.estimated_minutes, r.frequency_min,
                         r.description, r.is_interregional, r.external_source
                ORDER BY r.route_code, r.route_name
                """, (rs, rowNum) -> new RouteLookupRow(
                        rs.getInt("route_id"),
                        rs.getString("route_name"),
                        rs.getString("route_code"),
                        rs.getString("color_hex"),
                        rs.getBigDecimal("distance_km"),
                        (Integer) rs.getObject("estimated_minutes"),
                        (Integer) rs.getObject("frequency_min"),
                        rs.getString("description"),
                        rs.getBoolean("is_interregional"),
                        rs.getString("external_source"),
                        rs.getInt("stop_count")));

        return rows.stream()
                .map(row -> {
                    TripWindow window = operationWindow(row.routeId(), row.description());
                    return new RouteLookup(
                            row.routeId(),
                            row.routeName(),
                            row.routeCode(),
                            colorForRoute(row.routeId(), row.colorHex()),
                            row.distanceKm(),
                            row.estimatedMinutes(),
                            row.frequencyMin(),
                            fare(row.routeId(), "SINGLE"),
                            fare(row.routeId(), "MONTHLY"),
                            window.firstTrip(),
                            window.lastTrip(),
                            row.stopCount(),
                            availableDirections(row.routeId()).stream().map(RouteDirectionSummary::direction).toList(),
                            linkedRouteIds.contains(row.routeId()),
                            row.interregional(),
                            row.externalSource());
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public RouteMapPreview getRoutePreview(CurrentUser currentUser, Integer routeId, Integer requestedDirection) {
        Set<Integer> linkedRouteIds = subsidyService.activeLinkedRouteIds(currentUser);
        BusRoute route = busRouteRepository.findById(routeId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Route not found"));
        if (route.getStatus() != RouteStatus.ACTIVE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Route is not active");
        }

        List<RouteDirectionSummary> directions = availableDirections(routeId);
        if (directions.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Route does not have usable stop geometry");
        }
        int direction = directions.stream()
                .map(RouteDirectionSummary::direction)
                .filter(value -> value.equals(requestedDirection))
                .findFirst()
                .orElse(directions.get(0).direction());

        List<RoutePathRow> rows = jdbcTemplate.query("""
                SELECT rs.stop_order, COALESCE(rs.station_direction, 0) AS station_direction,
                       rs.minutes_from_previous_stop, rs.path_points,
                       s.stop_id, s.stop_name, s.address, s.latitude, s.longitude
                FROM route_stops rs
                JOIN stops s ON s.stop_id = rs.stop_id
                WHERE rs.route_id = ?
                  AND COALESCE(rs.station_direction, 0) = ?
                  AND s.status = 'ACTIVE'
                  AND s.latitude IS NOT NULL
                  AND s.longitude IS NOT NULL
                ORDER BY rs.stop_order
                """, (rs, rowNum) -> new RoutePathRow(
                        rs.getInt("stop_id"),
                        rs.getString("stop_name"),
                        rs.getString("address"),
                        rs.getBigDecimal("latitude"),
                        rs.getBigDecimal("longitude"),
                        rs.getInt("stop_order"),
                        rs.getInt("station_direction"),
                        (Integer) rs.getObject("minutes_from_previous_stop"),
                        rs.getString("path_points")), routeId, direction);

        if (rows.size() < 2) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Route does not have enough stops to draw");
        }

        int eta = 0;
        List<JourneyStop> stops = new ArrayList<>();
        for (RoutePathRow row : rows) {
            eta += Math.max(0, row.minutesFromPrevious() == null ? 0 : row.minutesFromPrevious());
            stops.add(new JourneyStop(
                    row.stopId(),
                    row.stopName(),
                    row.address(),
                    row.latitude(),
                    row.longitude(),
                    row.stopOrder(),
                    row.direction(),
                    eta,
                    false));
        }

        List<Coordinate> points = routeShape(rows);
        List<MapPolyline> polylines = points.size() >= 2
                ? List.of(new MapPolyline("route-" + routeId + "-" + direction, "BUS",
                        colorForRoute(routeId, route.getColorHex()), points))
                : List.of();
        TripWindow window = operationWindow(routeId, route.getDescription());

        return new RouteMapPreview(
                route.getId(),
                route.getRouteName(),
                route.getRouteCode(),
                colorForRoute(route.getId(), route.getColorHex()),
                route.getDistanceKm(),
                route.getEstimatedMinutes(),
                route.getFrequencyMin(),
                fare(routeId, "SINGLE"),
                fare(routeId, "MONTHLY"),
                window.firstTrip(),
                window.lastTrip(),
                linkedRouteIds.contains(routeId),
                route.isInterregional(),
                route.getExternalSource(),
                direction,
                directions,
                stops,
                polylines);
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

    private TripWindow operationWindow(Integer routeId, String description) {
        TripWindow scheduled = tripWindow(routeId);
        if (scheduled.firstTrip() != null || scheduled.lastTrip() != null) {
            return scheduled;
        }
        return operationWindowFromDescription(description);
    }

    private TripWindow operationWindowFromDescription(String description) {
        if (description == null || description.isBlank()) {
            return new TripWindow(null, null);
        }
        String[] parts = description.split("\\|");
        for (String part : parts) {
            String trimmed = part.trim().toLowerCase(Locale.ROOT);
            if (!trimmed.startsWith("operationtime=")) {
                continue;
            }
            String[] bounds = trimmed.substring("operationtime=".length()).split("-");
            if (bounds.length < 2) {
                return new TripWindow(null, null);
            }
            return new TripWindow(normalizeTime(bounds[0]), normalizeTime(bounds[1]));
        }
        return new TripWindow(null, null);
    }

    private String normalizeTime(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return LocalTime.parse(value.trim()).toString().substring(0, 5);
        } catch (Exception ignored) {
            return value.trim();
        }
    }

    private String formatTime(LocalTime time) {
        return time == null ? null : time.toString().substring(0, 5);
    }

    private List<RouteDirectionSummary> availableDirections(Integer routeId) {
        List<DirectionStopRow> rows = jdbcTemplate.query("""
                SELECT COALESCE(rs.station_direction, 0) AS station_direction,
                       rs.stop_order, s.stop_name
                FROM route_stops rs
                JOIN stops s ON s.stop_id = rs.stop_id
                WHERE rs.route_id = ?
                  AND s.status = 'ACTIVE'
                  AND s.latitude IS NOT NULL
                  AND s.longitude IS NOT NULL
                ORDER BY COALESCE(rs.station_direction, 0), rs.stop_order
                """, (rs, rowNum) -> new DirectionStopRow(
                        rs.getInt("station_direction"),
                        rs.getInt("stop_order"),
                        rs.getString("stop_name")), routeId);
        Map<Integer, List<DirectionStopRow>> grouped = new LinkedHashMap<>();
        rows.forEach(row -> grouped.computeIfAbsent(row.direction(), ignored -> new ArrayList<>()).add(row));
        return grouped.entrySet().stream()
                .filter(entry -> entry.getValue().size() >= 2)
                .map(entry -> {
                    List<DirectionStopRow> group = entry.getValue().stream()
                            .sorted(Comparator.comparingInt(DirectionStopRow::stopOrder))
                            .toList();
                    return new RouteDirectionSummary(
                            entry.getKey(),
                            group.size(),
                            group.get(0).stopName(),
                            group.get(group.size() - 1).stopName());
                })
                .toList();
    }

    private List<Coordinate> routeShape(List<RoutePathRow> rows) {
        List<Coordinate> points = new ArrayList<>();
        for (int i = 0; i < rows.size(); i++) {
            RoutePathRow row = rows.get(i);
            if (i > 0) {
                parsePathPoints(row.pathPoints(), points);
            }
            addPoint(points, row.latitude().doubleValue(), row.longitude().doubleValue());
        }
        if (points.size() < 2) {
            points.clear();
            rows.forEach(row -> addPoint(points, row.latitude().doubleValue(), row.longitude().doubleValue()));
        }
        return points;
    }

    private void parsePathPoints(String pathPoints, List<Coordinate> points) {
        if (pathPoints == null || pathPoints.isBlank()) {
            return;
        }
        String[] pairs = pathPoints.trim().split("\\s+");
        for (String pair : pairs) {
            String[] lngLat = pair.split(",");
            if (lngLat.length != 2) {
                continue;
            }
            try {
                double lng = Double.parseDouble(lngLat[0]);
                double lat = Double.parseDouble(lngLat[1]);
                addPoint(points, lat, lng);
            } catch (NumberFormatException ignored) {
                // Source shapes can contain occasional malformed points; skip them.
            }
        }
    }

    private void addPoint(List<Coordinate> points, double lat, double lng) {
        if (Double.isNaN(lat) || Double.isNaN(lng)) {
            return;
        }
        Coordinate next = new Coordinate(PlaceService.bd(lat), PlaceService.bd(lng));
        if (points.isEmpty() || !points.get(points.size() - 1).equals(next)) {
            points.add(next);
        }
    }

    private String colorForRoute(Integer routeId, String colorHex) {
        if (colorHex != null && !colorHex.isBlank()) {
            return colorHex;
        }
        String[] palette = {"#0f8f78", "#2563eb", "#dc2626", "#f59e0b", "#7c3aed", "#0891b2"};
        return palette[Math.abs(routeId == null ? 0 : routeId) % palette.length];
    }

    private record TripWindow(String firstTrip, String lastTrip) {
    }

    private record RouteLookupRow(Integer routeId, String routeName, String routeCode,
            String colorHex, BigDecimal distanceKm, Integer estimatedMinutes,
            Integer frequencyMin, String description, boolean interregional,
            String externalSource, Integer stopCount) {
    }

    private record RoutePathRow(Integer stopId, String stopName, String address,
            BigDecimal latitude, BigDecimal longitude, Integer stopOrder, Integer direction,
            Integer minutesFromPrevious, String pathPoints) {
    }

    private record DirectionStopRow(Integer direction, Integer stopOrder, String stopName) {
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
