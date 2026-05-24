package com.bussvdn.backend.controller;

import com.bussvdn.backend.dto.DriverAssistantDtos.CreatedIdResponse;
import com.bussvdn.backend.dto.DriverAssistantDtos.IncidentRequest;
import com.bussvdn.backend.dto.DriverAssistantDtos.LostItemRequest;
import com.bussvdn.backend.dto.DriverAssistantDtos.ScanTicketRequest;
import com.bussvdn.backend.dto.DriverAssistantDtos.ScanTicketResponse;
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
@RequestMapping("/api/assistants")
public class AssistantController {
    private final DriverAssistantService service;

    public AssistantController(DriverAssistantService service) {
        this.service = service;
    }

    @GetMapping("/{maPhuXe}/trips")
    public List<TripResponse> trips(
            @PathVariable Integer maPhuXe,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return service.assistantTrips(maPhuXe, from, to);
    }

    @PostMapping("/{maPhuXe}/tickets/scan")
    public ScanTicketResponse scanTicket(
            @PathVariable Integer maPhuXe,
            @Valid @RequestBody ScanTicketRequest request) {
        return service.scanTicket(maPhuXe, request);
    }

    @PostMapping("/{maPhuXe}/lost-items")
    public CreatedIdResponse createLostItem(
            @PathVariable Integer maPhuXe,
            @Valid @RequestBody LostItemRequest request) {
        return service.createLostItem(maPhuXe, request);
    }

    @PostMapping("/{maPhuXe}/incidents")
    public CreatedIdResponse createIncident(
            @PathVariable Integer maPhuXe,
            @Valid @RequestBody IncidentRequest request) {
        return service.createIncident(maPhuXe, request);
    }
}
