package com.unibus.api.coordinator;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.unibus.api.coordinator.dto.CoordinatorSchedulesDtos.BusDropdownDto;
import com.unibus.api.coordinator.dto.CoordinatorSchedulesDtos.CreateScheduleRequest;
import com.unibus.api.coordinator.dto.CoordinatorSchedulesDtos.DriverDropdownDto;
import com.unibus.api.coordinator.dto.CoordinatorSchedulesDtos.ConductorDropdownDto;
import com.unibus.api.coordinator.dto.CoordinatorSchedulesDtos.ScheduleListItem;
import com.unibus.api.transport.BusRepository;
import com.unibus.api.transport.BusRouteRepository;
import com.unibus.api.transport.BusScheduleRepository;
import com.unibus.api.transport.model.Bus;
import com.unibus.api.transport.model.BusRoute;
import com.unibus.api.transport.model.BusSchedule;
import com.unibus.api.user.DriverRepository;
import com.unibus.api.user.ConductorRepository;
import com.unibus.api.user.UserRepository;
import com.unibus.api.user.model.Driver;
import com.unibus.api.user.model.Conductor;
import com.unibus.api.user.model.User;

import java.time.OffsetDateTime;
import java.time.LocalDate;
import java.time.DayOfWeek;
import java.time.temporal.TemporalAdjusters;

