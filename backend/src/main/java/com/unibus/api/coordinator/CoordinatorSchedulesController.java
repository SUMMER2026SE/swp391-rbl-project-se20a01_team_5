package com.unibus.api.coordinator;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.unibus.api.common.ApiResponse;
import com.unibus.api.coordinator.dto.CoordinatorSchedulesDtos.BusDropdownDto;
import com.unibus.api.coordinator.dto.CoordinatorSchedulesDtos.ConductorDropdownDto;
import com.unibus.api.coordinator.dto.CoordinatorSchedulesDtos.CreateScheduleRequest;
import com.unibus.api.coordinator.dto.CoordinatorSchedulesDtos.DriverDropdownDto;
import com.unibus.api.coordinator.dto.CoordinatorSchedulesDtos.ScheduleListItem;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/coordinator/schedules")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('DISPATCHER', 'ADMIN')")
public class CoordinatorSchedulesController {

    private final CoordinatorSchedulesService schedulesService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ScheduleListItem>>> getAllSchedules() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", schedulesService.getAllSchedules()));
    }

    @GetMapping("/routes/{routeId}")
    public ResponseEntity<ApiResponse<List<ScheduleListItem>>> getSchedulesByRoute(@PathVariable Integer routeId) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", schedulesService.getSchedulesByRoute(routeId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ScheduleListItem>> createSchedule(@RequestBody CreateScheduleRequest request) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Schedule created successfully", schedulesService.createSchedule(request)));
    }

    @PutMapping("/{scheduleId}")
    public ResponseEntity<ApiResponse<ScheduleListItem>> updateSchedule(@PathVariable Integer scheduleId, @RequestBody CreateScheduleRequest request) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Schedule updated", schedulesService.updateSchedule(scheduleId, request)));
    }

    @DeleteMapping("/{scheduleId}")
    public ResponseEntity<ApiResponse<Void>> deleteSchedule(@PathVariable Integer scheduleId) {
        schedulesService.deleteSchedule(scheduleId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Schedule deleted successfully", null));
    }

    @GetMapping("/buses")
    public ResponseEntity<ApiResponse<List<BusDropdownDto>>> getAvailableBuses() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", schedulesService.getAvailableBuses()));
    }

    @GetMapping("/drivers")
    public ResponseEntity<ApiResponse<List<DriverDropdownDto>>> getAvailableDrivers() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", schedulesService.getAvailableDrivers()));
    }

    @GetMapping("/conductors")
    public ResponseEntity<ApiResponse<List<ConductorDropdownDto>>> getAvailableConductors() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", schedulesService.getAvailableConductors()));
    }
}
