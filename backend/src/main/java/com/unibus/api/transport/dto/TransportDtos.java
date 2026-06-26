package com.unibus.api.transport.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public final class TransportDtos {
   private TransportDtos() {
   }

   public static record RouteReference(Integer routeId, String routeName, String routeCode, String colorHex) {
   }

   public static record StopSummary(Integer stopId, String stopName, String address, BigDecimal longitude,
         BigDecimal latitude, List<RouteReference> routes, String stopCode, boolean hasShelter) {
   }

   public static record RouteStopSummary(Integer stopId, String stopName, Integer stopOrder,
         Integer minutesFromPreviousStop, String stopCode, BigDecimal longitude, BigDecimal latitude,
         boolean hasShelter) {
   }

   public static record RouteSuggestion(Integer routeId, String routeName, BigDecimal distanceKm,
         Integer estimatedMinutes, List<RouteStopSummary> stops, String routeCode, String colorHex,
         Integer frequencyMin, BigDecimal singleFare, BigDecimal monthlyFare, String firstTrip,
         String lastTrip, boolean universityLinked) {
   }

   public static record Eta(Integer tripId, Integer busId, Integer stopId, OffsetDateTime estimatedArrivalAt, OffsetDateTime actualArrivalAt, OffsetDateTime updatedAt) {
   }
}
