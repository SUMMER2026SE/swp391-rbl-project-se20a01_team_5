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

   public static record RouteLookup(Integer routeId, String routeName, String routeCode,
         String colorHex, BigDecimal distanceKm, Integer estimatedMinutes, Integer frequencyMin,
         BigDecimal singleFare, BigDecimal monthlyFare, String firstTrip, String lastTrip,
         Integer stopCount, List<Integer> directions, boolean universityLinked,
         boolean interregional, String externalSource) {
   }

   public static record RouteDirectionSummary(Integer direction, Integer stopCount,
         String firstStopName, String lastStopName) {
   }

   public static record RouteMapPreview(Integer routeId, String routeName, String routeCode,
         String colorHex, BigDecimal distanceKm, Integer estimatedMinutes, Integer frequencyMin,
         BigDecimal singleFare, BigDecimal monthlyFare, String firstTrip, String lastTrip,
         boolean universityLinked, boolean interregional, String externalSource,
         Integer direction, List<RouteDirectionSummary> directions, List<JourneyStop> stops,
         List<MapPolyline> polylines) {
   }

   public static record Eta(Integer tripId, Integer busId, Integer stopId, OffsetDateTime estimatedArrivalAt, OffsetDateTime actualArrivalAt, OffsetDateTime updatedAt) {
   }

   public static record Coordinate(BigDecimal latitude, BigDecimal longitude) {
   }

   public static record PlaceSuggestion(String id, String type, String label, String address,
         BigDecimal latitude, BigDecimal longitude, Integer stopId, Integer distanceMeters,
         List<RouteReference> routes) {
   }

   public static record PlaceReverseResult(String label, String address, BigDecimal latitude,
         BigDecimal longitude, Integer nearestStopId, String nearestStopName, Integer distanceMeters) {
   }

   public static record JourneySearchRequest(PlacePoint origin, PlacePoint destination,
         Integer maxBusLegs, OffsetDateTime departAt) {
   }

   public static record PlacePoint(String placeId, Integer stopId, String label,
         BigDecimal latitude, BigDecimal longitude) {
   }

   public static record JourneyOption(String optionId, JourneySummary summary,
         List<JourneyLeg> legs, List<RouteReference> routeBadges,
         JourneyAction primaryAction, List<JourneyAction> secondaryActions,
         List<MapPolyline> polylines, List<JourneyStop> stops) {
   }

   public static record JourneySummary(Integer totalMinutes, Integer walkMinutes,
         Integer waitMinutes, BigDecimal walkMeters, BigDecimal busDistanceKm,
         Integer transferCount, BigDecimal singleFare, BigDecimal monthlyFare,
         String firstEtaText, String confidence) {
   }

   public static record JourneyLeg(String legId, String mode, Integer routeId,
         String routeCode, String routeName, String colorHex, Integer fromStopId,
         String fromStopName, Integer toStopId, String toStopName, Integer stopCount,
         Integer durationMinutes, Integer waitMinutes, BigDecimal distanceKm,
         BigDecimal fare, OffsetDateTime nextDepartureAt, OffsetDateTime estimatedArrivalAt,
         List<JourneyStop> stops, List<Coordinate> shape, boolean universityLinked) {
   }

   public static record JourneyStop(Integer stopId, String stopName, String address,
         BigDecimal latitude, BigDecimal longitude, Integer stopOrder, Integer stationDirection,
         Integer etaMinutes, boolean transfer) {
   }

   public static record JourneyAction(String type, String label, boolean enabled, String reason,
         Integer routeId, Integer boardingStopId, Integer alightingStopId,
         Boolean subsidyEligible, Boolean universityLinked, Boolean fullPriceAllowed,
         String availabilityStatus, String availabilityMessage) {
      public JourneyAction(String type, String label, boolean enabled, String reason,
            Integer routeId, Integer boardingStopId, Integer alightingStopId) {
         this(type, label, enabled, reason, routeId, boardingStopId, alightingStopId,
               null, null, null, null, null);
      }
   }

   public static record MapPolyline(String legId, String mode, String colorHex,
         List<Coordinate> points) {
   }

   public static record JourneyTrackingSnapshot(String journeyId, OffsetDateTime updatedAt,
         List<VehicleSnapshot> vehicles, List<StopEta> stopEtas, List<MapPolyline> polylines,
         Integer routeId, String routeCode, String routeName,
         Integer boardingStopId, Integer alightingStopId, List<TrackingStop> stops,
         boolean simulated) {
      public JourneyTrackingSnapshot(String journeyId, OffsetDateTime updatedAt,
            List<VehicleSnapshot> vehicles, List<StopEta> stopEtas, List<MapPolyline> polylines) {
         this(journeyId, updatedAt, vehicles, stopEtas, polylines,
               null, null, null, null, null, List.of(), true);
      }
   }

   public static record TrackingStop(Integer stopId, String stopName, String address,
         BigDecimal latitude, BigDecimal longitude, Integer stopOrder, boolean boarding,
         boolean alighting) {
   }

   public static record VehicleSnapshot(String vehicleId, String plateNumber, Integer routeId,
         String routeCode, BigDecimal latitude, BigDecimal longitude, BigDecimal speedKmh,
         Integer occupancy, Integer capacity, Integer nextStopId, String nextStopName,
         Integer etaMinutes) {
   }

   public static record StopEta(Integer stopId, String stopName, Integer routeId,
         String routeCode, OffsetDateTime estimatedArrivalAt, Integer minutesAway) {
   }
}
