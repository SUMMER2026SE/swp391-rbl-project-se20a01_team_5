package com.unibus.api.transport;

import com.unibus.api.common.ApiException;
import com.unibus.api.transport.dto.TransportDtos;
import com.unibus.api.transport.model.BusRoute;
import com.unibus.api.transport.model.RouteStatus;
import com.unibus.api.transport.model.RouteStop;
import com.unibus.api.transport.model.Stop;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TransportService {
   private final StopRepository stopRepository;
   private final RouteStopRepository routeStopRepository;
   private final BusRouteRepository busRouteRepository;
   private final EtaRepository etaRepository;

   public TransportService(StopRepository stopRepository, RouteStopRepository routeStopRepository, BusRouteRepository busRouteRepository, EtaRepository etaRepository) {
      this.stopRepository = stopRepository;
      this.routeStopRepository = routeStopRepository;
      this.busRouteRepository = busRouteRepository;
      this.etaRepository = etaRepository;
   }

   @Transactional(
      readOnly = true
   )
   public List<TransportDtos.StopSummary> getActiveStops() {
      return this.stopRepository.findAllByStatusOrderByStopName(RouteStatus.ACTIVE).stream().map((stop) -> new TransportDtos.StopSummary(stop.getId(), stop.getStopName(), stop.getAddress(), stop.getLongitude(), stop.getLatitude(), this.routeStopRepository.findAllByStopId(stop.getId()).stream().filter((routeStop) -> routeStop.getRoute().getStatus() == RouteStatus.ACTIVE).map((routeStop) -> new TransportDtos.RouteReference(routeStop.getRoute().getId(), routeStop.getRoute().getRouteName())).distinct().toList())).toList();
   }

   @Transactional(
      readOnly = true
   )
   public List<TransportDtos.RouteSuggestion> searchRoutes(Integer boardingStopId, Integer alightingStopId) {
      if (boardingStopId.equals(alightingStopId)) {
         throw new ApiException(HttpStatus.BAD_REQUEST, "Boarding and alighting stops must be different");
      } else {
         this.requireActiveStop(boardingStopId);
         this.requireActiveStop(alightingStopId);
         return this.busRouteRepository.searchRoutes(boardingStopId, alightingStopId).stream().map(this::toRouteSuggestion).toList();
      }
   }

   @Transactional(
      readOnly = true
   )
   public List<TransportDtos.Eta> getEtas(Integer routeId, Integer stopId) {
      BusRoute route = (BusRoute)this.busRouteRepository.findById(routeId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Route not found"));
      if (route.getStatus() != RouteStatus.ACTIVE) {
         throw new ApiException(HttpStatus.BAD_REQUEST, "Route is not active");
      } else {
         this.validateStopOnRoute(routeId, stopId);
         return this.etaRepository.findRunningTripEtas(routeId, stopId).stream().map((eta) -> new TransportDtos.Eta(eta.tripId(), eta.busId(), eta.stopId(), eta.estimatedArrivalAt(), eta.actualArrivalAt(), eta.updatedAt())).toList();
      }
   }

   @Transactional(
      readOnly = true
   )
   public RouteSelection requireValidSelection(Integer routeId, Integer boardingStopId, Integer alightingStopId) {
      BusRoute route = (BusRoute)this.busRouteRepository.findById(routeId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Route not found"));
      if (route.getStatus() != RouteStatus.ACTIVE) {
         throw new ApiException(HttpStatus.BAD_REQUEST, "Route is not active");
      } else {
         List<RouteStop> stops = this.routeStopRepository.findAllByRouteIdOrderByStopOrder(routeId);
         RouteStop boarding = (RouteStop)stops.stream().filter((item) -> item.getStop().getId().equals(boardingStopId)).findFirst().orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Boarding stop is not on route"));
         RouteStop alighting = (RouteStop)stops.stream().filter((item) -> item.getStop().getId().equals(alightingStopId)).filter((item) -> item.getStopOrder() > boarding.getStopOrder()).findFirst().orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Alighting stop must be after boarding stop on route"));
         return new RouteSelection(route, boarding.getStop(), alighting.getStop());
      }
   }

   private TransportDtos.RouteSuggestion toRouteSuggestion(BusRoute route) {
      List<TransportDtos.RouteStopSummary> stops = this.routeStopRepository.findAllByRouteIdOrderByStopOrder(route.getId()).stream().map((routeStop) -> new TransportDtos.RouteStopSummary(routeStop.getStop().getId(), routeStop.getStop().getStopName(), routeStop.getStopOrder(), routeStop.getMinutesFromPreviousStop())).toList();
      return new TransportDtos.RouteSuggestion(route.getId(), route.getRouteName(), route.getDistanceKm(), route.getEstimatedMinutes(), stops);
   }

   private Stop requireActiveStop(Integer stopId) {
      Stop stop = (Stop)this.stopRepository.findById(stopId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Stop not found"));
      if (stop.getStatus() != RouteStatus.ACTIVE) {
         throw new ApiException(HttpStatus.BAD_REQUEST, "Stop is not active");
      } else {
         return stop;
      }
   }

   private void validateStopOnRoute(Integer routeId, Integer stopId) {
      if (this.routeStopRepository.findAllByRouteIdOrderByStopOrder(routeId).stream().noneMatch((routeStop) -> routeStop.getStop().getId().equals(stopId))) {
         throw new ApiException(HttpStatus.BAD_REQUEST, "Stop is not on route");
      }
   }

   public static record RouteSelection(BusRoute route, Stop boardingStop, Stop alightingStop) {
   }
}
