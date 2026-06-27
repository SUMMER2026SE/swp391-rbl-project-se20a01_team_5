package com.unibus.api.ai;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AiDtos {

    private AiDtos() {
    }

    public record ChatRequest(
            @NotBlank @Size(max = 1000) String message,
            Map<String, Object> context) {
    }

    public record ChatResponse(
            String message,
            String mode,
            String advisoryType,
            List<RouteSuggestionCard> routeSuggestions,
            List<AiAction> actions,
            List<AiSource> sources,
            String sessionId) {
    }

    public record RouteSuggestionRequest(
            Integer boardingStopId,
            Integer alightingStopId,
            String preferredDepartureTime,
            List<String> preferences,
            String naturalLanguageQuery,
            @Size(max = 100) String preference) {
    }

    public record RouteSuggestionCard(
            Integer routeId,
            String routeCode,
            String routeName,
            BigDecimal score,
            int confidence,
            List<String> reasons,
            List<RouteStopCard> stops,
            List<String> nextDepartures,
            BigDecimal singleFare,
            BigDecimal monthlyFare,
            BigDecimal subsidyAmount,
            BigDecimal finalFare,
            List<AiAction> actions) {
    }

    public record RouteStopCard(
            Integer stopId,
            String stopCode,
            String stopName,
            Integer stopOrder,
            Integer minutesFromPreviousStop) {
    }

    public record AiAction(
            String type,
            String label,
            Integer routeId,
            Integer boardingStopId,
            Integer alightingStopId) {
    }

    public record AiSource(
            String type,
            String label,
            String detail) {
    }
}
