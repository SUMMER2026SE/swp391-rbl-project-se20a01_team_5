package com.unibus.api.transport;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.unibus.api.transport.dto.TransportDtos.Coordinate;
import com.unibus.api.transport.dto.TransportDtos.JourneyLeg;
import com.unibus.api.transport.dto.TransportDtos.JourneyOption;
import com.unibus.api.transport.dto.TransportDtos.JourneyTrackingSnapshot;
import com.unibus.api.transport.dto.TransportDtos.MapPolyline;
import com.unibus.api.transport.dto.TransportDtos.StopEta;
import com.unibus.api.transport.dto.TransportDtos.TrackingStop;
import com.unibus.api.transport.dto.TransportDtos.VehicleSnapshot;

@Service
public class JourneyTrackingService {

    private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final JourneyPlannerService journeyPlannerService;
    private final JdbcTemplate jdbcTemplate;

    public JourneyTrackingService(JourneyPlannerService journeyPlannerService, JdbcTemplate jdbcTemplate) {
        this.journeyPlannerService = journeyPlannerService;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional(readOnly = true)
    public JourneyTrackingSnapshot snapshot(String journeyId) {
        JourneyOption option = journeyPlannerService.cachedOption(journeyId)
                .orElseThrow(() -> new com.unibus.api.common.ApiException(
                        org.springframework.http.HttpStatus.NOT_FOUND,
                        "Journey preview expired. Please search again."));
        OffsetDateTime now = OffsetDateTime.now(VIETNAM_ZONE);
        List<VehicleSnapshot> vehicles = new ArrayList<>();
        List<StopEta> stopEtas = new ArrayList<>();
        int index = 0;
        for (JourneyLeg leg : option.legs()) {
            if (!"BUS".equals(leg.mode())) {
                continue;
            }
            VehicleSnapshot vehicle = vehicleForLeg(leg, index++, now);
            vehicles.add(vehicle);
            leg.stops().stream()
                    .filter(stop -> stop.etaMinutes() != null)
                    .limit(8)
                    .forEach(stop -> stopEtas.add(new StopEta(
                            stop.stopId(),
                            stop.stopName(),
                            leg.routeId(),
                            leg.routeCode(),
                            now.plusMinutes(stop.etaMinutes()),
                            stop.etaMinutes())));
        }
        return new JourneyTrackingSnapshot(journeyId, now, vehicles, stopEtas, option.polylines());
    }

    @Transactional(readOnly = true)
    public JourneyTrackingSnapshot routeSnapshot(Integer routeId, Integer boardingStopId, Integer alightingStopId) {
        OffsetDateTime now = OffsetDateTime.now(VIETNAM_ZONE);
        RouteInfo route = routeInfo(routeId);
        List<RouteStopPoint> stops = routeStops(routeId, boardingStopId, alightingStopId);
        List<Coordinate> shape = routeShape(routeId, stops);
        List<MapPolyline> polylines = shape.size() >= 2
                ? List.of(new MapPolyline("route-" + routeId, "BUS", route.colorHex(), shape))
                : List.of();

        List<VehicleSnapshot> vehicles = liveVehicles(routeId, route);

        List<StopEta> stopEtas = new ArrayList<>();
        int eta = 0;
        for (int i = 0; i < Math.min(8, stops.size()); i++) {
            RouteStopPoint stop = stops.get(i);
            eta += i == 0 ? 0 : 4;
            stopEtas.add(new StopEta(
                    stop.stopId(),
                    stop.stopName(),
                    route.routeId(),
                    route.routeCode(),
                    now.plusMinutes(eta),
                    eta));
        }
        List<TrackingStop> trackingStops = stops.stream()
                .map(stop -> new TrackingStop(
                        stop.stopId(),
                        stop.stopName(),
                        stop.address(),
                        stop.latitude(),
                        stop.longitude(),
                        stop.stopOrder(),
                        boardingStopId != null && boardingStopId.equals(stop.stopId()),
                        alightingStopId != null && alightingStopId.equals(stop.stopId())))
                .toList();
        return new JourneyTrackingSnapshot("route-" + routeId, now, vehicles, stopEtas, polylines,
                route.routeId(), route.routeCode(), route.routeName(), boardingStopId, alightingStopId,
                trackingStops, false);
    }

    private VehicleSnapshot vehicleForLeg(JourneyLeg leg, int index, OffsetDateTime now) {
        List<Coordinate> shape = leg.shape() == null ? List.of() : leg.shape();
        Coordinate position = interpolate(shape, progressFor(leg, index, now));
        var nextStop = leg.stops().stream()
                .filter(stop -> stop.etaMinutes() != null && stop.etaMinutes() >= 0)
                .min(Comparator.comparingInt(stop -> stop.etaMinutes()))
                .orElse(null);
        int seed = Math.abs((leg.routeId() == null ? 0 : leg.routeId()) * 31 + index * 17);
        return new VehicleSnapshot(
                "sim-" + leg.routeId() + "-" + index,
                "43B-" + String.format("%05d", 12000 + seed % 70000),
                leg.routeId(),
                leg.routeCode(),
                position == null ? null : position.latitude(),
                position == null ? null : position.longitude(),
                BigDecimal.valueOf(28 + seed % 18),
                12 + seed % 31,
                45,
                nextStop == null ? leg.toStopId() : nextStop.stopId(),
                nextStop == null ? leg.toStopName() : nextStop.stopName(),
                nextStop == null ? leg.waitMinutes() : nextStop.etaMinutes(),
                null);
    }

    private List<VehicleSnapshot> liveVehicles(Integer routeId, RouteInfo route) {
        return jdbcTemplate.query("""
                SELECT t.trip_id, b.license_plate, vl.latitude, vl.longitude, vl.speed_kmh, vl.occupancy
                FROM trips t
                JOIN buses b ON b.bus_id = t.bus_id
                JOIN vehicle_locations vl ON vl.vehicle_location_id = (
                    SELECT latest.vehicle_location_id
                    FROM vehicle_locations latest
                    WHERE latest.trip_id = t.trip_id
                    ORDER BY latest.updated_at DESC, latest.vehicle_location_id DESC
                    LIMIT 1
                )
                WHERE t.route_id = ?
                  AND t.service_date = CURRENT_DATE
                  AND t.status = 'RUNNING'
                  AND vl.updated_at >= ?
                ORDER BY t.trip_id
                """, (rs, rowNum) -> new VehicleSnapshot(
                "trip-" + rs.getInt("trip_id"),
                rs.getString("license_plate"),
                route.routeId(),
                route.routeCode(),
                rs.getBigDecimal("latitude"),
                rs.getBigDecimal("longitude"),
                rs.getBigDecimal("speed_kmh"),
                (Integer) rs.getObject("occupancy"),
                45,
                null,
                null,
                null,
                null), routeId, OffsetDateTime.now(VIETNAM_ZONE).minusMinutes(5));
    }
    private RouteInfo routeInfo(Integer routeId) {
        List<RouteInfo> rows = jdbcTemplate.query("""
                SELECT route_id, route_code, route_name, color_hex
                FROM routes
                WHERE route_id = ? AND status = 'ACTIVE'
                """, (rs, rowNum) -> new RouteInfo(
                rs.getInt("route_id"),
                rs.getString("route_code"),
                rs.getString("route_name"),
                rs.getString("color_hex")), routeId);
        if (rows.isEmpty()) {
            throw new com.unibus.api.common.ApiException(org.springframework.http.HttpStatus.NOT_FOUND, "Route not found");
        }
        return rows.get(0);
    }

    private List<RouteStopPoint> routeStops(Integer routeId, Integer boardingStopId, Integer alightingStopId) {
        List<RouteStopPoint> all = jdbcTemplate.query("""
                SELECT s.stop_id, s.stop_name, s.address, s.latitude, s.longitude,
                       rs.stop_order, COALESCE(rs.station_direction, 0) AS station_direction
                FROM route_stops rs
                JOIN stops s ON s.stop_id = rs.stop_id
                WHERE rs.route_id = ?
                  AND s.status = 'ACTIVE'
                  AND s.latitude IS NOT NULL
                  AND s.longitude IS NOT NULL
                ORDER BY COALESCE(rs.station_direction, 0), rs.stop_order
                """, (rs, rowNum) -> new RouteStopPoint(
                rs.getInt("stop_id"),
                rs.getString("stop_name"),
                rs.getString("address"),
                rs.getBigDecimal("latitude"),
                rs.getBigDecimal("longitude"),
                rs.getInt("stop_order"),
                rs.getInt("station_direction")), routeId);
        if (all.size() < 2 || boardingStopId == null || alightingStopId == null) {
            return all;
        }
        Optional<RouteStopPoint> boarding = all.stream().filter(stop -> stop.stopId().equals(boardingStopId)).findFirst();
        Optional<RouteStopPoint> alighting = all.stream().filter(stop -> stop.stopId().equals(alightingStopId)).findFirst();
        if (boarding.isEmpty() || alighting.isEmpty()) {
            return all;
        }
        RouteStopPoint from = boarding.get();
        RouteStopPoint to = alighting.get();
        if (from.direction() != to.direction() || from.stopOrder() >= to.stopOrder()) {
            return all.stream().filter(stop -> stop.direction() == from.direction()).toList();
        }
        List<RouteStopPoint> segment = all.stream()
                .filter(stop -> stop.direction() == from.direction())
                .filter(stop -> stop.stopOrder() >= from.stopOrder() && stop.stopOrder() <= to.stopOrder())
                .toList();
        return segment.size() >= 2 ? segment : all;
    }

    private List<Coordinate> routeShape(Integer routeId, List<RouteStopPoint> stops) {
        if (stops.isEmpty()) {
            return List.of();
        }
        int direction = stops.get(0).direction();
        int minOrder = stops.stream().map(RouteStopPoint::stopOrder).min(Integer::compareTo).orElse(0);
        int maxOrder = stops.stream().map(RouteStopPoint::stopOrder).max(Integer::compareTo).orElse(0);
        List<RoutePathRow> rows = jdbcTemplate.query("""
                SELECT rs.stop_order, rs.path_points, s.latitude, s.longitude
                FROM route_stops rs
                JOIN stops s ON s.stop_id = rs.stop_id
                WHERE rs.route_id = ?
                  AND COALESCE(rs.station_direction, 0) = ?
                  AND rs.stop_order BETWEEN ? AND ?
                  AND s.status = 'ACTIVE'
                  AND s.latitude IS NOT NULL
                  AND s.longitude IS NOT NULL
                ORDER BY rs.stop_order
                """, (rs, rowNum) -> new RoutePathRow(
                        rs.getInt("stop_order"),
                        rs.getString("path_points"),
                        rs.getBigDecimal("latitude"),
                        rs.getBigDecimal("longitude")), routeId, direction, minOrder, maxOrder);
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
            stops.forEach(stop -> addPoint(points, stop.latitude().doubleValue(), stop.longitude().doubleValue()));
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
                // Skip malformed imported path points.
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

    private double progressFor(JourneyLeg leg, int index, OffsetDateTime now) {
        int duration = Math.max(1, leg.durationMinutes() == null ? 20 : leg.durationMinutes());
        int cycleSeconds = (duration + Math.max(5, leg.waitMinutes() == null ? 10 : leg.waitMinutes())) * 60;
        int secondOfDay = now.getHour() * 3600 + now.getMinute() * 60 + now.getSecond();
        return ((secondOfDay + index * 420) % cycleSeconds) / (double) cycleSeconds;
    }

    private Coordinate interpolate(List<Coordinate> points, double progress) {
        if (points == null || points.isEmpty()) {
            return null;
        }
        if (points.size() == 1) {
            return points.get(0);
        }
        double clamped = Math.max(0, Math.min(1, progress));
        double target = clamped * (points.size() - 1);
        int left = Math.min(points.size() - 2, (int) Math.floor(target));
        double ratio = target - left;
        Coordinate a = points.get(left);
        Coordinate b = points.get(left + 1);
        double lat = mix(a.latitude(), b.latitude(), ratio);
        double lng = mix(a.longitude(), b.longitude(), ratio);
        return new Coordinate(
                BigDecimal.valueOf(lat).setScale(8, RoundingMode.HALF_UP),
                BigDecimal.valueOf(lng).setScale(8, RoundingMode.HALF_UP));
    }

    private double mix(BigDecimal a, BigDecimal b, double ratio) {
        double left = a == null ? 0 : a.doubleValue();
        double right = b == null ? left : b.doubleValue();
        return left + (right - left) * ratio;
    }


    private record RoutePathRow(Integer stopOrder, String pathPoints, BigDecimal latitude, BigDecimal longitude) {}

    private record RouteInfo(Integer routeId, String routeCode, String routeName, String colorHex) {
    }

    private record RouteStopPoint(Integer stopId, String stopName, String address, BigDecimal latitude, BigDecimal longitude,
            Integer stopOrder, Integer direction) {
    }
}
