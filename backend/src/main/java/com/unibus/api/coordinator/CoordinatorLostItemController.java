package com.unibus.api.coordinator;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.unibus.api.common.ApiResponse;
import com.unibus.api.experience.ExperienceDtos.LostItemCard;
import com.unibus.api.experience.ExperienceDtos.UpdateLostItemStatusRequest;
import com.unibus.api.experience.ExperienceService;
import com.unibus.api.security.CurrentUser;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/coordinator/lost-items")
@PreAuthorize("hasRole('DISPATCHER')")
public class CoordinatorLostItemController {

    private final ExperienceService experienceService;

    public CoordinatorLostItemController(ExperienceService experienceService) {
        this.experienceService = experienceService;
    }

    @GetMapping
    public ApiResponse<List<LostItemCard>> listLostItems() {
        return ApiResponse.ok("Lost items retrieved", experienceService.coordinatorLostItems());
    }

    @PutMapping("/{lostItemId}")
    public ApiResponse<LostItemCard> updateLostItem(
            @AuthenticationPrincipal CurrentUser currentUser,
            @PathVariable Integer lostItemId,
            @Valid @RequestBody UpdateLostItemStatusRequest request) {
        return ApiResponse.ok("Lost item updated", experienceService.coordinatorUpdateLostItem(currentUser, lostItemId, request));
    }
}
