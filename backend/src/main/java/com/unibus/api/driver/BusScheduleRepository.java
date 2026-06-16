package com.unibus.api.driver;

import com.unibus.api.driver.model.BusSchedule;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BusScheduleRepository extends JpaRepository<BusSchedule, Integer> {

    @EntityGraph(attributePaths = { "route", "bus", "driver.user", "conductor.user", "assignedBy" })
    List<BusSchedule> findByDriverIdAndStatusOrderByWeekdayNumberAscDepartureTimeAsc(Integer driverId, String status);

    @EntityGraph(attributePaths = { "route", "bus", "driver.user", "conductor.user", "assignedBy" })
    List<BusSchedule> findByDriverIdAndWeekdayNumberAndStatusOrderByDepartureTimeAsc(
            Integer driverId,
            Integer weekdayNumber,
            String status);
}
