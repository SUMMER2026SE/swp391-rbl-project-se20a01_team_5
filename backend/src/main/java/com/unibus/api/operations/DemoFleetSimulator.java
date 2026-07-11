package com.unibus.api.operations;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.unibus.api.realtime.RealtimePublisher;

@Component
@ConditionalOnProperty(name = "app.demo-fleet.enabled", havingValue = "true")
public class DemoFleetSimulator {

    private final JdbcTemplate jdbcTemplate;
    private final RealtimePublisher realtimePublisher;
    private final Map<Integer, List<RoutePoint>> routePoints = new HashMap<>();
    private long lastCleanupMinute = -1;

    public DemoFleetSimulator(JdbcTemplate jdbcTemplate, RealtimePublisher realtimePublisher) {
        this.jdbcTemplate = jdbcTemplate;
        this.realtimePublisher = realtimePublisher;
    }

    @Scheduled(fixedDelayString = "${app.demo-fleet.tick-ms:5000}")
    void tick() {
        List<DemoVehicle> vehicles = jdbcTemplate.query("""
                SELECT trip_id, route_id, bus_id
                FROM trips
                WHERE service_date = CURRENT_DATE
                  AND status = 'RUNNING'
                  AND (notes LIKE 'DEMO_DATA%' OR notes LIKE 'DEMO_FLEET%')
                ORDER BY trip_id
                """, (rs, rowNum) -> new DemoVehicle(
                rs.getInt("trip_id"),
                rs.getInt("route_id"),
                rs.getInt("bus_id")));
        if (vehicles.isEmpty()) {
            return;
        }

        long epochSecond = Instant.now().getEpochSecond();
        List<VehiclePosition> positions = new ArrayList<>();
        for (DemoVehicle vehicle : vehicles) {
            List<RoutePoint> points = routePoints.computeIfAbsent(vehicle.routeId(), this::loadRoutePoints);
            if (points.size() < 2) {
                continue;
            }
            long cycleSeconds = Math.max(1800, points.size() * 45L);
            double progress = Math.floorMod(epochSecond + vehicle.tripId() * 137L, cycleSeconds) / (double) cycleSeconds;
            RoutePoint point = pointAtProgress(points, progress);
            double speedKmh = 24 + Math.floorMod(vehicle.tripId(), 13);
            int occupancy = 8 + Math.floorMod(vehicle.tripId() * 3, 32);
            positions.add(new VehiclePosition(vehicle, point, speedKmh, occupancy));
            realtimePublisher.publishTripLocation(
                    vehicle.tripId(), vehicle.routeId(), point.longitude(), point.latitude(), speedKmh, occupancy);
        }

        if (!positions.isEmpty()) {
            persist(positions);
        }
        long currentMinute = epochSecond / 60;
        if (currentMinute != lastCleanupMinute) {
            jdbcTemplate.update("DELETE FROM vehicle_locations WHERE updated_at < NOW() - INTERVAL '24 hours'");
            lastCleanupMinute = currentMinute;
        }
    }

    private List<RoutePoint> loadRoutePoints(Integer routeId) {
        return jdbcTemplate.query("""
                SELECT s.longitude, s.latitude
                FROM route_stops rs
                JOIN stops s ON s.stop_id = rs.stop_id
                WHERE rs.route_id = ?
                  AND s.longitude IS NOT NULL
                  AND s.latitude IS NOT NULL
                ORDER BY rs.stop_order
                """, (rs, rowNum) -> new RoutePoint(
                rs.getDouble("longitude"),
                rs.getDouble("latitude")), routeId);
    }

    private void persist(List<VehiclePosition> positions) {
        jdbcTemplate.batchUpdate("DELETE FROM vehicle_locations WHERE trip_id = ?", positions, positions.size(),
                (statement, position) -> statement.setInt(1, position.vehicle().tripId()));
        jdbcTemplate.batchUpdate("""
                INSERT INTO vehicle_locations(bus_id, trip_id, longitude, latitude, speed_kmh, occupancy)
                VALUES (?, ?, ?, ?, ?, ?)
                """, positions, positions.size(), (statement, position) -> {
            statement.setInt(1, position.vehicle().busId());
            statement.setInt(2, position.vehicle().tripId());
            statement.setDouble(3, position.point().longitude());
            statement.setDouble(4, position.point().latitude());
            statement.setDouble(5, position.speedKmh());
            statement.setInt(6, position.occupancy());
        });
    }

    static RoutePoint pointAtProgress(List<RoutePoint> points, double progress) {
        double bounded = Math.max(0, Math.min(0.999999, progress));
        double position = bounded * (points.size() - 1);
        int index = (int) Math.floor(position);
        double ratio = position - index;
        RoutePoint start = points.get(index);
        RoutePoint end = points.get(index + 1);
        return new RoutePoint(
                start.longitude() + (end.longitude() - start.longitude()) * ratio,
                start.latitude() + (end.latitude() - start.latitude()) * ratio);
    }

    record RoutePoint(double longitude, double latitude) {
    }

    private record DemoVehicle(Integer tripId, Integer routeId, Integer busId) {
    }

    private record VehiclePosition(DemoVehicle vehicle, RoutePoint point, double speedKmh, int occupancy) {
    }
}
