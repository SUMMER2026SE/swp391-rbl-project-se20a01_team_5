package com.unibus.api.operations;

import java.time.LocalDate;
import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.unibus.api.common.ApiResponse;
import com.unibus.api.operations.OperationsDtos.LiveFleetVehicle;

@RestController
@RequestMapping("/api/v1/coordinator/fleet")
@PreAuthorize("hasAnyRole('DISPATCHER', 'ADMIN')")
public class CoordinatorFleetController {

    private final OperationsService operationsService;

    public CoordinatorFleetController(OperationsService operationsService) {
        this.operationsService = operationsService;
    }

    @GetMapping("/live")
    ApiResponse<List<LiveFleetVehicle>> liveFleet(@RequestParam(required = false) LocalDate date) {
        return ApiResponse.ok("Live fleet retrieved", operationsService.getLiveFleet(date));
    }
}
