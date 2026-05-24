package com.unibus.api.registration;

import com.unibus.api.common.ApiResponse;
import com.unibus.api.registration.dto.RegistrationDtos;
import com.unibus.api.security.CurrentUser;
import jakarta.validation.Valid;
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

@RestController
@RequestMapping({"/api/v1/students/me/route-registrations"})
@PreAuthorize("hasRole('STUDENT')")
public class RouteRegistrationController {
   private final RouteRegistrationService routeRegistrationService;

   public RouteRegistrationController(RouteRegistrationService routeRegistrationService) {
      this.routeRegistrationService = routeRegistrationService;
   }

   @GetMapping({"/current"})
   ApiResponse<RegistrationDtos.Registration> getCurrent(@AuthenticationPrincipal CurrentUser currentUser) {
      return ApiResponse.<RegistrationDtos.Registration>ok("Current registration retrieved", this.routeRegistrationService.getCurrent(currentUser));
   }

   @PostMapping
   ResponseEntity<ApiResponse<RegistrationDtos.Registration>> register(@AuthenticationPrincipal CurrentUser currentUser, @RequestBody RegistrationDtos.@Valid RegistrationRequest request) {
      return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Route registered", this.routeRegistrationService.register(currentUser, request)));
   }

   @PutMapping({"/{registrationId}"})
   ApiResponse<RegistrationDtos.Registration> change(@AuthenticationPrincipal CurrentUser currentUser, @PathVariable Integer registrationId, @RequestBody RegistrationDtos.@Valid RegistrationRequest request) {
      return ApiResponse.<RegistrationDtos.Registration>ok("Route registration changed", this.routeRegistrationService.change(currentUser, registrationId, request));
   }

   @DeleteMapping({"/{registrationId}"})
   ApiResponse<Void> cancel(@AuthenticationPrincipal CurrentUser currentUser, @PathVariable Integer registrationId, @RequestBody(required = false) RegistrationDtos.@Valid CancellationRequest request) {
      this.routeRegistrationService.cancel(currentUser, registrationId, request == null ? null : request.reason());
      return ApiResponse.<Void>ok("Route registration cancelled", (Void)null);
   }
}
