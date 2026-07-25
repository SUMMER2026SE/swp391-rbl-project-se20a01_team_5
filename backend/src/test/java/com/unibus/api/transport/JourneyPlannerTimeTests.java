package com.unibus.api.transport;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.unibus.api.transport.dto.TransportDtos.JourneyLeg;
import com.unibus.api.transport.dto.TransportDtos.JourneyOption;
import com.unibus.api.transport.dto.TransportDtos.JourneySummary;

class JourneyPlannerTimeTests {

    @Test
    void travelDurationExcludesWaitingForTheNextService() {
        assertThat(JourneyPlannerService.totalTravelMinutes(18, 31, 4)).isEqualTo(53);
    }

    @Test
    void ranksCloserTransferBeforeFarDirectRoute() {
        JourneyPlannerService planner = new JourneyPlannerService(null, null);
        JourneyOption direct = option("direct", 72, 23, 1_670, 0, "LOW", "16");
        JourneyOption transfer = option("transfer", 67, 13, 951, 1, "MEDIUM", "02", "TMF1");

        assertThat(planner.bestDistinctOptions(List.of(direct, transfer), 2))
                .extracting(JourneyOption::optionId)
                .containsExactly("transfer", "direct");
    }

    private JourneyOption option(String id, int totalMinutes, int walkMinutes, int walkMeters,
            int transfers, String confidence, String... routeCodes) {
        List<JourneyLeg> legs = java.util.Arrays.stream(routeCodes)
                .map(routeCode -> new JourneyLeg(routeCode, "BUS", routeCode.hashCode(), routeCode,
                        routeCode, null, null, null, null, null, null, null, null,
                        BigDecimal.ZERO, BigDecimal.ZERO, null, null, List.of(), List.of(), false))
                .toList();
        JourneySummary summary = new JourneySummary(totalMinutes, walkMinutes, 0,
                BigDecimal.valueOf(walkMeters), BigDecimal.ZERO, transfers,
                BigDecimal.ZERO, BigDecimal.ZERO, null, confidence);
        return new JourneyOption(id, summary, legs, List.of(), null, List.of(), List.of(), List.of());
    }
}
