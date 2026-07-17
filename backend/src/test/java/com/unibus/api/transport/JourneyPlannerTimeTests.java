package com.unibus.api.transport;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class JourneyPlannerTimeTests {

    @Test
    void travelDurationExcludesWaitingForTheNextService() {
        assertThat(JourneyPlannerService.totalTravelMinutes(18, 31, 4)).isEqualTo(53);
    }
}
