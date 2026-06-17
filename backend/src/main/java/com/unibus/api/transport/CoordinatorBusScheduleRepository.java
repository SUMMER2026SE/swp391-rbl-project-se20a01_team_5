package com.unibus.api.transport;

import com.unibus.api.transport.model.BusSchedule;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CoordinatorBusScheduleRepository extends JpaRepository<BusSchedule, Integer> {
    List<BusSchedule> findByRouteId(Integer routeId);

    @Modifying
    @Query(value = "DELETE FROM trips WHERE schedule_id = :scheduleId", nativeQuery = true)
    void deleteTripsByScheduleId(@Param("scheduleId") Integer scheduleId);
}
