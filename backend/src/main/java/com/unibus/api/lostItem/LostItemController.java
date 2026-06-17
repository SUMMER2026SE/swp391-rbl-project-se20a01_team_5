package com.unibus.api.lostItem;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.unibus.api.common.ApiResponse;
import com.unibus.api.lostItem.LostItemDtos.CreateLostItemReportRequest;
import com.unibus.api.lostItem.LostItemDtos.LostItemReportView;
import com.unibus.api.security.CurrentUser;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/students/me/lost-items")
@PreAuthorize("hasRole('STUDENT')")
public class LostItemController {

    private final LostItemService lostItemService;

    public LostItemController(LostItemService lostItemService) {
        this.lostItemService = lostItemService;
    }

    @GetMapping
    ApiResponse<List<LostItemReportView>> listMine(
            @AuthenticationPrincipal CurrentUser currentUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok("Lost item reports retrieved", lostItemService.listMine(currentUser, page, size));
    }

    @PostMapping
    ApiResponse<LostItemReportView> create(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Valid @RequestBody CreateLostItemReportRequest request) {
        return ApiResponse.ok("Lost item report submitted", lostItemService.create(currentUser, request));
    }
}
