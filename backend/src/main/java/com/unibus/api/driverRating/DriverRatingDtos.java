package com.unibus.api.driverRating;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class DriverRatingDtos {

    private DriverRatingDtos() {
    }

    public record SubmitDriverRatingRequest(
            @NotNull Integer driverId,
            @NotNull Integer tripId,
            @NotNull @Min(1) @Max(5) Integer rating,
            @Size(max = 1000) String comment) {
    }

    public record DriverRatingView(
            Long driverRatingId,
            String studentCode,
            String studentName,
            Integer driverId,
            String driverName,
            Integer tripId,
            Integer rating,
            String comment,
            OffsetDateTime createdAt) {
    }

    public record DriverRatingSummary(
            BigDecimal averageRating,
            long totalReviews) {
    }
}
