package com.unibus.api.transport;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.unibus.api.transport.model.BusSchedule;

public interface BusScheduleRepository extends JpaRepository<BusSchedule, Integer> {
    List<BusSchedule> findByRouteId(Integer routeId);
}
