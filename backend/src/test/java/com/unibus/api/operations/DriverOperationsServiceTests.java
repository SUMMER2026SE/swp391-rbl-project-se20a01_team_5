package com.unibus.api.operations;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.unibus.api.common.ApiException;
import com.unibus.api.operations.OperationsDtos.DriverTripView;
import com.unibus.api.realtime.RealtimePublisher;
import com.unibus.api.security.CurrentUser;
import com.unibus.api.user.model.UserRole;

@ExtendWith(MockitoExtension.class)
class DriverOperationsServiceTests {

    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final int DRIVER_USER_ID = 19;
    private static final int DRIVER_ID = 2;
    private static final int TRIP_ID = 3901;

    @Mock
    private OperationsRepository operationsRepository;

    @Mock
    private RealtimePublisher realtimePublisher;

    private OperationsService operationsService;
    private CurrentUser driver;

    @BeforeEach
    void setUp() {
        operationsService = new OperationsService(operationsRepository, realtimePublisher);
        driver = new CurrentUser(DRIVER_USER_ID, "driver.demo@unibus.local", UserRole.DRIVER, 1L);
        when(operationsRepository.staffIdForUser(DRIVER_USER_ID, "DRIVER")).thenReturn(DRIVER_ID);
    }

    @Test
    void startTripRecordsTheActualStartInsideTheAllowedWindow() {
        DriverTripView notStarted = trip("NOT_STARTED", null, null, LocalDate.now(BUSINESS_ZONE), LocalTime.now(BUSINESS_ZONE));
        DriverTripView running = trip("RUNNING", OffsetDateTime.now(BUSINESS_ZONE), null, notStarted.serviceDate(), notStarted.departureTime());
        when(operationsRepository.findDriverTrip(TRIP_ID, DRIVER_ID)).thenReturn(notStarted, running);
        when(operationsRepository.startTrip(TRIP_ID)).thenReturn(1);

        DriverTripView result = operationsService.startTrip(driver, TRIP_ID);

        assertThat(result.status()).isEqualTo("RUNNING");
        verify(operationsRepository).lockDriverForTripStart(DRIVER_ID);
        verify(operationsRepository).startTrip(TRIP_ID);
    }

    @Test
    void startTripRejectsATripThatIsTooEarly() {
        DriverTripView futureTrip = trip("NOT_STARTED", null, null, LocalDate.now(BUSINESS_ZONE).plusDays(1), LocalTime.NOON);
        when(operationsRepository.findDriverTrip(TRIP_ID, DRIVER_ID)).thenReturn(futureTrip);

        assertThatThrownBy(() -> operationsService.startTrip(driver, TRIP_ID))
                .isInstanceOf(ApiException.class)
                .hasMessage("Chưa đến giờ bắt đầu chuyến");
        verify(operationsRepository, never()).startTrip(TRIP_ID);
    }

    @Test
    void startTripRejectsATripMoreThanSixtyMinutesLate() {
        LocalDateTime scheduledAt = LocalDateTime.now(BUSINESS_ZONE).minusMinutes(61);
        DriverTripView lateTrip = trip(
                "NOT_STARTED",
                null,
                null,
                scheduledAt.toLocalDate(),
                scheduledAt.toLocalTime());
        when(operationsRepository.findDriverTrip(TRIP_ID, DRIVER_ID)).thenReturn(lateTrip);

        assertThatThrownBy(() -> operationsService.startTrip(driver, TRIP_ID))
                .isInstanceOf(ApiException.class)
                .hasMessage("Chuyến đã quá giờ bắt đầu");

        verify(operationsRepository, never()).startTrip(TRIP_ID);
    }

    @Test
    void startTripRejectsWhenDriverHasAnotherRunningTrip() {
        DriverTripView notStarted = trip(
                "NOT_STARTED",
                null,
                null,
                LocalDate.now(BUSINESS_ZONE),
                LocalTime.now(BUSINESS_ZONE));
        when(operationsRepository.findDriverTrip(TRIP_ID, DRIVER_ID)).thenReturn(notStarted);
        when(operationsRepository.hasOtherRunningTrip(DRIVER_ID, TRIP_ID, notStarted.serviceDate())).thenReturn(true);

        assertThatThrownBy(() -> operationsService.startTrip(driver, TRIP_ID))
                .isInstanceOf(ApiException.class)
                .hasMessage("Bạn đang có một chuyến khác chưa kết thúc");

        verify(operationsRepository).lockDriverForTripStart(DRIVER_ID);
        verify(operationsRepository, never()).startTrip(TRIP_ID);
    }

    @Test
    void trackingRejectsTripNotOwnedByDriver() {
        when(operationsRepository.findDriverTrip(TRIP_ID, DRIVER_ID)).thenReturn(null);

        assertThatThrownBy(() -> operationsService.getDriverTripForTracking(driver, TRIP_ID))
                .isInstanceOf(ApiException.class)
                .hasMessage("Không tìm thấy chuyến");
    }

