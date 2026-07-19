package com.unibus.api.transport;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import com.unibus.api.transport.dto.TransportDtos.RouteStopSummary;

class TransportDtosTests {
    @Test
    void routeStopSummaryKeepsStationDirection() {
        RouteStopSummary stop = new RouteStopSummary(603, "E144 Trần Đại Nghĩa", 2, 0,
                null, null, null, null, false);

        assertThat(stop.stationDirection()).isZero();
    }
}
