package com.unibus.api.dispatch;

import java.util.ArrayList;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.unibus.api.common.ApiException;
import com.unibus.api.dispatch.DispatchDtos.DispatchMessageRequest;
import com.unibus.api.dispatch.DispatchDtos.DispatchMessageView;
import com.unibus.api.dispatch.DispatchDtos.DispatcherContact;
import com.unibus.api.dispatch.DispatchDtos.IncidentReportRequest;
import com.unibus.api.security.CurrentUser;

@Service
public class DispatchService {

    private final DispatchRepository dispatchRepository;

    public DispatchService(DispatchRepository dispatchRepository) {
        this.dispatchRepository = dispatchRepository;
    }

    @Transactional(readOnly = true)
    public DispatcherContact getDriverContact(CurrentUser currentUser) {
        Integer driverId = requireDriverId(currentUser);
        Integer activeTripId = dispatchRepository.activeTripIdForDriver(driverId);
        return dispatchRepository.findPrimaryDispatcher(currentUser.userId(), activeTripId);
    }

    @Transactional
    public DispatchMessageView sendDriverMessage(CurrentUser currentUser, DispatchMessageRequest request) {
        Integer driverId = requireDriverId(currentUser);
        Integer tripId = resolveOptionalTripId(driverId, request.tripId());
        List<Integer> dispatchers = requireDispatchers();
        DispatchMessageView first = null;
        String content = request.content().trim();
        for (Integer dispatcherUserId : dispatchers) {
            DispatchMessageView created = dispatchRepository.createMessage(currentUser.userId(), dispatcherUserId, tripId, content);
            dispatchRepository.createNotification(currentUser.userId(), dispatcherUserId, "Tin nhắn từ tài xế", content);
            if (first == null) {
                first = created;
            }
        }
        return first;
    }

    @Transactional
    public DispatchMessageView reportIncident(CurrentUser currentUser, IncidentReportRequest request) {
        Integer driverId = requireDriverId(currentUser);
        Integer tripId = resolveRequiredTripId(driverId, request.tripId());
        String incidentType = normalizeIncidentType(request.incidentType());
        String description = request.description().trim();
        Integer conductorId = dispatchRepository.conductorIdForTrip(tripId);

        Long incidentId = null;
        if (conductorId != null) {
            incidentId = dispatchRepository.createIncident(conductorId, tripId, incidentType, description);
        }
        dispatchRepository.createDriverSosFeedback(currentUser.userId(), tripId, incidentType, description);

        String message = "[SOS] " + incidentType + " - " + description + incidentContext(tripId, incidentId);
        DispatchMessageView first = null;
        for (Integer dispatcherUserId : requireDispatchers()) {
            DispatchMessageView created = dispatchRepository.createMessage(currentUser.userId(), dispatcherUserId, tripId, message);
            dispatchRepository.createNotification(currentUser.userId(), dispatcherUserId, "SOS từ tài xế", message);
            if (first == null) {
                first = created;
            }
        }
        return first;
    }

    private Integer requireDriverId(CurrentUser currentUser) {
        Integer driverId = dispatchRepository.driverIdForUser(currentUser.userId());
        if (driverId == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Driver staff profile not found");
        }
        return driverId;
    }

    private Integer resolveOptionalTripId(Integer driverId, Integer requestedTripId) {
        Integer tripId = requestedTripId;
        if (tripId == null) {
            tripId = dispatchRepository.activeTripIdForDriver(driverId);
        }
        if (tripId == null) {
            return null;
        }
        if (!dispatchRepository.driverOwnsTrip(tripId, driverId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Trip not found");
        }
        return tripId;
    }

    private Integer resolveRequiredTripId(Integer driverId, Integer requestedTripId) {
        Integer tripId = resolveOptionalTripId(driverId, requestedTripId);
        if (tripId == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "SOS requires an active driver trip");
        }
        return tripId;
    }

    private String incidentContext(Integer tripId, Long incidentId) {
        if (tripId == null) {
            return " (chưa có chuyến đang chạy, đã gửi tin nhắn SOS)";
        }
        if (incidentId == null) {
            return " (Chuyến #" + tripId + ", chưa ghi incident do chuyến chưa có phụ xe)";
        }
        return " (Chuyến #" + tripId + ", incident #" + incidentId + ")";
    }

    private List<Integer> requireDispatchers() {
        List<Integer> dispatchers = new ArrayList<>(dispatchRepository.activeDispatcherUserIds());
        if (dispatchers.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "No active dispatcher found");
        }
        return dispatchers;
    }

    private String normalizeIncidentType(String value) {
        String normalized = value == null ? "" : value.trim().toUpperCase();
        return switch (normalized) {
            case "OVERCROWDED", "EMERGENCY", "TECHNICAL", "OTHER" -> normalized;
            case "TRAFFIC" -> "OTHER";
            default -> "OTHER";
        };
    }
}
