package com.unibus.api.driverRating;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.unibus.api.common.ApiResponse;
import com.unibus.api.driverRating.DriverRatingDtos.DriverRatingSummary;
import com.unibus.api.driverRating.DriverRatingDtos.DriverRatingView;
import com.unibus.api.driverRating.DriverRatingDtos.SubmitDriverRatingRequest;
import com.unibus.api.security.CurrentUser;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1")
public class DriverRatingController {

    private final DriverRatingService driverRatingService;

    public DriverRatingController(DriverRatingService driverRatingService) {
        this.driverRatingService = driverRatingService;
    }

    @PostMapping("/students/me/driver-ratings")
    @PreAuthorize("hasRole('STUDENT')")
    ApiResponse<DriverRatingView> submit(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Valid @RequestBody SubmitDriverRatingRequest request) {
        return ApiResponse.ok("Driver rating submitted", driverRatingService.submit(currentUser, request));
    }

    @GetMapping("/drivers/{driverId}/ratings")
    ApiResponse<List<DriverRatingView>> listByDriver(
            @PathVariable Integer driverId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok("Driver ratings retrieved", driverRatingService.listByDriver(driverId, page, size));
    }

    @GetMapping("/drivers/{driverId}/ratings/summary")
    ApiResponse<DriverRatingSummary> summarize(@PathVariable Integer driverId) {
        return ApiResponse.ok("Driver rating summary retrieved", driverRatingService.summarize(driverId));
    }
}
