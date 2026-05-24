package com.unibus.api.transport;

import com.unibus.api.common.ApiResponse;
import com.unibus.api.transport.dto.TransportDtos;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/v1"})
@PreAuthorize("hasRole('STUDENT')")
public class TransportController {
   private final TransportService transportService;

   public TransportController(TransportService transportService) {
      this.transportService = transportService;
   }

   @GetMapping({"/stops"})
   ApiResponse<List<TransportDtos.StopSummary>> getStops() {
      return ApiResponse.<List<TransportDtos.StopSummary>>ok("Stops retrieved", this.transportService.getActiveStops());
   }

   @GetMapping({"/routes/search"})
   ApiResponse<List<TransportDtos.RouteSuggestion>> searchRoutes(@RequestParam Integer boardingStopId, @RequestParam Integer alightingStopId) {
      return ApiResponse.<List<TransportDtos.RouteSuggestion>>ok("Routes retrieved", this.transportService.searchRoutes(boardingStopId, alightingStopId));
   }

   @GetMapping({"/routes/{routeId}/stops/{stopId}/eta"})
   ApiResponse<List<TransportDtos.Eta>> getEta(@PathVariable Integer routeId, @PathVariable Integer stopId) {
      return ApiResponse.<List<TransportDtos.Eta>>ok("ETA retrieved", this.transportService.getEtas(routeId, stopId));
   }
}
