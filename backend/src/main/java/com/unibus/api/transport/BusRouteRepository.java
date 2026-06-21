package com.unibus.api.transport;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.unibus.api.transport.model.BusRoute;

public interface BusRouteRepository extends JpaRepository<BusRoute, Integer> {

    @Query(value = """
            SELECT DISTINCT r.*
            FROM routes r
            JOIN route_stops boarding ON boarding.route_id = r.route_id
            JOIN route_stops alighting ON alighting.route_id = r.route_id
            WHERE r.status = 'ACTIVE'
              AND boarding.stop_id = :boardingStopId
              AND alighting.stop_id = :alightingStopId
              AND boarding.stop_order < alighting.stop_order
            ORDER BY r.route_name
            """, nativeQuery = true)
    List<BusRoute> searchRoutes(
            @Param("boardingStopId") Integer boardingStopId,
            @Param("alightingStopId") Integer alightingStopId);
}

