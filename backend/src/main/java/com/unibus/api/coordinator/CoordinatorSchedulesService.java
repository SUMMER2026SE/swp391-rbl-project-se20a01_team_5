package com.unibus.api.coordinator;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.unibus.api.coordinator.dto.CoordinatorSchedulesDtos.BusDropdownDto;
import com.unibus.api.coordinator.dto.CoordinatorSchedulesDtos.CreateScheduleRequest;
import com.unibus.api.coordinator.dto.CoordinatorSchedulesDtos.DriverDropdownDto;
import com.unibus.api.coordinator.dto.CoordinatorSchedulesDtos.ScheduleListItem;
import com.unibus.api.transport.BusRepository;
import com.unibus.api.transport.BusRouteRepository;
import com.unibus.api.transport.BusScheduleRepository;
import com.unibus.api.transport.model.Bus;
import com.unibus.api.transport.model.BusRoute;
import com.unibus.api.transport.model.BusSchedule;
import com.unibus.api.user.DriverRepository;
import com.unibus.api.user.model.Driver;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CoordinatorSchedulesService {

    private final BusScheduleRepository scheduleRepository;
    private final BusRouteRepository routeRepository;
    private final BusRepository busRepository;
    private final DriverRepository driverRepository;

    @Transactional(readOnly = true)
    public List<ScheduleListItem> getAllSchedules() {
        return scheduleRepository.findAll().stream()
                .map(s -> new ScheduleListItem(
                        s.getId(),
                        s.getRoute() != null ? s.getRoute().getId() : null,
                        s.getRoute() != null ? s.getRoute().getRouteName() : "Unknown Route",
                        s.getBus() != null ? s.getBus().getId() : null,
                        s.getBus() != null ? s.getBus().getLicensePlate() : "No Bus",
                        s.getDriver() != null ? s.getDriver().getId() : null,
                        s.getDriver() != null && s.getDriver().getUser() != null ? s.getDriver().getUser().getFullName() : "No Driver",
                        s.getWeekdayNumber(),
                        s.getDepartureTime(),
                        s.getEndTime(),
                        s.getStatus()
                ))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ScheduleListItem> getSchedulesByRoute(Integer routeId) {
        return scheduleRepository.findByRouteId(routeId).stream()
                .map(s -> new ScheduleListItem(
                        s.getId(),
                        s.getRoute() != null ? s.getRoute().getId() : null,
                        s.getRoute() != null ? s.getRoute().getRouteName() : "Unknown Route",
                        s.getBus() != null ? s.getBus().getId() : null,
                        s.getBus() != null ? s.getBus().getLicensePlate() : "No Bus",
                        s.getDriver() != null ? s.getDriver().getId() : null,
                        s.getDriver() != null && s.getDriver().getUser() != null ? s.getDriver().getUser().getFullName() : "No Driver",
                        s.getWeekdayNumber(),
                        s.getDepartureTime(),
                        s.getEndTime(),
                        s.getStatus()
                ))
                .collect(Collectors.toList());
    }

    @Transactional
    public ScheduleListItem createSchedule(CreateScheduleRequest request) {
        BusRoute route = routeRepository.findById(request.routeId()).orElseThrow();

        BusSchedule schedule = new BusSchedule();
        schedule.setRoute(route);
        
        if (request.busId() != null) {
            Bus bus = busRepository.findById(request.busId()).orElseThrow();
            schedule.setBus(bus);
        }
        
        if (request.driverId() != null) {
            Driver driver = driverRepository.findById(request.driverId()).orElseThrow();
            schedule.setDriver(driver);
        }
        
        schedule.setWeekdayNumber(request.weekdayNumber());
        schedule.setDepartureTime(request.departureTime());
        schedule.setStatus("ACTIVE");

        schedule = scheduleRepository.save(schedule);

        return new ScheduleListItem(
                schedule.getId(),
                route.getId(),
                route.getRouteName(),
                schedule.getBus() != null ? schedule.getBus().getId() : null,
                schedule.getBus() != null ? schedule.getBus().getLicensePlate() : "No Bus",
                schedule.getDriver() != null ? schedule.getDriver().getId() : null,
                schedule.getDriver() != null && schedule.getDriver().getUser() != null ? schedule.getDriver().getUser().getFullName() : "No Driver",
                schedule.getWeekdayNumber(),
                schedule.getDepartureTime(),
                schedule.getEndTime(),
                schedule.getStatus()
        );
    }

    @Transactional
    public ScheduleListItem updateSchedule(Integer scheduleId, CreateScheduleRequest request) {
        BusSchedule schedule = scheduleRepository.findById(scheduleId).orElseThrow();
        
        if (request.routeId() != null) {
            BusRoute route = routeRepository.findById(request.routeId()).orElseThrow();
            schedule.setRoute(route);
        }
        
        if (request.weekdayNumber() != null) {
            schedule.setWeekdayNumber(request.weekdayNumber());
        }
        
        if (request.departureTime() != null) {
            schedule.setDepartureTime(request.departureTime());
        }

        if (request.busId() != null) {
            Bus bus = busRepository.findById(request.busId()).orElseThrow();
            schedule.setBus(bus);
        } else {
            schedule.setBus(null);
        }
        
        if (request.driverId() != null) {
            Driver driver = driverRepository.findById(request.driverId()).orElseThrow();
            schedule.setDriver(driver);
        } else {
            schedule.setDriver(null);
        }

        schedule = scheduleRepository.save(schedule);

        return new ScheduleListItem(
                schedule.getId(),
                schedule.getRoute() != null ? schedule.getRoute().getId() : null,
                schedule.getRoute() != null ? schedule.getRoute().getRouteName() : "Unknown Route",
                schedule.getBus() != null ? schedule.getBus().getId() : null,
                schedule.getBus() != null ? schedule.getBus().getLicensePlate() : "No Bus",
                schedule.getDriver() != null ? schedule.getDriver().getId() : null,
                schedule.getDriver() != null && schedule.getDriver().getUser() != null ? schedule.getDriver().getUser().getFullName() : "No Driver",
                schedule.getWeekdayNumber(),
                schedule.getDepartureTime(),
                schedule.getEndTime(),
                schedule.getStatus()
        );
    }

    @Transactional
    public void deleteSchedule(Integer scheduleId) {
        scheduleRepository.deleteTripsByScheduleId(scheduleId);
        scheduleRepository.deleteById(scheduleId);
    }

    @Transactional(readOnly = true)
    public List<BusDropdownDto> getAvailableBuses() {
        return busRepository.findAll().stream()
                .map(b -> new BusDropdownDto(b.getId(), b.getLicensePlate(), b.getSeatCount()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DriverDropdownDto> getAvailableDrivers() {
        return driverRepository.findAll().stream()
                .map(d -> new DriverDropdownDto(
                        d.getId(),
                        d.getUser() != null ? d.getUser().getFullName() : "Unknown Driver"
                ))
                .collect(Collectors.toList());
    }
}
