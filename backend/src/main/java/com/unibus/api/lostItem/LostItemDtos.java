package com.unibus.api.lostItem;

import java.time.OffsetDateTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class LostItemDtos {

    private LostItemDtos() {
    }

    public record CreateLostItemReportRequest(
            Integer tripId,
            @NotBlank @Size(max = 500) String itemDescription,
            @Size(max = 500) String notes) {
    }

    public record LostItemReportView(
            Integer lostItemReportId,
            Integer tripId,
            Integer routeId,
            String routeName,
            String itemDescription,
            String status,
            String notes,
            String assistedByName,
            OffsetDateTime reportedAt) {
    }
}
