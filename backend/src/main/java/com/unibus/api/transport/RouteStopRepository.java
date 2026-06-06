package com.unibus.api.transport;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.unibus.api.transport.model.RouteStop;

public interface RouteStopRepository extends JpaRepository<RouteStop, Integer> {

    @EntityGraph(attributePaths = { "route", "stop" })
    List<RouteStop> findAllByRouteIdOrderByStopOrder(Integer routeId);

    @EntityGraph(attributePaths = "route")
    List<RouteStop> findAllByStopId(Integer stopId);
}
