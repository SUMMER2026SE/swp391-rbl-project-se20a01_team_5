package com.unibus.api.travel;

import com.unibus.api.common.ApiResponse;
import com.unibus.api.security.CurrentUser;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/v1/students/me/travel-history"})
@PreAuthorize("hasRole('STUDENT')")
public class TravelHistoryController {
   private final TravelHistoryService travelHistoryService;

   public TravelHistoryController(TravelHistoryService travelHistoryService) {
      this.travelHistoryService = travelHistoryService;
   }

   @GetMapping
   ApiResponse<List<TravelHistoryRepository.TravelHistoryView>> getHistory(@AuthenticationPrincipal CurrentUser currentUser, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
      return ApiResponse.<List<TravelHistoryRepository.TravelHistoryView>>ok("Travel history retrieved", this.travelHistoryService.getHistory(currentUser, page, size));
   }
}
