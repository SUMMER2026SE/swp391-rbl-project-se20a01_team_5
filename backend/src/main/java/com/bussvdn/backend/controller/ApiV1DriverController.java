package com.bussvdn.backend.controller;

import com.bussvdn.backend.dto.DriverAssistantDtos.ContactResponse;
import com.bussvdn.backend.dto.DriverAssistantDtos.GpsRequest;
import com.bussvdn.backend.dto.DriverAssistantDtos.RouteStopResponse;
import com.bussvdn.backend.dto.DriverAssistantDtos.ScheduleResponse;
import com.bussvdn.backend.dto.DriverAssistantDtos.TripResponse;
import com.bussvdn.backend.service.DriverAssistantService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/driver")
public class ApiV1DriverController {
    private static final Integer DEFAULT_DRIVER_ID = 1;
    private static final Integer DEFAULT_TRIP_ID = 1;

    private final DriverAssistantService service;

    public ApiV1DriverController(DriverAssistantService service) {
        this.service = service;
    }

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard(@RequestParam(defaultValue = "1") Integer maTaiXe) {
        LocalDate today = LocalDate.now();
        List<TripResponse> trips = service.driverTrips(maTaiXe, today, today.plusDays(7));
        List<ScheduleResponse> schedules = service.driverSchedules(maTaiXe);
        TripResponse currentTrip = trips.stream()
                .filter(trip -> "DANG_CHAY".equals(trip.trangThai()) || "CHUA_BAT_DAU".equals(trip.trangThai()))
                .findFirst()
                .orElse(null);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("currentTrip", currentTrip);
        response.put("nextSchedules", schedules);
        response.put("tripStatus", currentTrip == null ? "IDLE" : currentTrip.trangThai());
        return response;
    }

    @GetMapping("/trips")
    public List<TripResponse> trips(
            @RequestParam(defaultValue = "1") Integer maTaiXe,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to) {
        LocalDate start = from == null ? LocalDate.now() : from;
        LocalDate end = to == null ? start.plusDays(7) : to;
        return service.driverTrips(maTaiXe, start, end);
    }

    @GetMapping("/trips/current")
    public Map<String, Object> currentTrip(@RequestParam(defaultValue = "1") Integer maTaiXe) {
        LocalDate today = LocalDate.now();
        TripResponse trip = service.driverTrips(maTaiXe, today, today.plusDays(7)).stream()
                .findFirst()
                .orElse(null);
        Integer maChuyenXe = trip == null ? DEFAULT_TRIP_ID : trip.maChuyenXe();
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("trip", trip);
        response.put("routeStops", service.routeStops(maChuyenXe));
        response.put("contacts", service.contacts(maChuyenXe));
        return response;
    }

    @GetMapping("/trips/{maChuyenXe}/route-stops")
    public List<RouteStopResponse> routeStops(@PathVariable Integer maChuyenXe) {
        return service.routeStops(maChuyenXe);
    }

    @PostMapping("/trips/{maChuyenXe}/start")
    public TripResponse startTrip(
            @PathVariable Integer maChuyenXe,
            @RequestParam(defaultValue = "1") Integer maTaiXe,
            @Valid @RequestBody(required = false) GpsRequest request) {
        return service.startTrip(maTaiXe, maChuyenXe, request);
    }

    @PostMapping("/trips/{maChuyenXe}/end")
    public TripResponse endTrip(
            @PathVariable Integer maChuyenXe,
            @RequestParam(defaultValue = "1") Integer maTaiXe,
            @Valid @RequestBody(required = false) GpsRequest request) {
        return service.endTrip(maTaiXe, maChuyenXe, request);
    }

    @GetMapping("/contact")
    public Map<String, Object> contact(@RequestParam(defaultValue = "1") Integer maChuyenXe) {
        List<ContactResponse> contacts = service.contacts(maChuyenXe);
        return Map.of(
                "contacts", contacts,
                "sosTypes", List.of("KHAN_CAP", "KY_THUAT", "KET_XE", "KHAC"));
    }

    @GetMapping("/profile")
    public Map<String, Object> profile(@RequestParam(defaultValue = "1") Integer maTaiXe) {
        List<ScheduleResponse> schedules = service.driverSchedules(maTaiXe);
        return Map.of(
                "maTaiXe", maTaiXe,
                "schedules", schedules,
                "totalSchedules", schedules.size(),
                "status", "ACTIVE");
    }
}
