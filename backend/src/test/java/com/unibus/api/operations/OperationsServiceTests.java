package com.unibus.api.operations;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.unibus.api.operations.OperationsDtos.ConductorTicketView;
import com.unibus.api.operations.OperationsDtos.TicketScanRequest;
import com.unibus.api.operations.OperationsDtos.TicketScanResult;
import com.unibus.api.operations.OperationsRepository.TripRouteInfo;
import com.unibus.api.realtime.RealtimePublisher;
import com.unibus.api.security.CurrentUser;
import com.unibus.api.user.model.UserRole;

@ExtendWith(MockitoExtension.class)
class OperationsServiceTests {

    private static final int CONDUCTOR_USER_ID = 44;
    private static final int CONDUCTOR_ID = 7;
    private static final int TRIP_ID = 101;
    private static final int ROUTE_A = 501;
    private static final int ROUTE_B = 502;

    @Mock
    private OperationsRepository operationsRepository;

    @Mock
    private RealtimePublisher realtimePublisher;

    private OperationsService operationsService;
    private CurrentUser conductor;

    @BeforeEach
    void setUp() {
        operationsService = new OperationsService(operationsRepository, realtimePublisher);
        conductor = new CurrentUser(CONDUCTOR_USER_ID, "conductor@example.com", UserRole.CONDUCTOR, 1L);
        when(operationsRepository.staffIdForUser(CONDUCTOR_USER_ID, "CONDUCTOR")).thenReturn(CONDUCTOR_ID);
        when(operationsRepository.conductorOwnsTrip(TRIP_ID, CONDUCTOR_ID)).thenReturn(true);
    }

    @Test
    void monthlyPassScanAcceptsSameRouteWithoutCheckingDefaultStopPair() {
        ConductorTicketView ticket = monthlyTicket(ROUTE_A, "Campus Gate", "Dormitory");
        ConductorTicketView refreshed = monthlyTicket(ROUTE_A, "Updated Stop", "Dormitory");
        when(operationsRepository.tripRouteInfo(TRIP_ID))
                .thenReturn(Optional.of(openTrip(ROUTE_A)));
        when(operationsRepository.findMonthlyTicketByQr("QR-A"))
                .thenReturn(Optional.of(ticket), Optional.of(refreshed));
        when(operationsRepository.ensureTravelHistoryForScan("SE001", TRIP_ID, CONDUCTOR_ID, ROUTE_A))
                .thenReturn(9001);

        TicketScanResult result = operationsService.scanTicket(conductor, new TicketScanRequest(TRIP_ID, " QR-A "));

        assertThat(result.valid()).isTrue();
        assertThat(result.travelHistoryId()).isEqualTo(9001);
        assertThat(result.ticket().boardingStopName()).isEqualTo("Updated Stop");
        verify(operationsRepository).markMonthlyPassScanned(11);
        verify(operationsRepository).ensureTravelHistoryForScan("SE001", TRIP_ID, CONDUCTOR_ID, ROUTE_A);
    }

    @Test
    void monthlyPassScanRejectsDifferentRoute() {
        ConductorTicketView ticket = monthlyTicket(ROUTE_A, "Campus Gate", "Dormitory");
        when(operationsRepository.tripRouteInfo(TRIP_ID))
                .thenReturn(Optional.of(openTrip(ROUTE_B)));
        when(operationsRepository.findMonthlyTicketByQr("QR-A")).thenReturn(Optional.of(ticket));

        TicketScanResult result = operationsService.scanTicket(conductor, new TicketScanRequest(TRIP_ID, "QR-A"));

        assertThat(result.valid()).isFalse();
        assertThat(result.message()).isEqualTo("Vé không hợp lệ cho chuyến này");
        verify(operationsRepository, never()).markMonthlyPassScanned(11);
        verify(operationsRepository, never()).ensureTravelHistoryForScan(anyString(), any(), any(), any());
    }

    @Test
    void scanRejectsTripThatDriverHasNotStarted() {
        when(operationsRepository.tripRouteInfo(TRIP_ID))
                .thenReturn(Optional.of(new TripRouteInfo(TRIP_ID, ROUTE_A, LocalDate.now(), LocalTime.NOON, null, null, "NOT_STARTED")));

        TicketScanResult result = operationsService.scanTicket(conductor, new TicketScanRequest(TRIP_ID, "QR-A"));

        assertThat(result.valid()).isFalse();
        assertThat(result.message()).isEqualTo("Tài xế chưa bắt đầu chuyến.");
        verify(operationsRepository, never()).findMonthlyTicketByQr(anyString());
        verify(operationsRepository, never()).findSingleTicketByQr(anyString());
    }

    @Test
    void singleTicketScanDoesNotCreateHistoryWhenAtomicUseFails() {
        ConductorTicketView ticket = singleTicket("UNUSED");
        ConductorTicketView usedTicket = singleTicket("USED");
        when(operationsRepository.tripRouteInfo(TRIP_ID))
                .thenReturn(Optional.of(openTrip(ROUTE_A)));
        when(operationsRepository.findMonthlyTicketByQr("QR-S")).thenReturn(Optional.empty());
        when(operationsRepository.findJourneyMonthlyTicketByQr("QR-S", ROUTE_A)).thenReturn(Optional.empty());
        when(operationsRepository.findSingleTicketByQr("QR-S")).thenReturn(Optional.of(ticket), Optional.of(usedTicket));
        when(operationsRepository.markSingleTicketUsed(22, TRIP_ID, CONDUCTOR_ID)).thenReturn(0);

        TicketScanResult result = operationsService.scanTicket(conductor, new TicketScanRequest(TRIP_ID, "QR-S"));

        assertThat(result.valid()).isFalse();
        assertThat(result.message()).isEqualTo("Vé lượt đã được sử dụng");
        verify(operationsRepository, never()).ensureTravelHistoryForScan(anyString(), any(), any(), any());
    }

    private ConductorTicketView monthlyTicket(Integer routeId, String boardingStopName, String alightingStopName) {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        return new ConductorTicketView(
                "MONTHLY",
                11,
                "QR-A",
                "SE001",
                "Verified Student",
                routeId,
                "Route " + routeId,
                boardingStopName,
                alightingStopName,
                "ACTIVE",
                now.minusDays(1),
                now.plusDays(15),
                null);
    }

    private TripRouteInfo openTrip(Integer routeId) {
        return new TripRouteInfo(
                TRIP_ID,
                routeId,
                LocalDate.now(ZoneOffset.UTC),
                null,
                OffsetDateTime.now(ZoneOffset.UTC).minusMinutes(5),
                null,
                "RUNNING");
    }

    private ConductorTicketView singleTicket(String status) {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        return new ConductorTicketView(
                "SINGLE",
                22,
                "QR-S",
                "SE001",
                "Verified Student",
                ROUTE_A,
                "Route " + ROUTE_A,
                "Campus Gate",
                "Dormitory",
                status,
                now.minusHours(1),
                now.plusHours(2),
                null);
    }
}
