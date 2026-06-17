package com.unibus.api.dispatch;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.unibus.api.common.ApiResponse;
import com.unibus.api.dispatch.DispatchDtos.DispatcherInbox;
import com.unibus.api.security.CurrentUser;

@RestController
@RequestMapping("/api/v1/dispatch")
@PreAuthorize("hasAnyRole('DISPATCHER', 'ADMIN')")
public class DispatcherInboxController {

    private final DispatchService dispatchService;

    public DispatcherInboxController(DispatchService dispatchService) {
        this.dispatchService = dispatchService;
    }

    @GetMapping("/inbox")
    ApiResponse<DispatcherInbox> inbox(@AuthenticationPrincipal CurrentUser currentUser) {
        return ApiResponse.ok("Dispatcher inbox retrieved", dispatchService.getDispatcherInbox(currentUser));
    }
}
