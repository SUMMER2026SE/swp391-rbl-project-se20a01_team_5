package com.unibus.api.admin;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.unibus.api.admin.AdminMonthlyPassDtos.MonthlyPassAdminView;
import com.unibus.api.common.ApiResponse;

@RestController
@RequestMapping("/api/v1/admin/monthly-passes")
@PreAuthorize("hasRole('ADMIN')")
public class AdminMonthlyPassController {

    private final AdminMonthlyPassService service;

    public AdminMonthlyPassController(AdminMonthlyPassService service) {
        this.service = service;
    }

    @GetMapping
    ApiResponse<List<MonthlyPassAdminView>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status) {
        return ApiResponse.ok("Monthly passes retrieved", service.list(keyword, status));
    }

    @PostMapping("/{monthlyPassId}/cancel")
    ApiResponse<MonthlyPassAdminView> cancel(@PathVariable Integer monthlyPassId) {
        return ApiResponse.ok("Monthly pass cancelled", service.cancel(monthlyPassId));
    }
}
