package com.unibus.api.coordinator;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.unibus.api.coordinator.dto.CoordinatorSchedulesDtos.BusDropdownDto;
import com.unibus.api.coordinator.dto.CoordinatorSchedulesDtos.ConductorDropdownDto;
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
    private final JdbcTemplate jdbcTemplate;

    @Transactional(readOnly = true)
    public List<ScheduleListItem> getAllSchedules() {
        return findScheduleItems(null);
    }

    @Transactional(readOnly = true)
    public List<ScheduleListItem> getSchedulesByRoute(Integer routeId) {
        return findScheduleItems(routeId);
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
        updateConductor(schedule.getId(), request.conductorId());
        syncTodayTrip(schedule.getId());

        return findScheduleItem(schedule.getId());
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
        updateConductor(schedule.getId(), request.conductorId());
        syncTodayTrip(schedule.getId());

        return findScheduleItem(schedule.getId());
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

    @Transactional(readOnly = true)
    public List<ConductorDropdownDto> getAvailableConductors() {
        return jdbcTemplate.query("""
                SELECT c.conductor_id, u.full_name
                FROM conductors c
                JOIN users u ON u.user_id = c.user_id
                WHERE u.role = 'CONDUCTOR' AND u.status = 'ACTIVE'
                ORDER BY u.full_name
                """, (rs, rowNum) -> new ConductorDropdownDto(
                        rs.getInt("conductor_id"),
                        rs.getString("full_name")));
    }

    private void updateConductor(Integer scheduleId, Integer conductorId) {
        jdbcTemplate.update("UPDATE bus_schedules SET conductor_id = ? WHERE schedule_id = ?", conductorId, scheduleId);
    }

    private void syncTodayTrip(Integer scheduleId) {
        jdbcTemplate.update("""
                DELETE FROM trips t
                USING bus_schedules bs
                WHERE t.schedule_id = bs.schedule_id
                  AND t.schedule_id = ?
                  AND t.service_date = CURRENT_DATE
                  AND (bs.bus_id IS NULL OR bs.driver_id IS NULL OR bs.conductor_id IS NULL)
                """, scheduleId);

        jdbcTemplate.update("""
                UPDATE trips t
                SET route_id = bs.route_id,
                    bus_id = bs.bus_id,
                    driver_id = bs.driver_id,
                    conductor_id = bs.conductor_id
                FROM bus_schedules bs
                WHERE bs.schedule_id = t.schedule_id
                  AND t.schedule_id = ?
                  AND t.service_date = CURRENT_DATE
                  AND bs.bus_id IS NOT NULL
                  AND bs.driver_id IS NOT NULL
                  AND bs.conductor_id IS NOT NULL
                """, scheduleId);

        jdbcTemplate.update("""
                INSERT INTO trips(schedule_id, route_id, bus_id, driver_id, conductor_id, service_date, status)
                SELECT bs.schedule_id, bs.route_id, bs.bus_id, bs.driver_id, bs.conductor_id, CURRENT_DATE, 'NOT_STARTED'
                FROM bus_schedules bs
                WHERE bs.schedule_id = ?
                  AND bs.weekday_number = EXTRACT(ISODOW FROM CURRENT_DATE)::int
                  AND bs.bus_id IS NOT NULL
                  AND bs.driver_id IS NOT NULL
                  AND bs.conductor_id IS NOT NULL
                  AND NOT EXISTS (
                      SELECT 1 FROM trips t
                      WHERE t.schedule_id = bs.schedule_id
                        AND t.service_date = CURRENT_DATE
                  )
                """, scheduleId);
    }

    private ScheduleListItem findScheduleItem(Integer scheduleId) {
        return findScheduleItems(null).stream()
                .filter(item -> item.id().equals(scheduleId))
                .findFirst()
                .orElseThrow();
    }

    private List<ScheduleListItem> findScheduleItems(Integer routeId) {
        String routeFilter = routeId == null ? "" : "WHERE bs.route_id = ?";
        Object[] args = routeId == null ? new Object[]{} : new Object[]{routeId};
        return jdbcTemplate.query("""
                SELECT bs.schedule_id, bs.route_id, r.route_name,
                       bs.bus_id, COALESCE(b.license_plate, 'No Bus') AS license_plate,
                       bs.driver_id, COALESCE(du.full_name, 'No Driver') AS driver_name,
                       bs.conductor_id, COALESCE(cu.full_name, 'No Conductor') AS conductor_name,
                       bs.weekday_number, bs.departure_time, bs.end_time, bs.status
                FROM bus_schedules bs
                LEFT JOIN routes r ON r.route_id = bs.route_id
                LEFT JOIN buses b ON b.bus_id = bs.bus_id
                LEFT JOIN drivers d ON d.driver_id = bs.driver_id
                LEFT JOIN users du ON du.user_id = d.user_id
                LEFT JOIN conductors c ON c.conductor_id = bs.conductor_id
                LEFT JOIN users cu ON cu.user_id = c.user_id
                %s
                ORDER BY bs.weekday_number, bs.departure_time, r.route_name
                """.formatted(routeFilter), (rs, rowNum) -> new ScheduleListItem(
                        rs.getInt("schedule_id"),
                        (Integer) rs.getObject("route_id"),
                        rs.getString("route_name"),
                        (Integer) rs.getObject("bus_id"),
                        rs.getString("license_plate"),
                        (Integer) rs.getObject("driver_id"),
                        rs.getString("driver_name"),
                        (Integer) rs.getObject("conductor_id"),
                        rs.getString("conductor_name"),
                        (Integer) rs.getObject("weekday_number"),
                        rs.getTime("departure_time") == null ? null : rs.getTime("departure_time").toLocalTime(),
                        rs.getTime("end_time") == null ? null : rs.getTime("end_time").toLocalTime(),
                        rs.getString("status")), args);
    }
}
