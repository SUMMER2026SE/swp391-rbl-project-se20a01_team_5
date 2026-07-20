package com.unibus.api.operations;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@ConditionalOnProperty(name = "app.trip-auto-completion.enabled", havingValue = "true", matchIfMissing = true)
public class TripAutoCompletionService {

    private static final Logger LOGGER = LoggerFactory.getLogger(TripAutoCompletionService.class);

    private final OperationsRepository operationsRepository;

    public TripAutoCompletionService(OperationsRepository operationsRepository) {
        this.operationsRepository = operationsRepository;
    }

    @Scheduled(fixedDelayString = "${app.trip-auto-completion.poll-ms:5000}")
    @Transactional
    public void completeTripsPastSimulationGracePeriod() {
        int completedTrips = operationsRepository.completeSimulatedTripsPastGracePeriod();
        if (completedTrips > 0) {
            LOGGER.info("Automatically completed {} simulated trip(s) after destination grace period", completedTrips);
        }
    }
}
