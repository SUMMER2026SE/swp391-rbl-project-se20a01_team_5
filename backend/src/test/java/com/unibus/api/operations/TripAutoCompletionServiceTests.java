package com.unibus.api.operations;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TripAutoCompletionServiceTests {

    @Mock
    private OperationsRepository operationsRepository;

    @Test
    void scheduledCompletionDelegatesToAtomicRepositoryUpdate() {
        when(operationsRepository.completeSimulatedTripsPastGracePeriod()).thenReturn(1);
        TripAutoCompletionService service = new TripAutoCompletionService(operationsRepository);

        service.completeTripsPastSimulationGracePeriod();

        verify(operationsRepository).completeSimulatedTripsPastGracePeriod();
    }
}
