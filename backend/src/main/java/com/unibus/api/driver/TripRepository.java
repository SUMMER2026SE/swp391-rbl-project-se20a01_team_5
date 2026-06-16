package com.unibus.api.driver;

import com.unibus.api.driver.model.Trip;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TripRepository extends JpaRepository<Trip, Integer> {

    @EntityGraph(attributePaths = { "schedule.route", "schedule.bus", "schedule.driver.user", "schedule.conductor.user", "schedule.assignedBy", "route", "bus", "driver.user", "conductor.user" })
    Optional<Trip> findByScheduleIdAndServiceDate(Integer scheduleId, LocalDate serviceDate);

    @EntityGraph(attributePaths = { "schedule.route", "schedule.bus", "schedule.driver.user", "schedule.conductor.user", "schedule.assignedBy", "route", "bus", "driver.user", "conductor.user" })
    List<Trip> findByScheduleDriverIdAndServiceDateOrderByScheduleDepartureTimeAsc(Integer driverId, LocalDate serviceDate);

    @EntityGraph(attributePaths = { "schedule.route", "schedule.bus", "schedule.driver.user", "schedule.conductor.user", "schedule.assignedBy", "route", "bus", "driver.user", "conductor.user" })
    Optional<Trip> findFirstByScheduleDriverIdAndStatusOrderByDepartedAtDesc(Integer driverId, String status);

    @EntityGraph(attributePaths = { "schedule.route", "schedule.bus", "schedule.driver.user", "schedule.conductor.user", "schedule.assignedBy", "route", "bus", "driver.user", "conductor.user" })
    Optional<Trip> findFirstByDriverIdAndServiceDateAndStatusOrderByDepartedAtDesc(
            Integer driverId,
            LocalDate serviceDate,
            String status);

    long countByScheduleDriverIdAndStatus(Integer driverId, String status);

    List<Trip> findByScheduleDriverIdAndStatusAndServiceDateBetween(
            Integer driverId,
            String status,
            LocalDate from,
            LocalDate to);
}
