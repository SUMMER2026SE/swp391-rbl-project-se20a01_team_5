package com.unibus.api.operations;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

class DemoFleetSimulatorTests {

    @Test
    void interpolatesVehiclePositionAlongRoute() {
        List<DemoFleetSimulator.RoutePoint> points = List.of(
                new DemoFleetSimulator.RoutePoint(108.0, 16.0),
                new DemoFleetSimulator.RoutePoint(109.0, 17.0),
                new DemoFleetSimulator.RoutePoint(110.0, 18.0));

        DemoFleetSimulator.RoutePoint point = DemoFleetSimulator.pointAtProgress(points, 0.25);

        assertThat(point.longitude()).isEqualTo(108.5);
        assertThat(point.latitude()).isEqualTo(16.5);
    }
}
