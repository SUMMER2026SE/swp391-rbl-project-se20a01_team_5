package com.bussvdn.backend.controller;

import com.bussvdn.backend.dto.DriverAssistantDtos.GpsRequest;
import com.bussvdn.backend.dto.DriverAssistantDtos.ScheduleResponse;
import com.bussvdn.backend.dto.DriverAssistantDtos.TripResponse;
import com.bussvdn.backend.service.DriverAssistantService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/drivers")
public class DriverController {
    private final DriverAssistantService service;

    public DriverController(DriverAssistantService service) {
        this.service = service;
    }

    @GetMapping("/{maTaiXe}/schedules")
    public List<ScheduleResponse> schedules(@PathVariable Integer maTaiXe) {
        return service.driverSchedules(maTaiXe);
    }

    @GetMapping("/{maTaiXe}/trips")
    public List<TripResponse> trips(
            @PathVariable Integer maTaiXe,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return service.driverTrips(maTaiXe, from, to);
    }

    @PostMapping("/{maTaiXe}/trips/{maChuyenXe}/start")
    public TripResponse startTrip(
            @PathVariable Integer maTaiXe,
            @PathVariable Integer maChuyenXe,
            @Valid @RequestBody(required = false) GpsRequest request) {
        return service.startTrip(maTaiXe, maChuyenXe, request);
    }

    @PostMapping("/{maTaiXe}/trips/{maChuyenXe}/end")
    public TripResponse endTrip(
            @PathVariable Integer maTaiXe,
            @PathVariable Integer maChuyenXe,
            @Valid @RequestBody(required = false) GpsRequest request) {
        return service.endTrip(maTaiXe, maChuyenXe, request);
    }
}
