package com.unibus.api.transport;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.unibus.api.transport.dto.TransportDtos.Coordinate;
import com.unibus.api.transport.dto.TransportDtos.VehicleSnapshot;

@Service
public class VehicleSimulationService {
    public VehicleSnapshot simulate(TripSimulation trip, RouteSimulation route,
            List<Coordinate> shape, List<SimulationStop> stops, OffsetDateTime now) {
        double progress = progress(trip, now);
        Coordinate position = interpolate(shape, progress);
        SimulationStop nextStop = nextStop(stops, progress);
        int seed = Math.abs(trip.tripId() * 31 + (int) (trip.startedAt().toEpochSecond() % 100000));
        int distanceMeters = position == null || nextStop == null ? 0 : distanceMeters(position, nextStop);
        double segmentPosition = stops.size() <= 1 ? 0 : progress * (stops.size() - 1);
        double speedKmh = speed(seed, segmentPosition - Math.floor(segmentPosition), distanceMeters, now, progress);
        return new VehicleSnapshot("trip:" + trip.tripId(), trip.plateNumber(), route.routeId(), route.routeCode(),
                position == null ? null : position.latitude(), position == null ? null : position.longitude(),
                BigDecimal.valueOf(speedKmh).setScale(1, RoundingMode.HALF_UP), null, 45,
                nextStop == null ? null : nextStop.stopId(), nextStop == null ? null : nextStop.stopName(),
                nextStop == null ? null : etaMinutes(distanceMeters, speedKmh), distanceMeters,
                trip.tripId(), trip.driverName(), true);
    }

    private double progress(TripSimulation trip, OffsetDateTime now) {
        if (now.isBefore(trip.startedAt())) return 0;
        if (!now.isBefore(trip.endsAt())) return 1;
        long total = Math.max(1, Duration.between(trip.startedAt(), trip.endsAt()).toSeconds());
        return Math.max(0, Math.min(1, Duration.between(trip.startedAt(), now).toSeconds() / (double) total));
    }

    private Coordinate interpolate(List<Coordinate> points, double progress) {
        if (points == null || points.isEmpty()) return null;
        if (points.size() == 1 || progress >= 1) return points.get(points.size() - 1);
        double target = Math.max(0, progress) * (points.size() - 1);
        int left = Math.min(points.size() - 2, (int) Math.floor(target));
        double ratio = target - left;
        Coordinate a = points.get(left);
        Coordinate b = points.get(left + 1);
        return new Coordinate(decimal(mix(a.latitude(), b.latitude(), ratio)), decimal(mix(a.longitude(), b.longitude(), ratio)));
    }

    private SimulationStop nextStop(List<SimulationStop> stops, double progress) {
        if (stops == null || stops.isEmpty()) return null;
        int index = Math.min(stops.size() - 1, Math.max(0, (int) Math.ceil(progress * (stops.size() - 1))));
        return stops.get(index);
    }

    private double speed(int seed, double segmentRatio, int distanceMeters, OffsetDateTime now, double progress) {
        if (progress >= 1 || distanceMeters <= 18) return 0;
        int secondOfDay = now.getHour() * 3600 + now.getMinute() * 60 + now.getSecond();
        double cruise = 35 + Math.abs(seed % 16);
        double value = Math.max(35, Math.min(50, cruise + Math.sin((seed % 360) * Math.PI / 180.0) * 2
                + Math.sin((secondOfDay + seed * 13) / 5.0) * 3.5 + Math.sin((secondOfDay + seed * 7) / 2.3) * 1.2));
        if (distanceMeters <= 250) return Math.max(4, value * distanceMeters / 250.0);
        if (segmentRatio < 0.08) return Math.max(8, value * segmentRatio / 0.08);
        return value;
    }

    private int etaMinutes(int distanceMeters, double speedKmh) {
        if (distanceMeters <= 0 || speedKmh <= 0) return 0;
        return Math.max(1, (int) Math.ceil(distanceMeters / (speedKmh * 1000 / 60.0)));
    }

    private int distanceMeters(Coordinate from, SimulationStop to) {
        double lat1 = Math.toRadians(from.latitude().doubleValue());
        double lat2 = Math.toRadians(to.latitude().doubleValue());
        double dLat = lat2 - lat1;
        double dLng = Math.toRadians(to.longitude().doubleValue() - from.longitude().doubleValue());
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return (int) Math.round(6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    }

    private double mix(BigDecimal a, BigDecimal b, double ratio) {
        double left = a == null ? 0 : a.doubleValue();
        return left + ((b == null ? left : b.doubleValue()) - left) * ratio;
    }

    private BigDecimal decimal(double value) { return BigDecimal.valueOf(value).setScale(8, RoundingMode.HALF_UP); }

    public record TripSimulation(Integer tripId, String plateNumber, String driverName, OffsetDateTime startedAt, OffsetDateTime endsAt) {}
    public record RouteSimulation(Integer routeId, String routeCode) {}
    public record SimulationStop(Integer stopId, String stopName, BigDecimal latitude, BigDecimal longitude) {}
}
