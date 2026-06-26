package com.unibus.api.dispatch;

import java.time.OffsetDateTime;
import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class DispatchDtos {

    private DispatchDtos() {
    }

    public record DispatcherContact(
            Integer dispatcherUserId,
            String dispatcherName,
            String phoneNumber,
            String department,
            Integer activeTripId,
            List<DispatchMessageView> messages) {
    }

    public record DispatchMessageRequest(
            Integer tripId,
            @NotBlank @Size(max = 2000) String content) {
    }

    public record IncidentReportRequest(
            Integer tripId,
            @NotBlank @Size(max = 30) String incidentType,
            @NotBlank @Size(max = 2000) String description) {
    }

    public record DispatchMessageView(
            Long messageId,
            Integer senderUserId,
            String senderName,
            Integer recipientUserId,
            String recipientName,
            Integer tripId,
            String content,
            boolean read,
            OffsetDateTime sentAt) {
    }

}
