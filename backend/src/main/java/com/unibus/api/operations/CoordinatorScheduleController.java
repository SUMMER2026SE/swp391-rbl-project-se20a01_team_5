package com.unibus.api.operations;

import java.time.LocalDate;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.unibus.api.common.ApiResponse;
import com.unibus.api.operations.OperationsDtos.SaveSchedulesRequest;
import com.unibus.api.operations.OperationsDtos.ScheduleDashboard;
import com.unibus.api.security.CurrentUser;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/operations/schedules")
@PreAuthorize("hasAnyRole('DISPATCHER', 'ADMIN')")
public class CoordinatorScheduleController {

    private final OperationsService operationsService;

    public CoordinatorScheduleController(OperationsService operationsService) {
        this.operationsService = operationsService;
    }

    @GetMapping
    ApiResponse<ScheduleDashboard> getDashboard(@RequestParam(required = false) LocalDate date) {
        return ApiResponse.ok("Schedule dashboard retrieved", operationsService.getScheduleDashboard(date));
    }

    @PostMapping
    ApiResponse<ScheduleDashboard> save(
            @AuthenticationPrincipal CurrentUser currentUser,
            @Valid @RequestBody SaveSchedulesRequest request) {
        return ApiResponse.ok("Schedules saved", operationsService.saveSchedules(currentUser, request));
    }
}
