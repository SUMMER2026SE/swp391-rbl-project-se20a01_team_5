package com.unibus.api.transport;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.unibus.api.transport.dto.TransportDtos.Coordinate;
import com.unibus.api.transport.dto.TransportDtos.JourneyLeg;
import com.unibus.api.transport.dto.TransportDtos.JourneyOption;
import com.unibus.api.transport.dto.TransportDtos.JourneyTrackingSnapshot;
import com.unibus.api.transport.dto.TransportDtos.MapPolyline;
import com.unibus.api.transport.dto.TransportDtos.StopEta;
import com.unibus.api.transport.dto.TransportDtos.VehicleSnapshot;

@Service
public class JourneyTrackingService {

    private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final JourneyPlannerService journeyPlannerService;

    public JourneyTrackingService(JourneyPlannerService journeyPlannerService) {
        this.journeyPlannerService = journeyPlannerService;
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
                nextStop == null ? leg.waitMinutes() : nextStop.etaMinutes());
    }

    private double progressFor(JourneyLeg leg, int index, OffsetDateTime now) {
        int duration = Math.max(1, leg.durationMinutes() == null ? 20 : leg.durationMinutes());
        int cycle = duration + Math.max(5, leg.waitMinutes() == null ? 10 : leg.waitMinutes());
        int minuteOfDay = now.getHour() * 60 + now.getMinute();
        return ((minuteOfDay + index * 7) % cycle) / (double) cycle;
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
}
