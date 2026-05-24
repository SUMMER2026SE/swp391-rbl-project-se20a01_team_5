package com.bussvdn.backend.controller;

import com.bussvdn.backend.dto.DriverAssistantDtos.ContactResponse;
import com.bussvdn.backend.dto.DriverAssistantDtos.MessageRequest;
import com.bussvdn.backend.dto.DriverAssistantDtos.MessageResponse;
import com.bussvdn.backend.dto.DriverAssistantDtos.RouteStopResponse;
import com.bussvdn.backend.service.DriverAssistantService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/trips")
public class TripController {
    private final DriverAssistantService service;

    public TripController(DriverAssistantService service) {
        this.service = service;
    }

    @GetMapping("/{maChuyenXe}/route-stops")
    public List<RouteStopResponse> routeStops(@PathVariable Integer maChuyenXe) {
        return service.routeStops(maChuyenXe);
    }

    @GetMapping("/{maChuyenXe}/contacts")
    public List<ContactResponse> contacts(@PathVariable Integer maChuyenXe) {
        return service.contacts(maChuyenXe);
    }

    @PostMapping("/messages")
    public MessageResponse sendMessage(@Valid @RequestBody MessageRequest request) {
        return service.sendMessage(request);
    }
}
