package com.unibus.api.transport;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.unibus.api.transport.VehicleSimulationService.RouteSimulation;
import com.unibus.api.transport.VehicleSimulationService.SimulationStop;
import com.unibus.api.transport.VehicleSimulationService.TripSimulation;
import com.unibus.api.transport.dto.TransportDtos.Coordinate;

class VehicleSimulationServiceTests {
    private final VehicleSimulationService service = new VehicleSimulationService();

    @Test
    void sameTripAndTimeProduceSameSnapshotAndTripStopsAtDestination() {
        OffsetDateTime start = OffsetDateTime.parse("2026-07-12T10:00:00+07:00");
        TripSimulation trip = new TripSimulation(42, "43B-00042", "Tài xế demo", start, start.plusMinutes(90));
        List<Coordinate> shape = List.of(
                new Coordinate(new BigDecimal("16.00000000"), new BigDecimal("108.00000000")),
                new Coordinate(new BigDecimal("16.10000000"), new BigDecimal("108.10000000")));
        List<SimulationStop> stops = List.of(
                new SimulationStop(1, "Trạm đầu", shape.get(0).latitude(), shape.get(0).longitude()),
                new SimulationStop(2, "Trạm cuối", shape.get(1).latitude(), shape.get(1).longitude()));

        var first = service.simulate(trip, new RouteSimulation(7, "R7"), shape, stops, start.plusMinutes(45));
        var second = service.simulate(trip, new RouteSimulation(7, "R7"), shape, stops, start.plusMinutes(45));
        var ended = service.simulate(trip, new RouteSimulation(7, "R7"), shape, stops, start.plusMinutes(91));

        assertEquals(first, second);
        assertEquals(shape.get(1).latitude(), ended.latitude());
        assertEquals(shape.get(1).longitude(), ended.longitude());
        assertEquals(new BigDecimal("0.0"), ended.speedKmh());
        assertEquals(2, ended.nextStopId());
    }
}