    @Test
    void endTripRejectsANotStartedTrip() {
        DriverTripView notStarted = trip("NOT_STARTED", null, null, LocalDate.now(BUSINESS_ZONE), LocalTime.now(BUSINESS_ZONE));
        when(operationsRepository.findDriverTrip(TRIP_ID, DRIVER_ID)).thenReturn(notStarted);

        assertThatThrownBy(() -> operationsService.endTrip(driver, TRIP_ID))
                .isInstanceOf(ApiException.class)
                .hasMessage("Chỉ có thể kết thúc chuyến đang chạy");
        verify(operationsRepository, never()).endTrip(TRIP_ID);
    }

    @Test
    void endTripCompletesOnlyARunningTrip() {
        DriverTripView running = trip("RUNNING", OffsetDateTime.now(BUSINESS_ZONE).minusMinutes(10), null,
                LocalDate.now(BUSINESS_ZONE), LocalTime.now(BUSINESS_ZONE).minusMinutes(10));
        DriverTripView completed = trip("COMPLETED", running.departedAt(), OffsetDateTime.now(BUSINESS_ZONE),
                running.serviceDate(), running.departureTime());
        when(operationsRepository.findDriverTrip(TRIP_ID, DRIVER_ID)).thenReturn(running, completed);
        when(operationsRepository.endTrip(TRIP_ID)).thenReturn(1);

        DriverTripView result = operationsService.endTrip(driver, TRIP_ID);

        assertThat(result.status()).isEqualTo("COMPLETED");
        verify(operationsRepository).endTrip(TRIP_ID);
    }

    @Test
    void overviewDoesNotTreatRunningStatusWithoutDepartureAsActive() {
        LocalDate today = LocalDate.now(BUSINESS_ZONE);
        DriverTripView invalidRunning = trip(3901, "RUNNING", null, null, today, LocalTime.now(BUSINESS_ZONE));
        DriverTripView futureTrip = trip(3902, "NOT_STARTED", null, null, today.plusDays(1), LocalTime.NOON);
        when(operationsRepository.findDriverUpcomingActualTrips(DRIVER_ID, today, today.plusDays(60)))
                .thenReturn(List.of(invalidRunning, futureTrip));
        when(operationsRepository.findDriverTripHistory(DRIVER_ID, today.minusDays(90), today.plusDays(60)))
                .thenReturn(List.of());
        when(operationsRepository.findDriverScheduleTemplates(DRIVER_ID)).thenReturn(List.of());

        var overview = operationsService.getDriverTripOverview(driver);

        assertThat(overview.nearestTrip()).isEqualTo(futureTrip);
        assertThat(overview.upcomingTrips()).doesNotContain(invalidRunning);
    }

    @Test
    void overviewDoesNotTreatEndedRunningRowAsActive() {
        LocalDate today = LocalDate.now(BUSINESS_ZONE);
        OffsetDateTime departedAt = OffsetDateTime.now(BUSINESS_ZONE).minusMinutes(30);
        DriverTripView invalidRunning = trip(3901, "RUNNING", departedAt, OffsetDateTime.now(BUSINESS_ZONE), today,
                departedAt.toLocalTime());
        when(operationsRepository.findDriverUpcomingActualTrips(DRIVER_ID, today, today.plusDays(60)))
                .thenReturn(List.of(invalidRunning));
        when(operationsRepository.findDriverTripHistory(DRIVER_ID, today.minusDays(90), today.plusDays(60)))
                .thenReturn(List.of());
        when(operationsRepository.findDriverScheduleTemplates(DRIVER_ID)).thenReturn(List.of());

        var overview = operationsService.getDriverTripOverview(driver);

        assertThat(overview.nearestTrip()).isNull();
        assertThat(overview.upcomingTrips()).isEmpty();
    }

    private DriverTripView trip(
            String status,
            OffsetDateTime departedAt,
            OffsetDateTime endedAt,
            LocalDate serviceDate,
            LocalTime departureTime) {
        return trip(TRIP_ID, status, departedAt, endedAt, serviceDate, departureTime);
    }

    private DriverTripView trip(
            Integer tripId,
            String status,
            OffsetDateTime departedAt,
            OffsetDateTime endedAt,
            LocalDate serviceDate,
            LocalTime departureTime) {
        return new DriverTripView(
                522,
                tripId,
                49,
                "Bến xe Trung tâm – Đại học Việt Hàn",
                30,
                "43B-80808",
                "Trần Gia Hân",
                "0908000003",
                serviceDate,
                departureTime,
                departedAt,
                endedAt,
                status,
                List.of());
    }
}
