package com.unibus.api.transport;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.unibus.api.transport.model.RouteStatus;
import com.unibus.api.transport.model.Stop;

public interface StopRepository extends JpaRepository<Stop, Integer> {

    List<Stop> findAllByStatusOrderByStopName(RouteStatus status);
}
