package com.unibus.api.assistant;

import java.time.LocalDate;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.unibus.api.assistant.AssistantTicketDtos.ConductorDashboard;
import com.unibus.api.assistant.AssistantTicketDtos.ConductorTripView;
import com.unibus.api.assistant.AssistantTicketDtos.ScanTicketRequest;
import com.unibus.api.assistant.AssistantTicketDtos.ScanTicketResult;
import com.unibus.api.assistant.AssistantTicketRepository.MonthlyPassScanContext;
import com.unibus.api.common.ApiException;
import com.unibus.api.security.CurrentUser;

@Service
public class AssistantTicketService {

    private final AssistantTicketRepository repository;

    public AssistantTicketService(AssistantTicketRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public ConductorDashboard dashboard(CurrentUser currentUser, LocalDate date) {
        Integer conductorId = requireConductorId(currentUser);
        List<ConductorTripView> trips = repository.findConductorTrips(conductorId, date == null ? LocalDate.now() : date);
        return new ConductorDashboard(trips);
    }

    @Transactional
    public ScanTicketResult scan(CurrentUser currentUser, ScanTicketRequest request) {
        Integer conductorId = requireConductorId(currentUser);
        if (!repository.conductorOwnsTrip(conductorId, request.tripId())) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Trip not found for current conductor");
        }

        String qrCode = request.qrCode().trim();
        MonthlyPassScanContext pass = repository.findMonthlyPassByQr(qrCode)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket QR code not found"));

        if (!"ACTIVE".equals(pass.status())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Monthly pass is not active");
        }
        LocalDate today = LocalDate.now();
        if (pass.validFrom() != null && pass.validFrom().toLocalDate().isAfter(today)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Monthly pass is not valid yet");
        }
        if (pass.expiresAt() != null && !pass.expiresAt().toLocalDate().isAfter(today)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Monthly pass has expired");
        }

        Integer tripRouteId = repository.routeIdForTrip(request.tripId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Trip not found"));
        if (!tripRouteId.equals(pass.routeId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Ticket is not valid for this route");
        }

        return repository.recordMonthlyPassScan(pass, request.tripId(), conductorId);
    }

    private Integer requireConductorId(CurrentUser currentUser) {
        return repository.conductorIdForUser(currentUser.userId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Conductor profile not found"));
    }
}