import org.springframework.jdbc.core.JdbcTemplate;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CoordinatorSchedulesService {

    private final BusScheduleRepository scheduleRepository;
    private final BusRouteRepository routeRepository;
    private final BusRepository busRepository;
    private final DriverRepository driverRepository;
    private final ConductorRepository conductorRepository;
    private final UserRepository userRepository;
    private final JdbcTemplate jdbcTemplate;

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
                        s.getConductor() != null ? s.getConductor().getId() : null,
                        s.getConductor() != null && s.getConductor().getUser() != null ? s.getConductor().getUser().getFullName() : "No Conductor",
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
                        s.getConductor() != null ? s.getConductor().getId() : null,
                        s.getConductor() != null && s.getConductor().getUser() != null ? s.getConductor().getUser().getFullName() : "No Conductor",
                        s.getWeekdayNumber(),
                        s.getDepartureTime(),
                        s.getEndTime(),
                        s.getStatus()
                ))
                .collect(Collectors.toList());
    }

    @Transactional
    public ScheduleListItem createSchedule(CreateScheduleRequest request, Integer currentUserId) {
        BusRoute route = routeRepository.findById(request.routeId()).orElseThrow();
        User currentUser = userRepository.findById(currentUserId).orElseThrow();

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
        
        if (request.conductorId() != null) {
            Conductor conductor = conductorRepository.findById(request.conductorId()).orElseThrow();
            schedule.setConductor(conductor);
        }
        
        schedule.setWeekdayNumber(request.weekdayNumber());
        schedule.setDepartureTime(request.departureTime());
        schedule.setStatus("ACTIVE");
        schedule.setAssignedByUser(currentUser);
        schedule.setAssignedAt(OffsetDateTime.now());

        schedule = scheduleRepository.save(schedule);
        createInitialTrip(schedule);

        return new ScheduleListItem(
                schedule.getId(),
                route.getId(),
                route.getRouteName(),
                schedule.getBus() != null ? schedule.getBus().getId() : null,
                schedule.getBus() != null ? schedule.getBus().getLicensePlate() : "No Bus",
                schedule.getDriver() != null ? schedule.getDriver().getId() : null,
                schedule.getDriver() != null && schedule.getDriver().getUser() != null ? schedule.getDriver().getUser().getFullName() : "No Driver",
                schedule.getConductor() != null ? schedule.getConductor().getId() : null,
                schedule.getConductor() != null && schedule.getConductor().getUser() != null ? schedule.getConductor().getUser().getFullName() : "No Conductor",
                schedule.getWeekdayNumber(),
                schedule.getDepartureTime(),
                schedule.getEndTime(),
                schedule.getStatus()
        );
    }

    @Transactional
    public ScheduleListItem updateSchedule(Integer scheduleId, CreateScheduleRequest request, Integer currentUserId) {
        Integer activeTripsCount = jdbcTemplate.queryForObject(
            "SELECT count(*) FROM trips WHERE schedule_id = ? AND status IN ('RUNNING', 'COMPLETED')",
            Integer.class, scheduleId
        );
        if (activeTripsCount != null && activeTripsCount > 0) {
            throw new IllegalArgumentException("Không thể thay đổi thông tin vì tài xế đã bắt đầu hoặc kết thúc chuyến đi này.");
        }

        BusSchedule schedule = scheduleRepository.findById(scheduleId).orElseThrow();
        User currentUser = userRepository.findById(currentUserId).orElseThrow();
        
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

        if (request.conductorId() != null) {
            Conductor conductor = conductorRepository.findById(request.conductorId()).orElseThrow();
            schedule.setConductor(conductor);
        } else {
            schedule.setConductor(null);
        }

        schedule.setAssignedByUser(currentUser);
        schedule.setAssignedAt(OffsetDateTime.now());

        schedule = scheduleRepository.save(schedule);
        updateTripsAssignment(schedule, currentUserId);

        return new ScheduleListItem(
                schedule.getId(),
                schedule.getRoute() != null ? schedule.getRoute().getId() : null,
                schedule.getRoute() != null ? schedule.getRoute().getRouteName() : "Unknown Route",
                schedule.getBus() != null ? schedule.getBus().getId() : null,
                schedule.getBus() != null ? schedule.getBus().getLicensePlate() : "No Bus",
                schedule.getDriver() != null ? schedule.getDriver().getId() : null,
                schedule.getDriver() != null && schedule.getDriver().getUser() != null ? schedule.getDriver().getUser().getFullName() : "No Driver",
                schedule.getConductor() != null ? schedule.getConductor().getId() : null,
                schedule.getConductor() != null && schedule.getConductor().getUser() != null ? schedule.getConductor().getUser().getFullName() : "No Conductor",
                schedule.getWeekdayNumber(),
                schedule.getDepartureTime(),
                schedule.getEndTime(),
                schedule.getStatus()
        );
    }

    @Transactional
    public void deleteSchedule(Integer scheduleId) {
        Integer activeTripsCount = jdbcTemplate.queryForObject(
            "SELECT count(*) FROM trips WHERE schedule_id = ? AND status IN ('RUNNING', 'COMPLETED')",
            Integer.class, scheduleId
        );
        if (activeTripsCount != null && activeTripsCount > 0) {
            throw new IllegalArgumentException("Không thể xóa lịch trình vì đã có chuyến đi đang chạy hoặc đã hoàn thành.");
        }
        
        jdbcTemplate.update("DELETE FROM trips WHERE schedule_id = ?", scheduleId);
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

    @Transactional(readOnly = true)
    public List<ConductorDropdownDto> getAvailableConductors() {
        return conductorRepository.findAll().stream()
                .map(c -> new ConductorDropdownDto(
                        c.getId(),
                        c.getUser() != null ? c.getUser().getFullName() : "Unknown Conductor"
                ))
                .collect(Collectors.toList());
    }

    private void updateTripsAssignment(BusSchedule schedule, Integer currentUserId) {
        if (schedule.getBus() == null || schedule.getDriver() == null) {
            jdbcTemplate.update("DELETE FROM trips WHERE schedule_id = ? AND status = 'NOT_STARTED'", schedule.getId());
        } else {
            int updated = jdbcTemplate.update("""
                    UPDATE trips
                    SET bus_id = ?,
                        driver_id = ?,
                        conductor_id = ?
                    WHERE schedule_id = ? AND status = 'NOT_STARTED'
                    """, 
                    schedule.getBus().getId(),
                    schedule.getDriver().getId(),
                    schedule.getConductor() != null ? schedule.getConductor().getId() : null,
                    schedule.getId()
            );
            if (updated == 0) {
                createInitialTrip(schedule);
            }
        }
    }

    private LocalDate calculateNextServiceDate(Integer weekdayNumber) {
        DayOfWeek targetDay;
        if (weekdayNumber == 1) {
            targetDay = DayOfWeek.SUNDAY;
        } else {
            targetDay = DayOfWeek.of(weekdayNumber - 1);
        }
        
        LocalDate today = LocalDate.now();
        if (today.getDayOfWeek() == targetDay) {
            return today;
        } else {
            return today.with(TemporalAdjusters.next(targetDay));
        }
    }

    private void createInitialTrip(BusSchedule schedule) {
        if (schedule.getWeekdayNumber() == null || schedule.getBus() == null || schedule.getDriver() == null) {
            return; // Cannot create trip without bus and driver
        }
        
        LocalDate serviceDate = calculateNextServiceDate(schedule.getWeekdayNumber());
        
        jdbcTemplate.update("""
                INSERT INTO trips (schedule_id, route_id, bus_id, driver_id, conductor_id, service_date, status)
                VALUES (?, ?, ?, ?, ?, ?, 'NOT_STARTED')
                """,
                schedule.getId(),
                schedule.getRoute().getId(),
                schedule.getBus().getId(),
                schedule.getDriver().getId(),
                schedule.getConductor() != null ? schedule.getConductor().getId() : null,
                serviceDate
        );
    }
}
