package com.unibus.api.transport;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.unibus.api.common.ApiResponse;
import com.unibus.api.security.CurrentUser;
import com.unibus.api.transport.dto.TransportDtos.Eta;
import com.unibus.api.transport.dto.TransportDtos.JourneyOption;
import com.unibus.api.transport.dto.TransportDtos.JourneySearchRequest;
import com.unibus.api.transport.dto.TransportDtos.JourneyTrackingSnapshot;
import com.unibus.api.transport.dto.TransportDtos.PlaceReverseResult;
import com.unibus.api.transport.dto.TransportDtos.PlaceSuggestion;
import com.unibus.api.transport.dto.TransportDtos.RouteLookup;
import com.unibus.api.transport.dto.TransportDtos.RouteMapPreview;
import com.unibus.api.transport.dto.TransportDtos.RouteSuggestion;
import com.unibus.api.transport.dto.TransportDtos.StopSummary;

@RestController
@RequestMapping("/api/v1")
@PreAuthorize("hasRole('STUDENT')")
public class TransportController {

    private final TransportService transportService;
    private final PlaceService placeService;
    private final JourneyPlannerService journeyPlannerService;
    private final JourneyTrackingService journeyTrackingService;

    public TransportController(
            TransportService transportService,
            PlaceService placeService,
            JourneyPlannerService journeyPlannerService,
            JourneyTrackingService journeyTrackingService) {
        this.transportService = transportService;
        this.placeService = placeService;
        this.journeyPlannerService = journeyPlannerService;
        this.journeyTrackingService = journeyTrackingService;
    }

    @GetMapping("/stops")
    ApiResponse<List<StopSummary>> getStops(@AuthenticationPrincipal CurrentUser currentUser) {
        return ApiResponse.ok("Stops retrieved", transportService.getActiveStops(currentUser));
    }

    @GetMapping("/places/search")
    ApiResponse<List<PlaceSuggestion>> searchPlaces(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) BigDecimal lat,
            @RequestParam(required = false) BigDecimal lng,
            @RequestParam(required = false) Integer limit) {
        return ApiResponse.ok("Places retrieved", placeService.search(q, lat, lng, limit));
    }

    @GetMapping("/places/reverse")
    ApiResponse<PlaceReverseResult> reversePlace(
            @RequestParam BigDecimal lat,
            @RequestParam BigDecimal lng) {
        return ApiResponse.ok("Place resolved", placeService.reverse(lat, lng));
    }

    @PostMapping("/journeys/search")
    ApiResponse<List<JourneyOption>> searchJourneys(
            @AuthenticationPrincipal CurrentUser currentUser,
            @RequestBody JourneySearchRequest request) {
        return ApiResponse.ok("Journeys retrieved", journeyPlannerService.search(currentUser, request));
    }

    @GetMapping("/tracking/journeys/{journeyId}")
    ApiResponse<JourneyTrackingSnapshot> trackJourney(@PathVariable String journeyId) {
        return ApiResponse.ok("Journey tracking retrieved", journeyTrackingService.snapshot(journeyId));
    }

    @GetMapping("/tracking/routes/{routeId}")
    ApiResponse<JourneyTrackingSnapshot> trackRoute(
            @PathVariable Integer routeId,
            @RequestParam(required = false) Integer boardingStopId,
            @RequestParam(required = false) Integer alightingStopId) {
        return ApiResponse.ok("Route tracking retrieved", journeyTrackingService.routeSnapshot(routeId, boardingStopId, alightingStopId));
    }

    @GetMapping("/routes/search")
    ApiResponse<List<RouteSuggestion>> searchRoutes(
            @AuthenticationPrincipal CurrentUser currentUser,
            @RequestParam Integer boardingStopId,
            @RequestParam Integer alightingStopId) {
        return ApiResponse.ok("Routes retrieved", transportService.searchRoutes(currentUser, boardingStopId, alightingStopId));
    }

    @GetMapping("/routes")
    ApiResponse<List<RouteLookup>> listRoutes(@AuthenticationPrincipal CurrentUser currentUser) {
        return ApiResponse.ok("Routes retrieved", transportService.listRoutes(currentUser));
    }

    @GetMapping("/routes/{routeId}")
    ApiResponse<RouteSuggestion> getRoute(@AuthenticationPrincipal CurrentUser currentUser, @PathVariable Integer routeId) {
        return ApiResponse.ok("Route retrieved", transportService.getRoute(currentUser, routeId));
    }

    @GetMapping("/routes/{routeId}/preview")
    ApiResponse<RouteMapPreview> getRoutePreview(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Integer routeId,
            @RequestParam(required = false) Integer direction) {
        return ApiResponse.ok("Route preview retrieved", transportService.getRoutePreview(currentUser, routeId, direction));
    }

    @GetMapping("/routes/{routeId}/stops/{stopId}/eta")
    ApiResponse<List<Eta>> getEta(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Integer routeId,
            @PathVariable Integer stopId) {
        return ApiResponse.ok("ETA retrieved", transportService.getEtas(currentUser, routeId, stopId));
    }
}
