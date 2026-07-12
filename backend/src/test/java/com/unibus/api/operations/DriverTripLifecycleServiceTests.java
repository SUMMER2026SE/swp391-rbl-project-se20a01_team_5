package com.unibus.api.operations;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.unibus.api.common.ApiException;
import com.unibus.api.operations.OperationsRepository.TripRouteInfo;
import com.unibus.api.realtime.RealtimePublisher;
import com.unibus.api.security.CurrentUser;
import com.unibus.api.user.model.UserRole;

@ExtendWith(MockitoExtension.class)
class DriverTripLifecycleServiceTests {

    private static final int USER_ID = 55;
    private static final int DRIVER_ID = 9;
    private static final int TRIP_ID = 101;
    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @Mock
    private OperationsRepository operationsRepository;

    @Mock
    private RealtimePublisher realtimePublisher;

    private OperationsService operationsService;
    private CurrentUser driver;

    @BeforeEach
    void setUp() {
        operationsService = new OperationsService(operationsRepository, realtimePublisher);
        driver = new CurrentUser(USER_ID, "driver@example.com", UserRole.DRIVER, 1L);
        when(operationsRepository.staffIdForUser(USER_ID, "DRIVER")).thenReturn(DRIVER_ID);
        when(operationsRepository.driverOwnsTrip(TRIP_ID, DRIVER_ID)).thenReturn(true);
    }

    @Test
    void startRejectsWhenDriverAlreadyHasAnotherRunningTrip() {
        when(operationsRepository.tripRouteInfo(TRIP_ID)).thenReturn(Optional.of(new TripRouteInfo(
                TRIP_ID,
                501,
                LocalDate.now(BUSINESS_ZONE),
                LocalTime.now(BUSINESS_ZONE),
                null,
                null,
                "NOT_STARTED")));
        when(operationsRepository.hasOtherRunningTrip(DRIVER_ID, TRIP_ID)).thenReturn(true);

        assertThatThrownBy(() -> operationsService.startTrip(driver, TRIP_ID))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("chuyến khác");

        verify(operationsRepository, never()).startTrip(TRIP_ID);
    }

    @Test
    void endRejectsTripThatIsNotRunning() {
        when(operationsRepository.endTrip(TRIP_ID)).thenReturn(0);

        assertThatThrownBy(() -> operationsService.endTrip(driver, TRIP_ID))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("đang chạy");
    }
}
