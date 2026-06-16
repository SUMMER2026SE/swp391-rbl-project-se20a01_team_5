package com.unibus.api.coordinator.dto;

import java.math.BigDecimal;

public class CoordinatorRoutesDtos {

    public record RouteListItem(
            Integer id,
            String routeName,
            String description,
            Integer estimatedMinutes,
            String status) {
    }

    public record CreateRouteRequest(
            String routeName,
            String description,
            Integer estimatedMinutes) {
    }

    public record RouteStopDto(
            Integer id,
            Integer stopId,
            String stopName,
            Integer stopOrder,
            Integer minutesFromPreviousStop) {
    }

    public record AddStopRequest(
            Integer stopId,
            String stopName,
            String address,
            BigDecimal longitude,
            BigDecimal latitude,
            Integer stopOrder,
            Integer minutesFromPreviousStop) {
    }

    public record UpdateStopRequest(
            Integer id,
            Integer stopId,
            String stopName,
            Integer stopOrder,
            Integer minutesFromPreviousStop) {
    }
}
