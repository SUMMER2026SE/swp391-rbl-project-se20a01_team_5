package com.unibus.api.operations;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.unibus.api.common.ApiResponse;
import com.unibus.api.operations.OperationsDtos.DriverContactView;
import com.unibus.api.security.CurrentUser;

@RestController
@RequestMapping("/api/v1/driver")
@PreAuthorize("hasRole('DRIVER')")
public class DriverContactController {

    private final OperationsService operationsService;

    public DriverContactController(OperationsService operationsService) {
        this.operationsService = operationsService;
    }

    @GetMapping("/contacts")
    ApiResponse<List<DriverContactView>> contacts(@AuthenticationPrincipal CurrentUser currentUser) {
        return ApiResponse.ok("Driver contacts retrieved", operationsService.getDriverContacts(currentUser));
    }
}
