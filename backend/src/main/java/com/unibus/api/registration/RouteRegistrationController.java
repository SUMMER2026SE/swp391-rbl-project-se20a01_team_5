package com.unibus.api.registration;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.unibus.api.common.ApiResponse;
import com.unibus.api.registration.dto.RegistrationDtos.CancellationRequest;
import com.unibus.api.registration.dto.RegistrationDtos.Registration;
import com.unibus.api.registration.dto.RegistrationDtos.RegistrationRequest;
import com.unibus.api.security.CurrentUser;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/students/me/route-registrations")
@PreAuthorize("hasRole('STUDENT')")
public class RouteRegistrationController {

    private final RouteRegistrationService routeRegistrationService;

    public RouteRegistrationController(RouteRegistrationService routeRegistrationService) {
        this.routeRegistrationService = routeRegistrationService;
    }

    @GetMapping
    ApiResponse<List<Registration>> listActive(@AuthenticationPrincipal CurrentUser currentUser) {
        return ApiResponse.ok("Route registrations retrieved", routeRegistrationService.listActive(currentUser));
    }

    @GetMapping("/current")
    ApiResponse<Registration> getCurrent(@AuthenticationPrincipal CurrentUser currentUser) {
        return ApiResponse.ok("Current registration retrieved", routeRegistrationService.getCurrent(currentUser));
    }

    @PostMapping
    ResponseEntity<ApiResponse<Registration>> register(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Valid @RequestBody RegistrationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Route registered", routeRegistrationService.register(currentUser, request)));
    }

    @PutMapping("/{registrationId}")
    ApiResponse<Registration> change(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Integer registrationId,
            @Valid @RequestBody RegistrationRequest request) {
        return ApiResponse.ok(
                "Route registration changed",
                routeRegistrationService.change(currentUser, registrationId, request));
    }

    @DeleteMapping("/{registrationId}")
    ApiResponse<Void> cancel(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Integer registrationId,
            @Valid @RequestBody(required = false) CancellationRequest request) {
        routeRegistrationService.cancel(currentUser, registrationId, request == null ? null : request.reason());
        return ApiResponse.ok("Route registration cancelled", null);
    }
}
