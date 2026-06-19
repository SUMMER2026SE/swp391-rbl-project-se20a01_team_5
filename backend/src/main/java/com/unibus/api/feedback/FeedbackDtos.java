package com.unibus.api.feedback;

import java.time.OffsetDateTime;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class FeedbackDtos {

    private FeedbackDtos() {
    }

    public record CreateFeedbackRequest(
            Integer tripId,
            Integer routeId,
            @Min(1) @Max(5) Integer rating,
            @Size(max = 40) String category,
            @NotBlank @Size(max = 2000) String content) {
    }

    public record ResolveFeedbackRequest(@Size(max = 2000) String response) {
    }

    public record FeedbackView(
            Long feedbackId,
            String studentCode,
            String studentName,
            Integer tripId,
            Integer routeId,
            String routeName,
            Integer rating,
            String category,
            String content,
            String status,
            String response,
            String handlerName,
            OffsetDateTime handledAt,
            OffsetDateTime createdAt) {
    }
}
